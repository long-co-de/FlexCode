# Feature Implementation Visual Guide

## Overall Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BorrowLite Platform                      │
└─────────────────────────────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
    ┌─────────┐        ┌─────────┐        ┌─────────┐
    │  Users  │        │  Admin  │        │Database │
    └─────────┘        └─────────┘        └─────────┘
         │                   │                   │
    ┌────┴────┬──────────┬───┼────┬──────────┬──┴────┐
    │          │          │   │    │          │       │
    ▼          ▼          ▼   ▼    ▼          ▼       ▼
 Feedback  Payment      Referral Card      Borrowing Feedback
 Submit    Retrieval    Earnings Repayment Settlement Table
```

## User Features Flow

### 1. Feedback System
```
Dashboard
   │
   └─→ "Give Feedback" Button (Purple Card)
        │
        └─→ FeedbackModal Opens
             │
             ├─→ Category Selection
             ├─→ Title Input (max 255)
             ├─→ Message Input (max 5000)
             ├─→ Star Rating (1-5)
             └─→ Feature Request Checkbox
                  │
                  └─→ Form Submit
                       │
                       ├─→ Validation
                       ├─→ POST /feedback
                       └─→ Success Message
                            │
                            └─→ Modal Closes
                                 │
                                 └─→ User can view history
                                     (GET /feedback)
```

### 2. Payment Retrieval System
```
Dashboard
   │
   └─→ "Retrieve Payment" Button (Cyan Card)
        │
        └─→ Navigates to /payment-retrieval
             │
             └─→ Reference Input Form
                  │
                  ├─→ User enters Paystack reference
                  ├─→ User clicks "Retrieve Payment"
                  │
                  └─→ Verification Flow:
                      │
                      ├─→ Format validation
                      ├─→ Duplicate check
                      ├─→ Paystack verification
                      ├─→ Status check (success)
                      ├─→ Email matching
                      │
                      ├─→ If Valid:
                      │   ├─→ Create Transaction
                      │   ├─→ Credit Wallet
                      │   ├─→ Settle Debts
                      │   └─→ Show Success
                      │
                      └─→ If Invalid:
                          └─→ Show Error Message
```

## Admin Features Flow

### Feedback Management Console
```
Admin Dashboard
   │
   └─→ /admin/feedback (Feedback List)
        │
        ├─→ Search Box (Real-time)
        │
        ├─→ Filters Panel (Toggleable)
        │   ├─→ Category Filter
        │   ├─→ Status Filter
        │   ├─→ Rating Filter
        │   ├─→ Type Filter
        │   └─→ Sort Options
        │
        ├─→ Stats Cards
        │   ├─→ Total Count
        │   ├─→ Status Breakdown
        │   └─→ Avg Rating
        │
        └─→ Feedback List (Paginated)
             │
             ├─→ Each Row Shows:
             │   ├─→ Title
             │   ├─→ User Name/Email
             │   ├─→ Category Badge
             │   ├─→ Status Badge
             │   ├─→ Rating
             │   └─→ "View" Button
             │
             └─→ Click "View" Button
                  │
                  └─→ /admin/feedback/{id} (Detail Page)
                       │
                       ├─→ Full Message Content
                       ├─→ User Information
                       ├─→ Status Controls
                       │
                       ├─→ Response Section:
                       │   ├─→ Existing Response (if any)
                       │   ├─→ Response Form
                       │   ├─→ Character Counter
                       │   └─→ Save Button
                       │
                       └─→ Stats Button
                            │
                            └─→ /admin/feedback/statistics
                                 │
                                 ├─→ Key Metrics Cards
                                 ├─→ Status Breakdown Chart
                                 ├─→ Category Breakdown Chart
                                 ├─→ Rating Distribution Chart
                                 └─→ Insights Section
```

## Data Flow Diagrams

### Referral Email Notification
```
User A Registers
   │
   └─→ Uses Referral Code
        │
        └─→ User B (Referrer) Follows
             │
             └─→ User A Makes Wallet Deposit
                  │
                  └─→ ReferralService Triggered
                       │
                       ├─→ Calculate Commission (4%)
                       ├─→ Create Transaction
                       │
                       └─→ Send Email
                            ├─→ ReferralBonusEarned Notification
                            ├─→ Queue System (Async)
                            └─→ Mail Delivery
```

### Card-First Repayment
```
User Clicks "Repay Now"
   │
   └─→ BorrowingController@repayAll
        │
        └─→ repayAllFromCard() Called
             │
             ├─→ Fetch Active/Overdue Borrowings
             ├─→ Calculate Total Amount
             ├─→ Get User's Default Card
             │
             ├─→ Try PaymentService.chargeAuthorization()
             │
             ├─→ If SUCCESS:
             │   ├─→ Mark All Borrowings as Paid
             │   ├─→ Set payment_method = 'card'
             │   └─→ Return Success
             │
             └─→ If FAIL:
                 ├─→ Call repayFromWallet()
                 ├─→ Use Wallet Balance
                 └─→ Return Success (Silent Fallback)
```

### Payment Retrieval & Verification
```
User Submits Reference
   │
   └─→ PaymentRetrievalController@retrieve
        │
        ├─→ Validate Reference Format
        │   └─→ Check for Pattern Match
        │
        ├─→ Check Duplicate Transaction
        │   └─→ Query Transaction Table
        │
        ├─→ PaystackService.verifyTransaction(ref)
        │   └─→ Call Paystack API
        │
        ├─→ Validate Payment Status = 'success'
        │   └─→ Check Paystack Response
        │
        ├─→ Validate Email Match
        │   └─→ User.email === Paystack.customer.email
        │
        ├─→ All Valid?
        │   │
        │   ├─→ YES:
        │   │   ├─→ Create Transaction Record
        │   │   ├─→ Increment Wallet Balance
        │   │   ├─→ Call settleDebts()
        │   │   ├─→ Send Notification
        │   │   └─→ Return Success + New Balance
        │   │
        │   └─→ NO:
        │       └─→ Return Error Message
        │           ├─→ Invalid Format
        │           ├─→ Duplicate Transaction
        │           ├─→ Not Successful
        │           └─→ Email Mismatch
```

### Feedback Submission & Response
```
User Submits Feedback
   │
   └─→ FeedbackController@store
        │
        ├─→ Validate Input
        ├─→ Create Feedback Record
        └─→ Return Success
             │
             └─→ Admin Notified (Optional)
                  │
                  └─→ Admin Goes to /admin/feedback
                       │
                       └─→ Reviews Feedback
                            │
                            ├─→ Updates Status
                            │   (Open → In Progress)
                            │
                            └─→ Writes Response
                                 │
                                 ├─→ POST /feedback/{id}/respond
                                 ├─→ Saves Response Text
                                 ├─→ Sets responded_at Timestamp
                                 └─→ Updates Status to 'Resolved'
                                      │
                                      └─→ User May Be Notified (Future)
```

## Component Hierarchy

### Dashboard Components
```
Dashboard
├─ Balance Card
├─ Stats Cards
├─ Services Grid
├─ Borrowing Card
├─ Referral Card
├─ New: Feedback Widget (Purple)
│  └─ FeedbackModal
│     ├─ Category Select
│     ├─ Title Input
│     ├─ Message Textarea
│     ├─ Star Rating
│     └─ Feature Checkbox
├─ New: Payment Retrieval Widget (Cyan)
└─ Recent Transactions
```

### Admin Components
```
AdminLayout
└─ FeedbackIndex (List Page)
   ├─ Header with Stats
   ├─ Search Box
   ├─ Filter Panel
   ├─ Feedback Table
   │  ├─ Title Column
   │  ├─ User Column
   │  ├─ Category Column
   │  ├─ Status Column
   │  ├─ Rating Column
   │  ├─ Date Column
   │  └─ Action Column
   └─ Pagination

FeedbackShow (Detail Page)
├─ Header with Badges
├─ User Info Card
├─ Message Section
├─ Response Section
│  ├─ Response Form
│  ├─ Status Selector
│  └─ Save Button
└─ Sidebar
   ├─ Status Controls
   ├─ Details Card
   └─ Actions Card

FeedbackStatistics (Analytics)
├─ Key Metrics Cards
├─ By Status Chart
├─ By Category Chart
├─ By Rating Chart
├─ Key Metrics Grid
└─ Insights Section
```

## State Management

### FeedbackModal
```
State:
├─ formData (category, title, message, rating, feature_request)
├─ loading (boolean)
├─ error (string)
└─ success (boolean)

Actions:
├─ handleChange() - Update form fields
├─ handleRating() - Set star rating
├─ handleSubmit() - POST feedback
└─ resetForm() - Clear all fields
```

### PaymentRetrieval
```
State:
├─ reference (string)
├─ loading (boolean)
├─ result (object or null)
└─ error (string)

Actions:
├─ handleChange() - Update reference input
└─ handleSubmit() - POST verification
```

### FeedbackIndex
```
State:
├─ filters (category, status, rating, search, etc.)
└─ showFilters (boolean)

Actions:
├─ handleFilterChange() - Update filters
└─ handleSearch() - Real-time search

Server State:
├─ feedback (paginated results)
├─ stats (aggregated data)
└─ filters (current filter values)
```

### FeedbackShow
```
State:
├─ status (current status)
├─ adminResponse (textarea content)
├─ isSubmitting (boolean)
└─ showResponse (boolean - show form)

Actions:
├─ handleStatusUpdate() - PATCH status
└─ handleSubmitResponse() - POST response
```

## Integration Points

### Services Integration
```
ReferralService
├─ Creates Commission ✓
├─ Sends Email Notification ✓ (NEW)
└─ Tracks Commission

BorrowingService
├─ repayFromWallet() (existing)
├─ repayAllFromCard() ✓ (NEW)
└─ settleDebts()

PaymentService
├─ chargeAuthorization() - Used by Card Repayment
└─ chargeCard()

PaystackService
├─ verifyTransaction() - Used by Payment Retrieval
└─ Paystack API Integration
```

### Notification Integration
```
NotificationService
├─ ReferralBonusEarned (Email) ✓
├─ PaymentRetrievalSuccess (System) ✓ (NEW)
└─ FeedbackAdminResponse (Email) ✓ (Future)
```

## API Response Timeline

### Feedback Submission
```
Request → Server (100ms)
  ├─ Validation (10ms)
  ├─ Create Record (20ms)
  └─ Response (5ms)
Receives Response with Success (135ms)
```

### Payment Verification
```
Request → Server (100ms)
  ├─ Validation (10ms)
  ├─ Call Paystack API (1-2s)
  ├─ Database Check (10ms)
  ├─ Create Transaction (20ms)
  └─ Response (5ms)
Receives Response (1200-2300ms depending on Paystack)
```

### Feedback List with Filters
```
Request → Server (100ms)
  ├─ Query Building (5ms)
  ├─ Database Query (50ms)
  ├─ Aggregation for Stats (20ms)
  └─ Response (5ms)
Receives Response (180ms)
```

---

This visual guide provides a complete overview of how all features interact and integrate within the BorrowLite platform.
