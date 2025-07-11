/**
 * UserController handles HTTP requests related to user management (registration, profile, updates).
 * Each method is an Express route handler.
 */

const userService = require('../services/userService');

module.exports = {
  /**
   * Creates a new user in Firestore.
   */
  async createUser(req, res) {
    try {
      const { userId, ...userData } = req.body;
      if (!userId) {
        return res.status(400).json({ error: 'userId is required.' });
      }
      const user = await userService.createUser(userId, userData);
      return res.status(201).json(user);
    } catch (err) {
      return res.status(400).json({ error: err.message || 'Failed to create user.' });
    }
  },

  /**
   * Deletes a user from Firestore.
   */
  async deleteUser(req, res) {
    try {
      const userId = req.params.userId;
      if (!userId) {
        return res.status(400).json({ error: 'userId is required in URL.' });
      }
      await userService.deleteUser(userId);
      return res.status(204).send();
    } catch (err) {
      return res.status(400).json({ error: err.message || 'Failed to delete user.' });
    }
  },

  /**
   * Retrieves user data from Firestore.
   */
  async getUser(req, res) {
    try {
      const userId = req.params.userId || req.query.userId;
      if (!userId) {
        return res.status(400).json({ error: 'userId is required.' });
      }
      const user = await userService.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }
      return res.status(200).json(user);
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Failed to get user.' });
    }
  },

  /**
   * Updates user details in Firestore.
   */
  async updateUser(req, res) {
    try {
      const userId = req.params.userId;
      const updates = req.body;
      if (!userId) {
        return res.status(400).json({ error: 'userId is required in URL.' });
      }
      if (!updates || Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No update fields provided.' });
      }
      const user = await userService.updateUser(userId, updates);
      return res.status(200).json(user);
    } catch (err) {
      return res.status(400).json({ error: err.message || 'Failed to update user.' });
    }
  },
};
