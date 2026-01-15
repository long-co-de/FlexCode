<?php

/**
 * Datavendro Service Integration Test Examples
 * 
 * This file contains test examples for the migrated Datavendro service
 * Used to verify all controllers are working correctly
 */

// Example 1: Test Airtime Purchase
// POST /api/airtime/purchase
$airtimeTestPayload = [
    'network_id' => 1, // MTN
    'phone_number' => '08012345678',
    'amount' => 500
];

// Expected Response (Success):
// {
//     "message": "Airtime purchase successful!",
//     "transaction": {
//         "id": 123,
//         "user_id": 2,
//         "reference": "AIR7X9K2Q",
//         "type": "airtime",
//         "amount": 500,
//         "status": "successful",
//         "recipient": "08012345678",
//         "created_at": "2026-01-02T17:14:00.000Z"
//     }
// }

// ---

// Example 2: Test Data Purchase
// POST /api/data/purchase
$dataTestPayload = [
    'plan_id' => 5, // Example plan ID
    'phone_number' => '08012345678'
];

// Expected Response (Success):
// {
//     "message": "Data purchase successful!",
//     "transaction": {
//         "id": 124,
//         "user_id": 2,
//         "reference": "DATA1A2B3C4D",
//         "type": "data",
//         "amount": 500,
//         "status": "successful",
//         "recipient": "08012345678",
//         "created_at": "2026-01-02T17:14:00.000Z"
//     }
// }

// ---

// Example 3: Test Electricity Bill Payment
// POST /api/electricity/purchase
$electricityTestPayload = [
    'provider_id' => 1, // Example provider ID
    'meter_number' => '1234567890',
    'meter_type' => 'prepaid',
    'amount' => 5000,
    'customer_name' => 'John Doe',
    'customer_address' => '123 Main St',
    'phone_number' => '08012345678'
];

// Expected Response (Success):
// {
//     "message": "Electricity bill payment successful!",
//     "transaction": {
//         "id": 125,
//         "user_id": 2,
//         "reference": "ELECX9Y8Z1",
//         "type": "electricity",
//         "amount": 5000,
//         "fee": 0,
//         "status": "successful",
//         "recipient": "1234567890",
//         "created_at": "2026-01-02T17:14:00.000Z"
//     },
//     "token": "ELECTRICITYTOKEN123456"
// }

// ---

// Example 4: Test Cable Subscription
// POST /api/cable/purchase
$cableTestPayload = [
    'plan_id' => 3, // Example plan ID
    'smart_card_number' => '9876543210',
    'customer_name' => 'Jane Doe'
];

// Expected Response (Success):
// {
//     "message": "Cable subscription successful!",
//     "transaction": {
//         "id": 126,
//         "user_id": 2,
//         "reference": "CABLE2B3C4D",
//         "type": "cable",
//         "amount": 3500,
//         "status": "successful",
//         "recipient": "9876543210",
//         "created_at": "2026-01-02T17:14:00.000Z"
//     }
// }

// ---

// Example 5: Test Meter Verification (Before Payment)
// POST /api/electricity/verify-meter
$meterVerifyPayload = [
    'provider_id' => 1,
    'meter_number' => '1234567890',
    'meter_type' => 'prepaid'
];

// Expected Response (Success):
// {
//     "message": "Meter verified successfully",
//     "data": {
//         "customer_name": "John Doe",
//         "customer_address": "123 Main St",
//         "meter_type": "prepaid",
//         "status": "valid"
//     }
// }

// ---

// Example 6: Test Smart Card Verification (Before Subscription)
// POST /api/cable/verify-smart-card
$iucVerifyPayload = [
    'provider_id' => 1,
    'smart_card_number' => '9876543210'
];

// Expected Response (Success):
// {
//     "message": "Smart card verified successfully",
//     "data": {
//         "customer_name": "Jane Doe",
//         "plan": "Premium",
//         "status": "active"
//     }
// }

// ---

// Example 7: Error Response - Insufficient Balance
// POST /api/airtime/purchase (with insufficient wallet)
// HTTP Status: 400
// {
//     "message": "Insufficient wallet balance. Please fund your wallet."
// }

// ---

// Example 8: Error Response - API Failure
// POST /api/data/purchase (API call fails)
// HTTP Status: 400
// {
//     "message": "Data purchase failed: API service unavailable",
//     "transaction": {
//         "id": 127,
//         "status": "failed"
//     }
// }

// ---

// TESTING CHECKLIST:
// 
// ✓ Test airtime purchase for MTN (network_id: 1)
// ✓ Test airtime purchase for GLO (network_id: 2)
// ✓ Test airtime purchase for 9Mobile (network_id: 3)
// ✓ Test airtime purchase for Airtel (network_id: 4)
// ✓ Test data purchase with valid plan
// ✓ Test data purchase with invalid plan
// ✓ Test electricity meter verification
// ✓ Test electricity bill payment
// ✓ Test cable smart card verification
// ✓ Test cable subscription
// ✓ Test insufficient wallet balance error
// ✓ Test invalid phone number format (should be 11 digits)
// ✓ Test transaction refund on API failure
// ✓ Test concurrent requests handling
// ✓ Test database transaction rollback on error

// ---

// CURL EXAMPLES for Manual Testing:

/*

# Test Airtime Purchase
curl -X POST http://127.0.0.1:8000/api/airtime/purchase \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN" \
  -d '{
    "network_id": 1,
    "phone_number": "08012345678",
    "amount": 500
  }'

# Test Data Purchase
curl -X POST http://127.0.0.1:8000/api/data/purchase \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN" \
  -d '{
    "plan_id": 5,
    "phone_number": "08012345678"
  }'

# Test Electricity Payment
curl -X POST http://127.0.0.1:8000/api/electricity/purchase \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN" \
  -d '{
    "provider_id": 1,
    "meter_number": "1234567890",
    "meter_type": "prepaid",
    "amount": 5000,
    "customer_name": "John Doe",
    "phone_number": "08012345678"
  }'

# Test Cable Subscription
curl -X POST http://127.0.0.1:8000/api/cable/purchase \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN" \
  -d '{
    "plan_id": 3,
    "smart_card_number": "9876543210",
    "customer_name": "Jane Doe"
  }'

# Test Meter Verification
curl -X POST http://127.0.0.1:8000/api/electricity/verify-meter \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "provider_id": 1,
    "meter_number": "1234567890",
    "meter_type": "prepaid"
  }'

# Test Smart Card Verification
curl -X POST http://127.0.0.1:8000/api/cable/verify-smart-card \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "provider_id": 1,
    "smart_card_number": "9876543210"
  }'

*/
