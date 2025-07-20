/**
 * ChallengeService handles all Firestore logic for user challenges.
 *
 * Methods:
 * - joinChallenge(userId, challengeId): Enrolls a user in a challenge if not already joined.
 * - checkIn(userId, challengeId, date): Handles a daily check-in with rule evaluation, updates streak and check-ins.
 * - calculateStreak(userId, challengeId): Returns the current streak and last check-in date.
 * - evaluateChallenge(userId, challengeId): Evaluates challenge rules against user transactions.
 * - syncTransactions(userId, days): Triggers manual transaction sync for a user.
 * - getUserPlaidAccessToken(userId): Helper to find user's Plaid access token.
 */

const firestoreService = require('./firestoreService');
const { evaluateRule } = require('../utils/challengeRule');

// normalize helper
const toIsoDate = (d) => new Date(d).toISOString().slice(0, 10);

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
      if (challenge && challenge.status !== 'failed') {
        return { success: false, message: 'User already joined this challenge.' };
      }
      const data = {
        userId,
        challengeId,
        streak: 0,
        lastCheckIn: null,
        checkIns: [],
        joinedAt: new Date().toISOString(),
        status: 'active'
      };
      await firestoreService.saveChallengeData(userId, challengeId, data);
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  /**
   * Handles a daily check-in for a user on a challenge. Updates streak and check-ins.
   * Compares today's date with last check-in and verifies challenge is still within duration.
   * @param {string} userId - User's unique ID
   * @param {string} challengeId - Challenge's unique ID
   * @param {string} date - ISO date string for the check-in (YYYY-MM-DD)
   * @returns {Promise<object>} Updated streak/status or error
   */
  async checkIn(userId, challengeId, date) {
    try {
      // Settlement lag protection - only evaluate transactions that are at least N days old
      const SETTLEMENT_LAG_DAYS = 1;
      const lagCutoff = new Date();
      lagCutoff.setDate(lagCutoff.getDate() - SETTLEMENT_LAG_DAYS);
      const latestConfirmable = toIsoDate(lagCutoff);

      const data = await firestoreService.getChallengeData(userId, challengeId);
      if (!data) {
        return { success: false, message: 'User is not enrolled in this challenge.' };
      }

      // Check if challenge is already failed
      if (data.status === 'failed') {
        return { 
          success: false, 
          message: 'This challenge has failed. Please rejoin to start over.',
          challengeFailed: true
        };
      }

      // normalize check-in date
      const isoDate = toIsoDate(date);

      // Prevent check-in for dates that are too recent (transactions may still be pending)
      if (isoDate > latestConfirmable) {
        return {
          success: false,
          message: `Too early to confirm ${isoDate}. Transactions may still be pending. Please check in after ${SETTLEMENT_LAG_DAYS} day(s) for transaction settlement.`
        };
      }

      // Prevent duplicate check-in for the same day
      const checkIns = data.checkIns || [];
     if (checkIns.includes(isoDate)) {
        return { success: false, message: 'Already checked in for this date.' };
      }

      // Get challenge template to check duration
      const challengeTemplate = await firestoreService.getChallengeTemplate(challengeId);
      if (!challengeTemplate) {
        return { success: false, message: 'Challenge template not found.' };
      }

      // Check if today is within challenge duration from join date
      // Simple date comparison: joinedAt date + duration days
      const joinDate = new Date(data.joinedAt);
      const joinDateOnly = toIsoDate(joinDate); // Get YYYY-MM-DD format
      const checkInDateOnly = isoDate;
      
      // Calculate which day of the challenge this is (1-based)
      const joinDateObj = new Date(joinDateOnly);
      const checkInDateObj = new Date(checkInDateOnly);
      const daysDiff = Math.floor((checkInDateObj - joinDateObj) / (1000 * 60 * 60 * 24));
      
      if (daysDiff < 0) {
        return { 
          success: false, 
          message: `Cannot check in before challenge start date (${joinDateOnly}).` 
        };
      }
      
      if (daysDiff >= challengeTemplate.duration) {
        return { 
          success: false, 
          message: `Challenge has ended. Valid period was ${challengeTemplate.duration} days from ${joinDateOnly}.` 
        };
      }

      // Calculate days since join for loop logic
      const daysSinceJoin = daysDiff;

     // Ensure no rule violations on missed days since last check-in or join date
     const daysBetween = daysSinceJoin;
     const lastCheck = data.lastCheckIn
       ? Math.floor((new Date(data.lastCheckIn) - new Date(joinDateOnly)) / (1000 * 60 * 60 * 24))
       : -1; // Start from day 0 if no previous check-in
     for (let d = lastCheck + 1; d < daysBetween; d++) {
       const gapDateObj = new Date(joinDateObj.getTime() + d * 24 * 60 * 60 * 1000);
       const gapDateStr = toIsoDate(gapDateObj);
       const res = await this.evaluateChallenge(userId, challengeId, gapDateStr);
       if (!res.success || res.ruleBroken) {
         // Mark challenge as failed - user must rejoin
         await firestoreService.saveChallengeData(userId, challengeId, {
           ...data,
           status: 'failed',
           failedAt: new Date().toISOString(),
           failureReason: res.message || 'Rule violation detected on missed check-in dates.'
         });
         return {
           success: false,
           message: res.message || 'Rule violation detected on missed check-in dates. Challenge has been marked as failed. You must rejoin to start over.',
           evaluation: res,
           challengeFailed: true
         };
       }
     }
     // Evaluate today's rules before finalizing check-in
     const todayEval = await this.evaluateChallenge(userId, challengeId, isoDate);
     if (todayEval.ruleBroken) {
       // Mark challenge as failed - user must rejoin
       await firestoreService.saveChallengeData(userId, challengeId, {
         ...data,
         status: 'failed',
         failedAt: new Date().toISOString(),
         failureReason: todayEval.message || 'Rule violation detected for today\'s check-in.'
       });
       return {
         success: false,
         message: todayEval.message || 'Rule violation detected for today\'s check-in. Challenge has been marked as failed. You must rejoin to start over.',
         evaluation: todayEval,
         challengeFailed: true
       };
     }

      // Calculate streak based on consecutive check-ins
      const lastCheckIn = data.lastCheckIn ? new Date(data.lastCheckIn) : null;
      const today = new Date(isoDate);
      let streak = data.streak || 0;

      // Calculate streak
      if (lastCheckIn) {
        const diff = Math.floor((today - lastCheckIn) / (1000 * 60 * 60 * 24));
        if (diff === 1) {
          streak += 1;
        } else if (diff > 1) {
          streak = 1; // Reset to 1 if there was a gap
        }
      } else {
        streak = 1; // First check-in
      }

      // Update check-in data
     checkIns.push(isoDate);
      await firestoreService.saveChallengeData(userId, challengeId, {
        ...data,
        streak,
       lastCheckIn: isoDate,
        checkIns,
      });
      
      return { 
        success: true, 
        streak, 
       lastCheckIn: isoDate, 
        checkIns,
        message: 'Check-in successful!'
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
   * Evaluates challenge rules against user transactions.
   * @param {string} userId - User's unique ID
   * @param {string} challengeId - Challenge's unique ID
   * @param {string} evaluationDate - Optional ISO date string (YYYY-MM-DD) for specific date evaluation
   * @returns {Promise<object>} Evaluation result with rule status
   */
  async evaluateChallenge(userId, challengeId, evaluationDate = null) {
    try {
      // Get challenge template from challenges collection
      const challengeTemplate = await firestoreService.getChallengeTemplate(challengeId);
      if (!challengeTemplate) {
        return { success: false, message: 'Challenge template not found.' };
      }

      // Get user transactions
      const transactions = await firestoreService.getTransactions(userId);
      if (!transactions || transactions.length === 0) {
        return { 
          success: false, 
          message: 'No transactions found. Please sync your transactions first.' 
        };
      }

      // Filter transactions based on evaluation date or challenge duration
      let relevantTransactions;
      if (evaluationDate) {
        // For specific date evaluation, only look at transactions on that date
        // Use authorized_date when present, with fallback to date
        relevantTransactions = transactions.filter(txn => {
          const txnDate = txn.authorized_date || txn.date;
          return txnDate && txnDate === evaluationDate;
        });
      } else {
        // For general evaluation, use challenge duration window
        const duration = challengeTemplate.duration || 7;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - duration);
        const cutoffIso = cutoffDate.toISOString().slice(0, 10);
        relevantTransactions = transactions.filter(txn => {
          const txnDate = txn.authorized_date || txn.date;
          return txnDate && txnDate >= cutoffIso;
        });
      }

      // Evaluate the rule
      const ruleBroken = evaluateRule(
        challengeTemplate.ruleType, 
        relevantTransactions, 
        challengeTemplate
      );

      // Get specific violated transactions based on rule type
      let violatedTransactions = [];
      if (ruleBroken) {
        switch (challengeTemplate.ruleType) {
          case 'spend_block':
            violatedTransactions = relevantTransactions.filter(txn => {
              const matchesCategory = challengeTemplate.target?.pfc_detailed && 
                txn.personal_finance_category?.detailed?.includes(challengeTemplate.target.pfc_detailed);
              const matchesMerchant = challengeTemplate.target?.merchants && 
                challengeTemplate.target.merchants.includes(txn.merchant_name);
              return matchesCategory || matchesMerchant;
            });
            break;
          case 'spend_cap':
            violatedTransactions = relevantTransactions.filter(txn => {
              return challengeTemplate.target?.pfc_primary && 
                txn.personal_finance_category?.primary?.includes(challengeTemplate.target.pfc_primary);
            });
            break;
          case 'replacement':
            violatedTransactions = relevantTransactions.filter(txn => {
              const fromCategory = challengeTemplate.replacement?.fromCategory;
              return fromCategory && txn.personal_finance_category?.detailed?.includes(fromCategory);
            });
            break;
          case 'streak_goal':
            // For streak goal, return all transactions since the violation is about missing days
            violatedTransactions = relevantTransactions;
            break;
          default:
            violatedTransactions = relevantTransactions;
        }
      }

      let reason = '';
      if (ruleBroken) {
        switch (challengeTemplate.ruleType) {
          case 'spend_block':
            reason = `Spent on blocked category/merchant: ${challengeTemplate.target?.pfc_detailed || challengeTemplate.target?.merchants?.join(', ') || 'unknown'}`;
            break;
          case 'spend_cap':
            reason = `Exceeded spending cap of $${challengeTemplate.capAmount} on ${challengeTemplate.target?.pfc_primary}`;
            break;
          case 'replacement':
            reason = `Failed to replace ${challengeTemplate.replacement?.fromCategory} with ${challengeTemplate.replacement?.toCategory}`;
            break;
          case 'streak_goal':
            reason = `Missed daily goal for ${challengeTemplate.target?.pfc_primary}`;
            break;
          default:
            reason = 'Challenge rule was broken';
        }
      }

      return { 
        success: true, 
        ruleBroken,
        reason,
        evaluatedTransactions: relevantTransactions.length,
        violatedTransactions,
        challengeTemplate: {
          ruleType: challengeTemplate.ruleType,
          duration: challengeTemplate.duration,
          title: challengeTemplate.title
        }
      };
    } catch (error) {
      return { success: false, message: `Error evaluating challenge: ${error.message}` };
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
        if (!txn.amount) return false;
        
        // Use authorized_date when present, with fallback to date
        const txnDate = txn.authorized_date || txn.date;
        if (!txnDate || txnDate !== date) return false;
        
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
  async syncTransactions(userId, days = 90) {
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
