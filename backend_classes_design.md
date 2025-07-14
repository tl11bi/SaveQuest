## 🏗️ Suggested Class & Module Structure

Here’s a modular breakdown for your backend, mapping architecture to code. Use JavaScript or TypeScript as needed.

### Controllers

**PlaidController**
  - `createLinkToken(req, res)`: Generates a Plaid Link token for the frontend. Params: `{ userId }` (body). Returns: `{ link_token, expiration }`
  - `exchangePublicToken(req, res)`: Exchanges a public token for an access token and stores item mapping. Params: `{ publicToken, userId }` (body). Returns: `{ access_token, item_id }`
  - `getAccounts(req, res)`: Fetches Plaid accounts for a user. Params: `{ accessToken }` (body). Returns: `{ accounts: [...] }`
  - `getTransactions(req, res)`: Fetches Plaid transactions for a user. Params: `{ accessToken, startDate, endDate }` (body). Returns: `{ transactions: [...] }`
  - `handleWebhook(req, res)`: Handles Plaid webhook events, triggers transaction sync. Params: Plaid webhook payload (body). Returns: status message

**UserController**
  - `createUser(req, res)`: Creates a new user in Firestore. Params: `{ userId, ...userData }` (body). Returns: user object
  - `getUser(req, res)`: Retrieves user data. Params: `{ userId }` (query or params). Returns: user object
  - `updateUser(req, res)`: Updates user details. Params: `{ userId, ...userData }` (body). Returns: updated user object
  - `deleteUser(req, res)`: Deletes a user. Params: `{ userId }` (params). Returns: status

**ChallengeController**
  - `joinChallenge(req, res)`: Enrolls user in a challenge. Params: `{ userId, challengeId }` (body). Returns: challenge data
  - `checkIn(req, res)`: Handles daily check-in, validates qualifying payment. Params: `{ userId, challengeId, date }` (body). Returns: `{ streak, lastCheckIn, qualifyingPayment }`
  - `getStreak(req, res)`: Gets current streak for a challenge. Params: `{ userId, challengeId }` (params). Returns: `{ streak, lastCheckIn }`
  - `syncTransactions(req, res)`: Manually syncs transactions for a user. Params: `{ userId, days? }` (body). Returns: sync result


### Services

**PlaidService**
  - `createLinkToken(userId)`: Generates a Plaid Link token. Returns: `{ link_token, expiration }`
  - `exchangePublicToken(publicToken)`: Exchanges public token for access token and item_id. Returns: `{ access_token, item_id }`
  - `getTransactions(userId, accessToken, startDate, endDate)`: Fetches transactions and stores them. Returns: Plaid transactions response
  - `getAccounts(accessToken)`: Fetches account info. Returns: `{ accounts: [...] }`
  - `processWebhookEvent(eventData)`: Handles Plaid webhooks, syncs transactions. Returns: status message

**FirestoreService**
  - `saveUser(userId, data)`: Creates/updates user.
  - `getUser(userId)`: Retrieves user.
  - `saveTransactions(userId, transactions)`: Stores transactions.
  - `getTransactions(userId)`: Retrieves transactions.
  - `saveChallengeData(userId, challengeId, data)`: Stores challenge data.
  - `getChallengeData(userId, challengeId)`: Retrieves challenge data.
  - `savePlaidItemMapping(itemId, userId, accessToken)`: Stores Plaid item mapping.
  - `getPlaidItemMapping(itemId)`: Retrieves mapping.
  - `getPlaidAccessTokenByUserId(userId)`: Finds access token for user.

**ChallengeService**
  - `joinChallenge(userId, challengeId)`: Enrolls user in challenge. Returns: challenge data or error
  - `checkIn(userId, challengeId, date)`: Validates check-in with payment, updates streak. Returns: `{ streak, lastCheckIn, qualifyingPayment }` or error
  - `calculateStreak(userId, challengeId)`: Gets current streak. Returns: `{ streak, lastCheckIn }`
  - `verifyQualifyingPayment(userId, date)`: Checks for qualifying payment on date. Returns: `{ success, transaction }` or error
  - `syncTransactions(userId, days)`: Manually syncs transactions. Returns: sync result
  - `getUserPlaidAccessToken(userId)`: Helper to get access token.

**UserService**
  - `createUser(userId, userData)`: Creates user.
  - `getUser(userId)`: Gets user.
  - `updateUser(userId, userData)`: Updates user.
  - `deleteUser(userId)`: Deletes user.

- **NotificationService**
  - `sendReminder(userId, message)`: Sends daily reminders via FCM.
  - `sendCompletionNotification(userId, message)`: Notifies on challenge completion/milestones.

### Additional Modules

**NotificationService**
  - `sendReminder(userId, message)`: Sends daily reminders via FCM.
  - `sendCompletionNotification(userId, message)`: Notifies on challenge completion/milestones.

**Config Module**
  - Loads environment variables (Plaid keys, Firestore IDs), exports config.

**ErrorHandler / Middleware**
  - Centralizes error handling for Express, catches controller/service errors.

