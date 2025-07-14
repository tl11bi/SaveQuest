# Frontend Interface Design

## Profile Page

After login, users land on their dashboard or home page, which typically includes:

- **Welcome message** with the user’s name and profile picture
- **Key actions**: Join a challenge, view challenges, link bank account, sync transactions
- **Summary**: Active challenges, streaks, recent activity
- **Onboarding prompts** (optional): e.g., linking Plaid

```
+--------------------------------------------------+
|  [ SaveQuest ]                [Profile Icon]     |  ← App Bar (fixed)
+--------------------------------------------------+
|                                                  |
|  Welcome, [User Name]!                           |  ← Welcome Banner
|  (Profile Pic)                                   |
|                                                  |
|  [ Join Challenge ]  [ View Challenges ]          |
|  [ Link Bank ]       [ Sync Transactions ]        |  ← Quick Actions (2x2 grid)
|                                                  |
|  +------------------+                            |
|  | Challenge Name   |                            |  ← Active Challenge Card
|  | Streak: 5 🔥     |                            |
|  | [Check In]       |                            |
|  +------------------+                            |
|  ... more challenges ...                         |
|                                                  |
|  Recent Activity                                 |  ← Recent Activity Section
|  - Starbucks $5.25 (7/12)                        |
|  - Check-in: Coffee Challenge                    |
|  ...                                             |
|                                                  |
+--------------------------------------------------+
|  [Home] [Challenges] [Transactions] [Profile]    |  ← Bottom Nav (fixed)
+--------------------------------------------------+
```