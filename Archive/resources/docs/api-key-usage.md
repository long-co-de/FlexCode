# API Key Authentication

This document explains how to use API keys for authenticating with our VTU API.

## Overview

API keys provide a simple way to authenticate with our API without requiring user credentials. They are ideal for server-to-server communication and automated scripts.

## Managing API Keys

### Generating an API Key

To generate an API key, make a POST request to the following endpoint:

```
POST /api/user/api-key/generate
```

This endpoint requires authentication with a valid access token. The response will include your new API key:

```json
{
  "message": "API key generated successfully",
  "api_key": "your-api-key-here",
  "api_key_created_at": "2023-10-15T12:00:00.000000Z",
  "api_key_enabled": true
}
```

**Important**: Store this API key securely. For security reasons, we cannot retrieve the full API key after it's been generated.

### Revoking an API Key

To revoke an API key, make a DELETE request to:

```
DELETE /api/user/api-key
```

This will permanently delete your API key.

### Enabling/Disabling an API Key

To temporarily enable or disable an API key without deleting it, make a PUT request to:

```
PUT /api/user/api-key/toggle
```

The response will indicate the new status of your API key:

```json
{
  "message": "API key disabled successfully",
  "api_key_enabled": false
}
```

## Using API Keys

To authenticate with an API key, include it in the `X-API-KEY` header of your requests:

```
X-API-KEY: your-api-key-here
```

### API Key Endpoints

API key authentication can be used with the following endpoints:

```
GET /api/v1/services/networks
POST /api/v1/services/airtime/purchase
GET /api/v1/services/data-plans/{network}
POST /api/v1/services/data/purchase
GET /api/v1/services/cable-providers
GET /api/v1/services/cable-plans/{provider}
POST /api/v1/services/cable/verify
POST /api/v1/services/cable/purchase
GET /api/v1/services/electricity-providers
POST /api/v1/services/electricity/verify
POST /api/v1/services/electricity/purchase
GET /api/v1/wallet
GET /api/v1/wallet/history
GET /api/v1/transactions
GET /api/v1/transactions/{transaction}
```

## Security Best Practices

1. **Keep your API key secure**: Do not share your API key or commit it to public repositories.
2. **Use HTTPS**: Always use HTTPS when making API requests to ensure your API key is transmitted securely.
3. **Limit access**: Only give your API key to trusted applications and services.
4. **Rotate keys regularly**: Generate a new API key periodically and update your applications accordingly.
5. **Revoke compromised keys**: If you suspect your API key has been compromised, revoke it immediately and generate a new one.

## Rate Limiting

API key requests are subject to rate limiting to prevent abuse. If you exceed the rate limit, you'll receive a 429 Too Many Requests response.

## Support

If you have any questions or issues with API key authentication, please contact our support team.