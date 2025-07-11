/**
 * Loads and exports environment variables and configuration for Plaid and Firestore.
 * Used throughout the backend for API keys, secrets, and service URLs.
 */
require('dotenv').config();

module.exports = {
  plaid: {
    clientId: process.env.PLAID_CLIENT_ID,
    secret: process.env.PLAID_SECRET,
    env: process.env.PLAID_ENV,
    webhookUrl: process.env.WEBHOOK_URL,
  },
  firestore: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  },
  port: process.env.PORT || 5000,
};
