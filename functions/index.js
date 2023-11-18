const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const { lineWebhook } = require('./webhook');

const app = express();

// Automatically allow cross-origin requests
app.use(cors({ origin: true }));

// Define routes
app.post('/webhook', lineWebhook);

// Define additional routes as needed

// Create and deploy the Express app
exports.api3 = functions.region('asia-southeast1').https.onRequest(app);