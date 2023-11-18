const functions = require('firebase-functions');
const { Client } = require('@line/bot-sdk');
const admin = require('firebase-admin');
require('dotenv').config();

const lineConfig = {
  channelAccessToken: process.env.TEST_LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.TEST_LINE_CHANNEL_SECRET,
};

const lineClient = new Client(lineConfig);

admin.initializeApp();

// Firebase Realtime Database
const db = admin.database();
const messagesRef = db.ref('messages');

// Handle Line webhook events
exports.lineWebhook = functions.https.onRequest(async (req, res) => {
  const events = req.body.events;

  if (!events) {
    return res.status(400).send('No events in request body');
  }

  try {
    await Promise.all(events.map(handleEvent));
    res.status(200).end();
  } catch (error) {
    console.error('Error handling events:', error);
    res.status(500).end();
  }
});

// Function to handle Line events
async function handleEvent(event) {
  if (event.type === 'message' && event.message.type === 'text') {
    const userId = event.source.userId;
    const text = event.message.text;

    // Store the message in Firebase
    await messagesRef.child(userId).push({ text, timestamp: admin.database.ServerValue.TIMESTAMP });

    // Respond to the user
    await lineClient.replyMessage(event.replyToken, {
      type: 'text',
      text: `You said: ${text}`,
    });
  }
}
