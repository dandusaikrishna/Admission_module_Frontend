import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
})

// Add request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API Service Methods with proper integration to backend

export const leadAPI = {
  // GET /leads - retrieves all leads with optional filters
  // Response format: { status, message, count, data: [...] }
  getAll: (filters = {}) => {
    const params = new URLSearchParams()
    if (filters.created_after) params.append('created_after', filters.created_after)
    if (filters.created_before) params.append('created_before', filters.created_before)
    return api.get(`/leads?${params.toString()}`)
  },

  // POST /create-lead - creates a single lead
  // Required: name, email, phone
  // Optional: education, lead_source
  // Response: { status, message, data: { student_id, counselor_name, email } }
  create: (data) => api.post('/create-lead', data),

  // POST /upload-leads - bulk upload from Excel
  // File must be .xlsx format
  // Response: { status, message, data: { success_count, failed_count, failed_leads } }
  upload: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/upload-leads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}

export const courseAPI = {
  // GET /courses - retrieves all active courses
  // Response format: { status, message, data: [...] } where data is the courses array
  getAll: () => api.get('/courses'),

  // POST /courses - create new course (admin)
  create: (data) => api.post('/courses', data),

  // PUT /courses/:id - update course (admin)
  update: (id, data) => api.put(`/courses/${id}`, data),

  // DELETE /courses/:id - delete course (admin)
  delete: (id) => api.delete(`/courses/${id}`)
}

export const paymentAPI = {
  // POST /initiate-payment - initiate payment for registration or course fee
  // Required: student_id, payment_type (REGISTRATION or COURSE_FEE)
  // For COURSE_FEE: also require course_id
  // NOTE: Backend enforces registration fee must be PAID before course fee
  // Response: { status, message, data: { order_id, amount, currency, payment_type } }
  initiate: (data) => api.post('/initiate-payment', data),

  // POST /verify-payment - verify Razorpay signature (client-side)
  // Required: order_id, payment_id, razorpay_signature
  // Note: Actual DB update happens via Razorpay webhook, not this endpoint
  // Response: { status, message, data: { status } }
  verify: (data) => api.post('/verify-payment', data),

  // GET /payment-status/:studentId - get payment status for student
  // Returns current status of registration and course fees
  getStatus: (studentId) => api.get(`/payment-status?student_id=${studentId}`)
}

export const applicationAPI = {
  // POST /application-action - accept or reject application
  // Required: student_id, status (ACCEPTED or REJECTED)
  // For ACCEPTED: also require selected_course_id
  // NOTE: Backend enforces registration fee must be PAID first
  // Response (ACCEPTED): { status, message, data: { course_fee, next_step, payment_details } }
  // Response (REJECTED): { status, message, data: { result: 'rejected' } }
  submitDecision: (data) => api.post('/application-action', data)
}

export const meetAPI = {
  // POST /schedule-meet - schedule Google Meet interview
  // Required: student_id
  // NOTE: Backend enforces registration fee must be PAID first
  // Response: { status, message, data: { meet_link, student_id, scheduled_at } }
  schedule: (data) => api.post('/schedule-meet', data)
}

export const dlqAPI = {
  // GET /api/dlq/messages - retrieve failed email messages from Dead Letter Queue
  getMessages: (limit = 50) => api.get(`/api/dlq/messages?limit=${limit}`),

  // POST /api/dlq/messages/retry/:id - retry a failed message
  retry: (messageId) => api.post(`/api/dlq/messages/retry/${messageId}`),

  // POST /api/dlq/messages/resolve/:id - mark message as resolved
  resolve: (messageId, data) => api.post(`/api/dlq/messages/resolve/${messageId}`, data),

  // GET /api/dlq/stats - get DLQ statistics
  getStats: () => api.get('/api/dlq/stats')
}

export default api
