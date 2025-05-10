const express = require('express');
const router = express.Router();

// In-memory reminder list
const reminders = [];

router.get('/reminders', (req, res) => {
  res.render('reminders', { reminders });
});

router.post('/reminders/add', (req, res) => {
  const { title, description, date, time } = req.body;

  if (!title || !description || !date || !time) {
    return res.status(400).send('All fields are required.');
  }

  reminders.push({ title, description, date, time });
  res.redirect('/reminders');
});

module.exports = router;
