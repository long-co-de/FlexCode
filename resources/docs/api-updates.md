# API Updates: PIN Verification Requirement

## Overview

To enhance security for payment operations, we've implemented a mandatory PIN verification system for all financial transactions. This document outlines the changes and how to adapt your integration.

## What's Changed

All payment and financial transaction endpoints now require PIN verification. This includes:

- Airtime purchases
- Data purchases
- Cable TV payments
- Electricity bill payments
- Wallet transfers
- Wallet withdrawals

## How to Use

### 1. Setting Up a PIN

Before users can make transactions, they must set up a PIN:

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

### 2. Including PIN in Requests

For all payment endpoints, include the PIN in the `X-PIN` header:

```
X-PIN: 1234
```

Example request:
```javascript
fetch('/api/services/airtime/purchase', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-TOKEN': csrfToken,
    'X-PIN': '1234'  // Include PIN in header
  },
  body: JSON.stringify({
    network_id: 1,
    phone_number: '08012345678',
    amount: 1000
  })
})
```

### 3. Error Handling

If the PIN is missing or incorrect, you'll receive one of these error responses:

#### PIN Not Set
```json
{
  "message": "PIN not set. Please set up your PIN first.",
  "error_code": "PIN_NOT_SET"
}
```

#### PIN Required
```json
{
  "message": "PIN is required for this operation.",
  "error_code": "PIN_REQUIRED"
}
```

#### Invalid PIN
```json
{
  "message": "Invalid PIN provided.",
  "error_code": "INVALID_PIN"
}
```

## Implementation Guide

### Frontend Implementation

We recommend implementing a PIN verification modal that appears before processing payments:

1. When a user initiates a payment, show a PIN entry modal
2. Collect the 4-digit PIN
3. Include the PIN in the `X-PIN` header when making the payment request
4. Handle any PIN-related errors appropriately

### API Key Integration

If you're using API keys for server-to-server integration, you'll also need to include the PIN in the `X-PIN` header for all payment endpoints.

## Security Recommendations

1. Never store the PIN in plaintext on the client side
2. Always use HTTPS for all API requests
3. Implement proper error handling for PIN verification failures
4. Consider implementing a timeout after multiple failed PIN attempts
5. Educate users about the importance of keeping their PIN secure

## Migration Period

This change is effective immediately. All payment endpoints now require PIN verification.

For more detailed information, please refer to the [PIN Verification Documentation](pin-verification.md).