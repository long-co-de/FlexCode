# Pending Borrowing Restriction - Implementation

**Date**: January 5, 2026  
**Feature**: User can only borrow when they have NO pending borrowings

---

## Overview

Users are now restricted from borrowing if they have any active or overdue borrowings. This prevents users from accumulating too much debt and ensures they manage their existing obligations first.

---

## Business Rules

### Borrowing Restriction Logic

A user **CANNOT** borrow if they have:
- ✅ Any borrowing with status = `'active'` (not yet due)
- ✅ Any borrowing with status = `'overdue'` (past due date)

A user **CAN** borrow if they have:
- ✅ No active borrowings
- ✅ Only paid/completed borrowings
- ✅ Only defaulted borrowings (historical)

### Borrowing Eligibility Check Order

When checking if a user can borrow, the system checks in this order:

1. **Has Active Card?** → If NO, reject with "Link a card" message
2. **Has Pending Borrowing?** → If YES, reject with "Repay first" message *(NEW)*
3. **In 7-Day Waiting Period?** → If YES, reject with "Wait X days" message
4. **Other Criteria** → Check credit score, account age, etc.

---

## Code Changes

### File: `app/Services/AdvancedCreditScoringService.php`

**Method**: `determineEligibility()`

**New Logic Added** (after line ~380):

```php
// Check if user has pending/active borrowings
$pendingBorrowings = $user->borrowings()
    ->whereIn('status', ['active', 'overdue'])
    ->exists();

if ($pendingBorrowings) {
    return [
        'status' => 'not_eligible',
        'reason' => 'You have a pending borrowing that must be repaid first',
        'action' => 'Repay your active borrowing before borrowing again',
        'has_pending_borrowing' => true,
    ];
}
```

---

## API Response Examples

### Example 1: User Has Active Borrowing and Tries to Borrow

**Request**:
```php
POST /api/borrow/airtime
{
    "phone": "08012345678",
    "amount": 500,
    "network": "mtn"
}
```

**Response** (User has an active borrowing):
```json
{
    "success": false,
    "message": "You have a pending borrowing that must be repaid first",
    "eligibility": {
        "status": "not_eligible",
        "reason": "You have a pending borrowing that must be repaid first",
        "action": "Repay your active borrowing before borrowing again",
        "has_pending_borrowing": true,
        "credit_score": 65
    }
}
```

---

### Example 2: User Repays Borrowing and Can Now Borrow

**Scenario**: User had active borrowing, just repaid it

**Check Eligibility Response** (After repayment):
```json
{
    "success": true,
    "eligibility": {
        "status": "eligible",
        "reason": "Your account is eligible for borrowing with your linked card",
        "action": null,
        "credit_score": 70,
        "available_credit": 5000
    }
}
```

**Now user can borrow successfully**:
```json
{
    "success": true,
    "message": "Borrow created successfully",
    "data": {
        "borrow": {
            "id": 456,
            "type": "airtime",
            "amount": 500,
            "status": "active",
            "due_date": "2026-01-12"
        }
    }
}
```

---

### Example 3: User Has Overdue Borrowing

**Response** (User has overdue borrowing):
```json
{
    "success": false,
    "message": "You have a pending borrowing that must be repaid first",
    "eligibility": {
        "status": "not_eligible",
        "reason": "You have a pending borrowing that must be repaid first",
        "action": "Repay your active borrowing before borrowing again",
        "has_pending_borrowing": true,
        "overdue_amount": 5500
    }
}
```

---

## Database Queries

### Check User's Pending Borrowings

```php
// Get all active and overdue borrowings
$pendingBorrowings = $user->borrowings()
    ->whereIn('status', ['active', 'overdue'])
    ->get();

// Count pending borrowings
$pendingCount = $user->borrowings()
    ->whereIn('status', ['active', 'overdue'])
    ->count();

// Get oldest pending borrowing
$oldestPending = $user->borrowings()
    ->whereIn('status', ['active', 'overdue'])
    ->orderBy('due_date', 'asc')
    ->first();
```

---

### Get Borrowing Summary

```php
// SQL Query
$summary = DB::table('borrowings')
    ->where('user_id', $user->id)
    ->select(
        DB::raw("COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count"),
        DB::raw("COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_count"),
        DB::raw("COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count"),
        DB::raw("SUM(CASE WHEN status IN ('active', 'overdue') THEN amount ELSE 0 END) as pending_amount")
    )
    ->first();

// Usage
echo "Active: " . $summary->active_count;
echo "Overdue: " . $summary->overdue_count;
echo "Paid: " . $summary->paid_count;
echo "Total Pending: ₦" . $summary->pending_amount;
```

---

## Frontend Integration

### Display Pending Borrowing Message

```javascript
// React Component
import React from 'react';

export default function BorrowingRestriction({ eligibility, borrowings }) {
    if (eligibility.has_pending_borrowing) {
        const pendingBorrowings = borrowings.filter(b => 
            ['active', 'overdue'].includes(b.status)
        );
        
        return (
            <div className="bg-red-50 border border-red-200 rounded p-4">
                <h3 className="text-red-800 font-semibold mb-2">
                    ⚠️ Cannot Borrow Right Now
                </h3>
                <p className="text-red-700 mb-3">
                    You have {pendingBorrowings.length} active borrowing(s) that must be 
                    repaid before you can borrow again.
                </p>
                
                <div className="space-y-2">
                    {pendingBorrowings.map(borrowing => (
                        <div key={borrowing.id} className="bg-red-100 p-2 rounded">
                            <p className="text-sm font-medium">
                                {borrowing.type.toUpperCase()} - ₦{borrowing.total_amount}
                            </p>
                            <p className="text-xs text-red-600">
                                Due: {new Date(borrowing.due_date).toLocaleDateString()}
                            </p>
                        </div>
                    ))}
                </div>
                
                <button className="mt-3 bg-blue-600 text-white px-4 py-2 rounded">
                    Go to My Borrowings
                </button>
            </div>
        );
    }
    
    return null;
}
```

---

## Testing Guide

### Unit Test Example

```php
<?php

use App\Models\User;
use App\Models\Borrowing;
use App\Services\AdvancedCreditScoringService;

class PendingBorrowingTest extends TestCase
{
    public function testUserWithActiveBorrowingCannotBorrow()
    {
        $user = User::factory()->create();
        $user->cards()->create([
            'card_type' => 'visa',
            'last_four' => '4081',
            'authorization_code' => 'AUTH_123',
            'card_token' => 'token_123',
            'is_active' => true,
            'card_linked_at' => now()->subDays(10),
            'email' => $user->email,
            'bank' => 'Test Bank',
            'bin' => '408408',
            'is_default' => true,
        ]);

        // Create active borrowing
        Borrowing::create([
            'user_id' => $user->id,
            'reference' => 'BOR_' . uniqid(),
            'type' => 'airtime',
            'amount' => 500,
            'interest_rate' => 5,
            'total_amount' => 525,
            'service_details' => '08012345678',
            'transaction_details' => [],
            'due_date' => now()->addDays(7),
            'status' => 'active',
            'auto_deduction_enabled' => true,
        ]);

        $service = new AdvancedCreditScoringService();
        $creditScore = $service->calculateCreditScore($user);
        $eligibility = $service->determineEligibility($user, $creditScore);

        // Assert user is not eligible
        $this->assertEquals('not_eligible', $eligibility['status']);
        $this->assertTrue($eligibility['has_pending_borrowing']);
        $this->assertStringContainsString(
            'pending borrowing',
            $eligibility['reason']
        );
    }

    public function testUserWithoutActiveBorrowingCanBorrow()
    {
        $user = User::factory()->create();
        $user->cards()->create([
            'card_type' => 'visa',
            'last_four' => '4081',
            'authorization_code' => 'AUTH_456',
            'card_token' => 'token_456',
            'is_active' => true,
            'card_linked_at' => now()->subDays(10),
            'email' => $user->email,
            'bank' => 'Test Bank',
            'bin' => '408408',
            'is_default' => true,
        ]);

        // No active borrowing

        $service = new AdvancedCreditScoringService();
        $creditScore = $service->calculateCreditScore($user);
        $eligibility = $service->determineEligibility($user, $creditScore);

        // Assert user is eligible
        $this->assertEquals('eligible', $eligibility['status']);
        $this->assertArrayNotHasKey('has_pending_borrowing', $eligibility);
    }

    public function testUserWithOverdueBorrowingCannotBorrow()
    {
        $user = User::factory()->create();
        $user->cards()->create([
            'card_type' => 'visa',
            'last_four' => '4081',
            'authorization_code' => 'AUTH_789',
            'card_token' => 'token_789',
            'is_active' => true,
            'card_linked_at' => now()->subDays(10),
            'email' => $user->email,
            'bank' => 'Test Bank',
            'bin' => '408408',
            'is_default' => true,
        ]);

        // Create overdue borrowing
        Borrowing::create([
            'user_id' => $user->id,
            'reference' => 'BOR_' . uniqid(),
            'type' => 'data',
            'amount' => 1000,
            'interest_rate' => 10,
            'total_amount' => 1100,
            'service_details' => 'MTN 1GB',
            'transaction_details' => [],
            'due_date' => now()->subDays(5),  // 5 days overdue
            'status' => 'overdue',
            'auto_deduction_enabled' => true,
        ]);

        $service = new AdvancedCreditScoringService();
        $creditScore = $service->calculateCreditScore($user);
        $eligibility = $service->determineEligibility($user, $creditScore);

        // Assert user is not eligible
        $this->assertEquals('not_eligible', $eligibility['status']);
        $this->assertTrue($eligibility['has_pending_borrowing']);
    }

    public function testUserWithPaidBorrowingCanBorrow()
    {
        $user = User::factory()->create();
        $user->cards()->create([
            'card_type' => 'visa',
            'last_four' => '4081',
            'authorization_code' => 'AUTH_999',
            'card_token' => 'token_999',
            'is_active' => true,
            'card_linked_at' => now()->subDays(10),
            'email' => $user->email,
            'bank' => 'Test Bank',
            'bin' => '408408',
            'is_default' => true,
        ]);

        // Create PAID borrowing (should not block)
        Borrowing::create([
            'user_id' => $user->id,
            'reference' => 'BOR_' . uniqid(),
            'type' => 'cable',
            'amount' => 3000,
            'interest_rate' => 2,
            'total_amount' => 3060,
            'service_details' => 'DSTV Premium',
            'transaction_details' => [],
            'due_date' => now()->subDays(10),
            'status' => 'paid',
            'repaid_at' => now(),
            'auto_deduction_enabled' => true,
        ]);

        $service = new AdvancedCreditScoringService();
        $creditScore = $service->calculateCreditScore($user);
        $eligibility = $service->determineEligibility($user, $creditScore);

        // Assert user IS eligible (no pending borrowing)
        $this->assertEquals('eligible', $eligibility['status']);
        $this->assertArrayNotHasKey('has_pending_borrowing', $eligibility);
    }
}
```

---

## Eligibility Check Priority

The eligibility checks now run in this priority:

```
1. Check Active Card
   ↓ (if no card, reject)
2. Check Pending Borrowings ⭐ NEW
   ↓ (if has pending, reject)
3. Check Card Waiting Period
   ↓ (if in waiting period, reject)
4. Check Credit Score & Criteria
   ↓ (if all pass, approve)
```

---

## Borrowing Status Reference

| Status | Meaning | Can Borrow? |
|--------|---------|------------|
| `active` | Borrowing created, not yet due | ❌ NO |
| `overdue` | Borrowing past due date | ❌ NO |
| `paid` | Borrowing repaid in full | ✅ YES |
| `default` | Borrowing went unpaid (historical) | ✅ YES |
| `failed` | Borrowing service delivery failed | ✅ YES |

---

## User Communication

### Messages to Display

**When User Has Pending Borrowing**:
- 🔴 **Title**: "Cannot Borrow Right Now"
- 📝 **Message**: "You have a pending borrowing that must be repaid first"
- 🔧 **Action**: "Go to My Borrowings" (button)

**Details to Show**:
- Count of active borrowings
- Count of overdue borrowings
- Next due date
- Amount to repay

---

## Implementation Checklist

- [x] Add pending borrowing check to `determineEligibility()`
- [x] Return `has_pending_borrowing` flag in eligibility response
- [x] Update eligibility check order/priority
- [ ] Update frontend to display pending borrowing message
- [ ] Test all scenarios
- [ ] Update user documentation
- [ ] Train support team

---

## Side Effects & Considerations

### Positive Effects
✅ Prevents debt accumulation  
✅ Users manage one borrowing at a time  
✅ Better repayment compliance  
✅ Reduces risk of defaults  

### User Impact
⚠️ Users must repay before borrowing again  
⚠️ May reduce borrowing frequency  
⚠️ Needs clear messaging to users  

### System Impact
✅ Simpler credit calculation  
✅ Better risk management  
✅ Fewer concurrent active borrowings  

---

## Migration/Rollback

**No database migration needed** - This is a business logic change only.

To disable this restriction, remove the pending borrowing check from `determineEligibility()`.

---

**Status**: ✅ Implemented  
**Date**: January 5, 2026  
**Last Updated**: January 5, 2026
