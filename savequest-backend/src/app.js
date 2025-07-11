const express = require('express');
const cors = require('cors');
const userController = require('./controllers/userController');
const plaidController = require('./controllers/plaidController');
const challengeController = require('./controllers/challengeController');

const app = express();
app.use(cors());
app.use(express.json());

// User endpoints
app.post('/users', userController.createUser);
app.get('/users/:userId', userController.getUser);
app.put('/users/:userId', userController.updateUser);
app.delete('/users/:userId', userController.deleteUser);

// Plaid endpoints
// /plaid/transactions now requires userId, accessToken, startDate, endDate in body
app.post('/plaid/link-token', plaidController.createLinkToken);
app.post('/plaid/exchange', plaidController.exchangePublicToken);
app.post('/plaid/transactions', plaidController.getTransactions);
app.post('/plaid/accounts', plaidController.getAccounts);
app.post('/plaid/webhook', plaidController.handleWebhook);

// Challenge endpoints
app.post('/user-challenges/join', challengeController.joinChallenge);
app.post('/user-challenges/check-in', challengeController.checkIn);
app.get('/user-challenges/:userId/:challengeId/streak', challengeController.getStreak);
app.post('/user-challenges/sync-transactions', challengeController.syncTransactions);

module.exports = app;
