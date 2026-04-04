# LLM Build Guide

Use this guide when generating or modifying a React Native Expo client for BorrowLite.

This document is written for AI coding tools. It defines the intended client architecture, request sequencing, and assumptions that should remain stable unless the API contract changes.

## Primary contract inputs

Read these files in this order:

1. `openapi.yaml`
2. `overview.md`
3. `resource-guides.md`
4. `examples.md`
5. `expo-integration.md`

## Required client assumptions

- Base URL format: `https://<host>/api/mobile/v1`
- Auth header: `Authorization: Bearer <token>`
- Expected content type: `application/json`
- Secure token storage: required
- Mobile framework target: React Native Expo

## Bootstrap-first application model

After authentication, the app should not make many unrelated startup requests before showing the main UI.

Use this order:

1. Authenticate with `POST /auth/login` or `POST /auth/register`.
2. Persist the bearer token in secure storage.
3. Call `GET /bootstrap`.
4. Initialize authenticated app state from the bootstrap payload.
5. Register the Expo push token with `POST /devices` after permission is granted.

## Canonical client-side entities

Prefer these entity names in generated code:

- `User`
- `BootstrapPayload`
- `WalletSummary`
- `Transaction`
- `Borrowing`
- `BorrowingRepayment`
- `UserCard`
- `Beneficiary`
- `InboxNotification`
- `FeedbackItem`
- `MobileDevice`

If the app uses stores or hooks, map them to feature modules rather than to every endpoint individually.

Recommended feature modules:

- `auth`
- `session`
- `profile`
- `wallet`
- `transactions`
- `cards`
- `borrowing`
- `notifications`
- `beneficiaries`

## Data modeling rules

### Transaction status

Treat transaction status as normalized values:

- `successful`
- `pending`
- `failed`

If `raw_status` is present, keep it only for diagnostics or support views.

### Flexible `meta_data`

`Transaction.meta_data` is intentionally flexible. It may contain:

- provider payload fragments
- request IDs
- delivery metadata
- meter or smart card verification details
- borrowing references
- hosted payment references

Rule:

- Do not generate one rigid type for all `meta_data` values.
- Prefer a base record type plus transaction-specific narrowing in UI code.

### Pagination

For paginated resources, read pagination from `meta.pagination`.

Do not assume:

- all lists are unpaginated
- page size is fixed
- the first request returns the full dataset

## Polling vs synchronous behavior

Polling is required for:

- `GET /wallet/funding/{reference}/status`
- `GET /cards/link/{reference}/status`
- any other flow that explicitly returns an async `pending` state

Usually synchronous:

- profile reads and updates
- password changes
- PIN setup and verification
- beneficiaries CRUD
- notification reads and updates
- most transaction reads

Client rule:

- A successful browser return is not the same thing as a successful transaction.
- Async status endpoints are the source of truth.

## Error-handling rules

Generated clients should implement these behaviors:

- Show API `message` for business-rule failures.
- Use `error_code` for programmatic branching.
- Bind `422` validation errors to field-level form UI.
- Clear auth state on `401` during bootstrap or protected reads when the token is no longer valid.

Examples of domain-logic branches:

- `PIN_NOT_SET`: route to PIN setup or prompt the user to configure a PIN
- `INVALID_PIN`: re-open PIN entry UI
- `INSUFFICIENT_BALANCE`: block completion and show top-up path
- `BORROWING_NOT_ELIGIBLE`: disable borrowing CTA and show explanation

## Recommended Expo modules

Use these modules by default unless the project already has a different standard:

- `expo-secure-store`
- `expo-linking`
- `expo-web-browser`
- `expo-notifications`
- `expo-router`

## Implementation guidance

When generating screens or hooks:

- Prefer one shared API client wrapper.
- Centralize bearer token injection.
- Keep feature-specific request functions grouped by resource.
- Use optimistic updates sparingly for financial flows.
- Always require `request_id` on retryable financial writes.

When generating UI:

- Build around the bootstrap payload for initial dashboard screens.
- Use transaction type and normalized status to drive rendering.
- Show explicit loading, empty, and retry states on async screens.

## Anti-patterns to avoid

- Hardcoding localhost URLs directly in API modules
- Storing bearer tokens in plain text or unsecured storage
- Treating provider redirects as final payment success
- Generating one giant global store with no feature separation
- Assuming every transaction payload has the same data shape
- Dropping `error_code` handling and relying only on HTTP status text

## Good default output for an LLM

If asked to build the client, prefer generating:

- an env-driven API client
- a session provider
- bootstrap-aware app initialization
- feature-based route structure
- explicit polling utilities for async payment flows
- device registration for Expo push notifications
