# Credit Feature Overview

## 📋 Overview

The credit feature allows authenticated users to **borrow small amounts** for various services (Airtime, Data, Cable, Electricity) with an automatic repayment mechanism tied to their linked payment cards.

---

## 🏗️ Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────┐
│                  USER REQUESTS BORROW                   │
│         (Airtime, Data, Cable, Electricity)            │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌───────────────┐       ┌──────────────────┐
│ Check Card    │       │ Check Eligibility│
│ is_active=1   │       │ (BorrowingElig.)  │
└───────────────┘       └──────────────────┘
        │                         │
        └────────────┬────────────┘
                     │
        ┌────────────▼─────────────┐
        │  Check Borrow Settings   │
        │  (min/max amount)        │
        └────────────┬─────────────┘
                     │
        ┌────────────▼──────────────────┐
        │  Create Borrowing Record       │
        │  + Calculate Interest          │
        │  + Set Due Date                │
        └────────────┬──────────────────┘
                     │
        ┌────────────▼──────────────────┐
        │  Execute Service Transaction   │
        │  (Airtime/Data/Cable/etc)      │
        └────────────┬──────────────────┘
                     │
        ┌────────────▼──────────────────────┐
        │  Setup Auto-Repayment Scheduled  │
        │  (On Linked Card)                 │
        └───────────────────────────────────┘
```

---

## 📊 Database Schema

### Key Tables

#### 1. **borrowing_eligibilities**

Stores user's credit profile & eligibility status

```
┌─────────────────────────────────────────────┐
│ ID │ User ID │ Status │ Credit Limit │ Credit Score │
│ PK │ FK      │ enum   │ decimal(10,2)│ int(0-100)   │
└─────────────────────────────────────────────┘
```

**Key Fields:**

-   `eligibility_status`: 'eligible' | 'ineligible'
-   `credit_limit`: Maximum borrowing amount
-   `available_credit`: `credit_limit` - currently_borrowed
-   `credit_score`: 0-100 (calculated dynamically)
-   `eligibility_criteria`: JSON with detailed metrics
-   `rejection_reason`: Why user is ineligible
-   `last_eligibility_check`: Timestamp

#### 2. **borrowings**

Tracks active and completed loans

```
┌──────────────────────────────────────────────┐
│ ID │ User ID │ Type │ Amount │ Status │ DueDate │
│ PK │ FK      │ enum │ dec    │ enum   │ date    │
└──────────────────────────────────────────────┘
```

**Key Fields:**

-   `type`: 'airtime' | 'data' | 'cable' | 'electricity'
-   `amount`: Borrowed amount
-   `interest_rate`: % interest applied
-   `total_amount`: amount + interest
-   `status`: 'active' | 'paid' | 'overdue' | 'default'
-   `due_date`: When payment is due
-   `auto_deduction_enabled`: Automatic repayment flag
-   `service_details`: JSON with transaction details

#### 3. **borrowing_repayments**

Records each repayment attempt

```
┌─────────────────────────────────────────┐
│ ID │ Borrowing ID │ Amount │ Status │ Date │
│ PK │ FK           │ dec    │ enum   │ date │
└─────────────────────────────────────────┘
```

#### 4. **borrow_settings**

Admin-configurable limits per service

```
┌──────────────────────────────────────┐
│ Service │ Min │ Max │ Due Days │ Status │
└──────────────────────────────────────┘
```

**Per Service:**

-   Minimum borrow amount
-   Maximum borrow amount
-   Days before repayment due
-   Whether borrowing is enabled

#### 5. **credit_eligibility_settings**

Admin-managed scoring rules

```
┌──────────────────────────────────────────────┐
│ Service Type │ Min Credit Score │ Credit Limits │
│              │ for Different Tiers (90+, 80-89...) │
└──────────────────────────────────────────────┘
```

---

## 🔐 Credit Eligibility System

### Credit Score Calculation (0-100)

Weighted formula that considers:

```javascript
Credit Score =
  (Account Age * 0.15) +           // 15%
  (Transaction History * 0.25) +   // 25%
  (Transaction Frequency * 0.15) + // 15%
  (Spending Behavior * 0.15) +     // 15%
  (Payment Reliability * 0.20) +   // 20%
  (Card Linking * 0.10)            // 10%
```

### Individual Scoring Factors

#### 1. **Account Age** (15% weight)

-   2+ years → 100 points (excellent)
-   1+ year → 85 points (very good)
-   6+ months → 70 points (good)
-   3+ months → 50 points (fair)
-   1+ month → 30 points (poor)
-   < 1 month → 10 points (very poor)

#### 2. **Transaction History** (25% weight)

-   Counts total transactions
-   Calculates success rate
-   Penalizes failed transactions (5 points per failure, max -30)
-   Volume score: 50+ txns (40pts), 30+ (30pts), 15+ (20pts), 5+ (10pts)

#### 3. **Transaction Frequency** (15% weight)

-   Analyzes last 30 days of transactions
-   3+ per week → 100 (excellent consistency)
-   2+ per week → 80 (very good)
-   1+ per week → 60 (good)
-   2+ per month → 40 (fair)
-   1+ per month → 20 (poor)
-   None → 0

#### 4. **Spending Behavior** (15% weight)

-   Evaluates total spend & consistency
-   Rewards diverse transaction amounts
-   Detects anomalies (suspicious spikes)

#### 5. **Payment Reliability** (20% weight)

-   Success rate of transactions
-   Avg days between transactions
-   Completed borrowings & repayments

#### 6. **Card Linking** (10% weight)

-   Has active card linked? → boosts score
-   Card is security requirement for borrowing

### Eligibility Determination

**Eligibility is DENIED if:**

1. ❌ No active payment card linked (`user_cards.is_active = 1`)
2. ❌ Account age < 7 days
3. ❌ Zero successful transactions
4. ❌ Credit score too low for service tier

**Eligibility is GRANTED if:**

1. ✅ Active payment card exists
2. ✅ Account age ≥ 7 days
3. ✅ Has transaction history
4. ✅ Credit score meets minimum for service
5. ✅ Available credit > 0

---

## 🔄 Borrowing Flow

### Step 1: User Initiates Borrow Request

**Route:** `POST /borrow/{service}` (airtime, data, cable, electricity)

**Controller:** `BorrowingAirtimeController@borrow`

**Request Data:**

```json
{
    "network_id": 1, // which network
    "phone_number": "08123456789",
    "amount": 500, // request amount
    "pin": "1234" // transaction PIN
}
```

### Step 2: Eligibility Check

**Service:** `BorrowingEligibilityService::checkEligibility()`

**Validates:**

1. User has active linked card
2. User credit score & eligibility status
3. Available credit >= requested amount
4. Borrowing is enabled for service type
5. Amount within min/max limits

**Returns:**

```php
BorrowingEligibility {
  eligibility_status: 'eligible' | 'ineligible',
  credit_limit: 50000,
  available_credit: 25000,
  credit_score: 75,
  rejection_reason: null | "reason if denied"
}
```

### Step 3: Create Borrowing Record

**If eligible**, creates `Borrowing` record:

```php
Borrowing::create([
  'user_id' => $user->id,
  'reference' => 'BOR' . random(10),
  'type' => 'airtime',
  'amount' => 500,
  'interest_rate' => 5.0,      // calculated from settings
  'total_amount' => 525,        // amount + interest
  'due_date' => now()->addDays(7),
  'status' => 'active',
  'auto_deduction_enabled' => true,
  'service_details' => {        // JSON
    'phone': '08123456789',
    'network': 'MTN'
  }
]);
```

### Step 4: Execute Transaction

**Service:** Service-specific handler (HusmodataService, VtPassService, etc.)

Charges the service provider for airtime/data/cable/electricity

### Step 5: Handle Repayment

**Mechanism:** Automatic deduction from linked payment card

**Schedule:** On `due_date`, system attempts auto-deduction

-   Succeeds → `status = 'paid'`, mark `repaid_at`
-   Fails → `status = 'active'` (retry later)
-   Overdue → `status = 'overdue'` (after due_date passes)

---

## 🎯 Available Routes

### User Routes (Authenticated)

```php
// Borrowing Index Pages (show eligibility + form)
GET    /borrow/airtime           → BorrowingAirtimeController@index
GET    /borrow/data              → BorrowingDataController@index
GET    /borrow/cable             → (if exists)
GET    /borrow/electricity       → (if exists)

// Borrowing Process
POST   /borrow/airtime           → BorrowingAirtimeController@borrow
POST   /borrow/data              → BorrowingDataController@borrow
POST   /borrow/cable             → (if exists)
POST   /borrow/electricity       → (if exists)

// Success Page
GET    /borrow/airtime/success/{borrowing}  → success page

// My Borrowings
GET    /borrow/my-borrowings     → list active & past borrows
```

### Admin Routes

```php
// Credit Settings Management
GET    /admin/credit-eligibility-settings       → list
POST   /admin/credit-eligibility-settings       → create
GET    /admin/credit-eligibility-settings/{id}  → edit
PATCH  /admin/credit-eligibility-settings/{id}  → update
DELETE /admin/credit-eligibility-settings/{id}  → delete

// Borrowing Settings (per service)
GET    /admin/borrow-settings                   → list
POST   /admin/borrow-settings                   → create
PATCH  /admin/borrow-settings/{id}              → update
DELETE /admin/borrow-settings/{id}              → delete
```

---

## 🔑 Key Models & Relationships

### User Model

```php
$user->borrowingEligibility    // 1-to-1: current credit profile
$user->borrowings()            // 1-to-many: all borrows
$user->activeBorrowings()      // scope: only active borrows
$user->cards()                 // 1-to-many: payment cards
$user->transactions()          // 1-to-many: payment history
$user->wallet_balance          // decimal: current wallet
```

### Borrowing Model

```php
$borrowing->user               // belongs to user
$borrowing->repayments()       // 1-to-many: repayment records
$borrowing->isOverdue()        // check if past due_date
$borrowing->markAsPaid()       // mark as repaid
$borrowing->calculateInterest() // compute total_amount
```

### BorrowingEligibility Model

```php
$eligibility->user             // belongs to user
$eligibility->isEligible()     // check status & available_credit
$eligibility->canBorrow($amt)  // check if $amt <= available_credit
```

---

## 🛠️ Services Architecture

### 1. **BorrowingEligibilityService**

**Responsibility:** Calculate & manage user credit eligibility

**Key Methods:**

```php
checkEligibility(User $user, ?string $serviceType)
  → Calculates credit score & determines eligibility
  → Updates BorrowingEligibility record

recalculate(User $user)
  → Force recalculation (useful after card linking)

isEligible(User $user): bool
  → Quick check without database update

getEligibilityInfo(User $user): array
  → Formatted response for API
```

### 2. **BorrowingService**

**Responsibility:** Orchestrate borrowing process

**Key Methods:**

```php
borrowAirtime(User $user, $phone, $amount, $network)
borrowData(User $user, $phone, $planId, $amount)
borrowCable(User $user, $smartcard, $planId, $amount)
borrowElectricity(User $user, $meter, $amount, $provider)

processBorrowing($user, $type, $amount, $details)
  → Core logic: eligibility → create → execute → repayment setup
```

### 3. **AdvancedCreditScoringService**

**Responsibility:** Calculate credit score

**Key Methods:**

```php
calculateCreditScore(User $user): int
  → Weighted calculation (0-100)

determineEligibility(User $user, $creditScore, ?$serviceType)
  → Returns status & rejection reason

calculateCreditLimit(User $user, $creditScore, ?$serviceType)
  → Uses CreditEligibilitySetting to determine limit

scoreAccountAge(User $user): int
scoreTransactionHistory(User $user): int
scoreTransactionFrequency(User $user): int
scoreSpendingBehavior(User $user): int
scorePaymentReliability(User $user): int
scoreCardLinking(User $user): int
```

---

## 🎨 Frontend (React/Inertia)

### Pages

#### **BorrowingAirtimeController Index Page**

```jsx
/borrow/airtime
├─ Display Networks available
├─ Show User Eligibility
│  ├─ Credit Score
│  ├─ Credit Limit
│  ├─ Available Credit
│  └─ Rejection Reason (if denied)
├─ Form: Select Network → Amount → Phone → PIN
├─ Validation (amount within limits)
└─ Submit → POST /borrow/airtime

Rejection Actions (if ineligible):
├─ "Link a Card" → /profile (if no card)
├─ "Wait X days" → show countdown (if new account)
└─ "Build history" → show transaction tips
```

#### **Success Page**

```jsx
/borrow/airtime/success/{borrowing_id}
├─ Confirmation details
│  ├─ Amount borrowed
│  ├─ Interest rate & total
│  ├─ Due date
│  └─ Repayment method (auto-deduction)
└─ Next steps & FAQs
```

#### **My Borrowings Page**

```jsx
/borrow/my-borrowings
├─ Active Borrowings (status = active, overdue)
│  └─ Show: amount, due_date, days_remaining, status
├─ Completed Borrowings (status = paid)
│  └─ Show: amount, repaid_date
└─ Statistics
   ├─ Total borrowed
   ├─ Total repaid
   └─ Default rate
```

---

## 💰 Interest & Fees

**Calculated by:** `BorrowSetting` per service type

```php
BorrowSetting {
  service_type: 'airtime' | 'data' | 'cable' | 'electricity',
  min_amount: 100,
  max_amount: 50000,
  interest_rate: 5.0,          // % added to borrowed amount
  due_days: 7,                 // days before due
  is_active: true
}
```

**Example:**

-   Borrow: ₦500
-   Interest rate: 5%
-   Interest: ₦500 × 5% = ₦25
-   **Total to repay: ₦525**
-   Due in: 7 days

---

## 🔒 Security Features

1. **Card Requirement** ✅

    - User MUST have active linked card
    - Card is used for auto-repayment
    - Prevents bad-debt scenarios

2. **PIN Verification** ✅

    - Every borrow requires valid PIN
    - Middleware: `VerifyPin`

3. **Credit Limits** ✅

    - Per-service borrow limits (min/max)
    - Per-user credit limit (based on score)
    - Cannot borrow > available_credit

4. **Transaction History** ✅

    - Only successful transactions count
    - Failed transactions penalize score
    - Creates trust profile

5. **Account Age** ✅
    - New accounts (< 7 days) cannot borrow
    - Prevents fraud & chargebacks

---

## 📈 Monitoring & Repayment

### Auto-Repayment Scheduler

-   **When:** On `due_date` at scheduled time
-   **How:** Charges linked card
-   **Retry:** Auto-retry if failed
-   **Max Retries:** Configurable (default: 3)

### Status Tracking

```
active → (repayment attempt) → paid  ✅
      ↓ (retry failed)
      → overdue (past due_date)
      ↓ (still not paid after X days)
      → default (written off)
```

### Overdue Management

-   **Alert:** Notify user
-   **Penalty:** May reduce credit score
-   **Recovery:** Retry deductions periodically
-   **Default:** Mark as loss after X days

---

## 🐛 Common Issues & Fixes

### Issue: `SQLSTATE[42S22]: Column not found: 1054 Unknown column 'status'`

**Location:** `BorrowingAirtimeController.php` line 42

**Root Cause:** Querying `airtime_discounts.status` which doesn't exist

**Table Schema:**

```sql
CREATE TABLE airtime_discounts (
  id bigint PRIMARY KEY,
  network_id bigint,
  discount_percentage decimal(5,2),
  min_amount decimal(10,2),
  max_amount decimal(10,2),
  is_active boolean DEFAULT true,    -- ← USE THIS, NOT status
  timestamps
);
```

**Fix:** ✅ Change `where('status', true)` → `where('is_active', true)`

---

## 📝 Configuration Files

### Database Seeders

```php
database/seeders/CreditEligibilitySettingSeeder.php
  → Seeds default credit tiers per service

database/seeders/BorrowSettingSeeder.php
  → Seeds min/max amounts, interest rates, due days
```

### Migrations

```php
database/migrations/
├─ create_borrowing_eligibilities_table.php
├─ create_borrowings_table.php
├─ create_borrowing_repayments_table.php
├─ create_borrow_settings_table.php
└─ create_credit_eligibility_settings_table.php
```

---

## 🔄 Data Flow Example: User Borrows ₦500 Airtime

```
1. User visits /borrow/airtime
   ↓ Controller fetches:
     - Networks (with active discounts)
     - User eligibility (credit score, available_credit)
     - Borrow settings (min/max)

2. User selects MTN, ₦500, enters PIN, clicks Borrow
   ↓ POST /borrow/airtime

3. BorrowingService::borrowAirtime() validates:
   ✓ Card is active
   ✓ Eligibility.available_credit >= 500
   ✓ 500 within BorrowSetting.min/max
   ✓ Interest rate = 5%
   ✓ Total to repay = 525
   ✓ Due date = now() + 7 days

4. Creates Borrowing record:
   {
     user_id: 2,
     type: 'airtime',
     amount: 500,
     interest_rate: 5,
     total_amount: 525,
     status: 'active',
     due_date: '2025-12-13',
     service_details: { phone: '08123456789', network: 'MTN' }
   }

5. Executes with HusmodataService:
   - Charges MTN ₦500 for airtime
   - Sends airtime to phone
   - Gets transaction ref

6. Stores transaction_details in borrowing.transaction_details

7. Updates BorrowingEligibility:
   available_credit = 25000 - 500 = 24500

8. Schedules auto-repayment:
   - On 2025-12-13, attempt to deduct ₦525 from linked card
   - Mark as 'paid' if successful

9. Redirects to /borrow/airtime/success/{borrowing_id}
   Shows confirmation & repayment details

10. User receives airtime on their phone
    (Service delivered immediately, repayment scheduled for later)
```

---

## 📊 Entity Relationship Diagram

```
┌─────────────────────┐
│   Users             │
│ (id, name, email)   │
└──────────┬──────────┘
           │ 1
           │──────────────────┐
           │                  │
           │ 1                │ 1
    ┌──────▼──────────┐  ┌────▼──────────────────┐
    │ Transactions    │  │ BorrowingEligibility  │
    │ (user_id...)    │  │ (user_id, score...)   │
    └─────────────────┘  └────────────────────────┘
           │
           │ N
    ┌──────▼──────────────┐
    │ UserCards           │
    │ (user_id, is_active)│
    └─────────────────────┘
           │
           │ 1
           │──────────────────┐
           │                  │
           │ 1                │ N
    ┌──────▼──────────────┐  ┌────▼──────────────┐
    │ Borrowings          │  │ BorrowingRepay.   │
    │ (user_id, amount...)│  │ (borrowing_id...) │
    └─────────────────────┘  └───────────────────┘


┌──────────────────────────────┐
│ BorrowSettings               │
│ (service_type, min, max...)  │
└──────────────────────────────┘

┌──────────────────────────────────────┐
│ CreditEligibilitySettings            │
│ (service_type, min_score,           │
│  credit_limit_90plus, credit_limit..)│
└──────────────────────────────────────┘
```

---

## ✅ Testing Checklist

-   [ ] User with no card cannot borrow
-   [ ] New account (< 7 days) cannot borrow
-   [ ] User with low credit score gets rejection reason
-   [ ] Borrow amount < min fails
-   [ ] Borrow amount > max fails
-   [ ] Borrow amount > available_credit fails
-   [ ] Successful borrow creates record with correct dates
-   [ ] Available credit decreases after borrow
-   [ ] Auto-repayment scheduled correctly
-   [ ] Overdue status set after due_date passes
-   [ ] Admin can adjust credit tiers & borrow settings
-   [ ] Multiple borrows tracked separately

---

Generated: 2025-12-06
