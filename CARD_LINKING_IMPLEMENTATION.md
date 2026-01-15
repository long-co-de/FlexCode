# Card Linking & Credit System - Implementation Summary

**Date**: January 5, 2026  
**Changes**: Fixed duplicate card token issue and implemented 7-day card linking waiting period

---

## Overview

Implemented a complete card linking system with the following key features:

1. **Unique Card Tokens**: Generate unique tokens for cards when Paystack doesn't provide one
2. **7-Day Waiting Period**: New users must wait 7 days after card linking before they can borrow
3. **Card Reuse Prevention**: Same card cannot be registered to multiple user accounts
4. **Card Uniqueness Per User**: One card per user restriction enforced
5. **Credit Score Tracking**: Initial credit score for new users with linked cards

---

## Changes Made

### 1. Fixed Duplicate Card Token Error

**File**: `app/Http/Controllers/User/CardLinkingController.php`

**Problem**: When Paystack didn't return a `card_token`, the code defaulted to an empty string, causing duplicate entry violations on the unique constraint.

**Solution**: Generate a unique SHA256 hash-based token when Paystack doesn't provide one:
```php
$cardToken = $authorization['card_token'] ?? null;
if (!$cardToken || empty($cardToken)) {
    $cardToken = hash('sha256', $user->id . '|' . ($authorization['authorization_code'] ?? '') . '|' . time());
}
```

### 2. Added Card Reuse Prevention

**File**: `app/Http/Controllers/User/CardLinkingController.php`

**Implementation**: Check if the card (identified by authorization_code) is already registered to another active user:

```php
$cardUsedByAnotherUser = UserCard::where('authorization_code', $authCode)
    ->where('user_id', '!=', $user->id)
    ->where('is_active', true)
    ->first();

if ($cardUsedByAnotherUser) {
    // Reject with error message
    return response()->json([
        'success' => false,
        'message' => 'This card is already registered to another account.',
    ], 400);
}
```

**Benefits**:
- ✅ Each card can only be linked to one account
- ✅ Prevents fraudulent account creation using same card
- ✅ Maintains card integrity across the system

### 3. Implemented 7-Day Card Linking Waiting Period

**Files Modified**:
- `database/migrations/2026_01_05_132000_add_card_linking_tracking.php`
- `app/Models/UserCard.php`
- `app/Services/AdvancedCreditScoringService.php`

**How It Works**:

1. **Track Card Linking Date**: When a card is linked, `card_linked_at` timestamp is set
   ```php
   'card_linked_at' => now(),
   ```

2. **UserCard Model Methods** (New):
   - `isInWaitingPeriod()`: Returns true if card was linked within last 7 days
   - `getDaysRemainingInWaitingPeriod()`: Returns number of days until user can borrow

3. **Eligibility Check** (Updated):
   The `determineEligibility()` method now checks:
   ```php
   if ($activeCard && $activeCard->isInWaitingPeriod()) {
       $daysRemaining = $activeCard->getDaysRemainingInWaitingPeriod();
       return [
           'status' => 'not_eligible',
           'reason' => "Your card was recently linked. Please wait {$daysRemaining} more days before borrowing.",
           'card_waiting_period' => true,
           'days_remaining' => $daysRemaining,
       ];
   }
   ```

**User Experience**:
- User links card → System shows "Wait X days" message
- After 7 days → User can immediately start borrowing
- Prevents abuse of credit system by new accounts

### 4. Added Authorization Code Unique Constraint

**File**: `database/migrations/2026_01_05_132000_add_card_linking_tracking.php`

**Implementation**:
```php
$table->unique('authorization_code');
```

This ensures:
- ✅ No duplicate authorization codes in database
- ✅ One card per account (authorization_code is unique per card)
- ✅ Database-level integrity enforcement

### 5. Fixed Card Token Unique Constraint

**File**: `database/migrations/2026_01_05_131000_fix_card_token_unique_constraint.php`

**What was done**:
- Migrated existing empty card_token entries to unique generated values
- Changed `card_token` to nullable
- Maintained unique constraint (MySQL ignores NULL in unique indexes)

---

## Database Schema Changes

### New Columns in `user_cards` Table:
- `card_linked_at` (timestamp, nullable) - When the card was linked
- `authorization_code` (unique constraint) - Prevents duplicate cards

---

## Credit Score System

### Initial Credit Score for New Users:
When a new user links their first card:
1. Initial credit score = 60 (based on card linking factor of 5%)
2. Score increases based on:
   - Transaction history (30%)
   - Payment reliability (25%)
   - Account age (10%)
   - Spending behavior (15%)
   - Transaction frequency (15%)
   - Card linking (5%)

### Credit Score Calculation:
```
Total Score = (AccountAge × 0.10) + (TransactionHistory × 0.30) + 
              (TransactionFrequency × 0.15) + (SpendingBehavior × 0.15) + 
              (PaymentReliability × 0.25) + (CardLinking × 0.05)
```

### Borrowing Eligibility:
- **First Borrow Limit**: ₦100 (minimum, with active card)
- **Subsequent Borrows**: Based on credit score and service type
  - Score 90+: ₦50,000
  - Score 80-89: ₦25,000
  - Score 70-79: ₦15,000
  - Score 60-69: ₦10,000
  - Score 50-59: ₦5,000
  - Score 40-49: ₦2,000

---

## Migration Files

### 1. `2026_01_05_131000_fix_card_token_unique_constraint.php`
- Fixes the duplicate empty card_token issue
- Generates unique tokens for existing empty entries
- Makes card_token nullable

### 2. `2026_01_05_132000_add_card_linking_tracking.php`
- Adds `card_linked_at` timestamp column
- Adds unique constraint on `authorization_code`

---

## Updated Models

### UserCard Model (`app/Models/UserCard.php`)

**New Fillable Fields**:
```php
'card_linked_at',
```

**New Casts**:
```php
'card_linked_at' => 'datetime',
```

**New Methods**:
```php
public function isInWaitingPeriod(): bool
public function getDaysRemainingInWaitingPeriod(): int
```

---

## Updated Controllers

### CardLinkingController (`app/Http/Controllers/User/CardLinkingController.php`)

**Changes**:
1. Check if card is already registered to another user
2. Generate unique card_token if not provided by Paystack
3. Set `card_linked_at` timestamp on creation and reactivation
4. Prevent duplicate card registrations with clear error messages

---

## Updated Services

### AdvancedCreditScoringService (`app/Services/AdvancedCreditScoringService.php`)

**Updated `determineEligibility()` Method**:
- Now checks if card is in 7-day waiting period
- Returns special response with `card_waiting_period` flag
- Includes `days_remaining` in response for frontend display

---

## Frontend Integration Points

The following information is returned in the eligibility response:

```json
{
  "status": "not_eligible",
  "reason": "Your card was recently linked. Please wait 5 more days before borrowing.",
  "action": "You can start borrowing after the 7-day verification period.",
  "card_waiting_period": true,
  "days_remaining": 5
}
```

Frontend developers should:
1. Check for `card_waiting_period` flag
2. Display countdown timer showing `days_remaining`
3. Disable borrowing interface with this message
4. Show visual indicator (e.g., progress bar) of days elapsed vs remaining

---

## Testing Checklist

- [ ] Test card linking with new user
- [ ] Verify 7-day waiting period is enforced
- [ ] Attempt to reuse same card across different users (should fail)
- [ ] Attempt to link same card twice to same user (should fail)
- [ ] Verify credit score calculation
- [ ] Test borrowing eligibility after 7 days
- [ ] Verify error messages are clear and helpful
- [ ] Check database constraints are working

---

## Rollback Instructions

If needed, rollback can be done via:
```bash
php artisan migrate:rollback
```

This will:
1. Remove card_linked_at column
2. Remove authorization_code unique constraint
3. Revert card_token changes

---

## Summary of Business Logic

**User Journey**:
1. ✅ User creates account (initial credit score: 0)
2. ✅ User links payment card (credit score: 60)
3. ✅ System enforces 7-day waiting period
4. ✅ After 7 days, user can borrow starting at ₦100
5. ✅ Each successful transaction increases credit score
6. ✅ Higher credit score unlocks higher borrowing limits
7. ❌ Same card cannot be used across multiple accounts
8. ❌ Cannot link same card twice to same account

**Card System Rules**:
- One active card per user (can have multiple inactive cards)
- Each card is unique (authorization_code is unique)
- Card token is always unique (generated if not provided)
- 7-day waiting period after linking before borrowing allowed
- Cards cannot be transferred between user accounts

---

## Files Modified Summary

| File | Type | Changes |
|------|------|---------|
| `app/Http/Controllers/User/CardLinkingController.php` | Controller | Added card reuse prevention, unique token generation, card_linked_at timestamp |
| `app/Models/UserCard.php` | Model | Added card_linked_at field, new helper methods |
| `app/Services/AdvancedCreditScoringService.php` | Service | Added 7-day waiting period validation |
| `database/migrations/2026_01_05_131000_fix_card_token_unique_constraint.php` | Migration | Fixed duplicate card_token issue |
| `database/migrations/2026_01_05_132000_add_card_linking_tracking.php` | Migration | Added card tracking and authorization_code unique constraint |

---

**Status**: ✅ All changes implemented and migrated
**Date**: January 5, 2026
