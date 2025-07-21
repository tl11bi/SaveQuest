/**
 * Sample challenge templates based on the rule types defined in challengeRule.js
 * These can be seeded into the Firestore 'challenges' collection
 */

const sampleChallenges = [
  // SPEND_BLOCK challenges
  {
    id: 'no-fast-food-7d',
    title: 'No Fast Food for 7 Days',
    description: 'Avoid all fast food purchases for one week',
    ruleType: 'spend_block',
    duration: 7,
    difficulty: 'easy',
    target: {
      pfc_detailed: 'FOOD_AND_DRINK_FAST_FOOD',
      merchants: ['McDonald\'s', 'KFC', 'Burger King', 'Taco Bell']
    },
    reward: {
      type: 'badge',
      value: 'Fast Food Fighter',
      description: 'Completed 7 days without fast food'
    }
  },
  {
    id: 'no-uber-7d',
    title: 'No Uber for 7 Days',
    description: 'Skip ride-sharing for a week',
    ruleType: 'spend_block',
    duration: 7,
    difficulty: 'medium',
    target: {
      merchants: ['Uber', 'Lyft', 'Uber Technologies']
    },
    reward: {
      type: 'badge',
      value: 'Public Transit Hero',
      description: 'Avoided ride-sharing for 7 days'
    }
  },
  {
    id: 'no-coffee-shops-7d',
    title: 'No Coffee Shop Visits for 7 Days',
    description: 'Make your coffee at home for one week',
    ruleType: 'spend_block',
    duration: 7,
    difficulty: 'medium',
    target: {
      pfc_detailed: 'FOOD_AND_DRINK_COFFEE',
      merchants: ['Starbucks', 'Dunkin\'', 'Peet\'s Coffee']
    },
    reward: {
      type: 'badge',
      value: 'Home Barista',
      description: 'Skipped coffee shops for 7 days'
    }
  },

  // SPEND_CAP challenges
  {
    id: 'retail-cap-50-14d',
    title: 'Retail Spending Cap: $50 in 14 Days',
    description: 'Keep general merchandise spending under $50 for two weeks',
    ruleType: 'spend_cap',
    duration: 14,
    difficulty: 'medium',
    capAmount: 50,
    target: {
      pfc_primary: 'GENERAL_MERCHANDISE'
    },
    reward: {
      type: 'badge',
      value: 'Budget Master',
      description: 'Stayed under retail spending limit'
    }
  },
  {
    id: 'food-delivery-cap-25-7d',
    title: 'Food Delivery Cap: $25 in 7 Days',
    description: 'Limit food delivery spending to $25 this week',
    ruleType: 'spend_cap',
    duration: 7,
    difficulty: 'hard',
    capAmount: 25,
    target: {
      pfc_detailed: 'FOOD_AND_DRINK_RESTAURANTS'
    },
    reward: {
      type: 'badge',
      value: 'Delivery Discipline',
      description: 'Controlled food delivery spending'
    }
  },

  // REPLACEMENT challenges
  {
    id: 'gym-for-fast-food-7d',
    title: 'Replace Fast Food with Gym Visits',
    description: 'Skip fast food and hit the gym instead for 7 days',
    ruleType: 'replacement',
    duration: 7,
    difficulty: 'hard',
    replacement: {
      fromCategory: 'FOOD_AND_DRINK_FAST_FOOD',
      toCategory: 'RECREATION_FITNESS'
    },
    reward: {
      type: 'badge',
      value: 'Health Warrior',
      description: 'Successfully replaced bad habits with good ones'
    }
  },
  {
    id: 'savings-for-impulse-14d',
    title: 'Replace Impulse Buys with Savings',
    description: 'Skip unnecessary purchases and save money instead',
    ruleType: 'replacement',
    duration: 14,
    difficulty: 'medium',
    replacement: {
      fromCategory: 'GENERAL_MERCHANDISE',
      toCategory: 'TRANSFER_SAVINGS'
    },
    reward: {
      type: 'badge',
      value: 'Smart Saver',
      description: 'Chose savings over spending'
    }
  },

  // STREAK_GOAL challenges
  {
    id: 'daily-savings-5d',
    title: '5-Day Savings Streak',
    description: 'Make at least one savings transfer every day for 5 days',
    ruleType: 'streak_goal',
    duration: 5,
    difficulty: 'medium',
    target: {
      pfc_primary: 'TRANSFER_SAVINGS'
    },
    reward: {
      type: 'badge',
      value: 'Savings Streak',
      description: 'Saved money 5 days in a row'
    }
  },
  {
    id: 'no-spending-3d',
    title: '3-Day No Spending Streak',
    description: 'Have days with zero discretionary spending',
    ruleType: 'streak_goal',
    duration: 3,
    difficulty: 'hard',
    target: {
      pfc_primary: 'NO_DISCRETIONARY_SPENDING' // This would need custom logic
    },
    reward: {
      type: 'badge',
      value: 'Spending Freeze Master',
      description: 'Went 3 days without unnecessary spending'
    }
  }
];

module.exports = sampleChallenges;
