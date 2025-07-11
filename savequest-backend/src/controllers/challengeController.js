/**
 * ChallengeController handles HTTP requests for user challenges.
 */
const challengeService = require('../services/challengeService');

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
   * @param {Request} req - Express request (expects userId, challengeId, date in body)
   * @param {Response} res - Express response
   * @returns {object} Updated streak/status or error
   */
  async checkIn(req, res) {
    try {
      const { userId, challengeId, date } = req.body;
      if (!userId || !challengeId || !date) {
        return res.status(400).json({ success: false, message: 'userId, challengeId, and date are required.' });
      }
      const result = await challengeService.checkIn(userId, challengeId, date);
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
};
