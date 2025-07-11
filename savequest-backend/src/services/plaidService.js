const firestoreService = require('./firestoreService');
/**
 * PlaidService encapsulates all Plaid API logic.
 * Each method corresponds to a specific Plaid API call or webhook handler.
 */

const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
const config = require('../config');

const plaidClient = new PlaidApi(
  new Configuration({
    basePath: PlaidEnvironments[config.plaid.env],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': config.plaid.clientId,
        'PLAID-SECRET': config.plaid.secret,
      },
    },
  })
);

class PlaidService {

  /**
   * Generates a Plaid Link token for the frontend to initialize bank linking.
   * @param {string} userId - The unique user identifier.
   * @returns {Promise<object>} Plaid Link token object (contains link_token and expiration info)
   */
  async createLinkToken(userId) {
    // Generates a Plaid Link token for the frontend (webhook temporarily disabled)
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: 'SaveQuest',
      products: ['transactions'],
      country_codes: ['US'],
      language: 'en',
      webhook: config.plaid.webhookUrl, // Disabled for now
    });
    return response.data;
  }


  /**
   * Exchanges a public token (from frontend) for a permanent access token.
   * @param {string} publicToken - The public token received from Plaid Link.
   * @returns {Promise<object>} Plaid access token object (contains access_token and item_id)
   */
  async exchangePublicToken(publicToken) {
    // Exchanges a public token for an access token
    const response = await plaidClient.itemPublicTokenExchange({ public_token: publicToken });
    return response.data;
  }


  /**
   * Fetches transactions for a user from Plaid and stores them in Firestore.
   * @param {string} userId - The unique user identifier.
   * @param {string} accessToken - The user's Plaid access token.
   * @param {string} startDate - Start date for transactions (YYYY-MM-DD).
   * @param {string} endDate - End date for transactions (YYYY-MM-DD).
   * @returns {Promise<object>} Plaid transactions response (contains transactions, accounts, etc.)
   */
  async getTransactions(userId, accessToken, startDate, endDate) {
    // Fetches transactions for a user
    const response = await plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
      options: { count: 100, offset: 0 },
    });
    // Save transactions to Firestore
    if (userId && response.data && response.data.transactions) {
      await firestoreService.saveTransactions(userId, response.data.transactions);
    }
    return response.data;
  }


  /**
   * Fetches account information for a user from Plaid.
   * @param {string} accessToken - The user's Plaid access token.
   * @returns {Promise<object>} Accounts response object (contains accounts array)
   */
  async getAccounts(accessToken) {
    // Fetches account information for a user
    const response = await plaidClient.accountsGet({ access_token: accessToken });
    return response.data;
  }


  /**
   * Handles Plaid webhook events (e.g., new transactions, errors).
   * @param {object} eventData - The webhook event payload from Plaid.
   * @returns {Promise<void>|Promise<string>} Usually nothing (void), but may return a status or log message after processing
   */
  async processWebhookEvent(eventData) {
    // Handles Plaid webhook events (e.g., new transactions, errors)
    if (eventData.webhook_type === 'TRANSACTIONS' && eventData.webhook_code === 'DEFAULT_UPDATE') {
      // Look up userId and accessToken by item_id using the mapping we stored
      const itemId = eventData.item_id;
      
      try {
        const mapping = await firestoreService.getPlaidItemMapping(itemId);
        if (!mapping || !mapping.userId || !mapping.accessToken) {
          console.warn('No mapping found for item_id:', itemId);
          return 'Webhook received: no mapping found for item_id.';
        }

        const { userId, accessToken } = mapping;
        
        // Calculate date range for fetching recent transactions (last 30 days)
        const endDate = new Date().toISOString().split('T')[0]; // Today in YYYY-MM-DD
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 days ago
        
        // Fetch and store the updated transactions
        await this.getTransactions(userId, accessToken, startDate, endDate);
        
        console.log('Successfully processed webhook for user:', userId, 'item:', itemId);
        return 'Webhook processed: transactions updated for user.';
        
      } catch (error) {
        console.error('Error processing webhook for item_id:', itemId, error);
        return 'Webhook error: failed to process transaction update.';
      }
    }
    
    // Handle other webhook types as needed
    console.log('Webhook received:', eventData.webhook_type, eventData.webhook_code);
    return 'Webhook event received.';
  }
}

module.exports = new PlaidService();
