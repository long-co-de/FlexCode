# Expo Integration Guide

This guide explains how a React Native Expo app should integrate with the BorrowLite mobile API.

## Recommended Expo modules

Use these Expo packages as the default integration stack:

- `expo-secure-store` for bearer token persistence
- `expo-linking` for deep-link parsing and route handoff
- `expo-web-browser` for hosted payment and card-link browser flows
- `expo-notifications` for push permission, token retrieval, and notification handling

Optional but common:

- `expo-router` for screen routing
- `expo-constants` for app config and environment values
- `expo-device` for device metadata during push registration

## Environment configuration

Use environment variables for runtime switching between local, LAN, staging, and production.

Example:

```env
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/mobile/v1
EXPO_PUBLIC_APP_SCHEME=borrowliteapp
```

Development examples:

- Android emulator: `http://10.0.2.2:8000/api/mobile/v1`
- iOS simulator: `http://127.0.0.1:8000/api/mobile/v1`
- Physical device on the same network: `http://YOUR-LAN-IP:8000/api/mobile/v1`

## Required request headers

All authenticated requests should send:

```http
Authorization: Bearer <token>
Accept: application/json
Content-Type: application/json
```

For unauthenticated write requests such as login or registration, omit the bearer token but keep JSON headers.

## Startup sequence

Recommended startup flow:

1. Show login or registration if no token exists.
2. If a token exists, restore it from secure storage.
3. Call `GET /bootstrap`.
4. Hydrate app-wide state from bootstrap.
5. Request push permission when appropriate.
6. If permission is granted, register the Expo push token with `POST /devices`.

Practical note:

- If `GET /bootstrap` returns `401`, clear the token and return the user to authentication.

## Auth flow

Login sequence:

1. Call `POST /auth/login` with email and password.
2. Save the returned token in secure storage.
3. Save the user/bootstrap payload in memory.
4. Navigate into the authenticated app.

Logout sequence:

1. Optionally unregister or deactivate the device entry.
2. Call `POST /auth/logout`.
3. Clear secure storage.
4. Reset local state and navigate to login.

## Hosted wallet funding flow

Wallet funding is backend-first and browser-assisted.

Recommended sequence:

1. Call `POST /wallet/funding/init`.
2. Read the hosted checkout URL from the response.
3. Open the URL using `WebBrowser.openAuthSessionAsync` or another controlled browser flow.
4. If a `redirect_url` was supplied, handle the return deep link.
5. Poll `GET /wallet/funding/{reference}/status` until the status becomes `successful` or `failed`.
6. Refresh wallet summary, transactions, or bootstrap after completion.

Client behavior rules:

- Treat `pending` as a valid intermediate state.
- Do not mark funding as successful only because the browser returned.
- The backend status endpoint is the source of truth.

## Hosted card-link flow

Card linking follows the same pattern:

1. Call `POST /cards/link/init`.
2. Open the returned hosted URL in a browser session.
3. Handle the app redirect if one is supplied.
4. Poll `GET /cards/link/{reference}/status`.
5. Refresh `GET /cards` or `GET /bootstrap` when successful.

Client behavior rules:

- Do not assume the card is linked until the status endpoint confirms success.
- The card list is the source of truth for what the user can actually use.

## Deep-link handling

Use an app scheme such as:

```text
borrowliteapp://
```

Typical redirect targets:

- `borrowliteapp://payments`
- `borrowliteapp://cards`

Recommended deep-link behavior:

- Parse the route.
- Extract any reference or status hints if present.
- Route the user back to the related screen.
- Trigger a status poll immediately after returning.

## Push notification registration

Recommended flow:

1. Ask for notification permission at a sensible moment.
2. Retrieve the Expo push token.
3. Send the token to `POST /devices`.
4. Include platform, app version, and device name where available.
5. On logout or device removal, call `DELETE /devices/{id}` if the app tracks the server-side device ID.

Suggested payload:

```json
{
  "expo_push_token": "ExponentPushToken[abc123]",
  "platform": "android",
  "device_name": "Pixel 8",
  "app_version": "1.0.0"
}
```

## Retry rules

Use cautious retries:

- Safe to retry most GET requests.
- Safe to retry idempotent write requests when the same `request_id` is reused.
- Do not fire repeated purchase or funding init requests with new IDs during unstable network conditions.

Suggested client behavior:

- Retry transient network failures with backoff.
- Stop retrying when the API returns a clear domain error.
- Offer a manual retry action for polling flows that remain `pending`.

## Local state model

A practical Expo app usually keeps:

- `session`: token, auth state, bootstrap timestamp
- `profile`: user identity and preferences
- `wallet`: balances, recent activity
- `notifications`: unread count and notification list
- `cards`: linked cards and default card
- `borrowing`: summary, active borrowing items, eligibility state

Avoid over-normalizing too early. The API is already grouped in a way that maps well to screen-level state.

## Common mistakes to avoid

- Storing the bearer token in non-secure storage
- Treating a browser return as a successful payment
- Skipping bootstrap and over-fetching the app on startup
- Hardcoding localhost URLs in app code instead of env values
- Assuming all transaction `meta_data` objects share one shape
- Ignoring `error_code` and relying only on HTTP status
