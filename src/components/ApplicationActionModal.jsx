import React, { useEffect, useState } from 'react'
import api, { applicationAPI } from '../services/api'
import { X, AlertCircle, CheckCircle, CheckSquare, XSquare, Loader } from 'lucide-react'

export default function ApplicationActionModal({ isOpen, onClose, lead, onActionCompleted }) {
  const [action, setAction] = useState('ACCEPT')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [courses, setCourses] = useState([])
  const [coursesLoading, setCoursesLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [paymentStatus, setPaymentStatus] = useState(null)

  console.log('ApplicationActionModal - isOpen:', isOpen, 'lead:', lead)

  // ✅ MOVED BEFORE guard clauses - React hooks must be called unconditionally
  useEffect(() => {
    let mounted = true
    
    async function fetchCourses() {
      try {
        setCoursesLoading(true)
        setError('')
        const res = await api.get('/courses')
        
        if (!mounted) return
        
        // Backend returns { status, message, data: [...] } where data is courses array
        let list = []
        if (res?.data?.data && Array.isArray(res.data.data)) {
          list = res.data.data
        } else if (Array.isArray(res?.data)) {
          list = res.data
        }
        
        // ensure all courses have id and name
        list = list.filter(c => c?.id && (c?.name || c?.title))
        setCourses(list)
      } catch (err) {
        if (mounted) {
          setError('Unable to load courses. Please try again.')
        }
      } finally {
        if (mounted) setCoursesLoading(false)
      }
    }

    if (isOpen && action === 'ACCEPT') {
      setSelectedCourse('') // reset course selection when toggling action
      fetchCourses()
    }

    return () => { mounted = false }
  }, [isOpen, action])

  // Fetch fresh payment status when modal opens
  useEffect(() => {
    let mounted = true

    async function fetchPaymentStatus() {
      if (!lead?.id || !isOpen) return

      try {
        const res = await api.get(`/payment-status?student_id=${lead.id}`)
        if (!mounted) return

        let paymentData = res.data?.data
        // Handle double-wrapped data
        if (paymentData && paymentData.data && !paymentData.registration_status) {
          paymentData = paymentData.data
        }

        setPaymentStatus(paymentData)
        console.log('Fresh payment status fetched:', paymentData)
      } catch (err) {
        console.error('Error fetching payment status:', err)
        // Don't set error, just use lead data as fallback
      }
    }

    fetchPaymentStatus()
    return () => { mounted = false }
  }, [isOpen, lead?.id])

  // Show debugging information if modal should be open but has no lead
  if (isOpen && !lead) {
    console.log('ERROR: Modal is open but lead is null/undefined!')
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
          <h2 className="text-xl font-bold text-red-600 mb-4">⚠️ Something Went Wrong</h2>
          <p className="text-gray-600 mb-4">Student data couldn't be loaded. Please close and try again.</p>
          <p className="text-sm text-gray-500 mb-4">Debug info: isOpen={String(isOpen)}, lead={String(lead)}</p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  // defensive: don't render if not open
  if (!isOpen) {
    console.log('Modal not open, returning null')
    return null
  }

  // If we reach here, modal is open AND lead exists
  console.log('Modal should display with lead data:', lead)

  const handleSubmit = async (e) => {
    console.log('=== handleSubmit CALLED ===')
    console.log('Event:', e)
    e.preventDefault()
    console.log('Event prevented')
    
    setLoading(true)
    setError('')
    console.log('State updated: loading=true, error cleared')

    try {
      // defensive checks before calling API
      console.log('Lead object:', lead)
      console.log('Lead ID:', lead?.id)
      if (!lead || typeof lead.id === 'undefined' || lead.id === null) {
        throw new Error('Invalid student data')
      }
      console.log('Lead validation passed')

      let selected_course_id = null
      if (action === 'ACCEPT') {
        console.log('Action is ACCEPT, checking course selection')
        if (!selectedCourse) {
          throw new Error('Please select a course')
        }
        console.log('Selected course:', selectedCourse)

        // ensure selectedCourse exists in loaded courses (prevent client-side tampering)
        const courseId = selectedCourse
        const found = courses.find((c) => {
          const cId = c.id ?? c.course_id
          return String(cId) === String(courseId)
        })
        
        if (!found) {
          throw new Error('Selected course is not valid. Please refresh and try again.')
        }
        console.log('Course validation passed')

        // normalize to integer if possible, otherwise keep as string
        selected_course_id = isNaN(courseId) ? courseId : Number(courseId)
      }

      const payload = {
        student_id: lead.id,
        status: action,
        selected_course_id: action === 'ACCEPT' ? (isNaN(selectedCourse) ? selectedCourse : Number(selectedCourse)) : null
      }
      
      console.log('=== CALLING API POST /application-action ===')
      console.log('Payload:', payload)
      const response = await applicationAPI.submitDecision(payload)
      console.log('=== API RESPONSE RECEIVED ===')
      console.log('Response:', response)
      
      setSuccess(`Application ${action === 'ACCEPT' ? 'accepted' : 'rejected'} successfully!`)
      if (onActionCompleted) {
        console.log('Calling onActionCompleted callback')
        onActionCompleted()
      }
      
      setTimeout(() => {
        setSuccess('')
        onClose()
      }, 2500)
    } catch (err) {
      // prefer server message, fallback to thrown message or generic
      console.error('=== ERROR IN SUBMIT ===')
      console.error('Full error object:', err)
      const serverMsg = err?.response?.data?.error || err?.response?.data?.message
      const message = serverMsg || err.message || 'Failed to update application status'
      console.error('Error message:', message)
      setError(message)
    } finally {
      setLoading(false)
      console.log('handleSubmit finished, loading=false')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="text-lg font-semibold text-gray-900">Application Review</h2>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={(e) => {
          console.log('FORM onSubmit triggered')
          handleSubmit(e)
        }} className="p-6 space-y-4">
          {success && (
            <div className="p-4 bg-green-50 border-l-4 border-green-600 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700 font-medium">{success}</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-600 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          <p className="text-sm text-gray-700 font-medium">Reviewing application from <span className="font-semibold text-gray-900">{lead.name}</span></p>

          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-lg">
            <p className="text-xs text-blue-900 font-semibold uppercase tracking-wide mb-2">
              💳 Payment Status: <span className="text-sm font-bold">{paymentStatus?.registration_status || lead.registration_fee_status || 'PENDING'}</span>
            </p>
            {(paymentStatus?.registration_status !== 'PAID' && lead.registration_fee_status !== 'PAID') && (
              <p className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded border border-red-200 mt-2">
                ⚠️ This student hasn't completed payment yet. Please ask them to pay before reviewing.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all" style={{
              borderColor: action === 'ACCEPT' ? '#059669' : '#e5e7eb',
              backgroundColor: action === 'ACCEPT' ? '#f0fdf4' : 'transparent'
            }}>
              <input
                type="radio"
                name="action"
                value="ACCEPT"
                checked={action === 'ACCEPT'}
                onChange={(e) => setAction(e.target.value)}
                className="w-4 h-4"
              />
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">✓ Approve Application</p>
                <p className="text-xs text-gray-600 font-medium">Student will be enrolled in the selected course</p>
              </div>
              <CheckSquare className="w-5 h-5 text-green-600" />
            </label>

            <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all" style={{
              borderColor: action === 'REJECT' ? '#dc2626' : '#e5e7eb',
              backgroundColor: action === 'REJECT' ? '#fef2f2' : 'transparent'
            }}>
              <input
                type="radio"
                name="action"
                value="REJECT"
                checked={action === 'REJECT'}
                onChange={(e) => setAction(e.target.value)}
                className="w-4 h-4"
              />
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">✕ Reject Application</p>
                <p className="text-xs text-gray-600 font-medium">Student will receive a rejection notification</p>
              </div>
              <XSquare className="w-5 h-5 text-red-600" />
            </label>
          </div>

          {action === 'ACCEPT' && (
            <div>
              <label className="block text-xs text-gray-700 font-semibold uppercase tracking-wide mb-2">Which course should they enroll in? *</label>
              <div className="relative">
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  disabled={coursesLoading || courses.length === 0}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                  required
                >
                  <option value="">{coursesLoading ? 'Loading available courses...' : 'Select a course'}</option>
                  {courses.map((c) => {
                    const courseId = c.id
                    const courseName = c.name
                    return (
                      <option key={courseId} value={courseId}>
                        {courseName}
                      </option>
                    )
                  })}
                </select>
                {coursesLoading && (
                  <Loader className="absolute right-3 top-3 w-4 h-4 text-gray-400 animate-spin" />
                )}
              </div>
              {courses.length === 0 && !coursesLoading && (
                <p className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded mt-2 border border-amber-200">No courses available right now. Please contact support.</p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (action === 'ACCEPT' && !selectedCourse) || (paymentStatus?.registration_status !== 'PAID' && lead.registration_fee_status !== 'PAID')}
            onClick={() => console.log('BUTTON CLICKED - action:', action, 'selectedCourse:', selectedCourse, 'loading:', loading, 'payment_status:', paymentStatus?.registration_status || lead.registration_fee_status)}
            className={`w-full text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              action === 'ACCEPT'
                ? 'bg-gradient-to-r from-green-600 to-emerald-600'
                : 'bg-gradient-to-r from-red-600 to-pink-600'
            }`}
          >
            {loading ? '⏳ Processing...' : (paymentStatus?.registration_status !== 'PAID' && lead.registration_fee_status !== 'PAID') ? '💳 Waiting for Payment' : `${action === 'ACCEPT' ? '✓ Approve Application' : '✕ Reject Application'}`}
          </button>
        </form>
      </div>
    </div>
  )
}
