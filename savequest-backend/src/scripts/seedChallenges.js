/**
 * Script to seed sample challenges into Firestore
 * Run this script to populate the challenges collection with sample data
 */

const admin = require('firebase-admin');
const config = require('../config');
const sampleChallenges = require('../data/sampleChallenges');

// Initialize Firebase Admin if not already initialized
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

async function seedChallenges() {
  console.log('Starting to seed challenges...');
  
  try {
    const batch = db.batch();
    
    for (const challenge of sampleChallenges) {
      const { id, ...challengeData } = challenge;
      const challengeRef = db.collection('challenges').doc(id);
      
      // Add creation timestamp
      challengeData.createdAt = admin.firestore.FieldValue.serverTimestamp();
      challengeData.isActive = true;
      
      batch.set(challengeRef, challengeData);
      console.log(`Prepared challenge: ${challenge.title}`);
    }
    
    await batch.commit();
    console.log(`Successfully seeded ${sampleChallenges.length} challenges!`);
    
    // Verify the seeding
    const snapshot = await db.collection('challenges').get();
    console.log(`Total challenges in database: ${snapshot.size}`);
    
  } catch (error) {
    console.error('Error seeding challenges:', error);
  }
}

// Run the seeding if this script is executed directly
if (require.main === module) {
  seedChallenges()
    .then(() => {
      console.log('Seeding completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedChallenges };
