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

      // Check if challenge period has ended - but still evaluate the challenge
      const challengePeriodEnded = todayOnly > challengeEndOnly;
      
      console.log('=== CHECK-IN DEBUG START ===');
      console.log('Challenge ID:', challengeId);
      console.log('User ID:', userId);
      console.log('Join date:', joinDateOnly);
      console.log('Today:', todayOnly);
      console.log('Challenge end date:', challengeEndOnly);
      console.log('Challenge period ended:', challengePeriodEnded);
      console.log('Challenge template:', {
        title: challengeTemplate.title,
        ruleType: challengeTemplate.ruleType,
        duration: challengeTemplate.duration,
        target: challengeTemplate.target,
        capAmount: challengeTemplate.capAmount,
        replacement: challengeTemplate.replacement
      });
      console.log('=== CHECK-IN DEBUG END ===');
      
      // Always evaluate the challenge for the actual challenge period
      const evaluation = await this.evaluateChallenge(userId, challengeId);
      
      if (!evaluation.success) {
        return evaluation; // Return error if evaluation failed
      }
      
      const ruleBroken = evaluation.ruleBroken;
      
      // Calculate streak: days completed successfully
      let currentStreak = 0;
      if (!ruleBroken) {
        const daysCompleted = Math.floor((today - joinDate) / (1000 * 60 * 60 * 24)) + 1;
        currentStreak = Math.min(daysCompleted, challengeTemplate.duration);
      }

      // If rule is broken, mark challenge as failed
      if (ruleBroken) {
        await firestoreService.saveChallengeData(userId, challengeId, {
          ...data,
          status: 'failed',
          streak: currentStreak,
          failedAt: new Date().toISOString()
        });
        
        return { 
          success: true, 
          status: 'failed',
          streak: currentStreak,
          ruleBroken: true,
          message: `Challenge failed! Rule violation detected.`,
          evaluation: evaluation,
          challengePeriodEnded: challengePeriodEnded
        };
      }

      // Challenge passed - determine final status based on whether period ended
      const isComplete = challengePeriodEnded || currentStreak >= challengeTemplate.duration;
      const newStatus = isComplete ? 'completed' : 'active';
      
      await firestoreService.saveChallengeData(userId, challengeId, {
        ...data,
        status: newStatus,
        streak: currentStreak,
        lastCheckedAt: new Date().toISOString(),
        ...(isComplete && { completedAt: new Date().toISOString() })
      });
      
      let message;
      if (challengePeriodEnded) {
        message = 'Challenge period has ended. Challenge completed successfully!';
      } else if (isComplete) {
        message = `Congratulations! Challenge completed with ${currentStreak} day streak!`;
      } else {
        message = `Check-in successful! Current streak: ${currentStreak} days`;
      }
      
      return { 
        success: true, 
        status: newStatus,
        streak: currentStreak,
        ruleBroken: false,
        isCompleted: isComplete,
        message: message,
        evaluation: evaluation,
        challengePeriodEnded: challengePeriodEnded
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
   * @returns {Promise<object>} Evaluation result with rule status
   */
  async evaluateChallenge(userId, challengeId) {
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

      // Filter transactions based on user's challenge join date
      // Always evaluate the complete challenge period (join date to challenge end date)
      const challengeData = await firestoreService.getChallengeData(userId, challengeId);
      if (!challengeData) {
        return { success: false, message: 'User challenge data not found.' };
      }
      
      const joinDate = new Date(challengeData.joinedAt);
      const joinDateOnly = toIsoDate(joinDate);
      const challengeEndDate = new Date(joinDate);
      challengeEndDate.setDate(challengeEndDate.getDate() + challengeTemplate.duration);
      const challengeEndOnly = toIsoDate(challengeEndDate);
      
      const relevantTransactions = transactions.filter(txn => {
        const txnDate = txn.authorized_date || txn.date;
        return txnDate && txnDate >= joinDateOnly && txnDate <= challengeEndOnly;
      });

      console.log('=== TRANSACTIONS IN EVALUATION PERIOD ===');
      console.log('Total transactions found:', transactions.length);
      console.log('Relevant transactions in period:', relevantTransactions.length);
      relevantTransactions.forEach((txn, index) => {
        const txnDate = txn.authorized_date || txn.date;
        console.log(`Transaction ${index + 1}:`);
        console.log(`  - ID: ${txn.transaction_id}`);
        console.log(`  - Merchant: ${txn.merchant_name}`);
        console.log(`  - Amount: $${Math.abs(txn.amount)}`);
        console.log(`  - Date: ${txnDate}`);
        console.log(`  - Category Primary: ${txn.personal_finance_category?.primary}`);
        console.log(`  - Category Detailed: ${txn.personal_finance_category?.detailed}`);
        console.log(`  - Account ID: ${txn.account_id}`);
        console.log('---');
      });
      console.log('=== END TRANSACTIONS IN PERIOD ===');

      console.log('=== EVALUATION DEBUG ===');
      console.log('Challenge ID:', challengeId);
      console.log('Join date:', joinDateOnly);
      console.log('Challenge end date:', challengeEndOnly);
      console.log('Evaluation period:', `${joinDateOnly} to ${challengeEndOnly}`);
      console.log('Total transactions:', transactions.length);
      console.log('Relevant transactions:', relevantTransactions.length);
      console.log('Challenge template target:', challengeTemplate.target);
      console.log('Challenge rule type:', challengeTemplate.ruleType);      // Evaluate the rule
      const ruleBroken = evaluateRule(
        challengeTemplate.ruleType, 
        relevantTransactions, 
        challengeTemplate
      );

      console.log('Rule evaluation result:', ruleBroken);

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
              console.log(`Checking transaction ${txn.merchant_name}:`);
              console.log(`  - Category match (${challengeTemplate.target?.pfc_detailed}): ${matchesCategory}`);
              console.log(`  - Merchant match (${challengeTemplate.target?.merchants}): ${matchesMerchant}`);
              console.log(`  - Transaction category detailed: ${txn.personal_finance_category?.detailed}`);
              console.log(`  - Transaction category primary: ${txn.personal_finance_category?.primary}`);
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
            // For streak goal, the violation is the absence of qualifying transactions
            const qualifyingTransactions = relevantTransactions.filter(txn => {
              const matchesTarget = challengeTemplate.target?.pfc_primary && 
                (txn.personal_finance_category?.primary?.includes(challengeTemplate.target.pfc_primary) ||
                 txn.personal_finance_category?.detailed?.includes(challengeTemplate.target.pfc_primary));
              console.log(`Checking streak goal transaction ${txn.merchant_name}:`);
              console.log(`  - Target category: ${challengeTemplate.target?.pfc_primary}`);
              console.log(`  - Transaction category primary: ${txn.personal_finance_category?.primary}`);
              console.log(`  - Transaction category detailed: ${txn.personal_finance_category?.detailed}`);
              console.log(`  - Matches target: ${matchesTarget}`);
              return matchesTarget;
            });
            console.log(`Found ${qualifyingTransactions.length} qualifying transactions for streak goal`);
            // For streak goals, we don't return violated transactions in the traditional sense
            // Instead, we indicate success/failure based on having qualifying transactions
            violatedTransactions = [];
            break;
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

      if (ruleBroken) {
        console.log('RULE BROKEN - Violated transactions:', violatedTransactions.length);
        violatedTransactions.forEach(txn => {
          const txnDate = txn.authorized_date || txn.date;
          console.log(`Violation: ${txn.merchant_name} - $${Math.abs(txn.amount)} on ${txnDate}`);
        });
      } else {
        console.log('NO RULE VIOLATIONS FOUND - Challenge is passing');
      }
      
      console.log('=== FINAL EVALUATION RESULT ===');
      console.log('Rule broken:', ruleBroken);
      console.log('Reason:', reason || 'No violations');
      console.log('Evaluated transactions:', relevantTransactions.length);
      console.log('Violated transactions:', violatedTransactions.length);
      console.log('=== END DEBUG ===');

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
