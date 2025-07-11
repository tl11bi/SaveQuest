/**
 * ChallengeService handles all Firestore logic for user challenges.
 *
 * Methods:
 * - joinChallenge(userId, challengeId): Enrolls a user in a challenge if not already joined.
 * - checkIn(userId, challengeId, date): Handles a daily check-in with payment verification, updates streak and check-ins.
 * - calculateStreak(userId, challengeId): Returns the current streak and last check-in date.
 * - verifyQualifyingPayment(userId, date): Verifies that a qualifying payment exists for the given date.
 * - syncTransactions(userId, days): Triggers manual transaction sync for a user.
 * - getUserPlaidAccessToken(userId): Helper to find user's Plaid access token.
 */

const firestoreService = require('./firestoreService');

module.exports = {
  /**
   * Enrolls a user in a challenge. Creates a user-challenge doc if not exists.
   * @param {string} userId - User's unique ID
   * @param {string} challengeId - Challenge's unique ID
   * @returns {Promise<object>} The joined challenge data or error
   */
  async joinChallenge(userId, challengeId) {
    try {
      // Use FirestoreService to check and create challenge doc
      const challenge = await firestoreService.getChallengeData(userId, challengeId);
      if (challenge) {
        return { success: false, message: 'User already joined this challenge.' };
      }
      const data = {
        userId,
        challengeId,
        streak: 0,
        lastCheckIn: null,
        checkIns: [],
        joinedAt: new Date().toISOString(),
      };
      await firestoreService.saveChallengeData(userId, challengeId, data);
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  /**
   * Handles a daily check-in for a user on a challenge. Updates streak and check-ins.
   * Now verifies that a qualifying payment exists for the check-in date.
   * @param {string} userId - User's unique ID
   * @param {string} challengeId - Challenge's unique ID
   * @param {string} date - ISO date string for the check-in (YYYY-MM-DD)
   * @returns {Promise<object>} Updated streak/status or error
   */
  async checkIn(userId, challengeId, date) {
    try {
      const data = await firestoreService.getChallengeData(userId, challengeId);
      if (!data) {
        return { success: false, message: 'User is not enrolled in this challenge.' };
      }

      // Prevent duplicate check-in for the same day
      const checkIns = data.checkIns || [];
      if (checkIns.includes(date)) {
        return { success: false, message: 'Already checked in for this date.' };
      }

      // Verify qualifying payment exists for the check-in date
      const hasQualifyingPayment = await this.verifyQualifyingPayment(userId, date);
      if (!hasQualifyingPayment.success) {
        return { 
          success: false, 
          message: hasQualifyingPayment.message || 'No qualifying payment found for this date.'
        };
      }

      const lastCheckIn = data.lastCheckIn ? new Date(data.lastCheckIn) : null;
      const today = new Date(date);
      let streak = data.streak || 0;

      // Calculate streak
      if (lastCheckIn) {
        const diff = Math.floor((today - lastCheckIn) / (1000 * 60 * 60 * 24));
        if (diff === 1) {
          streak += 1;
        } else if (diff > 1) {
          streak = 1;
        }
      } else {
        streak = 1;
      }

      checkIns.push(date);
      await firestoreService.saveChallengeData(userId, challengeId, {
        ...data,
        streak,
        lastCheckIn: date,
        checkIns,
      });
      
      return { 
        success: true, 
        streak, 
        lastCheckIn: date, 
        checkIns,
        qualifyingPayment: hasQualifyingPayment.transaction
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  /**
   * Calculates the current streak for a user on a challenge.
   * @param {string} userId - User's unique ID
   * @param {string} challengeId - Challenge's unique ID
   * @returns {Promise<object>} The current streak and last check-in date, or error
   */
  async calculateStreak(userId, challengeId) {
    try {
      const data = await firestoreService.getChallengeData(userId, challengeId);
      if (!data) {
        return { success: false, message: 'User is not enrolled in this challenge.' };
      }
      return { success: true, streak: data.streak || 0, lastCheckIn: data.lastCheckIn || null };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  /**
   * Verifies that a qualifying payment exists for the given date.
   * A qualifying payment is defined as a debit transaction (payment/purchase) on the specified date.
   * @param {string} userId - User's unique ID
   * @param {string} date - ISO date string (YYYY-MM-DD)
   * @returns {Promise<object>} Success with transaction details or failure message
   */
  async verifyQualifyingPayment(userId, date) {
    try {
      const transactions = await firestoreService.getTransactions(userId);
      
      if (!transactions || transactions.length === 0) {
        return { 
          success: false, 
          message: 'No transactions found. Please sync your transactions first.' 
        };
      }

      // Find transactions on the specified date that are payments/purchases
      const qualifyingTransactions = transactions.filter(txn => {
        if (!txn.date || !txn.amount) return false;
        
        // Check if transaction date matches the check-in date
        const txnDate = txn.date; // Plaid transactions come with date in YYYY-MM-DD format
        if (txnDate !== date) return false;
        
        // Check if it's a debit transaction (payment/purchase)
        // Plaid amounts are positive for debits, negative for credits
        return txn.amount > 0;
      });

      if (qualifyingTransactions.length === 0) {
        return { 
          success: false, 
          message: 'No qualifying payments found for this date. Make a purchase to complete your check-in.' 
        };
      }

      // Return the first qualifying transaction as proof
      return { 
        success: true, 
        transaction: qualifyingTransactions[0],
        totalQualifying: qualifyingTransactions.length
      };
    } catch (error) {
      return { success: false, message: `Error verifying payment: ${error.message}` };
    }
  },

  /**
   * Triggers a manual transaction sync for a user using their stored Plaid access token.
   * @param {string} userId - User's unique ID
   * @param {number} days - Number of days to sync (default: 30)
   * @returns {Promise<object>} Success with transaction count or error
   */
  async syncTransactions(userId, days = 30) {
    try {
      // First, we need to find the user's Plaid access token
      // We'll look through all plaid item mappings to find one for this user
      const plaidService = require('./plaidService');
      
      // Get user's Plaid access token (we'll need to find it from the mappings)
      const accessToken = await this.getUserPlaidAccessToken(userId);
      if (!accessToken) {
        return { 
          success: false, 
          message: 'No Plaid account found for this user. Please link your bank account first.' 
        };
      }

      // Calculate date range
      const endDate = new Date().toISOString().split('T')[0]; // Today
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Fetch and store transactions
      const result = await plaidService.getTransactions(userId, accessToken, startDate, endDate);
      
      return { 
        success: true, 
        message: `Transactions synced successfully for ${days} days.`,
        transactionCount: result.transactions ? result.transactions.length : 0,
        dateRange: { startDate, endDate }
      };
    } catch (error) {
      return { success: false, message: `Failed to sync transactions: ${error.message}` };
    }
  },

  /**
   * Helper method to find a user's Plaid access token from stored mappings.
   * @param {string} userId - User's unique ID
   * @returns {Promise<string|null>} Access token or null if not found
   */
  async getUserPlaidAccessToken(userId) {
    try {
      return await firestoreService.getPlaidAccessTokenByUserId(userId);
    } catch (error) {
      console.error('Error finding user Plaid access token:', error);
      return null;
    }
  },
};
