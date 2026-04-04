# BorrowLite Mobile API Overview

This document explains how the BorrowLite mobile API is meant to be consumed by a React Native Expo client, backend integrators, and AI coding tools.

Base path: `/api/mobile/v1`

## Who this API is for

This API is the contract of record for the end-user mobile app. It is designed to replace dependence on web routes, Inertia responses, and browser-specific redirects.

Use this API for:

- React Native Expo mobile clients
- Native mobile apps
- Mobile-focused integrations
- LLM-generated frontend clients

Do not use this API document as the contract for:

- Admin dashboards
- Agent/operator tooling
- Legacy web pages

## Core conventions

### Authentication

Protected endpoints require a Sanctum bearer token:

```http
Authorization: Bearer <token>
Accept: application/json
Content-Type: application/json
```

Tokens are issued by:

- `POST /auth/login`
- `POST /auth/register`

Logout is handled by:

- `POST /auth/logout`

### Response envelope

Successful responses use a consistent top-level shape:

```json
{
  "success": true,
  "message": "Request completed successfully.",
  "data": {},
  "meta": {}
}
```

Conventions:

- `success` is always a boolean.
- `message` is human-readable and safe to display in the UI.
- `data` contains the main resource or payload.
- `meta` is optional and is used for pagination, polling hints, or other supporting data.

### Validation errors

Validation failures use Laravel's normal `422 Unprocessable Entity` format.

Example:

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": [
      "The email field is required."
    ],
    "password": [
      "The password field is required."
    ]
  }
}
```

Client rule:

- Bind `errors[field]` to the relevant form inputs.
- Do not treat `422` errors as unexpected server failures.

### Domain errors

Business-rule failures return a stable error code alongside a readable message.

Example:

```json
{
  "success": false,
  "message": "You must set a transaction PIN before making this request.",
  "error_code": "PIN_NOT_SET"
}
```

Typical domain error codes:

- `PIN_NOT_SET`
- `INVALID_PIN`
- `INSUFFICIENT_BALANCE`
- `CARD_REQUIRED`
- `BORROWING_NOT_ELIGIBLE`
- `RESOURCE_NOT_FOUND`
- `ACTION_NOT_ALLOWED`

Client rule:

- Show `message` to the user.
- Use `error_code` for branching logic.

### Pagination

Paginated responses include pagination details under `meta.pagination`.

Example:

```json
{
  "success": true,
  "message": "Transactions fetched successfully.",
  "data": [],
  "meta": {
    "pagination": {
      "current_page": 1,
      "per_page": 15,
      "total": 42,
      "last_page": 3
    }
  }
}
```

Client rule:

- Use `current_page` and `last_page` for infinite scroll or "load more" behavior.
- Do not assume every list endpoint returns all records in one request.

### Idempotency

Every financial or purchase write request should include a client-generated `request_id`.

Use `request_id` for:

- wallet funding initialization
- transfers
- withdrawals
- airtime purchases
- data purchases
- cable purchases
- electricity purchases
- card-link initiation where supported

Best practice:

- Generate one `request_id` per user action.
- Reuse the same `request_id` when retrying the same action.
- Do not generate a new `request_id` on network retry unless the user started a new action.

## Status normalization

The mobile API normalizes status fields so clients do not need to understand every legacy backend value.

Transaction and async flow statuses should generally be treated as:

- `successful`
- `pending`
- `failed`

When present, `raw_status` exposes the original provider or database value for debugging and admin support. Client UI should usually rely on the normalized status first.

## Recommended client lifecycle

This is the expected app startup order for most clients:

1. Call `POST /auth/login` or `POST /auth/register`.
2. Save the returned bearer token in secure storage.
3. Call `GET /bootstrap`.
4. Hydrate the app state from the bootstrap payload.
5. Register the device with `POST /devices` after push permission is granted.
6. Use module-specific endpoints for subsequent updates.

## Bootstrap philosophy

`GET /bootstrap` exists so the mobile app can render quickly after authentication without making many small calls first.

The bootstrap payload should be treated as the initial source of truth for:

- authenticated user profile
- wallet balance and summary
- borrowing summary
- cards summary
- notification counts
- app-level preferences or indicators

After bootstrap:

- refresh feature modules independently as needed
- avoid refetching bootstrap on every screen visit
- refetch bootstrap after major account changes if the app wants a global refresh

## Async vs synchronous operations

Most reads and simple updates are synchronous. Some payment-related flows are asynchronous and must be polled.

Polling is typically required for:

- `GET /wallet/funding/{reference}/status`
- `GET /cards/link/{reference}/status`
- any purchase flow that returns `pending`

Usually synchronous:

- profile updates
- password changes
- PIN setup and verification
- beneficiary CRUD
- transaction list/detail reads
- notifications list/read/delete

## Resource groups

The mobile API is organized into these modules:

- `auth`
- `bootstrap`
- `profile`
- `pin`
- `catalog`
- `wallet`
- `purchases`
- `transactions`
- `cards`
- `borrowing`
- `beneficiaries`
- `notifications`
- `referrals`
- `feedback`
- `devices`

See `resource-guides.md` for endpoint-by-endpoint mapping.

## Security notes

- Never store bearer tokens in plain AsyncStorage if secure storage is available.
- Never trust client-side balance calculations for financial actions.
- Always send requests over HTTPS outside local development.
- Do not expose provider raw payloads directly in user-facing UI unless intentionally formatted.

## Suggested reading order

For humans:

1. `overview.md`
2. `resource-guides.md`
3. `expo-integration.md`
4. `examples.md`

For LLMs and code generators:

1. `openapi.yaml`
2. `llm-build-guide.md`
3. `overview.md`
4. `examples.md`
