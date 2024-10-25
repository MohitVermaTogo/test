const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth(),
});

client.on('qr', (qr) => {
    // Generate and display QR code in terminal
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', message => {
    console.log(message, 'testing');
    if (message.body === 'Hi') {
        message.reply('Hello from WhatsApp Bot!');
    }
});

client.initialize();
