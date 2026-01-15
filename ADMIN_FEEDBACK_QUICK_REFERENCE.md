# Admin Feedback Quick Reference

## Access Points

| Page | URL | Description |
|------|-----|-------------|
| List | `/admin/feedback` | View all feedback with filters |
| Detail | `/admin/feedback/{id}` | View single feedback & respond |
| Stats | `/admin/feedback/statistics` | View analytics & insights |

## Main Features

### 1. Feedback List (`/admin/feedback`)
**What You Can Do:**
- Search feedback by title, message, or user
- Filter by category (Bug, Feature Request, Improvement, General)
- Filter by status (Open, In Progress, Resolved, Closed)
- Filter by minimum rating (1-5 stars)
- Filter by type (Feature requests only / Regular feedback)
- Sort by latest, rating, status, or category
- View paginated results (15 per page)
- Click row to view full details

**Stats Displayed:**
- Total feedback count
- Open issues count
- In progress count
- Resolved count
- Feature requests count
- Average rating

### 2. Feedback Detail (`/admin/feedback/{id}`)
**What You See:**
- Full feedback title and message
- Category badge (color-coded)
- Status badge (color-coded)
- Star rating if provided
- Feature request indicator if applicable
- User name and email
- Submission date and time
- Response date and time (if responded)

**What You Can Do:**
- Update status (Open → In Progress → Resolved → Closed)
- Write admin response (up to 5000 characters)
- Edit existing response
- View user profile by clicking user info

### 3. Statistics Page (`/admin/feedback/statistics`)
**What You See:**
- Total feedback count
- Average user rating (out of 5 stars)
- Response rate (% of feedback answered)
- Feedback by Status breakdown with charts
- Feedback by Category breakdown with charts
- Feedback by Rating distribution with charts
- Key metrics summary
- Insights and recommendations

## Filter Options

### By Category
- **Bug Report** 🐛 - System issues/errors
- **Feature Request** ✨ - New features wanted
- **Improvement** ⚡ - Enhancement suggestions
- **General** 💬 - Other feedback

### By Status
- **Open** - Not yet addressed
- **In Progress** - Currently being handled
- **Resolved** - Addressed with response
- **Closed** - Completed or archived

### By Rating
- 5 Stars ⭐⭐⭐⭐⭐ - Excellent
- 4 Stars ⭐⭐⭐⭐ - Good
- 3 Stars ⭐⭐⭐ - Average
- 2 Stars ⭐⭐ - Poor
- 1 Star ⭐ - Very Poor

### By Type
- Feature Requests Only - Filter to see requests
- Regular Feedback - Filter to see regular feedback
- All Types - Show everything

## Typical Workflow

### Responding to Feedback

1. **Go to Feedback List**
   - Navigate to `/admin/feedback`

2. **Find Feedback**
   - Use search box to find specific feedback
   - Or use filters to narrow down

3. **Click View**
   - Click the "View" button on the row

4. **Read Feedback**
   - Read the complete message
   - Check the category and rating

5. **Write Response**
   - Click "Hide Edit Form" → "Update Response" (if already responded)
   - Or scroll to "Admin Response" section
   - Type your response in the textarea
   - Max 5000 characters

6. **Update Status**
   - Change status based on action taken
   - Examples:
     - open → in_progress (if you're working on it)
     - in_progress → resolved (if you've addressed it)
     - resolved → closed (if you're archiving it)

7. **Save**
   - Click "Save Response" button
   - System automatically records timestamp

### Managing Status

**Status Meanings:**

| Status | When to Use | Next Status |
|--------|------------|------------|
| **Open** | New feedback, not yet reviewed | In Progress |
| **In Progress** | You're working on addressing it | Resolved |
| **Resolved** | You've responded and addressed it | Closed |
| **Closed** | Finished, archived, or not actionable | - |

### Quick Status Update (No Response)

1. Go to feedback detail page
2. Find "Status" section in sidebar (right side)
3. Select new status from dropdown
4. Click "Update Status" button
5. Status updates immediately

## Key Metrics Explained

| Metric | Meaning | What to Monitor |
|--------|---------|-----------------|
| **Total** | All feedback submissions | Growth trend |
| **Open** | Feedback not yet addressed | High count = backlog |
| **In Progress** | Being worked on | Should be low |
| **Resolved** | Addressed with response | Shows responsiveness |
| **Feature Requests** | New features suggested | Product insights |
| **Avg Rating** | Average user satisfaction | Higher is better |
| **Response Rate** | % of feedback answered | Aim for 90%+ |

## Color Guide

### Status Colors
- 🔵 **Primary (Blue)** - Open
- 🟡 **Warning (Yellow)** - In Progress
- 🟢 **Success (Green)** - Resolved
- ⚪ **Slate (Gray)** - Closed

### Category Colors
- 🔴 **Error (Red)** - Bug Report
- 🔵 **Info (Blue)** - Feature Request
- 🟡 **Warning (Yellow)** - Improvement
- 🔵 **Primary (Blue)** - General

## Common Tasks

### Task: Find All Bug Reports
1. Go to `/admin/feedback`
2. Click "Filters"
3. Select Category: "Bug Report"
4. View all bugs

### Task: Find Unanswered Feedback
1. Go to `/admin/feedback`
2. Click "Filters"
3. Select Status: "Open"
4. These are feedback not yet responded to

### Task: Find High-Satisfaction Feedback
1. Go to `/admin/feedback`
2. Click "Filters"
3. Select Min Rating: "5 Stars"
4. See what users loved

### Task: Find Feature Requests Only
1. Go to `/admin/feedback`
2. Click "Filters"
3. Select Type: "Feature Requests Only"
4. Review product requests

### Task: Search for User Feedback
1. Go to `/admin/feedback`
2. Type user email in search box
3. See all feedback from that user

### Task: Check Response Rate
1. Click "Statistics" button
2. Look at "Response Rate" card
3. Aim for 90%+ coverage

## Response Tips

**Good Response Format:**
1. Thank user for feedback
2. Acknowledge their concern
3. Explain what you'll do
4. Give timeline if applicable
5. Provide next steps

**Example Response:**
```
Thank you for reporting this issue! We appreciate your feedback.

We've identified the login problem you mentioned and our team is 
currently investigating. We expect to have a fix within the next 
48 hours.

We'll send you an email notification once the issue is resolved.

Thanks for your patience!
```

## Important Notes

⚠️ **Response Limits:**
- Responses have 5000 character limit
- Timestamp is auto-set when saved
- Can edit responses multiple times

⚠️ **Status Management:**
- Change status to match action taken
- "Resolved" indicates user has been answered
- "Closed" is for archiving completed items

⚠️ **Data Access:**
- Only admin users can access feedback pages
- User data is private and should be treated as such
- Responses are saved and timestamped

## Keyboard Shortcuts

None currently configured, but you can:
- Use browser's search (Ctrl+F) to find text
- Use Tab key to navigate form fields
- Use Enter to submit forms

## Troubleshooting

**Problem:** Can't find feedback?
- **Solution:** Check filters are not too restrictive
- **Solution:** Try clearing search box and filters
- **Solution:** Check different status filters

**Problem:** Response not saving?
- **Solution:** Check response text is not empty
- **Solution:** Make sure you clicked "Save Response" button
- **Solution:** Check for validation errors

**Problem:** Statistics not updating?
- **Solution:** Refresh the page
- **Solution:** New feedback takes 1-2 minutes to appear
- **Solution:** Check if feedback was actually saved

## Related User Features

Users can:
- Submit feedback from dashboard widget
- View their own feedback history
- Rate the platform (1-5 stars)
- Indicate if feedback is a feature request
- Submit in categories: Bug, Feature, Improvement, General

See `FEEDBACK_PAYMENT_QUICK_REFERENCE.md` for user-facing features.
