import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import ApplicationActionModal from '../components/ApplicationActionModal'
import { User, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'

export default function Reviews() {
  const navigate = useNavigate()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedLead, setSelectedLead] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    try {
      setLoading(true)
      setError('')
      console.log('Fetching leads from /leads endpoint...')
      const response = await api.get('/leads')
      console.log('API Response:', response)
      const allLeads = response.data.data || response.data || []
      console.log('All leads from API:', allLeads)
      console.log('Total leads:', allLeads.length)
      
      // Show all leads in application reviews
      setLeads(allLeads)
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to fetch applications'
      console.error('Error fetching leads:', err)
      setError(errorMsg)
      setLeads([])
    } finally {
      setLoading(false)
    }
  }

  const handleReviewClick = (lead) => {
    console.log('Review clicked for lead:', lead)
    console.log('Setting selectedLead to:', lead)
    console.log('Setting isModalOpen to: true')
    setSelectedLead(lead)
    setIsModalOpen(true)
    // Verify state was set
    console.log('After setState - modal should be visible')
  }

  const handleActionCompleted = () => {
    console.log('Action completed, refetching leads...')
    setTimeout(() => {
      fetchLeads()
    }, 1000)
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'ACCEPTED': { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: '✓ Approved' },
      'REJECTED': { icon: XCircle, color: 'bg-red-100 text-red-800', label: '✕ Rejected' },
      'NEW': { icon: Clock, color: 'bg-blue-100 text-blue-800', label: '📝 New App' },
      'PENDING_REVIEW': { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: '⏳ Review' }
    }
    
    const config = statusMap[status] || statusMap['NEW']
    const Icon = config.icon
    
    return (
      <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 ${config.color} text-xs font-semibold rounded`}>
        <Icon className="w-3 h-3" />
        {config.label}
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
          <p className="text-gray-600 text-sm mt-8 font-medium">Loading applications...</p>
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
                📋 Review Applications
              </h1>
              <p className="text-xs text-gray-600 font-medium">Review student applications and make approval decisions</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-lg font-semibold">
                {leads.length} {leads.length === 1 ? 'Application' : 'Applications'}
              </div>
              <button
                onClick={fetchLeads}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-600 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-900">⚠️ Something went wrong</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button
              onClick={() => {
                setError('')
                fetchLeads()
              }}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-sm font-semibold transition-colors duration-300 border border-red-300 flex-shrink-0"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Applications List */}
        {leads.length > 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Name</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Email</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Phone</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Education</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Counselor</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Joined</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {leads.map((lead, idx) => (
                    <tr key={lead.id || idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2">
                        <button
                          onClick={() => navigate(`/leads/${lead.id}`)}
                          className="text-indigo-600 hover:text-indigo-800 font-medium text-xs"
                        >
                          {lead.name}
                        </button>
                      </td>
                      <td className="px-3 py-2 text-gray-700 text-xs truncate">{lead.email}</td>
                      <td className="px-3 py-2 text-gray-700 text-xs">{lead.phone || '-'}</td>
                      <td className="px-3 py-2 text-gray-700 text-xs">{lead.education || '-'}</td>
                      <td className="px-3 py-2 text-gray-700 text-xs truncate" title={lead.counselor_name || 'Unassigned'}>{lead.counselor_name || '-'}</td>
                      <td className="px-3 py-2">{getStatusBadge(lead.application_status)}</td>
                      <td className="px-3 py-2 text-gray-700 text-xs">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => handleReviewClick(lead)}
                          className="px-2 py-0.5 bg-green-100 hover:bg-green-200 text-green-700 rounded text-xs font-medium transition-all whitespace-nowrap"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center shadow-sm">
            <CheckCircle className="w-16 h-16 mx-auto text-green-400 mb-4" />
            <h3 className="text-base font-bold text-gray-900 mb-2">✓ All Caught Up!</h3>
            <p className="text-xs text-gray-600 font-medium">No applications waiting for review at the moment</p>
            <p className="text-gray-500 text-xs mt-4">Check back later when new applications arrive.</p>
            {process.env.NODE_ENV === 'development' && (
              <p className="text-gray-400 text-xs mt-4">Debug: applications = {leads.length}</p>
            )}
          </div>
        )}
      </div>

      {/* Application Action Modal */}
      {console.log('Reviews page render - isModalOpen:', isModalOpen, 'selectedLead:', selectedLead)}
      <ApplicationActionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        lead={selectedLead}
        onActionCompleted={handleActionCompleted}
      />
    </div>
  )
}
