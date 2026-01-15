# Card Linking System - Implementation Examples

## API Response Examples

### Example 1: User Linking Card Successfully (First Time)

**Request**:
```php
POST /api/cards/link-from-payment
{
    "reference": "PAYSTACK_REF_123",
    "status": "success"
}
```

**Success Response**:
```json
{
    "success": true,
    "message": "Card linked successfully!",
    "data": {
        "card": {
            "id": 1,
            "card_type": "visa",
            "last_four": "4081",
            "bank": "TEST BANK",
            "is_default": true
        }
    }
}
```

**Database State**:
- `user_cards.card_linked_at` = NOW (2026-01-05 13:06:20)
- `user_cards.is_active` = 1
- `user_cards.authorization_code` = "AUTH_4a7mvq7g96" (unique)
- `user_cards.card_token` = "abc123def456..." (unique SHA256 hash)

---

### Example 2: User Tries to Borrow Within 7 Days of Card Linking

**Request**:
```php
POST /api/borrow/airtime
{
    "phone": "08012345678",
    "amount": 500,
    "network": "mtn"
}
```

**Failure Response** (User linked card 3 days ago):
```json
{
    "success": false,
    "message": "Your card was recently linked. Please wait 4 more days before borrowing.",
    "eligibility": {
        "status": "not_eligible",
        "reason": "Your card was recently linked. Please wait 4 more days before borrowing.",
        "action": "You can start borrowing after the 7-day verification period.",
        "card_waiting_period": true,
        "days_remaining": 4,
        "credit_score": 60
    }
}
```

---

### Example 3: User Tries to Reuse Same Card on Different Account

**Scenario**: User A links card (last 4: 4081), then User B tries to link same card

**Request (User B)**:
```php
POST /api/cards/link-from-payment
{
    "reference": "PAYSTACK_REF_456",
    "status": "success"
}
```

**Failure Response**:
```json
{
    "success": false,
    "message": "This card is already registered to another account. Please use a different card."
}
```

**Database Check**:
```sql
SELECT * FROM user_cards 
WHERE authorization_code = 'AUTH_4a7mvq7g96' AND is_active = 1;
-- Returns: User A's card, not User B's
```

---

### Example 4: User Borrows Successfully (After 7 Days)

**Scenario**: User linked card 7+ days ago

**Request**:
```php
POST /api/borrow/airtime
{
    "phone": "08012345678",
    "amount": 500,
    "network": "mtn"
}
```

**Success Response**:
```json
{
    "success": true,
    "message": "Borrow created successfully",
    "data": {
        "borrow": {
            "id": 123,
            "type": "airtime",
            "amount": 500,
            "status": "active",
            "due_date": "2026-01-12"
        }
    },
    "eligibility": {
        "status": "eligible",
        "credit_score": 75,
        "available_credit": 24500
    }
}
```

---

## Code Usage Examples

### Check if User Can Borrow

```php
<?php

namespace App\Http\Controllers\User;

use App\Models\User;

class BorrowController extends Controller
{
    public function checkEligibility(User $user)
    {
        // Get user's active card
        $activeCard = $user->cards()->where('is_active', true)->first();
        
        if (!$activeCard) {
            return response()->json([
                'eligible' => false,
                'message' => 'Please link a card first'
            ]);
        }
        
        // Check waiting period
        if ($activeCard->isInWaitingPeriod()) {
            $daysRemaining = $activeCard->getDaysRemainingInWaitingPeriod();
            return response()->json([
                'eligible' => false,
                'message' => "Please wait {$daysRemaining} more days",
                'days_remaining' => $daysRemaining
            ]);
        }
        
        // User is eligible
        return response()->json([
            'eligible' => true,
            'credit_score' => $user->eligibility->credit_score ?? 0,
            'available_credit' => $user->eligibility->available_credit ?? 0
        ]);
    }
}
```

---

### Link a Card with Validation

```php
<?php

namespace App\Http\Controllers\User;

use App\Models\UserCard;
use Illuminate\Support\Str;

class CardLinkingController extends Controller
{
    public function linkCard($authCode)
    {
        // Check if card already linked to another user
        $existingCard = UserCard::where('authorization_code', $authCode)
            ->where('is_active', true)
            ->first();
        
        if ($existingCard && $existingCard->user_id !== auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'This card is already registered to another account'
            ], 400);
        }
        
        // Generate unique token
        $cardToken = hash('sha256', 
            auth()->id() . '|' . $authCode . '|' . time()
        );
        
        // Create card with timestamp
        $card = UserCard::create([
            'user_id' => auth()->id(),
            'authorization_code' => $authCode,
            'card_token' => $cardToken,
            'is_active' => true,
            'card_linked_at' => now(),  // Key: Set linking time
            // ... other fields
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Card linked successfully'
        ]);
    }
}
```

---

### Display Waiting Period to User

```javascript
// React Component Example

import React, { useEffect, useState } from 'react';

export default function CardWaitingPeriod({ card }) {
    const [daysRemaining, setDaysRemaining] = useState(0);
    
    useEffect(() => {
        if (card?.card_linked_at) {
            const linkedDate = new Date(card.card_linked_at);
            const today = new Date();
            const daysElapsed = Math.floor(
                (today - linkedDate) / (1000 * 60 * 60 * 24)
            );
            const remaining = Math.max(0, 7 - daysElapsed);
            setDaysRemaining(remaining);
        }
    }, [card]);
    
    if (daysRemaining === 0) {
        return <div className="text-green-600">Ready to borrow!</div>;
    }
    
    return (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <p className="text-yellow-800 font-semibold">
                Card Verification in Progress
            </p>
            <p className="text-yellow-700">
                Your card will be ready for borrowing in {daysRemaining} days.
            </p>
            <div className="mt-3 bg-yellow-200 rounded-full h-2">
                <div 
                    className="bg-yellow-500 h-2 rounded-full transition-all"
                    style={{ width: `${((7 - daysRemaining) / 7) * 100}%` }}
                ></div>
            </div>
        </div>
    );
}
```

---

## Database Query Examples

### Find All Cards for a User

```php
$user = User::find(3);
$activeCards = $user->cards()->where('is_active', true)->get();

foreach ($activeCards as $card) {
    echo "Card: " . $card->last_four;
    echo " - Linked: " . $card->card_linked_at->diffForHumans();
    echo " - Waiting Period: " . ($card->isInWaitingPeriod() ? 'Yes' : 'No');
}
```

---

### Find Duplicate Card Attempts

```php
// Find if a card is registered to another user
$authCode = 'AUTH_4a7mvq7g96';

$cardUsers = UserCard::where('authorization_code', $authCode)
    ->where('is_active', true)
    ->pluck('user_id');

if ($cardUsers->count() > 1) {
    // Card registered to multiple users (should not happen now)
    Log::warning('Duplicate card registration detected', ['auth_code' => $authCode]);
}
```

---

### Get Users in Waiting Period

```php
$usersInWaitingPeriod = UserCard::where('is_active', true)
    ->whereNotNull('card_linked_at')
    ->where('card_linked_at', '>', now()->subDays(7))
    ->with('user')
    ->get();

foreach ($usersInWaitingPeriod as $card) {
    echo $card->user->name . " - " . $card->getDaysRemainingInWaitingPeriod() . " days remaining\n";
}
```

---

## Error Handling Examples

### Handle Card Already Registered Error

```php
<?php

try {
    $card = UserCard::create([
        'user_id' => $user->id,
        'authorization_code' => $authCode,
        // ... other fields
    ]);
} catch (\Illuminate\Database\QueryException $e) {
    if ($e->getCode() == '23000') { // Duplicate entry
        // Check if it's authorization_code or card_token
        if (str_contains($e->getMessage(), 'authorization_code')) {
            return response()->json([
                'success' => false,
                'message' => 'This card is already registered'
            ], 400);
        }
        if (str_contains($e->getMessage(), 'card_token')) {
            return response()->json([
                'success' => false,
                'message' => 'Card token conflict. Please try again.'
            ], 400);
        }
    }
    throw $e;
}
```

---

## Testing Examples

### Unit Test for Waiting Period

```php
<?php

use App\Models\User;
use App\Models\UserCard;
use Carbon\Carbon;

class CardLinkingTest extends TestCase
{
    public function testCardWaitingPeriod()
    {
        // Create user and link card 3 days ago
        $user = User::factory()->create();
        $linkedDate = now()->subDays(3);
        
        $card = UserCard::create([
            'user_id' => $user->id,
            'card_type' => 'visa',
            'last_four' => '4081',
            'authorization_code' => 'AUTH_' . uniqid(),
            'card_token' => hash('sha256', uniqid()),
            'is_active' => true,
            'card_linked_at' => $linkedDate,
            'email' => $user->email,
            'bank' => 'Test Bank',
            'bin' => '408408',
            'is_default' => true,
        ]);
        
        // Assert in waiting period
        $this->assertTrue($card->isInWaitingPeriod());
        $this->assertEquals(4, $card->getDaysRemainingInWaitingPeriod());
    }
    
    public function testCardNotInWaitingPeriodAfterSevenDays()
    {
        $user = User::factory()->create();
        $linkedDate = now()->subDays(7);
        
        $card = UserCard::create([
            'user_id' => $user->id,
            'card_type' => 'visa',
            'last_four' => '4081',
            'authorization_code' => 'AUTH_' . uniqid(),
            'card_token' => hash('sha256', uniqid()),
            'is_active' => true,
            'card_linked_at' => $linkedDate,
            'email' => $user->email,
            'bank' => 'Test Bank',
            'bin' => '408408',
            'is_default' => true,
        ]);
        
        // Assert NOT in waiting period
        $this->assertFalse($card->isInWaitingPeriod());
        $this->assertEquals(0, $card->getDaysRemainingInWaitingPeriod());
    }
}
```

---

## Migration Verification

### Check Migrations Applied

```bash
# View all migrations
php artisan migrate:status

# Should show:
# 2026_01_05_131000_fix_card_token_unique_constraint ... Batch: 1
# 2026_01_05_132000_add_card_linking_tracking ... Batch: 1
```

---

## Common Issues & Solutions

### Issue: "SQLSTATE[23000]: Integrity constraint violation"

**Cause**: Duplicate authorization_code  
**Solution**: Check if card is already registered:
```php
$existing = UserCard::where('authorization_code', $authCode)->first();
if ($existing) {
    // Handle duplicate
}
```

---

### Issue: Waiting Period Not Enforced

**Cause**: `card_linked_at` not being set  
**Solution**: Ensure timestamp is set:
```php
'card_linked_at' => now(),  // Add this line
```

---

### Issue: User Can Still Borrow in Waiting Period

**Cause**: `determineEligibility()` not checking waiting period  
**Solution**: Verify AdvancedCreditScoringService is updated and call it:
```php
$creditScore = $this->creditScoringService->calculateCreditScore($user);
$eligibilityInfo = $this->creditScoringService->determineEligibility($user, $creditScore);
```

---

**Last Updated**: January 5, 2026
