# Frontend-Backend Integration Checklist

## API Endpoints Verified ✅

### Lead Management
- [x] GET `/leads` - Fetch all leads
  - Response: `{ status, message, count, data: [...] }`
  - Frontend updated to handle response.data.data
  
- [x] POST `/create-lead` - Create single lead
  - Request: `{ name, email, phone, education, lead_source }`
  - Response: `{ status, message, data: { student_id, counselor_name, email } }`
  
- [x] POST `/upload-leads` - Bulk upload from Excel
  - File: multipart/form-data with field "file"
  - Response: `{ status, message, data: { success_count, failed_count, failed_leads } }`

### Course Management
- [x] GET `/courses` - Fetch all active courses
  - Response: `{ status, message, data: [...] }`
  - Frontend updated to parse courses array properly

### Payment Processing
- [x] POST `/initiate-payment` - Create Razorpay order
  - Request: `{ student_id, payment_type (REGISTRATION|COURSE_FEE), course_id? }`
  - Critical Restriction: Registration fee must be PAID before course fee
  - Response: `{ status, message, data: { order_id, amount, currency, payment_type } }`
  
- [x] POST `/verify-payment` - Verify Razorpay signature
  - Request: `{ order_id, payment_id, razorpay_signature }`
  - Note: Actual DB update happens via webhook, not this endpoint
  - Response: `{ status, message, data: { status } }`

### Meeting & Application
- [x] POST `/schedule-meet` - Schedule Google Meet interview
  - Request: `{ student_id }`
  - Critical Restriction: Registration fee must be PAID first
  - Response: `{ status, message, data: { meet_link, student_id, scheduled_at } }`
  
- [x] POST `/application-action` - Accept/Reject application
  - Request (Accept): `{ student_id, status: "ACCEPTED", selected_course_id }`
  - Request (Reject): `{ student_id, status: "REJECTED" }`
  - Critical Restriction: Registration fee must be PAID first
  - Response: `{ status, message, data: { course_fee, next_step, payment_details } }`

### DLQ Management
- [x] GET `/api/dlq/messages` - Retrieve failed email messages
- [x] POST `/api/dlq/messages/retry/:id` - Retry failed message
- [x] POST `/api/dlq/messages/resolve/:id` - Mark as resolved
- [x] GET `/api/dlq/stats` - Get DLQ statistics

---

## Frontend Components Updated ✅

### Pages
- [x] **Dashboard.jsx** - Properly fetches and handles leads data
- [x] **Leads.jsx** - Error handling, empty states, proper API integration
- [x] **Courses.jsx** - Handles courses array format, error handling
- [x] **Payments.jsx** - Error handling and display
- [x] **Reviews.jsx** - Error handling and display

### Modals/Components
- [x] **CreateLeadModal.jsx** - Single and bulk upload working
- [x] **ApplicationActionModal.jsx** 
  - Dynamically fetches courses from `/courses`
  - Validates against fetched courses list
  - Sends correct payload: `{ student_id, status, selected_course_id }`
  - Enforces: Registration fee PAID check (backend)
  
- [x] **PaymentModal.jsx**
  - Dynamically fetches courses for COURSE_FEE
  - Sends correct payload: `{ student_id, payment_type, course_id }`
  - Enforces: Registration fee PAID check (backend)
  
- [x] **ScheduleInterviewModal.jsx**
  - Sends correct payload: `{ student_id }`
  - Enforces: Registration fee PAID check (backend)

- [x] **Navbar.jsx** - Navigation and routing

### Services
- [x] **api.js** - 
  - Updated with detailed comments for each endpoint
  - Correct request/response formats documented
  - All critical restrictions documented

---

## Critical Business Rules Enforced by Backend ⚠️

### Payment Restrictions
1. **Course Fee Cannot Be Paid Until Registration Fee is PAID**
   - Backend checks: `registration_payment.status === 'PAID'`
   - Error: "Registration payment status is PENDING..."
   - Frontend displays this error from backend

2. **Interview Cannot Be Scheduled Until Registration Fee is PAID**
   - Backend checks: `registration_payment.status === 'PAID'`
   - Error: "Interview cannot be scheduled..."
   - Frontend displays this error from backend

3. **Application Status Cannot Change Until Registration Fee is PAID**
   - Backend checks: `registration_payment.status === 'PAID'`
   - Error: "Application status cannot be updated..."
   - Frontend displays this error from backend

### Automatic Actions
1. **On Registration Payment PAID (via Webhook)**
   - Interview auto-scheduled 1 hour later
   - `application_status` → `INTERVIEW_SCHEDULED`
   - Email sent to student with meet link
   - `meet_link` field populated

2. **On Application ACCEPTED**
   - Course selection stored in `selected_course_id`
   - `application_status` → `ACCEPTED`
   - Next step: Course fee payment
   - Email sent to student

3. **On Application REJECTED**
   - `application_status` → `REJECTED`
   - Email sent to student with rejection notice

---

## Error Handling

### Frontend Error Display
- All pages have error banners with "Retry" button
- Errors from backend API displayed to user
- Network errors handled gracefully
- Empty states when no data available

### Backend Error Responses
Format: `{ status: "error", error: "error message" }`

Common errors:
- 400: Invalid input, business rule violation
- 401: Unauthorized (auth token required)
- 404: Resource not found
- 500: Server error

---

## Testing Checklist

### Manual Testing Steps

1. **Create Lead**
   - Navigate to Leads page
   - Click "Add New Lead"
   - Fill form and submit
   - Verify lead appears in list
   - Verify counselor auto-assigned ✅

2. **Fetch Courses**
   - Navigate to Courses page
   - Verify courses load correctly
   - Check course cards display fee, duration ✅

3. **Payment Flow**
   - Click "💳 Pay" on a lead card
   - Try to pay COURSE_FEE without registration payment
   - Backend should error: "Registration payment status is PENDING..."
   - Pay REGISTRATION fee instead ✅

4. **Application Decision**
   - Click "✓ Decide" on a lead card
   - Try to accept/reject without registration payment
   - Backend should error: "Application status cannot be updated..."
   - Complete registration payment first
   - Then accept application with course selection ✅

5. **Interview Scheduling**
   - After registration fee paid, click "📅 Meet"
   - Verify backend creates Google Meet link
   - Check email sent (via Kafka consumer) ✅

---

## Known Limitations & Future Work

### Current Limitations
1. Frontend uses polling (30s interval) instead of WebSocket
2. No authentication/authorization implemented
3. No user sessions/login
4. Payment gateway (Razorpay) integration is client-side only
5. Email system requires Kafka + consumer running

### Backend Requirements
- PostgreSQL 12+ must be running
- Apache Kafka must be configured (optional - can disable)
- SMTP credentials must be set in `.env`
- Razorpay test credentials must be set in `.env`
- Google Meet API credentials needed for meeting scheduling

### Frontend Requirements
- React 18+
- Tailwind CSS
- Axios for HTTP
- Lucide Icons
- Recharts for charts

---

## Environment Configuration

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_APP_NAME=Admission Module
VITE_APP_VERSION=1.0.0
```

### Backend (.env)
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=admission_db

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=app_password
EMAIL_FROM=noreply@admission-module.com

# Payment
RazorpayKeyID=rzp_test_xxxxx
RazorpayKeySecret=secret_key

# Kafka (Optional)
KAFKA_BROKERS=localhost:9092

# Server
SERVER_PORT=8080
```

---

## Integration Status: ✅ COMPLETE

All frontend pages and components have been verified and updated to properly integrate with backend API endpoints. Business rules are enforced by the backend, and frontend properly displays errors to users.
