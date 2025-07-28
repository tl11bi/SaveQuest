## Challenge Ideas

Based on your sample transactions, here are some improved challenge ideas:

### Merchant-based Challenges

- **No McDonald's for 7 days**
- **No KFC for 7 days**
- **No Uber for 7 days**
- **No Starbucks for 7 days**
- **No United Airlines for 30 days**

### Category-based Challenges

- **No Fast Food for 7 days**  
    *(Use `personal_finance_category.detailed` or `merchant_name` for fast food merchants)*
- **No Coffee Shops for 7 days**
- **No Ride Shares for 7 days**
- **No General Merchandise for 7 days**

### Spending Limit Challenges

- **Spend less than $50 on Fast Food in 7 days**
- **Spend less than $20 on Coffee in 7 days**

### Frequency Challenges

- **No more than 2 Uber rides in 7 days**
- **No more than 1 Starbucks visit in 7 days**

### Positive Habit Challenges

- **Make at least 1 payment to “Touchstone Climbing” (or any gym) in 7 days**
- **Make at least 1 deposit (e.g., “CD DEPOSIT”) in 7 days**

### Custom/Combo Challenges

- **No McDonald's and no KFC for 7 days**
- **No eating out (all merchants with `FOOD_AND_DRINK` category) for 7 days**



## 🟥 1. `spend_block` — **“Don’t spend on X”**

### 💡 Concept

Block all spending that matches a given **category**, **merchant**, or **keyword** during a set challenge window (e.g., 7 days).

### 🔍 Used for

* No McDonald’s for 7 days
* No Uber/Lyft
* No fast food this week
* No coffee shop purchases

### 🔧 Template example

```json
{
  "ruleType": "spend_block",
  "duration": 7,
  "target": {
    "pfc_detailed": "FOOD_AND_DRINK_FAST_FOOD",
    "merchants": ["McDonald's"]
  }
}
```

### ✅ Rule logic

Return `true` (broken) if **any** transaction during the window:

* Matches the target category
* OR is from a merchant in the block list

### ✅ Simple code

```ts
txns.some(txn =>
  txn.category.includes(template.target.pfc_detailed) ||
  template.target.merchants?.includes(txn.merchant_name)
)
```

---

## 🟧 2. `spend_cap` — **“Limit spending on X”**

### 💡 Concept

Cap spending in a category (or merchant group) within a rolling or fixed time window (e.g., “< \$50 on retail in 14 days”).

### 🔍 Used for

* “Retail Blackout” challenge
* “No more than \$10 on coffee this week”
* “Keep food delivery under \$25”

### 🔧 Template example

```json
{
  "ruleType": "spend_cap",
  "capAmount": 50,
  "windowDays": 14,
  "target": {
    "pfc_primary": "GENERAL_MERCHANDISE"
  }
}
```

### ✅ Rule logic

Return `true` (broken) if **sum of txn.amounts** in window > `capAmount`

```ts
const total = txns
  .filter(t => t.category.includes(template.target.pfc_primary))
  .reduce((sum, t) => sum + t.amount, 0);
return total > template.capAmount;
```

---

## 🟨 3. `replacement` — **“Replace bad habit with better one”**

### 💡 Concept

Encourage a *swap*: e.g., every fast food skip must be paired with a gym visit or a savings transfer.

### 🔍 Used for

* Swap Starbucks for homemade coffee
* For every ride-share skipped, do 1 public transit or bike ride
* Replace impulse buying with savings

### 🔧 Template example

```json
{
  "ruleType": "replacement",
  "duration": 7,
  "replacement": {
    "fromCategory": "FOOD_AND_DRINK_FAST_FOOD",
    "toCategory": "SPORTS_AND_FITNESS_GYMS"
  }
}
```

### ✅ Rule logic

Success =
• No `fromCategory` **AND**
• At least one txn in `toCategory` during the window

```ts
const avoided = txns.every(t => !t.category.includes(from));
const didSwap = txns.some(t => t.category.includes(to));
return !(avoided && didSwap); // returns true if failed
```

> Can be extended later to “for every 1 fast food skipped, must save \$X or do Y”

---

## 🟩 4. `streak_goal` — **“Do something X days in a row”**

### 💡 Concept

Track positive actions over time — not “what did you avoid,” but “what did you do?”

### 🔍 Used for

* 3 days in a row with **no spending at all**
* Log at least 1 **savings** transaction per day for 5 straight days
* “No unnecessary purchases” streak

### 🔧 Template example

```json
{
  "ruleType": "streak_goal",
  "duration": 5,
  "target": {
    "pfc_primary": "TRANSFER_SAVINGS"
  }
}
```

### ✅ Rule logic

* Group transactions by day
* For each day in the window, is there **at least one txn** in the target category?
* If any day fails → return `true` (broken)

```ts
const grouped = groupByDate(txns); // e.g. { "2025-07-17": [...], ... }
for (let day of challengeWindowDays) {
  const hasQualifying = (grouped[day] || []).some(t =>
    t.category.includes(template.target.pfc_primary)
  );
  if (!hasQualifying) return true; // broken
}
return false;
```

> This one encourages **habit building** over time and gives you daily “streak” UX.

---

## ✅ Summary Comparison

| Rule Type     | Goal                | Breaks if...                      | Best For                     |
| ------------- | ------------------- | --------------------------------- | ---------------------------- |
| `spend_block` | Don’t spend on X    | Any txn matches category/merchant | Quit habits (Uber, McD)      |
| `spend_cap`   | Limit how much on X | Total > capAmount                 | Budget control               |
| `replacement` | Swap bad for good   | Bad exists & no good found        | Habit pairing (gym, savings) |
| `streak_goal` | Build a daily habit | Any day missing the action        | Positive action streaks      |

---

Want help writing Firestore templates for each rule type, or wiring your `/check-in` route to support all four? I can generate starter code or seed data too.
