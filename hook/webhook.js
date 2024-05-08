const functions = require('firebase-functions');
const { Client } = require('@line/bot-sdk');
const admin = require('firebase-admin');
const { currentDate } = require('./util/date')
const axios = require('axios');
require('dotenv').config();

const lineConfig = {
  channelAccessToken: process.env.TEST_LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.TEST_LINE_CHANNEL_SECRET,
};

const lineClient = new Client(lineConfig);

admin.initializeApp();

// const bucket = admin.storage().bucket();

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

const dailyPaid = async (userId, context, amount, replyToken) => {
  const dailyPaidTable = db.ref('dailyPaid');
  await dailyPaidTable.child(userId).push({
    context,
    amount,
    createDate: currentDate(),
    timestamp: admin.database.ServerValue.TIMESTAMP
  });

  await lineClient.replyMessage(replyToken, {
    type: 'text',
    text: `save completed`,
  });
}

// Get image from Line store
// const getImageById = async (messageId) => {
// 	console.log('response messageId ====>>>', messageId)

// 	const response = await axios.get(
// 		`https://api-data.line.me/v2/bot/message/${messageId}/content`,
// 		{ headers: { Authorization: `Bearer ${process.env.TEST_LINE_CHANNEL_ACCESS_TOKEN}` } }
// 	)
// 	return response;
// }

// Function to handle Line events
async function handleEvent(event) {
  if (event.type === 'message' && event.message.type === 'text') {
    const userId = event.source.userId;
    const text = event.message.text;

    const splitContext = text.split(' ')

    const context = splitContext[0]
    const amount = splitContext[1]

    if (context.startsWith('ค่า') && splitContext.length === 2) {
      dailyPaid(userId, context, amount, event.replyToken)
    } else {
      // Store the message in Firebase
      await messagesRef.child(userId).push({
        text,
        createDate: currentDate(),
        timestamp: admin.database.ServerValue.TIMESTAMP
      });

      // Respond to the user
      await lineClient.replyMessage(event.replyToken, {
        type: 'text',
        text: `our plans:
        1. daily paid example: ค่าซื้อของเข้าบ้าน 200 or ค่าซื้อของเข้าบ้านจากพี่ +200`,
      });
    }
  } else {
    await lineClient.replyMessage(event.replyToken, {
      type: 'text',
      text: `รับเฉพาะ text อ่ะสิ`,
    });
  }
}

exports.testGetData = async () => {
  const dailyPaidTable = db.ref('dailyPaid');
  const response = await dailyPaidTable.once('value', (snapshot) => {
    const data = snapshot.val();
    // Access the data in the "data" variable
    console.log(data);
    return data
  });
  return response.val()
}
