import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { ArrowLeft, AlertCircle, CheckCircle, CreditCard, Loader, Phone, Mail, BookOpen, Users, Calendar } from 'lucide-react'

export default function LeadDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lead, setLead] = useState(null)
  const [paymentStatus, setPaymentStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [paymentType, setPaymentType] = useState('REGISTRATION')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [courses, setCourses] = useState([])
  const [coursesLoading, setCoursesLoading] = useState(false)
  const [initiatingPayment, setInitiatingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [paymentSuccess, setPaymentSuccess] = useState('')

  // Fetch lead details and payment status
  useEffect(() => {
    fetchLead()
  }, [id])

  // Fetch courses when payment type changes to COURSE_FEE
  useEffect(() => {
    if (paymentType === 'COURSE_FEE') {
      fetchCourses()
    } else {
      setCourses([])
      setSelectedCourse('')
    }
  }, [paymentType])

  const fetchLead = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await api.get('/leads')
      const allLeads = response.data.data || response.data || []
      const foundLead = allLeads.find(l => String(l.id) === String(id))
      if (foundLead) {
        setLead(foundLead)
        // Fetch payment status for this lead
        try {
          const paymentRes = await api.get(`/payment-status?student_id=${foundLead.id}`)
          console.log('Payment Status API Response:', paymentRes.data)
          
          // Extract from response structure: { status, message, data: {...} }
          let paymentStatusData = paymentRes.data?.data
          
          // Handle double-wrapped data (if backend still returns data: {data: {...}})
          if (paymentStatusData && paymentStatusData.data && !paymentStatusData.registration_status) {
            paymentStatusData = paymentStatusData.data
          }
          
          console.log('Extracted payment data:', paymentStatusData)
          
          setPaymentStatus(paymentStatusData || {
            registration_status: 'PENDING',
            course_status: 'PENDING'
          })
        } catch (payErr) {
          console.error('Error fetching payment status:', payErr)
          setPaymentStatus({
            registration_status: 'PENDING',
            course_status: 'PENDING'
          })
        }
      } else {
        setError('Lead not found')
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch lead details')
    } finally {
      setLoading(false)
    }
  }

  const fetchCourses = async () => {
    try {
      setCoursesLoading(true)
      const res = await api.get('/courses')
      let list = []
      if (res?.data?.data && Array.isArray(res.data.data)) {
        list = res.data.data
      } else if (Array.isArray(res?.data)) {
        list = res.data
      }
      list = list.filter(c => c?.id && (c?.name || c?.title))
      setCourses(list)
    } catch (err) {
      setPaymentError('Unable to load courses')
    } finally {
      setCoursesLoading(false)
    }
  }

  const handleInitiatePayment = async () => {
    setPaymentError('')
    setPaymentSuccess('')

    try {
      if (!lead?.id) {
        throw new Error('Invalid lead data')
      }

      if (paymentType === 'COURSE_FEE' && !selectedCourse) {
        throw new Error('Please select a course')
      }

      const amount = paymentType === 'REGISTRATION' ? 1870 : (courses.find(c => String(c.id) === String(selectedCourse))?.fee || 0)

      const payload = {
        student_id: lead.id,
        payment_type: paymentType,
        amount: amount,
        course_id: paymentType === 'COURSE_FEE' ? Number(selectedCourse) : null
      }

      setInitiatingPayment(true)
      const response = await api.post('/initiate-payment', payload)
      
      // Get the order details from response
      const orderData = response.data?.data || {}
      const orderID = orderData.order_id || orderData.orderID
      const currency = orderData.currency || 'INR'
      const orderAmount = orderData.amount || (amount * 100) // Convert to paise if needed

      if (!orderID) {
        throw new Error('Failed to get order ID from server')
      }

      // Open Razorpay checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_key',
        amount: orderAmount,
        currency: currency,
        name: 'Admission Portal',
        description: paymentType === 'REGISTRATION' ? 'Registration Fee' : 'Course Fee',
        order_id: orderID,
        handler: async function (paymentResponse) {
          try {
            // Verify payment on backend
            const verifyPayload = {
              order_id: orderID,
              payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature
            }
            
            await api.post('/verify-payment', verifyPayload)
            setPaymentSuccess('Payment completed successfully!')
            
            // Refresh payment status after a short delay to allow webhook processing
            setTimeout(() => {
              fetchLead()
            }, 2000)
            
            // Redirect after longer delay
            setTimeout(() => {
              navigate('/leads')
            }, 4000)
          } catch (verifyErr) {
            setPaymentError('Payment verification failed. Please contact support.')
            console.error('Payment verification error:', verifyErr)
          }
        },
        prefill: {
          name: lead.name || '',
          email: lead.email || '',
          contact: lead.phone || ''
        },
        theme: {
          color: '#2563eb'
        },
        modal: {
          ondismiss: function () {
            setPaymentError('Payment cancelled by user')
          }
        }
      }

      // Load Razorpay script and open checkout
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => {
        const razorpay = new window.Razorpay(options)
        razorpay.open()
      }
      script.onerror = () => {
        setPaymentError('Failed to load payment gateway. Please try again.')
      }
      document.body.appendChild(script)

      setInitiatingPayment(false)
    } catch (err) {
      const serverMsg = err?.response?.data?.error || err?.response?.data?.message
      setPaymentError(serverMsg || err.message || 'Failed to initiate payment')
      setInitiatingPayment(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-50 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-gray-300"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 border-r-indigo-600 animate-spin"></div>
            </div>
          </div>
          <p className="text-gray-600 text-sm mt-8 font-medium">Loading lead details...</p>
        </div>
      </div>
    )
  }

  if (error && !lead) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-50 p-8">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate('/leads')}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Leads
          </button>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-center gap-4">
            <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-900">Error</p>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/leads')}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Leads
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lead Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-gray-200 p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{lead?.name || 'Unknown'}</h1>
                    <p className="text-sm text-gray-600 font-medium mt-1">Email: {lead?.email || '-'}</p>
                    <p className="text-sm text-gray-600 font-medium">Phone: {lead?.phone || '-'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600 font-medium mb-2">Assigned Counselor</p>
                    <p className="text-base font-bold text-indigo-600">{lead?.counselor_name || 'Unassigned'}</p>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="p-6 space-y-6">
                {/* Basic Information */}
                <div className="border-b border-gray-200 pb-6">
                  <h2 className="text-sm font-semibold text-gray-900 mb-4">Basic Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <Mail className="w-4 h-4 text-indigo-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Email Address</p>
                        <p className="text-xs font-medium text-gray-900 mt-1">{lead?.email || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="w-4 h-4 text-indigo-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Phone Number</p>
                        <p className="text-xs font-medium text-gray-900 mt-1">{lead?.phone || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Counselor Information */}
                <div className="border-b border-gray-200 pb-6">
                  <h2 className="text-sm font-semibold text-gray-900 mb-4">Assigned Counselor</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <Users className="w-4 h-4 text-indigo-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Name</p>
                        <p className="text-xs font-medium text-gray-900 mt-1">{lead?.counselor_name || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="w-4 h-4 text-indigo-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Email Address</p>
                        <p className="text-xs font-medium text-gray-900 mt-1">{lead?.counselor_email || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="w-4 h-4 text-indigo-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Phone Number</p>
                        <p className="text-xs font-medium text-gray-900 mt-1">{lead?.counselor_phone || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Background & Details */}
                <div className="border-b border-gray-200 pb-6">
                  <h2 className="text-sm font-semibold text-gray-900 mb-4">Background & Source</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Education Level</p>
                      <p className="text-xs font-medium text-gray-900 mt-1">{lead?.education || '-'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Lead Source</p>
                      <p className="text-xs font-medium text-gray-900 mt-1 capitalize">{lead?.lead_source || '-'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Joined On</p>
                      <p className="text-xs font-medium text-gray-900 mt-1">{new Date(lead?.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>
                </div>

                {/* Payment Status */}
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 mb-4">Payment Status</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className={`p-4 rounded-lg border-2 ${paymentStatus?.registration_status === 'PAID' ? 'bg-green-50 border-green-300' : 'bg-amber-50 border-amber-300'}`}>
                      <p className={`text-xs font-semibold uppercase tracking-wide ${paymentStatus?.registration_status === 'PAID' ? 'text-green-700' : 'text-amber-700'}`}>Registration Fee</p>
                      <p className={`text-2xl font-bold mt-2 ${paymentStatus?.registration_status === 'PAID' ? 'text-green-900' : 'text-amber-900'}`}>
                        {paymentStatus?.registration_status === 'PAID' ? '✓ Paid' : '⏳ Pending'}
                      </p>
                      <p className={`text-xs mt-1 ${paymentStatus?.registration_status === 'PAID' ? 'text-green-700' : 'text-amber-700'}`}>₹1,870</p>
                    </div>
                    <div className={`p-4 rounded-lg border-2 ${paymentStatus?.course_status === 'PAID' ? 'bg-green-50 border-green-300' : 'bg-amber-50 border-amber-300'}`}>
                      <p className={`text-xs font-semibold uppercase tracking-wide ${paymentStatus?.course_status === 'PAID' ? 'text-green-700' : 'text-amber-700'}`}>Course Fee</p>
                      <p className={`text-2xl font-bold mt-2 ${paymentStatus?.course_status === 'PAID' ? 'text-green-900' : 'text-amber-900'}`}>
                        {paymentStatus?.course_status === 'PAID' ? '✓ Paid' : '⏳ Pending'}
                      </p>
                      <p className={`text-xs mt-1 ${paymentStatus?.course_status === 'PAID' ? 'text-green-700' : 'text-amber-700'}`}>Varies</p>
                    </div>
                  </div>
                </div>

                {/* Status & Dates */}
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 mb-4">Application Status</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Status</p>
                      <p className="text-sm font-bold text-blue-900 mt-2">{lead?.application_status ? lead.application_status.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') : 'New'}</p>
                    </div>
                    {lead?.meet_link && (
                      <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                        <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wide">Interview Link</p>
                        <a 
                          href={lead.meet_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm font-bold text-indigo-900 mt-2 underline hover:text-indigo-700 truncate"
                        >
                          Join Meeting
                        </a>
                        {lead?.interview_scheduled_at && (
                          <p className="text-xs text-indigo-600 mt-2">
                            {new Date(lead.interview_scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })} • {new Date(lead.interview_scheduled_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div>
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-semibold text-gray-900">Payment Options</h2>
                {paymentStatus?.registration_status === 'PAID' && paymentType === 'REGISTRATION' && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">✓ Already Paid</span>
                )}
                {paymentStatus?.course_status === 'PAID' && paymentType === 'COURSE_FEE' && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">✓ Already Paid</span>
                )}
              </div>

              {paymentError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700">{paymentError}</p>
                </div>
              )}

              {paymentSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-green-700">{paymentSuccess}</p>
                </div>
              )}

              {/* Payment Type Selection */}
              <div className="space-y-2 mb-5">
                <label className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  paymentStatus?.registration_status === 'PAID' ? 'opacity-60 cursor-not-allowed' : ''
                }`}
                  style={{
                    borderColor: paymentType === 'REGISTRATION' ? '#2563eb' : '#e5e7eb',
                    backgroundColor: paymentType === 'REGISTRATION' ? '#eff6ff' : 'transparent'
                  }}>
                  <input
                    type="radio"
                    name="paymentType"
                    value="REGISTRATION"
                    checked={paymentType === 'REGISTRATION'}
                    onChange={(e) => {
                      setPaymentType(e.target.value)
                      setPaymentError('')
                    }}
                    disabled={paymentStatus?.registration_status === 'PAID'}
                    className="w-4 h-4"
                  />
                  <div className="ml-3 flex-1">
                    <p className="text-xs font-medium text-gray-900">Registration Fee</p>
                    <p className="text-xs text-gray-600">{paymentStatus?.registration_status === 'PAID' ? '✓ Paid' : '₹1,870'}</p>
                  </div>
                </label>

                <label className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  paymentStatus?.course_status === 'PAID' ? 'opacity-60 cursor-not-allowed' : ''
                }`}
                  style={{
                    borderColor: paymentType === 'COURSE_FEE' ? '#2563eb' : '#e5e7eb',
                    backgroundColor: paymentType === 'COURSE_FEE' ? '#eff6ff' : 'transparent'
                  }}>
                  <input
                    type="radio"
                    name="paymentType"
                    value="COURSE_FEE"
                    checked={paymentType === 'COURSE_FEE'}
                    onChange={(e) => {
                      setPaymentType(e.target.value)
                      setPaymentError('')
                    }}
                    disabled={paymentStatus?.course_status === 'PAID'}
                    className="w-4 h-4"
                  />
                  <div className="ml-3 flex-1">
                    <p className="text-xs font-medium text-gray-900">Course Fee</p>
                    <p className="text-xs text-gray-600">{paymentStatus?.course_status === 'PAID' ? '✓ Paid' : selectedCourse ? `₹${courses.find(c => String(c.id) === String(selectedCourse))?.fee || 0}` : 'Select course'}</p>
                  </div>
                </label>
              </div>

              {/* Course Selection */}
              {paymentType === 'COURSE_FEE' && paymentStatus?.course_status !== 'PAID' && (
                <div className="mb-5">
                  <label className="block text-xs text-gray-700 font-semibold uppercase tracking-wide mb-2">Select Course *</label>
                  <div className="relative">
                    <select
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      disabled={coursesLoading || courses.length === 0}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">{coursesLoading ? 'Loading courses...' : 'Choose a course'}</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} - ₹{c.fee}
                        </option>
                      ))}
                    </select>
                    {coursesLoading && (
                      <Loader className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 animate-spin" />
                    )}
                  </div>
                </div>
              )}

              {/* Amount Display */}
              {(paymentStatus?.registration_status !== 'PAID' && paymentType === 'REGISTRATION') || 
               (paymentStatus?.course_status !== 'PAID' && paymentType === 'COURSE_FEE') ? (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-5">
                  <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wide mb-1">Total Amount</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    ₹{paymentType === 'REGISTRATION' ? '1,870' : (courses.find(c => String(c.id) === String(selectedCourse))?.fee || '0')}
                  </p>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-5">
                  <p className="text-xs text-green-600 font-semibold uppercase tracking-wide">Payment Status</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">✓ Already Paid</p>
                </div>
              )}

              {/* Payment Button */}
              <button
                onClick={handleInitiatePayment}
                disabled={
                  initiatingPayment || 
                  (paymentType === 'COURSE_FEE' && !selectedCourse) ||
                  (paymentType === 'REGISTRATION' && paymentStatus?.registration_status === 'PAID') ||
                  (paymentType === 'COURSE_FEE' && paymentStatus?.course_status === 'PAID')
                }
                className={`w-full text-white font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 text-sm ${
                  (paymentStatus?.registration_status === 'PAID' && paymentType === 'REGISTRATION') ||
                  (paymentStatus?.course_status === 'PAID' && paymentType === 'COURSE_FEE')
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:shadow-lg disabled:opacity-50'
                }`}
              >
                {initiatingPayment ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (paymentStatus?.registration_status === 'PAID' && paymentType === 'REGISTRATION') ||
                     (paymentStatus?.course_status === 'PAID' && paymentType === 'COURSE_FEE') ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Already Paid
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Initiate Payment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
