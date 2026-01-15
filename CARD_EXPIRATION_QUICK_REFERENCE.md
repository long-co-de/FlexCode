# Card Expiration Feature - Quick Reference

## 🎯 What Was Added

### Problem Statement
Users could not delete their cards, and expired cards didn't prevent borrowing. When a user's card expired, the system didn't recognize it, and users had no incentive to maintain good payment history.

### Solution
A comprehensive card expiration and deletion system that:
1. **Tracks expiration dates** - Stores exp_month, exp_year, expires_at
2. **Detects expired cards** - Prevents borrowing if card expired
3. **Warns about expiring cards** - Shows warning if expiring within 60 days
4. **Allows smart deletion** - Users can only delete expired/expiring cards
5. **Rewards good behavior** - Credit score increases by 5 points when card expires
6. **Forces relinking** - Users must link new card after deletion

---

## 📋 Checklist for Testing

### Database
- [ ] Run migration: `php artisan migrate`
- [ ] Verify `user_cards` table has new columns: exp_month, exp_year, expires_at, is_expired

### Model Methods
```php
$card = UserCard::find(1);

// Check if expired
$card->isExpired(); // Returns: true/false

// Check if expiring soon (within 60 days)
$card->isExpiringsooon(); // Returns: true/false

// Get days until expiration
$card->getDaysUntilExpiration(); // Returns: int|null

// Calculate expiration date from month/year
$card->calculateExpireDate(); // Returns: DateTime|null

// Mark as expired
$card->markAsExpired(); // Returns: bool
```

### Card Linking
When user links a card, the system now:
1. Stores `exp_month` and `exp_year` directly on UserCard
2. Calculates `expires_at` from expiration month/year
3. Sets `is_expired = false` initially

### Borrowing Eligibility
Before allowing borrowing, system checks:
```php
if (card is expired) → NOT ELIGIBLE
if (card expiring soon) → ELIGIBLE WITH WARNING
if (card valid) → ELIGIBLE
```

### Card Deletion
Users can only delete cards that are:
- ✅ Expired (past expiration date)
- ✅ Expiring soon (within 60 days)

Users CANNOT delete:
- ❌ Valid cards (> 60 days until expiration)

### Credit Score
When card expires:
- Credit score increases by **+5 points**
- Maximum cap: 100 points
- Transaction created for audit

### UI Updates
The LinkCard component now shows:
1. **Expiration date** - Displays when card expires
2. **Expired warning** - Red banner with delete button if expired
3. **Expiring soon warning** - Amber banner with recommendation if < 60 days
4. **Delete success** - Green checkmark and message after deletion

---

## 🔧 API Endpoints

### Delete Expired Card
```
DELETE /cards/{card}/expired
Content-Type: application/json
X-CSRF-Token: {token}

Response:
{
  "success": true,
  "message": "Card deleted successfully. Your credit score has been increased.",
  "credit_score_increase": 5
}
```

**Errors**:
- 403: Unauthorized (card doesn't belong to user)
- 400: Card is not expired (cannot delete valid cards)
- 500: Server error

---

## 📊 Database Schema

### New Fields in `user_cards`
```sql
exp_month VARCHAR(2) -- Card expiration month (e.g., "12")
exp_year VARCHAR(2) -- Card expiration year (e.g., "26")
expires_at TIMESTAMP -- Calculated expiration date (last day of month)
is_expired BOOLEAN DEFAULT false -- Flag for expired cards
```

---

## 💡 Usage Examples

### Check if User Can Borrow
```php
$user = Auth::user();
$eligibility = $user->borrowingEligibility;
$cardValid = $eligibility->eligibility_status === 'eligible';

// Check for expiration specifically
$activeCard = $user->cards()->where('is_active', true)->first();
if ($activeCard->isExpired()) {
    // Card expired - cannot borrow
}
```

### List User's Card Status
```php
$user = Auth::user();
foreach ($user->cards as $card) {
    echo $card->last_four . ': ';
    
    if ($card->isExpired()) {
        echo "EXPIRED (can delete)";
    } elseif ($card->isExpiringsooon()) {
        echo "EXPIRING IN " . $card->getDaysUntilExpiration() . " DAYS (can delete)";
    } else {
        echo "ACTIVE (" . $card->getDaysUntilExpiration() . " days remaining)";
    }
}
```

### Recalculate Eligibility
```php
$eligibilityService = app(BorrowingEligibilityService::class);
$eligibility = $eligibilityService->checkEligibility($user);

// Get full info including card expiration
$info = $eligibilityService->getEligibilityInfo($user);
// Returns: card_expired, card_expiring_soon, days_until_expiration
```

---

## 🚀 Deployment Commands

```bash
# 1. Pull latest code
git pull origin main

# 2. Install/update dependencies
composer install
npm install

# 3. Run migrations
php artisan migrate

# 4. Clear cache
php artisan cache:clear
php artisan config:clear

# 5. Rebuild frontend (if needed)
npm run build

# 6. Optional: Test
php artisan test
```

---

## 📝 Files Changed

| File | Purpose |
|------|---------|
| `database/migrations/2026_01_08_000001_add_card_expiration_tracking.php` | Add expiration fields to database |
| `app/Models/UserCard.php` | Add expiration methods and properties |
| `app/Http/Controllers/User/CardLinkingController.php` | Store expiration data during linking |
| `app/Http/Controllers/User/CardController.php` | New deleteExpiredCard endpoint |
| `app/Services/AdvancedCreditScoringService.php` | Check expiration in eligibility |
| `app/Services/BorrowingEligibilityService.php` | Include expiration info in response |
| `resources/js/Pages/User/Cards/LinkCard.jsx` | UI for expiration display and delete |
| `routes/web.php` | Add new delete-expired route |

---

## 🔒 Security Notes

✅ **Card Deletion Validation**:
- Only card owner can delete their card
- Can only delete expired/expiring cards
- Cannot delete valid cards

✅ **Credit Score**:
- Automatically calculated
- Cannot be manipulated by users
- Only increases on legitimate expiration

✅ **Transaction Audit**:
- All credit score changes logged
- Metadata includes reason and previous/new score
- Searchable by reference: `CARD_EXPIRED_SCORE_*`

---

## ❓ FAQ

**Q: Can users delete valid cards?**
A: No. Users can only delete expired or expiring (< 60 days) cards. Valid cards cannot be deleted to prevent account issues.

**Q: What happens to credit score when card expires?**
A: Credit score increases by 5 points (max 100). This rewards users for maintaining payment history.

**Q: Can users borrow with an expiring card?**
A: Yes, if expiring within 60 days. The system shows a warning but allows borrowing. After expiration, borrowing is blocked.

**Q: What if user deletes their only card?**
A: User must link a new card before they can borrow. The card linking flow will be available immediately.

**Q: How is expiration date calculated?**
A: From exp_month/exp_year (e.g., "12/26" = December 31, 2026). The expires_at is set to the last day of the expiration month.

**Q: Are deleted cards permanently gone?**
A: Yes, deleted cards are permanently removed from the database. Users can re-link the same card if needed (will be treated as new card).

---

## 🎓 Learning Resources

- **UserCard Model**: See `app/Models/UserCard.php` for expiration method implementations
- **Eligibility Service**: See `app/Services/AdvancedCreditScoringService.php` for business logic
- **Frontend Component**: See `resources/js/Pages/User/Cards/LinkCard.jsx` for UI implementation
- **Controller**: See `app/Http/Controllers/User/CardController.php` for API endpoint

---

## ✅ Status

**Implementation**: COMPLETE ✅
**Testing**: READY FOR QA
**Documentation**: COMPLETE
**Deployment**: READY

Last Updated: January 8, 2026
