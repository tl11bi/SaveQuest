/**
 * UserService encapsulates all Firestore logic for user management.
 * Each method performs a specific Firestore operation.
 */

const db = require('./firestoreService');

module.exports = {
  /**
   * Creates a new user document in Firestore.
   * @param {string} userId - Unique user identifier
   * @param {object} userData - User data to store (email, XP, etc.)
   * @returns {Promise<object>} Created user document or error
   */
  async createUser(userId, userData) {
    try {
      const userRef = db.collection('users').doc(userId);
      const doc = await userRef.get();
      if (doc.exists) {
        const error = new Error('User already exists');
        error.code = 409;
        throw error;
      }
      await userRef.set(userData);
      const newDoc = await userRef.get();
      return { id: newDoc.id, ...newDoc.data() };
    } catch (err) {
      throw new Error(`Failed to create user: ${err.message}`);
    }
  },

  /**
   * Retrieves a user document from Firestore.
   * @param {string} userId - Unique user identifier
   * @returns {Promise<object>} User document or null if not found
   */
  async getUser(userId) {
    try {
      const doc = await db.collection('users').doc(userId).get();
      if (!doc.exists) {
        const error = new Error('User not found');
        error.code = 404;
        throw error;
      }
      return { id: doc.id, ...doc.data() };
    } catch (err) {
      throw new Error(`Failed to get user: ${err.message}`);
    }
  },

  /**
   * Updates a user document in Firestore (optional).
   * @param {string} userId - Unique user identifier
   * @param {object} updates - Fields to update
   * @returns {Promise<object>} Updated user document or error
   */
  async updateUser(userId, updates) {
    try {
      const userRef = db.collection('users').doc(userId);
      const doc = await userRef.get();
      if (!doc.exists) {
        const error = new Error('User does not exist');
        error.code = 404;
        throw error;
      }
      await userRef.update(updates);
      const updatedDoc = await userRef.get();
      return { id: updatedDoc.id, ...updatedDoc.data() };
    } catch (err) {
      throw new Error(`Failed to update user: ${err.message}`);
    }
  },
  /**
   * Deletes a user document from Firestore.
   * @param {string} userId - Unique user identifier
   * @returns {Promise<void>} Resolves if deleted, throws error if not found
   */
  async deleteUser(userId) {
    try {
      const userRef = db.collection('users').doc(userId);
      const doc = await userRef.get();
      if (!doc.exists) {
        const error = new Error('User not found');
        error.code = 404;
        throw error;
      }
      await userRef.delete();
    } catch (err) {
      throw new Error(`Failed to delete user: ${err.message}`);
    }
  },
};
