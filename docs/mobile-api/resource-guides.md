# Resource Guides

This document groups endpoints by feature area and explains what each module is responsible for.

## Auth

Purpose:

- create and destroy authenticated sessions
- recover access when credentials are forgotten

Endpoints:

- `POST /auth/login`
- `POST /auth/register`
- `POST /auth/logout`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`

Client notes:

- `login` and `register` should transition into a bootstrap flow immediately after success.
- `logout` should clear local auth state and secure storage.

## Bootstrap

Purpose:

- return the minimum account state needed to render the authenticated app quickly

Endpoints:

- `GET /bootstrap`

Client notes:

- Use this once immediately after login or app restore.
- Treat it as the initial source of truth for dashboard-level UI.

## Profile

Purpose:

- manage user identity and preferences

Endpoints:

- `GET /profile`
- `PUT /profile`
- `PUT /profile/password`
- `PATCH /profile/notifications`

Client notes:

- Profile updates are usually synchronous.
- Password changes should require current-password UI in the client if enforced by the backend.

## PIN

Purpose:

- create, verify, rotate, and reset the transaction PIN

Typical responsibilities:

- PIN setup
- PIN verification before sensitive actions
- PIN reset with password confirmation where supported

Client notes:

- Handle `PIN_NOT_SET` distinctly.
- Sensitive financial flows should be prepared to prompt for PIN entry.

## Catalog

Purpose:

- fetch networks, plans, billers, and provider metadata used in purchase forms

Typical responsibilities:

- airtime network list
- data plans
- cable providers and bouquets
- electricity providers
- verification helpers for smart card and meter numbers

Client notes:

- Cache catalog data where reasonable.
- Refresh when purchase forms need current provider options.

## Wallet

Purpose:

- expose balances, funding, transfers, withdrawals, and wallet history

Endpoints:

- `GET /wallet/balance`
- `GET /wallet/summary`
- `POST /wallet/funding/init`
- `GET /wallet/funding/{reference}/status`
- `POST /wallet/transfers/verify-recipient`
- `POST /wallet/transfers`
- `POST /wallet/withdrawals`
- `GET /wallet/history`

Client notes:

- `funding/init` is asynchronous and must be followed by status polling.
- transfer and withdrawal writes should always include `request_id`.
- wallet history should be rendered using normalized types from the API response, not legacy assumptions.

## Purchases

Purpose:

- buy airtime, data, cable, and electricity

Endpoints:

- `POST /purchases/airtime`
- `POST /purchases/data`
- `POST /purchases/cable`
- `POST /purchases/electricity`
- `POST /purchases/cable/verify`
- `POST /purchases/electricity/verify`

Client notes:

- Verification endpoints should be called before purchase submission when required.
- Purchase writes should include a unique `request_id`.
- Electricity and provider-backed purchases may briefly remain `pending`.

## Transactions

Purpose:

- list and inspect account activity

Typical responsibilities:

- paginated transaction list
- filters by type or status
- single transaction detail
- receipt-ready metadata for display or sharing

Client notes:

- Always branch UI on normalized transaction status.
- Use `meta_data` carefully because it may vary by transaction type.

## Cards

Purpose:

- manage linked payment cards for future wallet or repayment flows

Endpoints:

- `GET /cards`
- `POST /cards/link/init`
- `GET /cards/link/{reference}/status`
- `POST /cards/{card}/set-default`
- `DELETE /cards/{card}`

Client notes:

- Card linking is asynchronous and browser-assisted.
- The list returned by `GET /cards` is the source of truth.
- Sensitive card fields should already be masked by the API.

## Borrowing

Purpose:

- expose borrowing eligibility, borrowing actions, and repayments

Endpoints:

- `GET /borrowing/eligibility`
- `GET /borrowing/summary`
- `GET /borrowing`
- `GET /borrowing/{borrowing}`
- `POST /borrowing/airtime`
- `POST /borrowing/data`
- `POST /borrowing/electricity`
- `POST /borrowing/{borrowing}/repay`
- `POST /borrowing/repay-all`

Client notes:

- Be prepared to handle `BORROWING_NOT_ELIGIBLE`.
- Repayment screens should refresh summary and active borrowing records after success.
- Borrowing detail screens should not assume all borrowing items have the same provider metadata.

## Beneficiaries

Purpose:

- manage saved recipients and favorite targets

Typical responsibilities:

- create beneficiary
- list beneficiaries
- update beneficiary
- delete beneficiary
- favorite or unfavorite beneficiary

Client notes:

- Beneficiaries are user-owned resources and should only display the authenticated user's records.

## Notifications

Purpose:

- show the in-app inbox and keep unread counts in sync

Endpoints:

- `GET /notifications`
- `GET /notifications/unread-count`
- `POST /notifications/{id}/read`
- `POST /notifications/read-all`
- `DELETE /notifications/{id}`
- `DELETE /notifications`

Client notes:

- Use `unread-count` for badges and fast refreshes.
- Refresh the inbox after bulk actions such as `read-all`.

## Referrals

Purpose:

- expose referral performance and related earnings

Typical responsibilities:

- stats
- referral code or referral link
- referred users
- commission history

Client notes:

- Referral and commission data may be display-heavy but usually does not require complex writes.

## Feedback

Purpose:

- let users submit and review support or feedback items

Typical responsibilities:

- create feedback ticket
- list submitted feedback
- view feedback detail

Client notes:

- Show status clearly if feedback items are triaged or answered by support.

## Devices

Purpose:

- register Expo push tokens and manage device records

Typical responsibilities:

- list devices
- register a device
- remove or deactivate a device

Client notes:

- Register devices after login and permission grant.
- Remove the device on logout if the app stores the corresponding device ID.
