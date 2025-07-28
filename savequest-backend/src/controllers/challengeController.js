/**
 * ChallengeController handles HTTP requests for user challenges.
 */
const challengeService = require('../services/challengeService');
const firestoreService = require('../services/firestoreService');
const { seedChallenges } = require('../scripts/seedChallenges');

module.exports = {
  /**
   * Enrolls a user in a challenge.
   * @param {Request} req - Express request (expects userId, challengeId in body)
   * @param {Response} res - Express response
   * @returns {object} Joined challenge data or error
   */
  async joinChallenge(req, res) {
    try {
      const { userId, challengeId } = req.body;
      if (!userId || !challengeId) {
        return res.status(400).json({ success: false, message: 'userId and challengeId are required.' });
      }
      const result = await challengeService.joinChallenge(userId, challengeId);
      if (result.success) {
        return res.status(201).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * Handles a daily check-in for a user on a challenge.
   * @param {Request} req - Express request (expects userId, challengeId in body)
   * @param {Response} res - Express response
   * @returns {object} Updated streak/status or error
   */
  async checkIn(req, res) {
    try {
      const { userId, challengeId } = req.body;
      if (!userId || !challengeId) {
        return res.status(400).json({ success: false, message: 'userId and challengeId are required.' });
      }
      const result = await challengeService.checkIn(userId, challengeId);
      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * Gets the current streak for a user on a challenge.
   * @param {Request} req - Express request (expects userId, challengeId in params)
   * @param {Response} res - Express response
   * @returns {object} Current streak or error
   */
  async getStreak(req, res) {
    try {
      const { userId, challengeId } = req.params;
      if (!userId || !challengeId) {
        return res.status(400).json({ success: false, message: 'userId and challengeId are required in params.' });
      }
      const result = await challengeService.calculateStreak(userId, challengeId);
      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(404).json(result);
      }
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * Triggers manual transaction sync for a user.
   * @param {Request} req - Express request (expects userId in body, optional days)
   * @param {Response} res - Express response
   * @returns {object} Sync result or error
   */
  async syncTransactions(req, res) {
    try {
      const { userId, days = 30 } = req.body;
      if (!userId) {
        return res.status(400).json({ success: false, message: 'userId is required.' });
      }
      
      const result = await challengeService.syncTransactions(userId, days);
      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * Gets all available challenge templates.
   * @param {Request} req - Express request
   * @param {Response} res - Express response
   * @returns {object} List of available challenges or error
   */
  async getAllChallenges(req, res) {
    try {
      const challenges = await firestoreService.getAllChallenges();
      return res.status(200).json({ success: true, challenges });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * Evaluates a challenge for a user without checking in.
   * @param {Request} req - Express request (expects userId, challengeId in params)
   * @param {Response} res - Express response
   * @returns {object} Challenge evaluation result or error
   */
  async evaluateChallenge(req, res) {
    try {
      const { userId, challengeId } = req.params;
      if (!userId || !challengeId) {
        return res.status(400).json({ success: false, message: 'userId and challengeId are required in params.' });
      }
      
      const result = await challengeService.evaluateChallenge(userId, challengeId);
      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * Seeds sample challenges into the Firestore database.
   * @param {Request} req - Express request
   * @param {Response} res - Express response
   * @returns {object} Seeding result or error
   */
  async seedSampleChallenges(req, res) {
    try {
      await seedChallenges();
      return res.status(200).json({ 
        success: true, 
        message: 'Sample challenges have been successfully seeded into the database.' 
      });
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        message: `Failed to seed challenges: ${error.message}` 
      });
    }
  },

  /**
   * Gets all challenges that a user has joined.
   * @param {Request} req - Express request (expects userId in params)
   * @param {Response} res - Express response
   * @returns {object} List of user's challenges or error
   */
  async getUserChallenges(req, res) {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({ success: false, message: 'userId is required.' });
      }
      const userChallenges = await firestoreService.getUserChallenges(userId);
      return res.status(200).json({ success: true, challenges: userChallenges });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * Gets user transactions for recent activity display.
   * @param {Request} req - Express request (expects userId in params)
   * @param {Response} res - Express response
   * @returns {object} List of user's transactions or error
   */
  async getUserTransactions(req, res) {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({ success: false, message: 'userId is required.' });
      }
      const transactions = await firestoreService.getTransactions(userId);
      
      // Sort by date (newest first) and limit to recent transactions
      const sortedTransactions = (transactions || [])
        .sort((a, b) => {
          const dateA = a.authorized_date || a.date;
          const dateB = b.authorized_date || b.date;
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        })
        .slice(0, 10); // Limit to 10 most recent transactions
      
      return res.status(200).json({ success: true, transactions: sortedTransactions });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },
};
