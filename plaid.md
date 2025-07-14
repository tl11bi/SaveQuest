Got it—my earlier advice was out‑of‑date. In today’s Plaid Sandbox, **only the six “seeded” test numbers below will pass the phone‑number pane** (any real or other fake number will trigger the “Invalid phone number” error you saw):

| Sandbox scenario                       | Phone number to enter | OTP that always works |
| -------------------------------------- | --------------------- | --------------------- |
| New user (first‑time link)             | **415‑555‑0010**      | 123456                |
| Verified returning user                | **415‑555‑0011**      | 123456                |
| Returning user, link new account       | **415‑555‑0012**      | 123456                |
| Returning user, link OAuth institution | **415‑555‑0013**      | 123456                |
| Returning user on a new device         | **415‑555‑0014**      | 123456                |
| Returning user, auto‑select saved acct | **415‑555‑0015**      | 123456                |

Real numbers—and even the old “212‑555‑5555” test value—are no longer accepted in this flow.([Plaid][1])

### Quick fix for your test

1. Relaunch Plaid Link in Sandbox.
2. When the phone‑number screen appears, paste one of the numbers above (most people just use **415‑555‑0010**).
3. Enter **123456** for the SMS code if prompted.
4. Continue with the rest of the Link flow.

### Why this happens

* **Sandbox doesn’t hit live telco look‑ups.** Instead, it checks whether the supplied number matches one of its pre‑seeded values. Anything else throws `INVALID_PHONE_NUMBER` and shows the UI error in your screenshot.([Plaid][1], [Plaid][2])
* These numbers also let you simulate different “returning user” situations (e.g., new device) without re‑creating items over and over.

### Alternatives when you don’t want to see the phone pane

* **Bypass Link entirely** during automated tests: call `/sandbox/public_token/create` to generate a `public_token`, then exchange it for an `access_token`—no UI or phone step involved.([Plaid][3])
* **Suppress the returning‑user flow** by not including `US` or `CA` in the `country_codes` array when you create the Link token (the phone pane only appears for +1 numbers, +44, and +52).([Plaid][1])

Give the 415‑555‑00xx numbers a try and let me know if you still hit issues!

[1]: https://plaid.com/docs/link/returning-user/ "Link - Returning user experience | Plaid Docs"
[2]: https://plaid.com/docs/errors/item/ "Errors - Item errors | Plaid Docs"
[3]: https://plaid.com/docs/sandbox/ "Sandbox - Overview | Plaid Docs"
