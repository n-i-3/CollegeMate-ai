const express = require('express');
const app = express();
const axios = require('axios');
require('dotenv').config();
const placesRoute = require('./routes/places');
const reminderRoutes = require('./routes/reminderRoutes'); // Add this line
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/places', placesRoute);
app.use('/', reminderRoutes); // Add this line to use the reminder routes


app.set('view engine', 'ejs');

let chatHistory = [
    { role: 'system', content: 'You are CollegeMate-ai, a helpful AI that assists with college-related queries, coding, and advice.' }
];

app.get('/', (req, res) => {
    res.render('index');  
});

app.post('/chat', async (req, res) => {
    const userMessage = req.body.message;

    chatHistory.push({ role: 'user', content: userMessage });

    try {
        const response = await axios.post('https://api.mistral.ai/v1/chat/completions', {
            model: 'mistral-small-latest',
            messages: chatHistory, 
            temperature: 0.8,  
            top_p: 1,
            max_tokens: 300
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
                'Content-Type': 'application/json',
            }
        });

        const botReply = response.data.choices?.[0]?.message?.content || "No response from AI.";

        chatHistory.push({ role: 'assistant', content: botReply });

        res.json({ reply: botReply });

    } catch (error) {
        console.error(error.response?.data || error.message);
        res.json({ reply: 'Sorry, something went wrong.' });
    }
});

// (for testing)
app.post('/reset', (req, res) => {
    chatHistory = [
        { role: 'system', content: 'You are CollegeMate-ai, a helpful AI that assists with college-related queries, coding, and advice.' }
    ];
    res.json({ status: 'Chat history reset.' });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

app.get('/nearby', (req, res) => {
    res.render('nearby');
  });
  
a