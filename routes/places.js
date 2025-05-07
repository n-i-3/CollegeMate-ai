const express = require('express');
const axios = require('axios');
const router = express.Router();

// Map for Overpass tags
const placeTags = {
  food: ['amenity', 'restaurant'],
  library: ['amenity', 'library'],
  atm: ['amenity', 'atm']
};

router.post('/search', async (req, res) => {
  const { lat, lon, type } = req.body;
  const tag = placeTags[type];
  const radius = 3000; // 3 km search radius

  if (!tag) return res.status(400).json({ error: 'Invalid place type' });

  const [key, value] = tag;

  const query = `
    [out:json];
    (
      node["${key}"="${value}"](around:${radius}, ${lat}, ${lon});
      way["${key}"="${value}"](around:${radius}, ${lat}, ${lon});
      relation["${key}"="${value}"](around:${radius}, ${lat}, ${lon});
    );
    out center tags;
  `;

  try {
    const response = await axios.post('https://overpass-api.de/api/interpreter', query, {
      headers: { 'Content-Type': 'text/plain' }
    });

    console.log(`Returned ${response.data.elements.length} places`);

    const results = response.data.elements
      .map(place => {
        const tags = place.tags || {};
        const lat = place.lat || place.center?.lat;
        const lon = place.lon || place.center?.lon;

        const address = ['addr:housenumber', 'addr:street', 'addr:city', 'addr:postcode']
          .map(key => tags[key])
          .filter(Boolean)
          .join(', ');

        return {
          id: place.id,
          name: tags.name || tags.brand || tags.operator || 'Unnamed',
          address: address || 'Location not specified',
          lat,
          lon
        };
      })
      .filter(place => place.lat && place.lon); // Ensure lat/lon are present

    res.json({ places: results });

  } catch (err) {
    console.error('Overpass fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch data from Overpass API' });
  }
});

module.exports = router;
