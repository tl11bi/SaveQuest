/**
 * FirestoreService handles all Firestore operations for users, transactions, challenges, and Plaid item mappings.
 *
 * Methods:
 * - saveUser(userId, data): Creates or updates a user document.
 * - getUser(userId): Retrieves a user document.
 * - saveTransactions(userId, transactions): Stores an array of transactions for a user.
 * - getTransactions(userId): Retrieves all transactions for a user.
 * - saveChallengeData(userId, challengeId, challengeData): Stores challenge data for a user and challenge.
 * - getChallengeData(userId, challengeId): Retrieves challenge data for a user and challenge.
 * - savePlaidItemMapping(itemId, userId, accessToken): Stores Plaid item_id mapping.
 * - getPlaidItemMapping(itemId): Retrieves Plaid item_id mapping.
 * - getPlaidAccessTokenByUserId(userId): Finds Plaid access token by userId.
 */

const admin = require('firebase-admin');
const config = require('../config');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.firestore.projectId,
      clientEmail: config.firestore.clientEmail,
      privateKey: config.firestore.privateKey,
    }),
    databaseURL: config.firestore.databaseURL,
  });
}

const db = admin.firestore();


module.exports = {
  /**
   * Deletes a user document from Firestore.
   * @param {string} userId - User's unique ID
   * @returns {Promise<void>} Resolves when user is deleted
   */
  async deleteUser(userId) {
    const userRef = db.collection('users').doc(userId);
    await userRef.delete();
  },

  /**
   * Stores or updates a user document in Firestore.
   * @param {string} userId - User's unique ID
   * @param {object} data - User data to store
   * @returns {Promise<void>} Resolves when user is saved
   */
  async saveUser(userId, data) {
    const userRef = db.collection('users').doc(userId);
    await userRef.set(data, { merge: true });
  },

  /**
   * Retrieves a user document from Firestore.
   * @param {string} userId - User's unique ID
   * @returns {Promise<object|null>} User data or null if not found
   */
  async getUser(userId) {
    const userRef = db.collection('users').doc(userId);
    const doc = await userRef.get();
    return doc.exists ? doc.data() : null;
  },

  /**
   * Stores an array of transactions for a user in Firestore.
   * @param {string} userId - User's unique ID
   * @param {Array<object>} transactions - Array of transaction objects to store
   * @returns {Promise<void>} Resolves when transactions are saved
   */
  async saveTransactions(userId, transactions) {
    // Store transactions in a subcollection 'transactions' under the user document
    const batch = db.batch();
    const userRef = db.collection('users').doc(userId);
    const transactionsRef = userRef.collection('transactions');
    // Optionally clear existing transactions for the date range, or upsert by transaction_id
    for (const txn of transactions) {
      if (!txn.transaction_id) continue;
      const txnRef = transactionsRef.doc(txn.transaction_id);
      batch.set(txnRef, txn, { merge: true });
    }
    await batch.commit();
  },

  /**
   * Retrieves all transactions for a user from Firestore.
   * @param {string} userId - User's unique ID
   * @returns {Promise<Array<object>>} Array of transaction objects
   */
  async getTransactions(userId) {
    // Retrieve all transactions for a user from the 'transactions' subcollection
    const userRef = db.collection('users').doc(userId);
    const transactionsRef = userRef.collection('transactions');
    const snapshot = await transactionsRef.get();
    return snapshot.docs.map(doc => doc.data());
  },

  /**
   * Stores challenge data for a user and challengeId in Firestore.
   * @param {string} userId - User's unique ID
   * @param {string} challengeId - Challenge's unique ID
   * @param {object} challengeData - Challenge data to store
   * @returns {Promise<void>} Resolves when data is saved
   */
  async saveChallengeData(userId, challengeId, challengeData) {
    const userRef = db.collection('users').doc(userId);
    const challengeRef = userRef.collection('challenges').doc(challengeId);
    await challengeRef.set(challengeData, { merge: true });
  },

  /**
   * Retrieves challenge data for a user and challengeId from Firestore.
   * @param {string} userId - User's unique ID
   * @param {string} challengeId - Challenge's unique ID
   * @returns {Promise<object|null>} Challenge data or null if not found
   */
  async getChallengeData(userId, challengeId) {
    const userRef = db.collection('users').doc(userId);
    const challengeRef = userRef.collection('challenges').doc(challengeId);
    const doc = await challengeRef.get();
    return doc.exists ? doc.data() : null;
  },

  /**
   * Stores a mapping between Plaid item_id, userId, and accessToken.
   * @param {string} itemId - Plaid item_id
   * @param {string} userId - User's unique ID
   * @param {string} accessToken - Plaid access token
   * @returns {Promise<void>} Resolves when mapping is saved
   */
  async savePlaidItemMapping(itemId, userId, accessToken) {
    const ref = db.collection('plaidItemMappings').doc(itemId);
    await ref.set({ userId, accessToken }, { merge: true });
  },

  /**
   * Retrieves the mapping for a Plaid item_id (returns userId and accessToken).
   * @param {string} itemId - Plaid item_id
   * @returns {Promise<{userId: string, accessToken: string}|null>} Mapping or null if not found
   */
  async getPlaidItemMapping(itemId) {
    const ref = db.collection('plaidItemMappings').doc(itemId);
    const doc = await ref.get();
    return doc.exists ? doc.data() : null;
  },

  /**
   * Finds a Plaid access token for a given userId.
   * @param {string} userId - User's unique ID
   * @returns {Promise<string|null>} Access token or null if not found
   */
  async getPlaidAccessTokenByUserId(userId) {
    const mappingsRef = db.collection('plaidItemMappings');
    const snapshot = await mappingsRef.where('userId', '==', userId).limit(1).get();
    
    if (snapshot.empty) {
      return null;
    }
    
    const mapping = snapshot.docs[0].data();
    return mapping.accessToken;
  },
};
