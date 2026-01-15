# Quick Reference Guide - Borrowing System

**Last Updated**: January 5, 2026

---

## 🎯 Quick Rules Summary

### User Can Borrow When:
✅ Has active linked card  
✅ No active/overdue borrowings  
✅ Card linking older than 7 days  
✅ Credit score ≥ minimum required  

### User CANNOT Borrow When:
❌ No active card linked  
❌ Has active borrowing pending  
❌ Has overdue borrowing  
❌ Within 7 days of card linking  
❌ Credit score too low  

---

## 💰 Credit Score & Borrowing Limits

```
Score 90-100  → ₦50,000 (Excellent)
Score 80-89   → ₦25,000 (Very Good)
Score 70-79   → ₦15,000 (Good)
Score 60-69   → ₦10,000 (Fair)
Score 50-59   → ₦5,000  (Poor)
Score 40-49   → ₦2,000  (Very Poor)
Score <40     → ₦0     (Not Eligible)
```

---

## 📋 Eligibility Check Order

```
1️⃣  Has Active Card?
    NO  → Reject

2️⃣  Has Pending Borrowing?
    YES → Reject

3️⃣  In 7-Day Waiting Period?
    YES → Reject

4️⃣  Other Criteria Met?
    NO  → Reject

✅  All Pass → ELIGIBLE
```

---

## 🔧 Common Operations

### Check If User Can Borrow
```php
$service = new AdvancedCreditScoringService();
$creditScore = $service->calculateCreditScore($user);
$eligibility = $service->determineEligibility($user, $creditScore, 'airtime');

if ($eligibility['status'] === 'eligible') {
    // User can borrow
} else {
    // Show reason: $eligibility['reason']
}
```

### Check Card Waiting Period
```php
$card = $user->cards()->first();

if ($card->isInWaitingPeriod()) {
    $days = $card->getDaysRemainingInWaitingPeriod();
    echo "Wait {$days} more days";
}
```

### Check Pending Borrowings
```php
$pending = $user->borrowings()
    ->whereIn('status', ['active', 'overdue'])
    ->count();

if ($pending > 0) {
    echo "User has {$pending} pending borrowing(s)";
}
```

---

## 🚨 Error Messages

| Scenario | Message |
|----------|---------|
| No card | "No active payment card linked to account" |
| Pending borrow | "You have a pending borrowing that must be repaid first" |
| Waiting period | "Your card was recently linked. Please wait X more days" |
| Card reuse | "This card is already registered to another account" |

---

## 📊 Database Schema

### user_cards Table
```
id                    | int
user_id              | int (FK to users)
card_type            | string (visa, mastercard, etc)
last_four            | string (4 digits)
authorization_code   | string (UNIQUE) ⭐
card_token           | string (UNIQUE)
is_default           | boolean
is_active            | boolean
card_linked_at       | timestamp ⭐
metadata             | json
created_at           | timestamp
updated_at           | timestamp
```

### borrowings Table (Relevant Columns)
```
id                   | int
user_id              | int (FK to users)
status               | string (active, overdue, paid, default)
amount               | decimal
total_amount         | decimal
due_date             | date
created_at           | timestamp
repaid_at            | timestamp (null until paid)
```

---

## 🔐 Constraints

- `authorization_code` is UNIQUE across all users
- `card_token` is UNIQUE and auto-generated if missing
- One active card per user (enforced at application level)
- No concurrent active + overdue borrowings allowed

---

## 📱 API Endpoints

### Check Eligibility
```
GET /api/borrowing/check-eligibility
Response:
{
  "status": "eligible|not_eligible",
  "reason": "string",
  "action": "string|null",
  "credit_score": int,
  "available_credit": decimal,
  "has_pending_borrowing": boolean (if applicable),
  "card_waiting_period": boolean (if applicable),
  "days_remaining": int (if waiting period)
}
```

### Link Card
```
POST /api/cards/link-from-payment
Request: { "reference": "PAYSTACK_REF", "status": "success" }
Response:
{
  "success": true|false,
  "message": "string",
  "data": { "card": {...} } (if success)
}
```

### Borrow
```
POST /api/borrow/{type}
Request varies by type (airtime, data, cable, electricity)
Response:
{
  "success": true|false,
  "message": "string",
  "eligibility": {...} (if failed due to eligibility)
}
```

---

## 🧪 Testing

### Test Waiting Period
```php
// Link card 8 days ago
$card->card_linked_at = now()->subDays(8)->save();
$card->isInWaitingPeriod(); // false (can borrow)

// Link card 3 days ago
$card->card_linked_at = now()->subDays(3)->save();
$card->isInWaitingPeriod(); // true (cannot borrow)
$card->getDaysRemainingInWaitingPeriod(); // 4
```

### Test Pending Borrowing
```php
// User has active borrowing
$user->borrowings()->create(['status' => 'active']);
$eligibility = $service->determineEligibility($user, 60);
// $eligibility['has_pending_borrowing'] === true

// After repayment
$borrowing->update(['status' => 'paid']);
$eligibility = $service->determineEligibility($user, 60);
// $eligibility['status'] === 'eligible'
```

---

## 🔄 Transaction Flow

```
User Visits Borrow Page
    ↓
Check Eligibility
    ├─ Has Card? → NO → Show "Link Card" message
    ├─ Has Pending? → YES → Show "Repay First" message
    ├─ In Waiting? → YES → Show "Wait X Days" message
    └─ All OK? → YES → Show Borrow Form
    ↓
User Submits Borrow Request
    ↓
Validate Amount ≤ Available Credit
    ↓
Create Borrowing Record
    ↓
Execute Service (Airtime, Data, etc.)
    ↓
Send Notification to User
    ↓
Set Due Date (usually 7 days)
    ↓
On Due Date: Auto-Deduct from Card
    ├─ Success → Mark as 'paid'
    ├─ Fail → Retry, mark as 'overdue' after retries
    └─ User gets notification
```

---

## 📈 Credit Score Factors

```
Factor                  | Weight | How to Improve
Account Age             | 10%    | Use account longer
Transaction History     | 30%    | Complete more transactions
Payment Reliability     | 25%    | Repay borrowings on time
Spending Behavior       | 15%    | Increase transaction amounts
Transaction Frequency   | 15%    | Use service regularly
Card Linking            | 5%     | Link payment card
```

---

## 💡 Common Issues & Solutions

| Issue | Cause | Fix |
|-------|-------|-----|
| User sees "pending borrowing" but none visible | Status may be 'active' or 'overdue' | Check status in DB |
| Waiting period shows wrong days | Server timezone issue | Verify server time |
| Card reuse rejection | Card already linked to other user | Use different card |
| Empty card_token error | Migration not applied | Run `php artisan migrate` |

---

## 📞 Support Reference

**Database**: Tables `user_cards`, `borrowings`, `borrowing_eligibility`  
**Services**: `AdvancedCreditScoringService`, `BorrowingEligibilityService`  
**Models**: `User`, `UserCard`, `Borrowing`  
**Controllers**: `CardLinkingController`, `BorrowingController`  

---

## 🚀 Deployment Checklist

- [ ] Run migrations: `php artisan migrate`
- [ ] Test card linking
- [ ] Test 7-day waiting period
- [ ] Test pending borrowing restriction
- [ ] Verify error messages
- [ ] Check database constraints
- [ ] Monitor logs for errors
- [ ] Update user documentation

---

**Version**: 1.0  
**Status**: ✅ Complete  
**Last Updated**: January 5, 2026
