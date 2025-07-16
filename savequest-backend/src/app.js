const express = require('express');
const cors = require('cors');

const userController = require('./controllers/userController');
const plaidController = require('./controllers/plaidController');
const challengeController = require('./controllers/challengeController');
const authenticateFirebaseToken = require('./middleware/authMiddleware');

const app = express();

// Global middleware
app.use(cors());
app.use(express.json());

// Protect all routes except Plaid webhook
app.use((req, res, next) => {
  if (req.path === '/plaid/webhook') return next();
  return authenticateFirebaseToken(req, res, next);
});

// User endpoints
app.post('/users', userController.createUser);
app.get('/users/:userId', userController.getUser);
app.put('/users/:userId', userController.updateUser);
app.delete('/users/:userId', userController.deleteUser);

// Plaid endpoints
app.post('/plaid/link-token', plaidController.createLinkToken);
app.post('/plaid/exchange', plaidController.exchangePublicToken);
app.post('/plaid/transactions', plaidController.getTransactions);
app.post('/plaid/accounts', plaidController.getAccounts);
app.post('/plaid/test-access-token', plaidController.testAccessToken);
// Plaid webhook must remain public
app.post('/plaid/webhook', plaidController.handleWebhook);

// Challenge endpoints
app.post('/user-challenges/join', challengeController.joinChallenge);
app.post('/user-challenges/check-in', challengeController.checkIn);
app.get('/user-challenges/:userId/:challengeId/streak', challengeController.getStreak);
app.post('/user-challenges/sync-transactions', challengeController.syncTransactions);

module.exports = app;
