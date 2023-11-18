const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const { lineWebhook } = require('./webhook');
const { currentDate } = require('./util/date')

const app = express();

// Automatically allow cross-origin requests
app.use(cors({ origin: true }));

// Define routes
app.post('/webhook', lineWebhook);

app.get('/test', (req, res) => {
	res.send(currentDate())
});

// Define additional routes as needed

// Create and deploy the Express app
exports.api = functions.region('asia-southeast1').https.onRequest(app);
