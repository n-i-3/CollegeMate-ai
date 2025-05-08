const express = require('express');
const axios = require('axios');
const router = express.Router();

// Map of place types to Overpass tags (you can add more types here!)
const placeTags = {
  food: ['amenity', 'restaurant'],
  library: ['amenity', 'library'],
  atm: ['amenity', 'atm'],
  hospital: ['amenity', 'hospital'],
  park: ['leisure', 'park']
};

// Helper to fetch Overpass data with basic retry on rate limiting (429)
const fetchOverpassData = async (query) => {
  try {
    return await axios.post('https://overpass-api.de/api/interpreter', query, {
      headers: { 'Content-Type': 'text/plain' }
    });
  } catch (err) {
    if (err.response?.status === 429) {
      console.warn('Rate limited. Retrying in 2 seconds...');
      await new Promise(res => setTimeout(res, 2000));
      return await axios.post('https://overpass-api.de/api/interpreter', query, {
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    throw err;
  }
};

router.post('/search', async (req, res) => {
  const { lat, lon, type } = req.body;
  const radius = 3000; // 3 km search radius

  // Validation
  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude and longitude are required.' });
  }

  const tag = placeTags[type];
  if (!tag) {
    return res.status(400).json({ error: `Invalid place type: ${type}` });
  }

  const [key, value] = tag;

  const query = `
    [out:json][timeout:25];
    (
      node["${key}"="${value}"](around:${radius},${lat},${lon});
      way["${key}"="${value}"](around:${radius},${lat},${lon});
      relation["${key}"="${value}"](around:${radius},${lat},${lon});
    );
    out center tags;
  `;

  try {
    const response = await fetchOverpassData(query);
    const elements = response.data.elements || [];
    console.log(`Fetched ${elements.length} places for type "${type}"`);

    const results = elements
      .map(place => {
        const tags = place.tags || {};
        const latitude = place.lat || place.center?.lat;
        const longitude = place.lon || place.center?.lon;

        const addressParts = [
          tags['addr:housenumber'],
          tags['addr:street'],
          tags['addr:neighbourhood'],
          tags['addr:suburb'],
          tags['addr:city'],
          tags['addr:postcode']
        ].filter(Boolean);

        return {
          id: place.id,
          name: tags.name || tags.brand || tags.operator || 'Unnamed',
          address: addressParts.length ? addressParts.join(', ') : 'Location not specified',
          lat: latitude,
          lon: longitude,
          website: tags.website || null,
          phone: tags['contact:phone'] || null,
          opening_hours: tags.opening_hours || null,
          osm_link: `https://www.openstreetmap.org/${place.type}/${place.id}`
        };
      })
      .filter(place => place.lat && place.lon);

    res.json({ places: results });
  } catch (err) {
    console.error('Error fetching from Overpass API:', err.message);
    res.status(500).json({ error: 'Failed to fetch data from Overpass API' });
  }
});

module.exports = router;
