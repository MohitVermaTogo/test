const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const moment = require('moment-timezone');
const fs = require('fs'); // Import fs module

const app = express();
const port = 3000;

const messagesFilePath = 'messages.json'; // Path to JSON file
let messages = [];

// Function to read messages from JSON file
const loadMessages = () => {
    if (fs.existsSync(messagesFilePath)) {
        const data = fs.readFileSync(messagesFilePath, 'utf8');
        messages = JSON.parse(data);
    }
};

// Function to save messages to JSON file
const saveMessages = () => {
    fs.writeFileSync(messagesFilePath, JSON.stringify(messages, null, 2));
};

// Load messages at the start
loadMessages();

// Initialize WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth(),
});

client.on('qr', (qr) => {
    // Generate and display QR code in terminal
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('WhatsApp client is ready!');
});

client.on('message', message => {
    console.log('Received message on WhatsApp:', message.body);

    if (message.contactId != "status@broadcast") {
        // Store the message in memory
        const msg = {
            contactId: message.from,
            body: message.body,
            timestamp: message.timestamp
        };
        messages.push(msg);

        // Save messages to JSON file
        saveMessages();
    }

    // Uncomment below to send message to Slack
    // axios.post('https://hooks.slack.com/services/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', {
    //     text: `New message from WhatsApp:\n*From:* ${message.from}\n*Message:* ${message.body}`
    // })
    // .then(response => {
    //     console.log('Message sent to Slack:', response.data);
    // })
    // .catch(error => {
    //     console.error('Error sending to Slack:', error.message);
    // });
});

client.initialize();

// Setup Express server
app.use(bodyParser.json());
app.get('/', async (req, res) => {
    res.status(200).json({ status: 'TESTING' });
});

// API endpoint to send a message
app.post('/send-message', async (req, res) => {
    const { contactId, message } = req.body;

    if (!contactId || !message) {
        return res.status(400).json({ status: 'error', error: 'Missing contactId or message' });
    }

    try {
        const response = await client.sendMessage(contactId, message);
        console.log('Message sent:', response);
        res.json({ status: 'success', response });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ status: 'error', error: error.message });
    }
});

// API endpoint to receive incoming messages
app.get('/messages', (req, res) => {
    res.json(messages);
});

app.get('/get-messages/:contactId', (req, res) => {
    const contactId = req.params.contactId;
    
    // Filter messages based on contactId
    const filteredMessages = messages
        .filter(msg => msg.contactId === contactId)
        .map(msg => {
            // Convert timestamp to IST timezone
            const readableTimestamp = moment.unix(msg.timestamp)
                .tz('Asia/Kolkata')
                .format('YYYY-MM-DD HH:mm:ss');
            
            return {
                ...msg,
                readableTimestamp // Add the formatted timestamp
            };
        });

    if (filteredMessages.length === 0) {
        return res.status(404).json({ status: 'error', error: 'No messages found for this contactId' });
    }

    res.json({ status: 'success', messages: filteredMessages });
});

app.get('/get-all-messages', (req, res) => {
    const allMessages = messages.map(msg => ({
        ...msg,
        readableTimestamp: moment.unix(msg.timestamp).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss')
    }));

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
