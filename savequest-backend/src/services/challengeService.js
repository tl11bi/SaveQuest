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
   * Simplified check-in for POC: Only requires userId and challengeId.
   * Evaluates entire challenge period from joinedAt to joinedAt + duration.
   * @param {string} userId - User's unique ID
   * @param {string} challengeId - Challenge's unique ID
   * @returns {Promise<object>} Challenge status and streak or error
   */
  async checkIn(userId, challengeId) {
    try {
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

      // Get challenge template
      const challengeTemplate = await firestoreService.getChallengeTemplate(challengeId);
      if (!challengeTemplate) {
        return { success: false, message: 'Challenge template not found.' };
      }

      // Calculate date ranges
      const joinDate = new Date(data.joinedAt);
      const joinDateOnly = toIsoDate(joinDate);
      const today = new Date();
      const todayOnly = toIsoDate(today);
      
      // Calculate challenge end date
      const challengeEndDate = new Date(joinDate);
      challengeEndDate.setDate(challengeEndDate.getDate() + challengeTemplate.duration);
      const challengeEndOnly = toIsoDate(challengeEndDate);

      // Calculate streak: min(days since join, duration)
      const daysSinceJoin = Math.floor((today - joinDate) / (1000 * 60 * 60 * 24));
      const streak = Math.min(daysSinceJoin, challengeTemplate.duration);

      // If challenge period hasn't ended yet, evaluate all transactions from join to today
      if (todayOnly <= challengeEndOnly) {
        // Evaluate all transactions in the challenge period
        const evaluation = await this.evaluateChallenge(userId, challengeId);
        
        if (!evaluation.success) {
          return evaluation; // Return error if evaluation failed
        }
        
        if (evaluation.ruleBroken) {
          // Get detailed violation message with first violating transaction
          let detailedMessage = evaluation.reason || 'Challenge rule violation detected';
          
          if (evaluation.violatedTransactions && evaluation.violatedTransactions.length > 0) {
            const firstViolation = evaluation.violatedTransactions[0];
            const violationDate = firstViolation.authorized_date || firstViolation.date;
            const amount = Math.abs(firstViolation.amount || 0).toFixed(2);
            const merchant = firstViolation.merchant_name || 'Unknown merchant';
            
            detailedMessage += `. First violation: $${amount} at ${merchant} on ${violationDate}`;
          }
          
          // Mark challenge as failed
          await firestoreService.saveChallengeData(userId, challengeId, {
            ...data,
            status: 'failed',
            failedAt: new Date().toISOString(),
            failureReason: detailedMessage,
            streak: streak
          });
          
          return {
            success: false,
            message: `Challenge failed: ${detailedMessage}. Please rejoin to start over.`,
            challengeFailed: true,
            streak: streak,
            violationDetails: {
              reason: evaluation.reason,
              firstViolation: evaluation.violatedTransactions?.[0],
              totalViolations: evaluation.violatedTransactions?.length || 0
            }
          };
        }
      }

      // If we reach here, either challenge is completed successfully or still ongoing with no violations
      const isCompleted = todayOnly > challengeEndOnly;
      const status = isCompleted ? 'completed' : 'active';
      
      // Update challenge data
      await firestoreService.saveChallengeData(userId, challengeId, {
        ...data,
        status: status,
        streak: streak,
        lastCheckIn: todayOnly,
        ...(isCompleted && { completedAt: new Date().toISOString() })
      });
      
      return { 
        success: true, 
        status: status,
        streak: streak,
        isCompleted: isCompleted,
        message: isCompleted ? 'Challenge completed successfully!' : 'Check-in successful!',
        challengeEndDate: challengeEndOnly
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

      // Filter transactions based on evaluation date or user's challenge join date
      let relevantTransactions;
      if (evaluationDate) {
        // For specific date evaluation, only look at transactions on that date
        // Use authorized_date when present, with fallback to date
        relevantTransactions = transactions.filter(txn => {
          const txnDate = txn.authorized_date || txn.date;
          return txnDate && txnDate === evaluationDate;
        });
      } else {
        // For general evaluation, get the user's join date and evaluate from join to now
        const challengeData = await firestoreService.getChallengeData(userId, challengeId);
        if (!challengeData) {
          return { success: false, message: 'User challenge data not found.' };
        }
        
        const joinDate = new Date(challengeData.joinedAt);
        const joinDateOnly = toIsoDate(joinDate);
        const today = new Date();
        const challengeEndDate = new Date(joinDate);
        challengeEndDate.setDate(challengeEndDate.getDate() + challengeTemplate.duration);
        const evaluateUntil = today < challengeEndDate ? toIsoDate(today) : toIsoDate(challengeEndDate);
        
        relevantTransactions = transactions.filter(txn => {
          const txnDate = txn.authorized_date || txn.date;
          return txnDate && txnDate >= joinDateOnly && txnDate <= evaluateUntil;
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
