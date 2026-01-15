# Admin Feedback Management System

## Overview

The admin feedback management system allows administrators to view, manage, respond to, and analyze user feedback submissions. It includes comprehensive filtering, statistics, and response capabilities.

## Features

### 1. Feedback List & Search
- **List all feedback** with pagination (15 per page)
- **Search** by title, message, user name, or email
- **Advanced filtering** by:
  - Category (Bug Report, Feature Request, Improvement, General)
  - Status (Open, In Progress, Resolved, Closed)
  - Rating (Minimum star rating)
  - Type (Feature requests only / Regular feedback)
  - Sort (Latest, Rating, Status, Category)

### 2. Feedback Statistics
- **Total feedback count**
- **Average user rating** (stars)
- **Response rate** (percentage of feedback responded to)
- **Charts & breakdowns**:
  - By Status (Open, In Progress, Resolved, Closed)
  - By Category (Bug, Feature Request, Improvement, General)
  - By Rating (1-5 stars)
- **Key metrics**:
  - Feature requests count
  - Resolved feedback count
  - Open issues count
  - In progress count

### 3. Feedback Detail View
- **Full feedback content** with title and message
- **User information** (name, email, profile link)
- **Metadata** (category, status, rating, submitted date)
- **Response management**:
  - View existing admin response
  - Edit/update response
  - Change status when responding
- **Quick status update** without responding
- **Link to user profile**

### 4. Admin Responses
- **Add response** to feedback
- **Update response** (can be edited multiple times)
- **Auto-set responded_at timestamp**
- **Update status** when responding (e.g., from "open" to "resolved")
- **5000 character limit** for responses

## Routes

All routes are prefixed with `/admin` and require admin middleware.

| Method | Route | Name | Handler |
|--------|-------|------|---------|
| GET | `/admin/feedback` | admin.feedback.index | FeedbackController@index |
| GET | `/admin/feedback/{id}` | admin.feedback.show | FeedbackController@show |
| PATCH | `/admin/feedback/{id}/status` | admin.feedback.update-status | FeedbackController@updateStatus |
| POST | `/admin/feedback/{id}/respond` | admin.feedback.respond | FeedbackController@respond |
| GET | `/admin/feedback/statistics` | admin.feedback.statistics | FeedbackController@statistics |

## Controller Methods

### FeedbackController

#### `index(Request $request)`
Displays paginated feedback list with filtering and search capabilities.

**Query Parameters:**
- `category` - Filter by category (all, bug, feature_request, improvement, general)
- `status` - Filter by status (all, open, in_progress, resolved, closed)
- `rating` - Minimum rating filter (all, 1-5)
- `feature_request` - Filter by type (all, true, false)
- `search` - Search feedback by title/message/user
- `sort` - Sort field (created_at, rating, status, category)
- `direction` - Sort direction (asc, desc)
- `page` - Pagination page number

**Returns:**
```php
[
    'feedback' => LengthAwarePaginator,
    'filters' => [
        'category' => string,
        'status' => string,
        'rating' => string,
        'search' => string,
        'feature_request' => string,
        'sort' => string,
        'direction' => string,
    ],
    'stats' => [
        'total' => int,
        'open' => int,
        'in_progress' => int,
        'resolved' => int,
        'closed' => int,
        'feature_requests' => int,
        'avg_rating' => float,
    ]
]
```

#### `show(Feedback $feedback)`
Displays detailed view of a single feedback item.

**Returns:**
```php
[
    'feedback' => Feedback (with user relationship)
]
```

#### `updateStatus(Request $request, Feedback $feedback)`
Updates the status of a feedback item.

**Input:**
```php
[
    'status' => 'required|in:open,in_progress,resolved,closed'
]
```

**Returns:** Redirect with success message

#### `respond(Request $request, Feedback $feedback)`
Adds or updates admin response to feedback.

**Input:**
```php
[
    'admin_response' => 'required|string|max:5000',
    'status' => 'nullable|in:open,in_progress,resolved,closed'
]
```

**Returns:** Redirect with success message

#### `statistics()`
Displays comprehensive feedback statistics and analytics.

**Returns:**
```php
[
    'stats' => [
        'total' => int,
        'by_category' => array,
        'by_status' => array,
        'by_rating' => array,
        'feature_requests' => int,
        'avg_rating' => float,
        'response_rate' => float,
        'avg_response_time' => ?float
    ]
]
```

## React Components

### 1. Admin/Feedback/Index.jsx

**Feedback list page with filtering and search.**

Features:
- Search input with real-time filtering
- Advanced filter panel (togglable)
- Stats cards (Total, Open, In Progress, Resolved, Features, Avg Rating)
- Responsive table with feedback details
- Pagination controls
- Category/Status badges with color coding
- Star ratings display
- Quick action buttons to view feedback

**Props:**
- `feedback` - Paginated feedback collection
- `filters` - Current filter state
- `stats` - Aggregated statistics

### 2. Admin/Feedback/Show.jsx

**Detailed feedback view and response management.**

Features:
- Full feedback content display
- User information with link to profile
- Category, status, rating badges
- Feature request indicator
- Timeline (submitted date, responded date)
- Response form with textarea
- Status update controls
- Edit response capability
- Character counter for responses
- Save response button

**Props:**
- `feedback` - Single feedback object with user relationship

### 3. Admin/Feedback/Statistics.jsx

**Analytics and insights dashboard.**

Features:
- Key metrics cards (Total, Avg Rating, Response Rate)
- Feedback by Status chart (bar breakdown with percentages)
- Feedback by Category chart (bar breakdown with percentages)
- Feedback by Rating chart (stars breakdown with percentages)
- Key metrics cards (Features, Resolved, Open, In Progress)
- Insights and recommendations section
- Responsive grid layout

**Props:**
- `stats` - Aggregated statistics object

## Database Schema

### Feedbacks Table

```sql
CREATE TABLE feedbacks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    category ENUM('bug', 'feature_request', 'improvement', 'general'),
    title VARCHAR(255),
    message LONGTEXT,
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

## Workflow Examples

### Responding to Feedback

1. Admin navigates to `/admin/feedback`
2. Admin searches/filters for specific feedback
3. Admin clicks "View" button on feedback row
4. Admin sees detailed feedback view
5. Admin writes response in response textarea
6. Admin updates status (e.g., "open" → "resolved")
7. Admin clicks "Save Response"
8. System saves response + timestamp and status
9. Feedback shows as responded with response content

### Monitoring Statistics

1. Admin navigates to `/admin/feedback`
2. Admin clicks "Statistics" button
3. System displays comprehensive analytics:
   - Total feedback count
   - Average rating
   - Response rate
   - Breakdown by status/category/rating
   - Key metrics
4. Admin can see trends and identify patterns

### Filtering Feedback

1. Admin navigates to `/admin/feedback`
2. Admin clicks "Filters" button
3. Filter panel expands
4. Admin selects:
   - Category: "Feature Request"
   - Status: "Open"
   - Rating: "5"
5. Admin clicks/selects filters
6. Table updates to show matching feedback
7. Admin can now focus on high-rated feature requests

## Styling & Design

- **Colors**: Uses DaisyUI color system (primary, success, warning, error, info)
- **Icons**: React Icons (FontAwesome)
- **Layout**: Responsive grid (mobile-friendly)
- **Status badges**: Color-coded (primary=open, warning=in progress, success=resolved, slate=closed)
- **Category badges**: Color-coded (error=bug, info=feature, warning=improvement, primary=general)
- **Tables**: Responsive with horizontal scroll on mobile

## Security

- All routes require `admin` middleware
- User authorization: Implicitly checked by model binding
- Input validation on all form submissions
- CSRF token required for state-changing operations
- Response length limited to 5000 characters

## Performance Optimizations

- Eager load user relationship on feedback queries
- Indexed database queries (user_id, status, created_at)
- Paginated results (15 per page)
- Search and filter applied at database level
- Statistics calculated using aggregation queries

## Future Enhancements

1. **Email Notifications**
   - Notify user when admin responds to their feedback
   - Notify admin when new feedback is submitted

2. **Bulk Actions**
   - Mark multiple feedback as resolved
   - Bulk status updates
   - Bulk export to CSV

3. **Advanced Analytics**
   - Response time averages
   - Trending issues over time
   - User satisfaction trends
   - Category-based insights

4. **Integration**
   - Link feedback to development tasks
   - Create issues from bug reports
   - Auto-tag feature requests
   - Priority scoring system

5. **User Communication**
   - Predefined response templates
   - Response scheduling (draft before sending)
   - Automatic notifications

## Testing Checklist

- [ ] View feedback list
- [ ] Search by title
- [ ] Search by user email
- [ ] Filter by category
- [ ] Filter by status
- [ ] Filter by rating
- [ ] Filter by feature request type
- [ ] Sort by creation date
- [ ] Sort by rating
- [ ] Pagination works correctly
- [ ] View feedback detail
- [ ] Update feedback status
- [ ] Add admin response
- [ ] Edit admin response
- [ ] View statistics page
- [ ] Statistics calculations are correct
- [ ] Category breakdown is accurate
- [ ] Status breakdown is accurate
- [ ] Rating distribution displays correctly
- [ ] Response rate calculation is correct
- [ ] Link to user profile works
- [ ] Mobile responsiveness

## API Response Examples

### Feedback Index Response
```json
{
  "feedback": {
    "data": [
      {
        "id": 1,
        "user_id": 5,
        "category": "bug",
        "title": "Login page error",
        "message": "Getting error when trying to login",
        "feature_request": false,
        "rating": 2,
        "status": "open",
        "admin_response": null,
        "responded_at": null,
        "created_at": "2026-01-15T10:30:00Z",
        "updated_at": "2026-01-15T10:30:00Z",
        "user": {
          "id": 5,
          "name": "John Doe",
          "email": "john@example.com"
        }
      }
    ],
    "current_page": 1,
    "total": 45,
    "per_page": 15,
    "last_page": 3
  },
  "stats": {
    "total": 45,
    "open": 10,
    "in_progress": 5,
    "resolved": 25,
    "closed": 5,
    "feature_requests": 8,
    "avg_rating": 4.2
  }
}
```

### Statistics Response
```json
{
  "stats": {
    "total": 45,
    "by_category": {
      "bug": 12,
      "feature_request": 8,
      "improvement": 15,
      "general": 10
    },
    "by_status": {
      "open": 10,
      "in_progress": 5,
      "resolved": 25,
      "closed": 5
    },
    "by_rating": {
      "1": 2,
      "2": 3,
      "3": 8,
      "4": 18,
      "5": 14
    },
    "feature_requests": 8,
    "avg_rating": 4.2,
    "response_rate": 86.7
  }
}
```
