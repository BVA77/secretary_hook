const express = require('express');
const line = require('@line/bot-sdk');
const firebaseAdmin = require('firebase-admin');

const app = express();

// Initialize Firebase
const serviceAccount = require('./path/to/your/firebase-service-account.json');
firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
  databaseURL: 'https://your-firebase-database-url.firebaseio.com',
});

// Initialize Line bot
const config = {
  channelAccessToken: 'YOUR_LINE_CHANNEL_ACCESS_TOKEN',
  channelSecret: 'YOUR_LINE_CHANNEL_SECRET',
};

const lineClient = new line.Client(config);

// Define a route to handle Line webhook events
app.post('/webhook', line.middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent)).then((result) => res.json(result));
});

// Handle Line events (e.g., messages, stickers, etc.)
async function handleEvent(event) {
  // Add your bot's logic here to respond to Line events
  // You can also store and retrieve data from Firebase as needed
}

// Start the Express server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});