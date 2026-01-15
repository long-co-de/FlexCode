# PIN Verification

This document explains how to use PIN verification for secure transactions in our API.

## Overview

PIN verification adds an extra layer of security for sensitive operations like payments, transfers, and other financial transactions. Users must set up a 4-digit PIN and provide it when performing these operations.

## Setting Up a PIN

Before using PIN-protected endpoints, users must set up a PIN:

```
POST /api/pin/setup
```

Request body:
```json
{
  "pin": "1234",
  "pin_confirmation": "1234"
}
```

Response:
```json
{
  "message": "PIN set up successfully."
}
```

## Verifying a PIN

To verify a PIN without performing any action:

```
POST /api/pin/verify
```

Request body:
```json
{
  "pin": "1234"
}
```

Response:
```json
{
  "message": "PIN verified successfully."
}
```

## Changing a PIN

To change an existing PIN:

```
POST /api/pin/change
```

Request body:
```json
{
  "current_pin": "1234",
  "pin": "5678",
  "pin_confirmation": "5678"
}
```

Response:
```json
{
  "message": "PIN changed successfully."
}
```

## Using PIN with API Endpoints

For endpoints that require PIN verification, include the PIN in the `X-PIN` header:

```
X-PIN: 1234
```

### Protected Endpoints

The following endpoints require PIN verification:

#### Airtime and Data
- `POST /api/services/airtime/purchase`
- `POST /api/services/data/purchase`

#### Cable TV
- `POST /api/services/cable/purchase`

#### Electricity
- `POST /api/services/electricity/purchase`

#### Wallet Operations
- `POST /api/wallet/fund`
- `POST /api/wallet/transfer`
- `POST /api/wallet/withdraw`

### API Key Authentication

When using API key authentication, PIN verification is also required for the same endpoints:

- `POST /api/v1/services/airtime/purchase`
- `POST /api/v1/services/data/purchase`
- `POST /api/v1/services/cable/purchase`
- `POST /api/v1/services/electricity/purchase`

## Error Responses

If PIN verification fails, you'll receive one of the following error responses:

### PIN Not Set
```json
{
  "message": "PIN not set. Please set up your PIN first.",
  "error_code": "PIN_NOT_SET"
}
```

### PIN Required
```json
{
  "message": "PIN is required for this operation.",
  "error_code": "PIN_REQUIRED"
}
```

### Invalid PIN
```json
{
  "message": "Invalid PIN provided.",
  "error_code": "INVALID_PIN"
}
```

## Security Best Practices

1. **Never store the PIN in plaintext**: Always hash the PIN before storing it.
2. **Use HTTPS**: Always use HTTPS when transmitting PINs.
3. **Implement rate limiting**: Limit the number of PIN verification attempts to prevent brute force attacks.
4. **Implement timeout**: Implement a timeout after multiple failed PIN verification attempts.
5. **Educate users**: Remind users to never share their PIN with anyone.