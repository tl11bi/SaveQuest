/**
 * PlaidController handles HTTP requests related to Plaid integration.
 * Each method is an Express route handler.
 */

const plaidService = require('../services/plaidService');

module.exports = {
  /**
   * Test endpoint: Returns Plaid access token for a given userId.
   * @route POST /plaid/test-access-token
   * @param {Request} req - Express request object (expects req.body.userId)
   * @param {Response} res - Express response object
   * @returns {Response} JSON with accessToken or error
   */
  async testAccessToken(req, res) {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: 'userId is required.' });
      }
      const firestoreService = require('../services/firestoreService');
      const accessToken = await firestoreService.getPlaidAccessTokenByUserId(userId);
      if (!accessToken) {
        return res.status(404).json({ error: 'No access token found for this user.' });
      }
      return res.status(200).json({ accessToken });
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Failed to get access token.' });
    }
  },
  /**
   * Generates a Plaid Link token for the frontend to initialize bank linking.
   * @param {Request} req - Express request object (expects req.body.userId)
   * @param {Response} res - Express response object
   * @returns {Response} JSON with Plaid link_token and expiration info
   */
  async createLinkToken(req, res) {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: 'userId is required.' });
      }
      const result = await plaidService.createLinkToken(userId);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Failed to create link token.' });
    }
  },

  /**
   * Exchanges a public token (from frontend) for a permanent access token.
   * @param {Request} req - Express request object (expects req.body.publicToken)
   * @param {Response} res - Express response object
   * @returns {Response} JSON with Plaid access_token and item_id
   */
  async exchangePublicToken(req, res) {
    try {
      const { publicToken, userId } = req.body;
      if (!publicToken) {
        return res.status(400).json({ error: 'publicToken is required.' });
      }
      if (!userId) {
        return res.status(400).json({ error: 'userId is required.' });
      }
      const result = await plaidService.exchangePublicToken(publicToken);
      // Save Plaid item_id mapping to Firestore
      const { access_token, item_id } = result;
      if (access_token && item_id) {
        const firestoreService = require('../services/firestoreService');
        await firestoreService.savePlaidItemMapping(item_id, userId, access_token);
      }
      return res.status(200).json(result);
    } catch (err) {
      // Plaid error details
      if (err.response && err.response.data) {
        console.error('Plaid error:', err.response.data);
        return res.status(err.response.status || 500).json({
          error: err.response.data.error_message || 'Plaid error',
          error_code: err.response.data.error_code,
          error_type: err.response.data.error_type,
          display_message: err.response.data.display_message
        });
      }
      return res.status(500).json({ error: err.message || 'Failed to exchange public token.' });
    }
  },

  /**
   * Fetches transactions for a user from Plaid.
   * @param {Request} req - Express request object (expects req.body.accessToken, req.body.startDate, req.body.endDate)
   * @param {Response} res - Express response object
   * @returns {Response} JSON with transactions, accounts, etc.
   */
  async getTransactions(req, res) {
    try {
      const { userId, accessToken, startDate, endDate } = req.body;
      if (!userId || !accessToken || !startDate || !endDate) {
        return res.status(400).json({ error: 'userId, accessToken, startDate, and endDate are required.' });
      }
      const result = await plaidService.getTransactions(userId, accessToken, startDate, endDate);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Failed to fetch transactions.' });
    }
  },

  /**
   * Fetches account information for a user from Plaid.
   * @param {Request} req - Express request object (expects req.body.accessToken)
   * @param {Response} res - Express response object
   * @returns {Response} JSON with accounts array
   */
  async getAccounts(req, res) {
    try {
      const { accessToken } = req.body;
      if (!accessToken) {
        return res.status(400).json({ error: 'accessToken is required.' });
      }
      const result = await plaidService.getAccounts(accessToken);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Failed to fetch accounts.' });
    }
  },

  /**
   * Handles Plaid webhook events (e.g., new transactions, errors).
   * @param {Request} req - Express request object (expects Plaid webhook payload in req.body)
   * @param {Response} res - Express response object
   * @returns {Response} Status or log message after processing
   */
  async handleWebhook(req, res) {
    try {
      const eventData = req.body;
      const result = await plaidService.processWebhookEvent(eventData);
      return res.status(200).json({ message: result || 'Webhook event processed.' });
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Failed to process webhook event.' });
    }
  },
};
