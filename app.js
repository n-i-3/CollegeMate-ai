const express = require('express');
const app = express();
const axios = require('axios');
require('dotenv').config();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('index');  // Make sure views/index.ejs exists
});

app.post('/chat', async (req, res) => {
    const userMessage = req.body.message;

    try {
        const response = await axios.post('https://api.mistral.ai/v1/chat/completions', {
            model: 'mistral-small-latest',
            messages: [
                { role: 'user', content: userMessage }
            ],
            temperature: 1.5,
            top_p: 1,
            max_tokens: 150
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
                'Content-Type': 'application/json',
            }
        });

        const botReply = response.data.choices?.[0]?.message?.content || "No response from AI.";
        res.json({ reply: botReply });

    } catch (error) {
        console.error(error.response?.data || error.message);
        res.json({ reply: 'Sorry, something went wrong.' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
