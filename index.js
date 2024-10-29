const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const moment = require('moment-timezone');
const fs = require('fs'); // Import fs module

const app = express();
const port = 4000;

const messagesFilePath = 'messages.json'; // Path to JSON file
let messages = [];

// Function to read messages from JSON file
const loadMessages = () => {
    if (fs.existsSync(messagesFilePath)) {
        const data = fs.readFileSync(messagesFilePath, 'utf8');
        messages = JSON.parse(data);
    }
};


app.get('/get-all-messages', (req, res) => {
    const allMessages = messages;

    res.json({ status: 'success', messages: allMessages });
});

app.delete('/flush-messages', (req, res) => {
    messages = [];
    // Also flush the JSON file
    saveMessages();
    res.json({ status: 'success', message: 'All messages have been flushed' });
});

app.listen(port, () => {
    console.log(`Express server is running on http://localhost:${port}`);
});
