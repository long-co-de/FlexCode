# System Architecture & Flow Diagrams

---

## 1. User Eligibility Check Flow

```
┌─────────────────────────────────────────────────────────────┐
│           USER ATTEMPTS TO BORROW                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────┐
        │ 1️⃣  Has Active Card?              │
        └──────────────┬───────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │ NO                          │ YES
        ▼                             ▼
    ❌ REJECT                    ┌─────────────────────────┐
   "Link a card"                 │ 2️⃣  Has Pending Borrow?  │
                                 └──────────┬──────────────┘
                                           │
                            ┌──────────────┴──────────────┐
                            │ YES                         │ NO
                            ▼                             ▼
                        ❌ REJECT                  ┌──────────────────────┐
                      "Repay first"                │ 3️⃣  In 7-Day Waiting?│
                                                   └──────────┬───────────┘
                                                             │
                                              ┌──────────────┴──────────────┐
                                              │ YES                         │ NO
                                              ▼                             ▼
                                          ❌ REJECT                  ┌──────────────┐
                                        "Wait X days"               │ ✅ ELIGIBLE  │
                                                                    └──────────────┘
```

---

## 2. Card Linking Process

```
┌────────────────────────────────────────┐
│ User Clicks "Link Card"                 │
└─────────────────┬──────────────────────┘
                  │
                  ▼
    ┌─────────────────────────────────────┐
    │ Opens Paystack Modal                │
    │ (User enters card details)          │
    └────────────────┬────────────────────┘
                     │
                     ▼
    ┌────────────────────────────────────┐
    │ Paystack Processes Payment (₦100)  │
    │ (Verification charge)              │
    └────────────────┬───────────────────┘
                     │
                     ▼
    ┌────────────────────────────────────┐
    │ Paystack Returns Authorization     │
    │ - authorization_code ✓             │
    │ - card_token (may be empty)        │
    │ - bin, last4, bank, type           │
    └────────────────┬───────────────────┘
                     │
                     ▼
    ┌────────────────────────────────────────────┐
    │ Backend: CardLinkingController            │
    │ 1. Check card not used by another user    │
    │    If used → ❌ REJECT                    │
    └────────────────┬─────────────────────────┘
                     │
                     ▼
    ┌────────────────────────────────────────────┐
    │ 2. Generate unique card_token if empty     │
    │    token = SHA256(user_id|auth_code|time) │
    └────────────────┬─────────────────────────┘
                     │
                     ▼
    ┌────────────────────────────────────────────┐
    │ 3. Create UserCard Record                  │
    │    - authorization_code (UNIQUE)           │
    │    - card_token (UNIQUE)                   │
    │    - card_linked_at = NOW ⭐              │
    │    - is_active = true                      │
    └────────────────┬─────────────────────────┘
                     │
                     ▼
    ┌────────────────────────────────────────────┐
    │ 4. Credit ₦50 bonus (first card only)     │
    │ 5. Recalculate credit score (now 60)      │
    └────────────────┬─────────────────────────┘
                     │
                     ▼
    ┌────────────────────────────────────────────┐
    │ ✅ Success Response                        │
    │ "Card linked! Wait 7 days to borrow"       │
    └────────────────────────────────────────────┘
```

---

## 3. Borrowing Request Flow

```
┌────────────────────────────────────┐
│ User Requests to Borrow            │
│ (e.g., Airtime ₦500)               │
└─────────────┬──────────────────────┘
              │
              ▼
    ┌──────────────────────────────────┐
    │ BorrowingController              │
    │ POST /api/borrow/airtime         │
    └──────────────┬───────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────┐
    │ Check Eligibility                │
    │ AdvancedCreditScoringService     │
    │ ::determineEligibility()         │
    └──────────────┬───────────────────┘
                   │
        ┌──────────┴────────────┐
        │ ELIGIBLE?             │ NOT ELIGIBLE?
        ▼                        ▼
    ┌─────────┐             ┌────────────────────┐
    │ Continue│             │ ❌ Return Error     │
    └────┬────┘             │ with reason:       │
         │                  │ - No card          │
         ▼                  │ - Pending borrow   │
    ┌────────────────────┐  │ - Waiting period   │
    │ Check Amount       │  │ - Low credit score │
    │ ≤ Available Credit │  └────────────────────┘
    └────┬───────────────┘
         │
    ┌────┴────┐
    │ YES     │ NO
    ▼         ▼
┌─────┐   ❌ REJECT
│     │   "Amount exceeds credit"
│ OK  │
└────┬┘
     │
     ▼
┌──────────────────────────┐
│ Create Borrowing Record  │
│ - status = 'active'      │
│ - due_date = now + 7 days│
│ - is_active = true       │
└────┬─────────────────────┘
     │
     ▼
┌──────────────────────────┐
│ Execute Service          │
│ (Purchase airtime)       │
└────┬─────────────────────┘
     │
┌────┴────┐
│ Success  │ Failed
▼          ▼
✅         ❌
Credit    Notify user
user      (retry auto-deduction)
Notify
```

---

## 4. Waiting Period Visualization

```
CARD LINKED
│
Day 0 ▶ Day 1 ▶ Day 2 ▶ Day 3 ▶ Day 4 ▶ Day 5 ▶ Day 6 ▶ Day 7 ▶ Day 8
  │
  └─ IN WAITING PERIOD (7 days) ────────────────────┐
                                                    │
                                              WAITING PERIOD ENDS
                                              User can borrow

User tries to borrow:
└─────────────────────────────┬────────────────────────────────────┬─
Day 0: "Wait 7 days"          Day 3: "Wait 4 days"               Day 7+: ✅ Can borrow
Day 1: "Wait 6 days"          Day 4: "Wait 3 days"
Day 2: "Wait 5 days"          Day 5: "Wait 2 days"
                               Day 6: "Wait 1 day"
```

---

## 5. Repayment & Credit Score Updates

```
┌────────────────────────────┐
│ Borrowing Created          │
│ - Amount: ₦500             │
│ - Due: 7 days from now     │
│ - Credit Score: 75         │
└────────────────┬───────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
    On Due Date        Auto-Deduction
    (Day 7)           from Card
                      │
        ┌─────────────┴──────────────┐
        │ SUCCESS                    │ FAILED
        ▼                            ▼
    ┌───────────────────┐      ┌─────────────┐
    │ Borrowing         │      │ Retry Later │
    │ status = 'paid'   │      │ (Up to 3x)  │
    │                   │      │             │
    │ Recalculate       │      └─────────────┘
    │ Credit Score:     │      If retries fail:
    │ 75 → 80 (+5 pts)  │      └─ status = 'overdue'
    │                   │      └─ User cannot borrow
    └─────────────┬─────┘      └─ Interest accrues
                  │
                  ▼
        ┌──────────────────┐
        │ ✅ User can      │
        │ borrow again     │
        │ immediately      │
        └──────────────────┘
```

---

## 6. Credit Score Calculation

```
┌──────────────────────────────────────────┐
│      CREDIT SCORE CALCULATION            │
│      (0-100 scale)                       │
└──────────────┬───────────────────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
    ▼                     ▼
┌─────────────────┐  ┌─────────────────┐
│ Account Age     │  │ Transaction     │
│ (10%)           │  │ History (30%)   │
│                 │  │                 │
│ <1mo:  0 pts    │  │ Count & Success │
│ 1-6mo: 30 pts   │  │ rate score      │
│ 6mo-1yr: 70 pts │  └─────────────────┘
│ 1-2yr: 85 pts   │
│ 2yr+: 100 pts   │  ┌─────────────────┐
└─────────────────┘  │ Payment         │
                     │ Reliability     │
                     │ (25%)           │
    ┌────────────────┤                 │
    │                │ Paid vs Failed  │
    ▼                │ Borrowings      │
┌─────────────────┐  └─────────────────┘
│ Spending        │
│ Behavior (15%)  │  ┌─────────────────┐
│                 │  │ Transaction     │
│ Total spent:    │  │ Frequency (15%) │
│ ₦10k+: points   │  │                 │
│ ₦100k+: more    │  │ Recent activity │
└─────────────────┘  └─────────────────┘
    │
    │                ┌─────────────────┐
    └────────────────►│ Card Linking    │
                     │ (5%)            │
                     │                 │
                     │ Has card: +pts  │
                     │ 3+ cards: +bonus│
                     └─────────────────┘
                            │
                            ▼
                     ┌─────────────┐
                     │ Total Score │
                     │ (0-100)     │
                     └─────────────┘
```

---

## 7. Error Prevention Flow

```
FRAUD PREVENTION MEASURES

Card Linking Request
    │
    ├─ Is authorization_code already used by another user?
    │  ├─ YES → ❌ REJECT ("Card already registered")
    │  └─ NO ↓
    │
    ├─ Is card_token empty?
    │  ├─ YES → Generate unique SHA256 hash
    │  └─ NO → Use provided token ↓
    │
    ├─ Does card_token already exist in DB?
    │  ├─ YES → ❌ REJECT (extremely rare)
    │  └─ NO → Continue ↓
    │
    └─ ✅ APPROVED - Create card with:
       - UNIQUE authorization_code
       - UNIQUE card_token
       - card_linked_at timestamp
```

---

## 8. Eligibility Check Order (Priority)

```
┌───────────────────────────────────────┐
│  ELIGIBILITY CHECK ORDER (PRIORITY)   │
└──────────────┬────────────────────────┘
               │
        ┌──────▼───────┐
        │ 1. Has Card? │
        └──────┬───────┘
               │
        ┌──────▼────────────────┐
        │ 2. Pending Borrow?    │  ← NEW REQUIREMENT
        │    (Active/Overdue)   │
        └──────┬────────────────┘
               │
        ┌──────▼────────────────┐
        │ 3. Waiting Period?    │  ← NEW REQUIREMENT
        │    (0-7 days)         │
        └──────┬────────────────┘
               │
        ┌──────▼──────────────┐
        │ 4. Credit Score OK? │
        │ 5. Account Age OK?  │
        │ 6. Amount OK?       │
        └──────┬───────────────┘
               │
        ┌──────▼────────┐
        │ ✅ ELIGIBLE   │
        │ or ❌ REJECT  │
        └───────────────┘
```

---

## 9. Database Relationships

```
┌──────────────┐           ┌───────────────┐
│    users     │──────┬───→│  user_cards   │
│              │      │    │               │
│ id (PK)      │      │    │ id (PK)       │
│ email        │      │    │ user_id (FK)  │
│ ...          │      │    │ card_token    │ ← UNIQUE
│              │      │    │ auth_code     │ ← UNIQUE
└──────────────┘      │    │ card_linked_at│ ← NEW
                      │    │ ...           │
                      │    └───────────────┘
                      │
                      │    ┌───────────────┐
                      └───→│  borrowings   │
                           │               │
                           │ id (PK)       │
                           │ user_id (FK)  │
                           │ status        │ ← Check: active/overdue?
                           │ due_date      │
                           │ ...           │
                           └───────────────┘
```

---

## 10. System Components

```
┌─────────────────────────────────────────────────────────┐
│                    CONTROLLERS                          │
├──────────────────┬──────────────────┬──────────────────┤
│ CardLinking      │ Borrowing        │ Other            │
│ Controller       │ Controller       │ Controllers      │
│                  │                  │                  │
│ - Link Card      │ - Create Borrow  │                  │
│ - Verify Card    │ - Check Elig.    │                  │
│                  │ - View Borrows   │                  │
└─────────┬────────┴─────────┬────────┴──────────────────┘
          │                  │
          ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│                    SERVICES                             │
├──────────────────┬──────────────────────────────────────┤
│ Paystack Service │ BorrowingEligibility Service         │
│                  │ AdvancedCreditScoring Service        │
│ - Process Cards  │ - Check Eligibility                  │
│ - Verify Trans.  │ - Calculate Credit Score             │
│                  │ - Determine Limits                   │
└─────────┬────────┴──────────────────┬───────────────────┘
          │                           │
          ▼                           ▼
┌─────────────────────────────────────────────────────────┐
│                     MODELS                              │
├────────────┬─────────────┬──────────────┬───────────────┤
│ User       │ UserCard    │ Borrowing    │ Transaction   │
│            │             │              │               │
│ - cards()  │ - is_*()    │ - status     │ - amount      │
│ - borrow() │ - linked_at │ - due_date   │ - reference   │
└────────────┴─────────────┴──────────────┴───────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│                   DATABASE                              │
└─────────────────────────────────────────────────────────┘
```

---

**Version**: 1.0  
**Last Updated**: January 5, 2026  
**Status**: Complete ✅
