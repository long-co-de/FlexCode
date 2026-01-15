# Referral System - Visual Guide & User Experience

## Dashboard View

```
┌─────────────────────────────────────────────────────────────┐
│  Dashboard                                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Balance Card - Main wallet display]                       │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 💰 Earn with Referrals                              │  │
│  │                                                      │  │
│  │ Share your code and earn 4% on every friend's       │  │
│  │ first deposit.                                       │  │
│  │                                                      │  │
│  │ Code: [ABC12345] [Copy Link]  [Manage Referrals]    │  │
│  │                                                      │  │
│  │ ┌─────────┬─────────┬─────────┐                      │  │
│  │ │ Referred│ Active  │Earnings │                      │  │
│  │ │   2     │   1     │ ₦2,500  │                      │  │
│  │ └─────────┴─────────┴─────────┘                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Referral Management Page Layout

```
HEADER
┌─────────────────────────────────────────────────────────────┐
│ ← Referral Program                                          │
│   Earn 4% on every friend's first deposit                  │
└─────────────────────────────────────────────────────────────┘

STATS SECTION
┌──────────┬──────────┬──────────┬──────────┐
│ Your Code│  Referred│  Active  │ Earnings │
│ ABC12345 │    5     │    3     │ ₦10,000  │
└──────────┴──────────┴──────────┴──────────┘

SHARE SECTION
┌─────────────────────────────────────────────────────────────┐
│ 📤 Share Your Referral Link                                │
│                                                             │
│ Link: [https://borrowlite.com/?ref=ABC123] [Copy Link]    │
│                                                             │
│ [📱 WhatsApp] [𝕏 Twitter] [✉️ Email]                       │
│                                                             │
│ 💡 You earn 4% on every friend's first deposit!           │
└─────────────────────────────────────────────────────────────┘

REFERRED USERS
┌─────────────────────────────────────────────────────────────┐
│ 👥 Your Referrals (5)                                       │
├─────────────────────────────────────────────────────────────┤
│ Name     │ Email         │ Status    │ Joined           │
├──────────┼───────────────┼───────────┼──────────────────┤
│ John D.  │ john@ex.com   │ ✓ Deposit │ Jan 15, 2026     │
│ Mary J.  │ mary@ex.com   │ ⏱ Pending │ Jan 14, 2026     │
│ Peter P. │ peter@ex.com  │ ✓ Deposit │ Jan 10, 2026     │
└─────────────────────────────────────────────────────────────┘

EARNINGS HISTORY
┌─────────────────────────────────────────────────────────────┐
│ 🪙 Referral Earnings History                                │
├─────────────────────────────────────────────────────────────┤
│ John D.        4% of ₦100,000  │ +₦4,000  │ Jan 15, 2026  │
│ Peter P.       4% of ₦50,000   │ +₦2,000  │ Jan 10, 2026  │
│ Sarah M.       4% of ₦75,000   │ +₦3,000  │ Jan 5, 2026   │
└─────────────────────────────────────────────────────────────┘
```

---

## User Actions & Flow

### Action 1: Copy Referral Code
```
User sees dashboard
    ↓
Hovers over referral card
    ↓
Clicks "Copy Link" button
    ↓
Link copied to clipboard
    ↓
Button shows "✓ Copied!" for 2 seconds
    ↓
User can now paste anywhere
```

### Action 2: View Detailed Referrals
```
User clicks "Manage Referrals" on dashboard
    ↓
Directed to /referral page
    ↓
Sees full referral statistics
    ↓
Can view all referred users
    ↓
Can view earnings history
    ↓
Can share via social media
```

### Action 3: Share via WhatsApp
```
User on referral page
    ↓
Clicks "Share on WhatsApp" button
    ↓
WhatsApp opens with message:
"I'm using BorrowLite and it's amazing! 🚀
Get instant airtime, data, and loans with 4% 
earnings on referrals. Join with my code: ABC12345"
    ↓
User selects contact and sends
    ↓
Friend receives message with code
```

### Action 4: Share via Twitter
```
User clicks "Share on Twitter" button
    ↓
Twitter opens with:
"Check out BorrowLite! Use my code ABC12345..."
    ↓
User completes/edits tweet
    ↓
Sends to followers
```

---

## Key Statistics Displayed

### Dashboard Card (Quick View)
- 📊 Referral Code (8 characters)
- 👥 Total Users Referred
- ✓ Active Users (who have deposited)
- 💰 Total Earnings from referrals

### Referral Page (Detailed View)
- **Your Code** - Unique 8-character code
- **Users Referred** - Total count
- **Active Users** - Those who made first deposit
- **Total Earnings** - Sum of all 4% commissions
- **Pending Earnings** - Awaiting first deposits
- **Referral Link** - Full shareable URL
- **User Details** - Name, email, status, join date
- **Earnings History** - Per-transaction detail

---

## Status Indicators

### User Status in Referred List
```
✓ Deposited    = User made their first deposit
               = Your 4% commission was earned
               = Amount visible in earnings history

⏱ Pending      = User registered with your code
               = Waiting for their first deposit
               = You haven't earned commission yet
```

### Button States

Copy Button:
- Default: [Copy Link] (primary color)
- Copied: [✓ Copied!] (success color) - for 2 seconds
- Then: Back to [Copy Link]

---

## Information Architecture

```
Dashboard
├── Referral Card (Quick Stats)
│   ├── Code Display
│   ├── Copy Button
│   ├── Stats (3 cards)
│   └── "Manage Referrals" Link
│
Referral Index Page (/referral)
├── Header with Back Button
├── Stats Overview (4 cards)
│   ├── Your Code
│   ├── Users Referred
│   ├── Total Earnings
│   └── Pending Earnings
├── Share Section
│   ├── Link Display + Copy
│   ├── WhatsApp Share
│   ├── Twitter Share
│   ├── Email Share
│   └── Tips
├── Referred Users Table
│   └── Name, Email, Status, Join Date
└── Earnings History
    └── User, Amount, % Calculation, Date
```

---

## Color Scheme

- **Primary (Blue)** - Action buttons, code display
- **Secondary (Purple)** - Referral card section
- **Success (Green)** - Deposited status, copy confirmed
- **Warning (Yellow)** - Pending status
- **Base Colors** - Cards, backgrounds

---

## Responsive Design

### Mobile View (< 768px)
- Stack stats in single column or 2-column grid
- Full-width buttons for sharing
- Referral card simplified but complete
- Table converts to card view on smallest screens

### Desktop View (≥ 768px)
- 4-column stats grid
- Side-by-side layout for share and stats
- Full table layout for users
- Horizontal buttons

---

## Empty States

### No Referrals Yet
```
┌───────────────────────────────────┐
│      👥                           │
│                                   │
│  No referrals yet                │
│                                   │
│  Start sharing your code to       │
│  earn money!                      │
│                                   │
│  [Copy & Share Code]              │
└───────────────────────────────────┘
```

### No Earnings History
```
┌───────────────────────────────────┐
│      🪙                           │
│                                   │
│  No earnings yet                  │
│                                   │
│  Your referral earnings will      │
│  appear here                      │
└───────────────────────────────────┘
```

---

## Integration Points

✅ **Dashboard Page** - Shows referral card with quick stats
✅ **Navigation** - "Manage Referrals" link in dashboard
✅ **Routes** - /referral path for detailed page
✅ **Database** - Uses existing referral tables and transactions
✅ **Services** - Uses ReferralService for stats calculation

---

## Success Indicators

- ✅ Dashboard shows referral stats immediately
- ✅ Copy buttons work with visual feedback
- ✅ Social media shares include proper messaging
- ✅ Referral page shows all user data correctly
- ✅ Earnings appear when referrals deposit
- ✅ Empty states display when no data
- ✅ Mobile responsive design works
- ✅ No JavaScript errors in console

---

**Status:** ✅ READY FOR USER TESTING
