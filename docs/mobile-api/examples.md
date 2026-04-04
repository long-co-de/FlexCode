# Examples

These examples are intentionally practical. They are meant for both humans testing the API and AI tools generating request code.

Base URL used below:

```text
https://example.com/api/mobile/v1
```

## Login

Request:

```bash
curl -X POST https://example.com/api/mobile/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

Typical response:

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "token": "1|sanctum-token-value",
    "user": {
      "id": 1,
      "name": "Jane Doe",
      "email": "user@example.com"
    }
  }
}
```

## Bootstrap

Request:

```bash
curl https://example.com/api/mobile/v1/bootstrap \
  -H "Authorization: Bearer TOKEN" \
  -H "Accept: application/json"
```

Typical response:

```json
{
  "success": true,
  "message": "Bootstrap loaded successfully.",
  "data": {
    "profile": {
      "id": 1,
      "name": "Jane Doe",
      "email": "user@example.com"
    },
    "wallet": {
      "available_balance": 2500,
      "currency": "NGN"
    },
    "notifications": {
      "unread_count": 3
    },
    "cards": [],
    "borrowing": {
      "eligible": true
    }
  }
}
```

## Wallet funding init

Request:

```bash
curl -X POST https://example.com/api/mobile/v1/wallet/funding/init \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"amount":5000,"request_id":"funding_req_12345678901234567890","redirect_url":"borrowliteapp://payments"}'
```

Typical response:

```json
{
  "success": true,
  "message": "Funding initialization created.",
  "data": {
    "reference": "FUND_ABC123",
    "status": "pending",
    "checkout": {
      "authorization_url": "https://checkout.example.com/pay/FUND_ABC123"
    }
  }
}
```

Client note:

- Open `checkout.authorization_url` in a browser.
- Poll the status endpoint until the final state is returned.

## Wallet funding status

Request:

```bash
curl https://example.com/api/mobile/v1/wallet/funding/FUND_ABC123/status \
  -H "Authorization: Bearer TOKEN" \
  -H "Accept: application/json"
```

Typical response:

```json
{
  "success": true,
  "message": "Funding status fetched successfully.",
  "data": {
    "reference": "FUND_ABC123",
    "status": "successful",
    "amount": 5000
  }
}
```

## Card linking init

Request:

```bash
curl -X POST https://example.com/api/mobile/v1/cards/link/init \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"request_id":"card_req_12345678901234567890","redirect_url":"borrowliteapp://cards"}'
```

Typical response:

```json
{
  "success": true,
  "message": "Card linking started.",
  "data": {
    "reference": "CARD_ABC123",
    "status": "pending",
    "checkout": {
      "authorization_url": "https://checkout.example.com/card/CARD_ABC123"
    }
  }
}
```

## Register Expo push token

Request:

```bash
curl -X POST https://example.com/api/mobile/v1/devices \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"expo_push_token":"ExponentPushToken[abc]","platform":"android","device_name":"Pixel 8","app_version":"1.0.0"}'
```

Typical response:

```json
{
  "success": true,
  "message": "Device registered successfully.",
  "data": {
    "id": 4,
    "platform": "android",
    "is_active": true
  }
}
```

## Borrow data

Request:

```bash
curl -X POST https://example.com/api/mobile/v1/borrowing/data \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"phone_number":"08012345678","plan_id":1,"duration":7,"request_id":"borrow_data_req_001"}'
```

Typical response:

```json
{
  "success": true,
  "message": "Data borrowed successfully.",
  "data": {
    "id": 15,
    "status": "successful",
    "type": "data"
  }
}
```

## Domain error example

Example response:

```json
{
  "success": false,
  "message": "You are not eligible to borrow at this time.",
  "error_code": "BORROWING_NOT_ELIGIBLE"
}
```

## Validation error example

Example response:

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "amount": [
      "The amount field is required."
    ],
    "request_id": [
      "The request id field is required."
    ]
  }
}
```
