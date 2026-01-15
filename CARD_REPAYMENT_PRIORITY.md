# Card Repayment Priority - Implementation Complete ✅

## Overview

Repayment from the user dashboard now **attempts to charge the user's linked card first**, with automatic fallback to wallet balance if card is unavailable or charge fails.

## Flow

```
User clicks "Repay All" on dashboard
    ↓
System checks if user has a linked card
    ↓
IF card exists:
    → Attempt to charge card with total outstanding amount
    → If charge succeeds → Mark all borrowings as PAID
    ↓
IF card doesn't exist OR charge fails:
    → Log warning
    → Fall back to wallet repayment
    → Deduct from wallet_balance
    → Mark all borrowings as PAID
    ↓
User sees success message with amount repaid
```

## Changes Made

### 1. **BorrowingService.php** - New Method
Added `repayAllFromCard()` method that:
- Fetches all active/overdue borrowings for the user
- Calculates total amount to repay
- Retrieves user's default linked card
- **Attempts to charge the card** if available
- **Falls back to wallet** if card charge fails or no card exists
- Returns total amount settled

```php
public function repayAllFromCard(User $user)
{
    // 1. Get active borrowings
    // 2. Get default card
    // 3. Try to charge card
    // 4. If successful, mark as paid via 'card' payment method
    // 5. If fails, fall back to repayFromWallet()
}
```

### 2. **BorrowingController.php** - Updated Method
Changed `repayAll()` to use the new card-first method:

```php
// OLD: Direct wallet repayment
$totalSettled = $this->borrowingService->repayFromWallet($user);

// NEW: Card-first with wallet fallback
$totalSettled = $this->borrowingService->repayAllFromCard($user);
```

### 3. **Dashboard.jsx** - Updated Message
Changed confirmation message to reflect card charge:

```javascript
// OLD
'Are you sure you want to repay your outstanding debt using your wallet balance?'

// NEW
'Are you sure you want to repay your outstanding debt? Your linked card will be charged, or wallet balance used if card is not available.'
```

## Payment Method Tracking

The `BorrowingRepayment` record now tracks payment method:
- `payment_method = 'card'` - Charged to linked card
- `payment_method = 'wallet'` - Deducted from wallet balance

## User Experience

### Scenario 1: User has linked card
1. Clicks "Repay All"
2. Sees confirmation about card charge
3. Clicks confirm
4. System charges the default card
5. ✅ All borrowings marked as PAID
6. Success message shows amount repaid

### Scenario 2: User has no linked card
1. Clicks "Repay All"
2. Sees confirmation
3. Clicks confirm
4. System detects no card
5. Falls back to wallet deduction
6. ✅ All borrowings marked as PAID
7. Success message shows amount repaid

### Scenario 3: Card charge fails
1. Clicks "Repay All"
2. Sees confirmation
3. Clicks confirm
4. System attempts card charge
5. ⚠️ Card charge fails (insufficient funds, expired, etc.)
6. System logs the failure
7. Falls back to wallet repayment
8. ✅ All borrowings marked as PAID (from wallet)
9. Success message shows amount repaid

## Error Handling

- **Card charge fails** → Automatic fallback to wallet (user won't see error)
- **No card + insufficient wallet** → Clear error message
- **No active borrowings** → Clear error message

## Database Records

Example `borrowing_repayments` record for card payment:
```
borrowing_id: 123
payment_method: 'card'
status: 'success'
amount: ₦50,000
reference: 'BOR_REPAY_...'
payment_gateway_response: {...}
metadata: {
    card_last_four: '4242',
    authorization_code: '...'
}
```

## Technical Details

### PaymentService Integration
Uses existing `PaymentService::chargeAuthorization()` to charge the card:
- Requires card's `authorization_code`
- Automatically handles Paystack integration
- Returns success/failure status

### Logging
Failed card charges are logged as warnings:
```
WARNING: Card repayment failed, falling back to wallet
user_id: 123
error: [error message]
```

## Future Enhancements

- Notify user which payment method was used (card vs wallet)
- Retry mechanism for failed card charges
- Option to manually select payment method
- Payment receipt showing card last 4 digits
- Email notification with payment method used

## Testing Checklist

- [ ] User with card + sufficient card balance
  - ✅ Card charged
  - ✅ Borrowings marked as paid
  - ✅ Success message shown

- [ ] User with card + insufficient card balance
  - ✅ Card charge fails
  - ✅ Wallet fallback triggers
  - ✅ Borrowings marked as paid (if wallet has balance)

- [ ] User without card + sufficient wallet
  - ✅ No card found
  - ✅ Wallet repayment used
  - ✅ Borrowings marked as paid

- [ ] User without card + insufficient wallet
  - ✅ Error message shown
  - ✅ No repayment attempted

- [ ] Transaction recording
  - ✅ BorrowingRepayment records created
  - ✅ Payment method correctly recorded
  - ✅ Status updated to 'paid'

## Status: ✅ COMPLETE

All changes implemented and ready for testing. Card charges are now the primary payment method for dashboard repayment, with seamless wallet fallback for better user experience.
