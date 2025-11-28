import React, { useEffect, useState } from 'react'
import api from '../services/api'
import { CreditCard, TrendingUp, AlertCircle, CheckCircle, Clock, Search, Download } from 'lucide-react'

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPaymentType, setFilterPaymentType] = useState('all')

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      setError('')
      // Get all leads which contain payment information
      const response = await api.get('/leads')
      const leadsData = response.data.data || []
      
      // Fetch payment status for each lead
      const paymentRecords = await Promise.all(leadsData.map(async (lead) => {
        try {
          const paymentRes = await api.get(`/payment-status?student_id=${lead.id}`)
          console.log(`Payment status for student ${lead.id}:`, paymentRes.data)
          
          // Extract payment data from response: { status, message, data: { registration_status, course_status } }
          let paymentData = paymentRes.data?.data || {}
          
          // Handle double-wrapped data if needed
          if (paymentData && paymentData.data && !paymentData.registration_status) {
            paymentData = paymentData.data
          }
          
          console.log(`Extracted payment data for ${lead.name}:`, paymentData)
          
          return {
            id: lead.id,
            student_id: lead.id,
            student_name: lead.name,
            email: lead.email,
            phone: lead.phone,
            education: lead.education || '-',
            registration_fee_status: paymentData.registration_status || 'PENDING',
            course_fee_status: paymentData.course_status || 'PENDING',
            application_status: lead.application_status || 'NEW',
            created_at: lead.created_at,
          }
        } catch (err) {
          console.error(`Error fetching payment status for student ${lead.id}:`, err)
          // If payment status fetch fails, fallback to lead's registration_fee_status
          return {
            id: lead.id,
            student_id: lead.id,
            student_name: lead.name,
            email: lead.email,
            phone: lead.phone,
            education: lead.education || '-',
            registration_fee_status: lead.registration_fee_status || 'PENDING',
            course_fee_status: 'PENDING',
            application_status: lead.application_status || 'NEW',
            created_at: lead.created_at,
          }
        }
      }))
      
      console.log('Final payment records:', paymentRecords)
      setPayments(paymentRecords)
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to fetch payments'
      setError(errorMsg)
      console.error('Error fetching payments:', err)
      setPayments([])
    } finally {
      setLoading(false)
    }
  }

  const filteredPayments = payments.filter(p => {
    const matchesSearch =
      p.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone?.includes(searchTerm)
    
    let matchesFilter = true
    if (filterPaymentType !== 'all') {
      if (filterPaymentType === 'registration') {
        matchesFilter = p.registration_fee_status === 'PAID'
      } else if (filterPaymentType === 'course') {
        matchesFilter = p.course_fee_status === 'PAID'
      } else if (filterPaymentType === 'pending') {
        matchesFilter = p.registration_fee_status === 'PENDING' || p.course_fee_status === 'PENDING'
      }
    }
    
    return matchesSearch && matchesFilter
  })

  const stats = {
    registrationPaid: payments.filter(p => p.registration_fee_status === 'PAID').length,
    courseFeePaid: payments.filter(p => p.course_fee_status === 'PAID').length,
    pendingCount: payments.filter(p => p.registration_fee_status === 'PENDING' || p.course_fee_status === 'PENDING').length,
    totalStudents: payments.length,
  }

  const getStatusBadge = (status) => {
    const badges = {
      'PAID': { bg: 'bg-green-100', border: 'border-green-200', text: 'text-green-800', icon: CheckCircle, label: '✓ Paid' },
      'PENDING': { bg: 'bg-amber-100', border: 'border-amber-200', text: 'text-amber-800', icon: Clock, label: '⏳ Pending' },
      'FAILED': { bg: 'bg-red-100', border: 'border-red-200', text: 'text-red-800', icon: AlertCircle, label: '✕ Failed' },
      'NEW': { bg: 'bg-blue-100', border: 'border-blue-200', text: 'text-blue-800', icon: Clock, label: '📝 New' },
      'ACCEPTED': { bg: 'bg-green-100', border: 'border-green-200', text: 'text-green-800', icon: CheckCircle, label: '✓ Approved' },
      'REJECTED': { bg: 'bg-red-100', border: 'border-red-200', text: 'text-red-800', icon: AlertCircle, label: '✕ Rejected' },
    }
    const badge = badges[status] || badges.PENDING
    const Icon = badge.icon
    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1.5 ${badge.bg} ${badge.text} rounded-lg text-xs font-semibold border ${badge.border}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    )
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
          <p className="text-gray-600 text-sm mt-8 font-medium">Loading payments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="sticky top-16 bg-white/80 backdrop-blur-sm z-40 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-base font-bold text-gray-900">
                💳 Payment Status Tracker
              </h1>
              <p className="text-xs text-gray-600 font-medium">Monitor registration and course fee payments</p>
            </div>
            <button
              onClick={fetchPayments}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              🔄 Refresh Data
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-600 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-red-900">⚠️ Something went wrong</p>
              <p className="text-xs text-red-700 mt-1">{error}</p>
            </div>
            <button
              onClick={() => {
                setError('')
                fetchPayments()
              }}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-medium transition-colors duration-300 border border-red-300 flex-shrink-0"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-700 text-xs font-semibold uppercase tracking-wide">Registration Received</p>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-xl font-bold text-gray-900">{stats.registrationPaid}</p>
            <p className="text-xs text-gray-600 font-medium mt-2">students completed payment</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-700 text-xs font-semibold uppercase tracking-wide">Course Fee Received</p>
              <CreditCard className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-xl font-bold text-gray-900">{stats.courseFeePaid}</p>
            <p className="text-xs text-gray-600 font-medium mt-2">students enrolled</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-700 text-xs font-semibold uppercase tracking-wide">Payment Pending</p>
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-xl font-bold text-gray-900">{stats.pendingCount}</p>
            <p className="text-xs text-gray-600 font-medium mt-2">awaiting action</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-700 text-xs font-semibold uppercase tracking-wide">Total Students</p>
              <TrendingUp className="w-5 h-5 text-indigo-500" />
            </div>
            <p className="text-xl font-bold text-gray-900">{stats.totalStudents}</p>
            <p className="text-xs text-gray-600 font-medium mt-2">in system</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-64 relative">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search student by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterPaymentType}
              onChange={(e) => setFilterPaymentType(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 text-sm text-gray-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Payments</option>
              <option value="registration">Registration Received</option>
              <option value="course">Course Fee Received</option>
              <option value="pending">Payment Pending</option>
            </select>
          </div>
        </div>

        {/* Payments Table */}
        {filteredPayments.length > 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Student Name</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Email</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Phone</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Education</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Registration</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Course Fee</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2 text-xs text-gray-900 font-medium">{payment.student_name}</td>
                      <td className="px-3 py-2 text-xs text-gray-600 truncate">{payment.email}</td>
                      <td className="px-3 py-2 text-xs text-gray-600">{payment.phone}</td>
                      <td className="px-3 py-2 text-xs text-gray-600">{payment.education || '-'}</td>
                      <td className="px-3 py-2">
                        {getStatusBadge(payment.registration_fee_status)}
                      </td>
                      <td className="px-3 py-2">
                        {getStatusBadge(payment.course_fee_status)}
                      </td>
                      <td className="px-3 py-2">
                        {getStatusBadge(payment.application_status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <CreditCard className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-base font-bold text-gray-900 mb-2">No Students Found</h3>
            <p className="text-xs text-gray-600 font-medium">Adjust your search filters or create new students</p>
          </div>
        )}
      </div>
    </div>
  )
}
