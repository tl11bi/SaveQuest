// Returns true if the rule is broken (i.e. check-in failed)
function evaluateRule(ruleType, txns, template) {
  switch (ruleType) {
    case 'spend_block':
      return spendsBlockedCategory(txns, template);
    case 'spend_cap':
      return exceedsSpendCap(txns, template);
    case 'replacement':
      return missesReplacement(txns, template);
    case 'streak_goal':
      return breaksStreakGoal(txns, template);
    default:
      throw new Error(`Unknown rule type: ${ruleType}`);
  }
}

function spendsBlockedCategory(txns, template) {
  return txns.some(txn => {
    // Check if transaction matches blocked category
    const matchesCategory = template.target?.pfc_detailed && 
      txn.personal_finance_category?.detailed?.includes(template.target.pfc_detailed);
    
    // Check if transaction matches blocked merchant
    const matchesMerchant = template.target?.merchants && 
      template.target.merchants.includes(txn.merchant_name);
    
    return matchesCategory || matchesMerchant;
  });
}

function exceedsSpendCap(txns, template) {
  const total = txns
    .filter(txn => {
      // Filter transactions that match the target category
      return template.target?.pfc_primary && 
        txn.personal_finance_category?.primary?.includes(template.target.pfc_primary);
    })
    .reduce((sum, txn) => sum + Math.abs(txn.amount), 0); // Use absolute value for spending
  
  return total > (template.capAmount || 0);
}

function missesReplacement(txns, template) {
  const fromCategory = template.replacement?.fromCategory;
  const toCategory = template.replacement?.toCategory;
  
  if (!fromCategory || !toCategory) {
    return true; // Invalid template
  }
  
  // Check if user avoided the "from" category
  const avoided = txns.every(txn => 
    !txn.personal_finance_category?.detailed?.includes(fromCategory)
  );
  
  // Check if user did the "to" category
  const didSwap = txns.some(txn => 
    txn.personal_finance_category?.detailed?.includes(toCategory) ||
    txn.personal_finance_category?.primary?.includes(toCategory)
  );
  
  // Return true if the user failed (i.e. did *not* avoid or did *not* swap)
  return !(avoided && didSwap);
}

function breaksStreakGoal(txns, template) {
  // For streak goals, check if we have qualifying transactions for today
  // If we have qualifying transactions, the streak continues (rule NOT broken)
  // If we have no qualifying transactions, the streak is broken
  
  let hasQualifyingTransactions = false;
  
  txns.forEach(txn => {
    // Check if transaction matches target category
    const matchesTarget = template.target?.pfc_primary && 
      (txn.personal_finance_category?.primary?.includes(template.target.pfc_primary) ||
       txn.personal_finance_category?.detailed?.includes(template.target.pfc_primary));
    
    if (matchesTarget) {
      hasQualifyingTransactions = true;
    }
  });
  
  // Return true if rule is broken (no qualifying transactions found)
  // Return false if rule is NOT broken (qualifying transactions found)
  return !hasQualifyingTransactions;
}

module.exports = {
  evaluateRule,
  spendsBlockedCategory,
  exceedsSpendCap,
  missesReplacement,
  breaksStreakGoal
};
