import React, { useState, useEffect } from 'react'
import api from '../services/api'
import { X, AlertCircle, CheckCircle, CreditCard, Loader } from 'lucide-react'

export default function PaymentModal({ isOpen, onClose, lead, onPaymentInitiated }) {
  const [paymentType, setPaymentType] = useState('REGISTRATION')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [courses, setCourses] = useState([])
  const [coursesLoading, setCoursesLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  if (!isOpen || !lead) return null

  const registrationFee = 1870

  // Fetch courses when payment type changes to COURSE_FEE
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
        
        // Filter and validate courses
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

    if (paymentType === 'COURSE_FEE') {
      setSelectedCourse('') // Reset course selection
      fetchCourses()
    } else {
      setCourses([])
    }

    return () => { mounted = false }
  }, [paymentType])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Defensive checks
      if (!lead || typeof lead.id === 'undefined' || lead.id === null) {
        throw new Error('Invalid student data')
      }

      if (paymentType === 'COURSE_FEE') {
        if (!selectedCourse) {
          throw new Error('Please select a course')
        }

        // Validate course exists in fetched list
        const found = courses.find((c) => String(c.id) === String(selectedCourse))
        
        if (!found) {
          throw new Error('Selected course is not valid')
        }
      }

      const payload = {
        student_id: lead.id,
        payment_type: paymentType,
        amount: amount,
        course_id: paymentType === 'COURSE_FEE' ? Number(selectedCourse) : null
      }

      const response = await api.post('/initiate-payment', payload)
      setSuccess('Payment initiated successfully!')
      if (onPaymentInitiated) onPaymentInitiated()
      
      setTimeout(() => {
        setSuccess('')
        onClose()
      }, 2000)
    } catch (err) {
      console.error('Payment error:', err)
      const serverMsg = err?.response?.data?.error || err?.response?.data?.message
      setError(serverMsg || err.message || 'Failed to initiate payment')
    } finally {
      setLoading(false)
    }
  }

  // Calculate course fee from selected course
  const getCourseFee = () => {
    if (!selectedCourse) return 0
    const selected = courses.find(c => String(c.id) === String(selectedCourse))
    return selected?.fee || 0
  }

  const courseFee = getCourseFee()
  const amount = paymentType === 'REGISTRATION' ? registrationFee : courseFee

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 scale-95">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">💳 Make Payment</h2>
            <p className="text-xs text-gray-600 font-medium mt-1">Student: <span className="font-semibold">{lead.name}</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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

          <div className="space-y-3">
            <label className="block text-xs text-gray-700 font-semibold uppercase tracking-wide mb-3">What do you want to pay for? *</label>
            
            <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all" style={{
              borderColor: paymentType === 'REGISTRATION' ? '#2563eb' : '#e5e7eb',
              backgroundColor: paymentType === 'REGISTRATION' ? '#eff6ff' : 'transparent'
            }}>
              <input
                type="radio"
                name="paymentType"
                value="REGISTRATION"
                checked={paymentType === 'REGISTRATION'}
                onChange={(e) => setPaymentType(e.target.value)}
                className="w-4 h-4"
              />
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">📋 Registration Fee</p>
                <p className="text-xs text-gray-600 font-medium">One-time fee to get started • ₹{registrationFee}</p>
              </div>
            </label>

            <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all" style={{
              borderColor: paymentType === 'COURSE_FEE' ? '#2563eb' : '#e5e7eb',
              backgroundColor: paymentType === 'COURSE_FEE' ? '#eff6ff' : 'transparent'
            }}>
              <input
                type="radio"
                name="paymentType"
                value="COURSE_FEE"
                checked={paymentType === 'COURSE_FEE'}
                onChange={(e) => setPaymentType(e.target.value)}
                className="w-4 h-4"
              />
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">📚 Course Fee</p>
                <p className="text-xs text-gray-600 font-medium">Selected course tuition • ₹{courseFee}</p>
              </div>
            </label>
          </div>

          {paymentType === 'COURSE_FEE' && (
            <div>
              <label className="block text-xs text-gray-700 font-semibold uppercase tracking-wide mb-2">Which course? *</label>
              <div className="relative">
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  disabled={coursesLoading || courses.length === 0}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                  required={paymentType === 'COURSE_FEE'}
                >
                  <option value="">{coursesLoading ? 'Loading available courses...' : 'Select a course'}</option>
                  {courses.map((c) => {
                    const courseId = c.id
                    const courseName = c.name
                    const fee = c.fee ? ` - ₹${c.fee}` : ''
                    return (
                      <option key={courseId} value={courseId}>
                        {courseName}{fee}
                      </option>
                    )
                  })}
                </select>
                {coursesLoading && (
                  <Loader className="absolute right-3 top-3 w-4 h-4 text-gray-400 animate-spin" />
                )}
              </div>
            </div>
          )}

          <div className="border-t border-gray-100 pt-4 mt-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-gray-700 font-medium">Total Amount</span>
              <span className="text-3xl font-bold text-indigo-600">₹{amount}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || (paymentType === 'COURSE_FEE' && !selectedCourse)}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <CreditCard className="w-5 h-5" />
            {loading ? '⏳ Processing...' : 'Proceed to Payment'}
          </button>
        </form>
      </div>
    </div>
  )
}
