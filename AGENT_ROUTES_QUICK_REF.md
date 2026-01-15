# Agent Routes Quick Reference

## All Agent Routes

### Dashboard
- `GET /agent/dashboard` - Agent dashboard (existing)

### Transactions (Existing)
- `GET /agent/transactions` - List transactions
- `GET /agent/transactions/{transaction}` - View transaction
- `POST /agent/transactions/{transaction}` - Update transaction

### Users (Existing)
- `GET /agent/users` - List users
- `GET /agent/users/{user}` - View user details
- `PATCH /agent/users/{user}/toggle-active` - Toggle user active status

### Messages (Existing)
- `GET /agent/messages` - List messages
- `GET /agent/messages/conversation/{conversation}` - View conversation
- `POST /agent/messages/send` - Send message
- `POST /agent/messages/conversation/{conversation}/close` - Close conversation

### Borrowings (NEW)
- `GET /agent/borrowings` → BorrowingController@index
- `GET /agent/borrowings/{borrowing}` → BorrowingController@show
- `POST /agent/borrowings/{borrowing}/approve` → BorrowingController@approve
- `POST /agent/borrowings/{borrowing}/reject` → BorrowingController@reject
- `POST /agent/borrowings/{borrowing}/mark-paid` → BorrowingController@markPaid

### Data Plans (NEW)
- `GET /agent/data-plans` → DataPlanController@index
- `POST /agent/data-plans/{dataPlan}/toggle` → DataPlanController@toggle

### Wallet Fundings (NEW)
- `GET /agent/wallet-fundings` → WalletFundingController@index
- `GET /agent/wallet-fundings/{funding}` → WalletFundingController@show
- `POST /agent/wallet-fundings/{funding}/approve` → WalletFundingController@approve
- `POST /agent/wallet-fundings/{funding}/reject` → WalletFundingController@reject

### Settings (NEW)
- `GET /agent/settings` → SettingsController@index
- `POST /agent/settings` → SettingsController@update

### Notifications (NEW)
- `GET /agent/notifications` → NotificationController@index
- `POST /agent/notifications/send` → NotificationController@send

## Route Helper Usage in Blade/JavaScript

```javascript
// Borrowings
route('agent.borrowings.index')
route('agent.borrowings.show', borrowing.id)
route('agent.borrowings.approve', borrowing.id)
route('agent.borrowings.reject', borrowing.id)
route('agent.borrowings.mark-paid', borrowing.id)

// Data Plans
route('agent.data-plans')
route('agent.data-plans.toggle', planId)

// Wallet Fundings
route('agent.wallet-fundings')
route('agent.wallet-fundings.show', fundingId)
route('agent.wallet-fundings.approve', fundingId)
route('agent.wallet-fundings.reject', fundingId)

// Settings
route('agent.settings')
route('agent.settings.update')

// Notifications
route('agent.notifications.index')
route('agent.notifications.send')
```

## Page Components

### Import Examples
```javascript
import BorrowingsIndex from '@/Pages/Agent/Borrowings/Index';
import BorrowingsShow from '@/Pages/Agent/Borrowings/Show';
import DataPlansIndex from '@/Pages/Agent/DataPlans/Index';
import WalletFundingsIndex from '@/Pages/Agent/WalletFundings/Index';
import WalletFundingsShow from '@/Pages/Agent/WalletFundings/Show';
import SettingsIndex from '@/Pages/Agent/Settings/Index';
import NotificationsIndex from '@/Pages/Agent/Notifications/Index';
```

## File Structure
```
app/Http/Controllers/Agent/
├── DashboardController.php (existing)
├── TransactionController.php (existing)
├── UserController.php (existing)
├── MessageController.php (existing)
├── BorrowingController.php (NEW)
├── DataPlanController.php (NEW)
├── WalletFundingController.php (NEW)
├── SettingsController.php (NEW)
└── NotificationController.php (NEW)

resources/js/Pages/Agent/
├── Dashboard.jsx (updated)
├── Transactions.jsx (existing)
├── Users/
│   ├── Index.jsx (existing)
│   └── Show.jsx (existing)
├── Messages.jsx (existing)
├── Borrowings/ (NEW)
│   ├── Index.jsx
│   └── Show.jsx
├── DataPlans/ (NEW)
│   └── Index.jsx
├── WalletFundings/ (NEW)
│   ├── Index.jsx
│   └── Show.jsx
├── Settings/ (NEW)
│   └── Index.jsx
└── Notifications/ (NEW)
    └── Index.jsx
```

## Database Models Expected

- `Borrowing` - Borrowing records
- `User` - User information
- `Transaction` - Transaction records
- `DataPlan` - Data plans
- `WalletFunding` - Wallet funding requests

## Next Implementation Steps

1. **Implement Controller Methods**
   - Query database for borrowings, data plans, wallet fundings
   - Add validation for approval/rejection
   - Implement status updates

2. **Add Page Functionality**
   - Form submission handlers
   - API calls to controllers
   - Error handling and notifications

3. **Database Queries**
   - Borrowing::with('user')->paginate()
   - DataPlan::all()
   - WalletFunding::with('user')->paginate()

4. **Authentication & Authorization**
   - Verify user is an agent
   - Check ownership of data before displaying
   - Implement role-based permissions

5. **Add Models & Relationships**
   - Define belongsTo/hasMany relationships
   - Add status enums if needed
   - Create migrations for any missing columns
