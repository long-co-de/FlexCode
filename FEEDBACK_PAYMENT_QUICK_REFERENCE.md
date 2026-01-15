# Quick Reference: Feedback & Payment Retrieval Features

## Feature 1: User Feedback System

### User Actions:
1. Click "Give Feedback" button on Dashboard
2. Modal opens with feedback form
3. Fill out:
   - Category (Bug/Feature/Improvement/General)
   - Subject (max 255 chars)
   - Message (max 5000 chars)
   - Rating (1-5 stars, optional)
   - Feature Request checkbox (optional)
4. Submit form → Sends to POST /feedback
5. Success message → Modal closes

### Admin Actions:
- View feedback at `/feedback` (route: feedback.index)
- View specific feedback with admin response options
- Respond to feedback (stored in admin_response, responded_at fields)

### Database:
- Table: `feedbacks`
- Fields: id, user_id, category, title, message, feature_request, rating, status, admin_response, responded_at, timestamps

---

## Feature 2: Payment Retrieval System

### User Actions:
1. Option A: Click "Retrieve Payment" on Dashboard → goes to /payment-retrieval
2. Option B: Navigate directly to /payment-retrieval route
3. Enter Paystack reference number
4. Click "Retrieve Payment" button
5. System verifies with Paystack:
   - Reference is valid
   - Payment status = 'success'
   - Email matches user email
   - No duplicate transaction exists
6. If verified:
   - Wallet balance increases
   - Outstanding debt automatically settled
   - System notification sent
   - Success message with new balance displayed
7. If verification fails:
   - Error message with reason
   - Can retry with different reference

### Technical Flow:
```
POST /payment-retrieval/verify
  ↓
PaymentRetrievalController@retrieve
  ↓
Validate reference format
  ↓
Check for duplicate transaction
  ↓
PaystackService::verifyTransaction()
  ↓
Verify payment status = 'success'
  ↓
Verify email match
  ↓
Create Transaction record
  ↓
Credit wallet: user.wallet_balance += amount
  ↓
BorrowingService::settleDebts()
  ↓
Send system notification
  ↓
Return success with new balance
```

---

## Routes Summary

### Feedback Routes:
| Method | Route | Controller | Notes |
|--------|-------|-----------|-------|
| POST | /feedback | FeedbackController@store | Submit new feedback |
| GET | /feedback | FeedbackController@index | List user's feedback (paginated) |
| GET | /feedback/{id} | FeedbackController@show | View specific feedback |

### Payment Retrieval Routes:
| Method | Route | Controller | Notes |
|--------|-------|-----------|-------|
| GET | /payment-retrieval | PaymentRetrievalController@show | Render retrieval page |
| POST | /payment-retrieval/verify | PaymentRetrievalController@retrieve | Verify with Paystack |

---

## Components

### Frontend:
- **FeedbackModal** (`resources/js/Components/FeedbackModal.jsx`)
  - Modal popup for feedback submission
  - Opens from Dashboard "Give Feedback" button
  - Props: `isOpen`, `onClose`

- **PaymentRetrieval** (`resources/js/Pages/User/PaymentRetrieval.jsx`)
  - Full-page payment verification interface
  - Reference input, verification button
  - Success/error display with transaction details
  - FAQ section

- **Dashboard Widgets** (in `resources/js/Pages/Dashboard.jsx`)
  - Two new cards showing feedback & payment retrieval options
  - Feedback card: Purple gradient, opens modal
  - Payment card: Cyan gradient, links to full page
  - Added to dashboard below main balance card

### Backend:
- **Feedback Model** (`app/Models/Feedback.php`)
  - Relationships: belongsTo User
  - Casts: feature_request → boolean, responded_at → datetime

- **FeedbackController** (`app/Http/Controllers/User/FeedbackController.php`)
  - `store()` - Create feedback with validation
  - `index()` - Get paginated user feedback
  - `show()` - Get specific feedback with auth check

- **PaymentRetrievalController** (`app/Http/Controllers/User/PaymentRetrievalController.php`)
  - `show()` - Render retrieval page via Inertia
  - `retrieve()` - Verify payment and credit wallet

---

## Error Handling

### Feedback:
- Missing category, title, or message → 422 Unprocessable Entity
- Title exceeds 255 chars → Validation error
- Message exceeds 5000 chars → Validation error
- Invalid rating (not 1-5) → Validation error

### Payment Retrieval:
- `"Invalid payment reference format"` - Reference doesn't match Paystack format
- `"This payment has already been claimed"` - Duplicate transaction detected
- `"Payment was not successful on Paystack"` - Status is not 'success'
- `"Email mismatch. Contact support if this is your payment."` - Email doesn't match
- `"Payment verification failed"` - Generic Paystack API error

---

## Database Preparation

✅ Migration executed: `php artisan migrate`

Feedbacks table structure:
```sql
CREATE TABLE feedbacks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    category ENUM('bug', 'feature_request', 'improvement', 'general') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message LONGTEXT NOT NULL,
    feature_request BOOLEAN DEFAULT FALSE,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
    admin_response LONGTEXT,
    responded_at TIMESTAMP NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX (user_id),
    INDEX (status),
    INDEX (created_at)
);
```

---

## Testing Commands

```bash
# Test feedback submission
curl -X POST http://localhost/feedback \
  -H "Content-Type: application/json" \
  -H "X-CSRF-TOKEN: {token}" \
  -d '{"category":"bug","title":"Test","message":"This is a test","rating":5}'

# Test payment retrieval
curl -X POST http://localhost/payment-retrieval/verify \
  -H "Content-Type: application/json" \
  -H "X-CSRF-TOKEN: {token}" \
  -d '{"reference":"123456789"}'
```

---

## Integration Points

### With Existing Services:
- **PaystackService** - Used for payment verification
- **BorrowingService** - Used for automatic debt settlement
- **NotificationService** - Sends notifications for successful payment retrieval
- **ReferralService** - Already sends email notifications (not modified)
- **AuthenticationMiddleware** - All routes protected with auth

### With Existing Models:
- **User** - Relationships to Feedback
- **Transaction** - Created when payment is retrieved
- **Borrowing** - Settled when payment is retrieved

---

## Future Enhancements

1. **Admin Dashboard**
   - View all feedback submissions
   - Filter by category, status, rating
   - Respond to feedback
   - Analytics on feedback trends

2. **Email Notifications**
   - Send email when feedback is received
   - Send email when admin responds to feedback
   - Send email confirmation for payment retrieval

3. **Advanced Filtering**
   - User feedback history filtering
   - Payment retrieval transaction history
   - Export feedback data

4. **Analytics**
   - Track feedback by category
   - Monitor payment retrieval success rates
   - Identify common issues from bug reports

---

## Support

For issues with:
- **Feedback submission** - Check browser console for validation errors
- **Payment retrieval** - Verify Paystack reference is correct and payment was successful
- **Database** - Ensure migration ran: `php artisan migrate --force`
- **Components** - Check assets are built: `npm run dev` or `npm run build`
