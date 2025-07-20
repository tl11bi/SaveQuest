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
  // Build a Set of ISO dates that *do* have a qualifying transaction
  const okDays = new Set();
  
  txns.forEach(txn => {
    // Use authorized_date when present, with fallback to date
    const txnDateStr = txn.authorized_date || txn.date;
    if (!txnDateStr) return;
    
    const date = new Date(txnDateStr);
    const isoDate = date.toISOString().slice(0, 10);
    
    // Check if transaction matches target category
    const matchesTarget = template.target?.pfc_primary && 
      (txn.personal_finance_category?.primary?.includes(template.target.pfc_primary) ||
       txn.personal_finance_category?.detailed?.includes(template.target.pfc_primary));
    
    if (matchesTarget) {
      okDays.add(isoDate);
    }
  });
  
  // For each day in the last `duration` days, check presence
  const duration = template.duration || 7;
  for (let i = 0; i < duration; i++) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    const isoDate = day.toISOString().slice(0, 10);
    
    if (!okDays.has(isoDate)) {
      return true; // Broken if any day missing
    }
  }
  
  return false;
}

module.exports = {
  evaluateRule,
  spendsBlockedCategory,
  exceedsSpendCap,
  missesReplacement,
  breaksStreakGoal
};
