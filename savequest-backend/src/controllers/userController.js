/**
 * UserController handles HTTP requests related to user management (registration, profile, updates).
 * Each method is an Express route handler.
 */

const userService = require('../services/userService');

module.exports = {
  /**
   * Deletes a user from Firestore.
   */
  async deleteUser(req, res) {
    try {
      const userId = req.params.userId;
      if (!userId) {
        return res.status(400).json({ error: 'userId is required.' });
      }
      const firestoreService = require('../services/firestoreService');
      await firestoreService.deleteUser(userId);
      return res.status(204).send();
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Failed to delete user.' });
    }
  },
  // ...existing code...

  /**
   * Deletes a user from Firestore.
   */
  async createUser(req, res) {
    try {
      const { uid, displayName, email, photoURL, providerId, phoneNumber, emailVerified } = req.body;
      if (!uid || !displayName || !email) {
        return res.status(400).json({ error: 'uid, displayName, and email are required.' });
      }
      const firestoreService = require('../services/firestoreService');
      const userData = {
        displayName,
        email,
        photoURL: photoURL || '',
        providerId: providerId || '',
        phoneNumber: phoneNumber || '',
        emailVerified: !!emailVerified,
        updatedAt: new Date().toISOString(),
      };
      await firestoreService.saveUser(uid, userData);
      return res.status(201).json({ uid, ...userData });
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Failed to create user.' });
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
