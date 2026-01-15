# VTU Borrowing System - Complete Overview

## System Architecture

The borrowing system allows users to borrow airtime, data, electricity, or cable services with an **interest-based repayment model**. The system includes eligibility checks, credit scoring, and automatic repayment via user cards.

---

## Database Models & Tables

### 1. **BorrowingEligibility** (`borrowing_eligibility` table)
Stores user's credit information and borrowing limits.

| Field | Type | Description |
|-------|------|-------------|
| `id` | PK | Primary key |
| `user_id` | FK | Reference to user |
| `eligibility_status` | string | `pending`, `eligible`, `not_eligible` |
| `credit_limit` | decimal | Max amount user can borrow |
| `available_credit` | decimal | Current available credit (decreases when borrowing) |
| `credit_score` | int | Score 0-100 based on user history |
| `eligibility_criteria` | JSON | Stores calculation metadata |
| `rejection_reason` | text | Why user was rejected (if applicable) |
| `last_eligibility_check` | timestamp | When eligibility was last recalculated |

**Key Methods:**
- `isEligible()` — Returns true if eligible and has available credit
- `canBorrow($amount)` — Checks if available credit >= amount

**Credit Limit Tiers:**
- Credit Score ≥ 80: ₦10,000
- Credit Score ≥ 60: ₦5,000
- Credit Score ≥ 50: ₦2,000
- Below 50: ₦0 (not eligible)

---

### 2. **Borrowing** (`borrowings` table)
Main borrowing record for each transaction.

| Field | Type | Description |
|-------|------|-------------|
| `id` | PK | Primary key |
| `user_id` | FK | Reference to user |
| `reference` | string | Unique ID: `BOR` + 10 random chars |
| `type` | string | `airtime`, `data`, `electricity`, `cable` |
| `amount` | decimal | Amount borrowed |
| `interest_rate` | decimal | Interest % (typically 5%, lower for high credit score) |
| `total_amount` | decimal | `amount + interest` |
| `service_details` | string/JSON | Details: phone, meter, smartcard, etc |
| `transaction_details` | JSON | Original transaction metadata |
| `due_date` | date | Repayment deadline (typically 30 days) |
| `status` | string | `active`, `paid`, `overdue`, `failed` |
| `auto_deduction_enabled` | boolean | Auto-deduct from default card on due date |
| `retry_count` | int | Failed payment retry count |
| `last_retry_at` | timestamp | Last repayment attempt |
| `repaid_at` | timestamp | When marked as paid |
| `payment_note` | text | Notes on payment attempts |

**Key Methods:**
- `isOverdue()` — Checks if active + due_date < now()
- `markAsPaid()` — Sets status to `paid` and `repaid_at`
- `calculateInterest()` — Computes `total_amount = amount + (amount * interest_rate / 100)`

---

### 3. **BorrowingRepayment** (`borrowing_repayments` table)
Tracks individual repayment attempts for a borrowing.

| Field | Type | Description |
|-------|------|-------------|
| `id` | PK | Primary key |
| `borrowing_id` | FK | Reference to borrowing |
| `user_id` | FK | Reference to user |
| `reference` | string | Unique repayment reference |
| `amount` | decimal | Repayment amount |
| `payment_method` | string | `card`, `wallet`, `bank_transfer` |
| `status` | string | `pending`, `success`, `failed` |
| `payment_gateway_response` | string | Response from payment processor |
| `metadata` | JSON | Additional payment data |

---

### 4. **UserCard** (`user_cards` table)
Stores user's saved payment cards for auto-deduction.

| Field | Type | Description |
|-------|------|-------------|
| `id` | PK | Primary key |
| `user_id` | FK | Reference to user |
| `card_type` | string | `visa`, `mastercard`, `verve` |
| `last_four` | string | Last 4 digits |
| `authorization_code` | string | Authorization code from payment gateway |
| `email` | string | Email associated with card |
| `bank` | string | Card issuing bank |
| `bin` | string | Bank Identification Number |
| `card_token` | string | Unique token for card (unique) |
| `is_default` | boolean | Default payment method |
| `is_active` | boolean | Card is active/valid |
| `metadata` | JSON | Additional card data |

---

## User Model Relationships

```php
// Borrowing eligibility (one-to-one)
user->borrowingEligibility()

// All borrowings (one-to-many)
user->borrowings()

// Active borrowings (scope)
user->activeBorrowings()  // where status = 'active'

// Overdue borrowings (scope)
user->overdueBorrowings()  // where status = 'overdue'

// Saved payment cards (one-to-many)
user->cards()
```

---

## Credit Score Calculation

**Credit Score** is calculated out of 100 based on:

| Factor | Points | Criteria |
|--------|--------|----------|
| **Account Age** | 30 max | ≥180 days: 30pts, ≥90 days: 20pts, ≥30 days: 10pts |
| **Transaction History** | 40 max | ≥50 txns: 40pts, ≥20: 30pts, ≥10: 20pts, ≥5: 10pts |
| **Total Spent** | 20 max | ≥₦50,000: 20pts, ≥₦20,000: 15pts, ≥₦5,000: 10pts, ≥₦1,000: 5pts |
| **Has Saved Card** | 10 max | Card exists: 10pts |

**Total Score Range:** 0-100 → determines credit limit

---

## Interest Rate Calculation

- **Base Rate:** 5%
- **Good Credit (≥80 score):** 3% (reduced by 2%)
- **Standard Credit (<80 score):** 5%

**Example:**
```
Borrowed: ₦1,000
Interest Rate: 5%
Interest: ₦1,000 × 0.05 = ₦50
Total Due: ₦1,050
Due Date: 30 days from now
```

---

## Service Flows

### **1. Borrowing Airtime**

**Controller:** `BorrowingAirtimeController::borrow()`

**Steps:**
1. Validate inputs: network, phone number, amount, PIN
2. Verify PIN with user's hashed PIN
3. Check borrowing eligibility via `BorrowingEligibilityService`
4. Call `BorrowingService::borrowAirtime()`
5. Create `Borrowing` record with calculated interest
6. Deduct from user's `available_credit`
7. Create `Transaction` record for record-keeping
8. Optionally save phone as beneficiary
9. Redirect to success page

**Request Validation:**
```php
'network_id' => 'required|exists:networks,id',
'phone_number' => 'required|regex:/^[0-9]{11}$/',
'amount' => 'required|numeric|min:50|max:10000',
'airtime_type' => 'required|in:VTU,AWOOF,SHARE,SELL',
'pin' => 'required|size:4',
```

---

### **2. Borrowing Data**

**Controller:** `BorrowingDataController::borrow()`

**Steps:** Similar to airtime but uses `DataPlan` model
- Validates data plan exists
- Borrows using data plan's `selling_price`
- Amount is from selected plan, not custom

**Request Validation:**
```php
'network_id' => 'required|exists:networks,id',
'data_plan_id' => 'required|exists:data_plans,id',
'phone_number' => 'required|regex:/^[0-9]{11}$/',
'pin' => 'required|size:4',
```

---

### **3. Borrowing Electricity**

**Controller:** `BorrowingElectricityController::borrow()`

**Steps:**
1. Verify meter number using `VtpassService::verifyCustomer()`
2. Get customer details from VTPass API
3. Validate custom amount range (₦500-₦20,000)
4. Create borrowing record
5. Optionally save meter as beneficiary
6. Redirect to success page

**Meter Verification First:**
```php
// POST /electricity/verify
// Response includes customer_name, address
$verified = $vtpassService->verifyCustomer(
    $provider->code,
    $meter_number,
    'meter'
);
```

---

### **4. Repayment Process**

**Controller:** `BorrowingController::repay()`

**Steps:**
1. User selects active borrowing
2. User pays either manually or auto-deduction processes
3. `BorrowingService::processRepayment()` called
4. Delegates to `PaymentService::processBorrowingRepayment()`
5. Creates `BorrowingRepayment` record
6. On successful payment:
   - `Borrowing` status set to `paid`
   - `repaid_at` timestamp set
   - Recalculate user eligibility (available_credit increases)
7. On failed payment:
   - `retry_count` incremented
   - `last_retry_at` updated
   - User notified

---

### **5. Eligibility Check & Recalculation**

**Service:** `BorrowingEligibilityService::checkEligibility()`

**Called When:**
- User first visits borrowing page
- Repayment completes
- Admin manually triggers

**Process:**
1. Calculate criteria: successful transactions, total spent, account age, wallet balance, has card
2. Calculate credit score (0-100) based on criteria
3. Determine credit limit based on score
4. Set `available_credit = credit_limit` (or update if existing)
5. Return `BorrowingEligibility` record

**Response:** Used in Inertia props to show user's eligibility status

---

## React Components

### **BorrowingCard.jsx**
Reusable component to display a single borrowing record.

**Props:**
- `borrowing` — Borrowing object
- `onRepay` — Callback for repay action
- `onDisableAutoDeduction` — Callback to disable auto-deduction
- `disabled` — Disable buttons while processing

**Features:**
- Shows borrowing type with emoji icon
- Displays status badge (Active, Overdue, Paid, Failed)
- Shows amount, total due, due date, interest rate
- "Pay Now", "Disable Auto-Deduction", and "View Details" buttons
- Red color for overdue dates

---

### **MyBorrowings.jsx**
Main page for user to view and manage all borrowings.

**Features:**
- Tabs for filtering: Active, Overdue, Paid
- Summary cards: Available Credit, Total Borrowed, Total Repaid, etc.
- Paginated list of borrowings (20 per page)
- Fetch summary stats on mount
- Handle repay and disable auto-deduction actions
- Real-time status updates on repayment

---

## Routes

### **Web Routes (Inertia)**
```
GET /borrow/airtime                              → BorrowingAirtimeController@index
POST /borrow/airtime                             → BorrowingAirtimeController@borrow
GET /borrow/airtime/success/{borrowing}          → (success page)

GET /borrow/data                                 → BorrowingDataController@index
POST /borrow/data                                → BorrowingDataController@borrow
GET /borrow/data/success/{borrowing}             → (success page)

GET /borrow/electricity                          → BorrowingElectricityController@index
POST /borrow/electricity/verify                  → BorrowingElectricityController@verifyMeter
POST /borrow/electricity                         → BorrowingElectricityController@borrow
GET /borrow/electricity/success/{borrowing}      → (success page)

GET /my-borrowings                               → BorrowingController@myBorrowings
POST /{borrowing}/repay                          → BorrowingController@repay
POST /{borrowing}/disable-auto-deduction         → BorrowingController@disableAutoDeduction
```

### **API Routes (Sanctum)**
```
GET /api/borrowing/check-eligibility             → BorrowingController@checkEligibility
GET /api/borrowing/summary                       → BorrowingController@summary
GET /api/borrowing/my-borrowings                 → BorrowingController@myBorrowingsApi
POST /api/borrowing/{borrowing}/repay            → BorrowingController@repay
```

---

## Missing/Incomplete Components

### **Missing React Pages:**
The borrowing flow expects these pages but they may not exist yet:
- `resources/js/Pages/User/Borrow/Airtime.jsx`
- `resources/js/Pages/User/Borrow/Data.jsx`
- `resources/js/Pages/User/Borrow/Electricity.jsx`
- `resources/js/Pages/User/Borrow/Success.jsx` (success page after borrowing)

### **Incomplete Service Logic:**
`BorrowingService::processServiceDelivery()` has empty switch cases — needs to integrate with:
- Airtime purchase service
- Data purchase service
- Cable subscription service
- Electricity payment service

### **Auto-Deduction Job:**
No scheduled job found for auto-deducing from user cards on due date. Needs:
- Laravel scheduled job in `Console/Kernel.php`
- Logic to process overdue borrowings
- Retry logic for failed payments

---

## Data Flow Diagram

```
User Selects Borrow Service
           ↓
Eligibility Check (BorrowingEligibilityService)
           ↓
Display Available Credit & Borrowing Options
           ↓
User Submits Request (Phone, Amount, PIN)
           ↓
PIN Verification
           ↓
Create Borrowing Record (with interest calculation)
           ↓
Deduct from Available Credit
           ↓
Create Transaction Record
           ↓
Process Service Delivery
           ↓
Show Success Page
           ↓
[Due Date Arrives]
           ↓
Auto-Deduction from Default Card (if enabled)
           ↓
Mark as Paid OR Retry/Failed
           ↓
Recalculate Eligibility
```

---

## Key Business Rules

1. **Credit Score Minimum:** Must be ≥50 to be eligible
2. **Interest Calculation:** Fixed rate (5% standard, 3% for good credit) applied once at borrowing creation
3. **Due Date:** Always 30 days from borrow date
4. **Auto-Deduction:** Enabled by default, can be disabled by user
5. **Retry Count:** Tracks failed repayment attempts
6. **Available Credit:** Resets when repayment completed (increases available limit)
7. **Overdue Status:** Automatically determined when `now() > due_date` and status is active
8. **Beneficiary Saving:** Optional during borrowing, for quick future transactions

---

## Next Steps for Development

1. **Create missing React pages** for borrowing interfaces
2. **Implement auto-deduction job** for scheduled repayments
3. **Complete service delivery** in `processServiceDelivery()`
4. **Add success pages** with borrowing confirmation details
5. **Implement notification system** for repayment reminders
6. **Add payment receipt generation** after repayment
7. **Implement credit score recalculation** after each transaction
