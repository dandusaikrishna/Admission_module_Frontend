import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import CreateLeadModal from '../components/CreateLeadModal'
import ApplicationActionModal from '../components/ApplicationActionModal'
import ScheduleInterviewModal from '../components/ScheduleInterviewModal'
import { Users, Plus, Search, Mail, Phone, Calendar, Download, AlertCircle, ExternalLink, TrendingUp, Filter } from 'lucide-react'

export default function Leads() {
  const navigate = useNavigate()
  const [leads, setLeads] = useState([])
  const [filteredLeads, setFilteredLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSource, setFilterSource] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showApplicationModal, setShowApplicationModal] = useState(false)
  const [showInterviewModal, setShowInterviewModal] = useState(false)
  const [selectedLead, setSelectedLead] = useState(null)

  useEffect(() => {
    fetchLeads()
    
    // Refresh leads when user returns to this page/tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchLeads()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Also refresh every 10 seconds to catch payment updates
    const refreshInterval = setInterval(fetchLeads, 10000)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearInterval(refreshInterval)
    }
  }, [])

  useEffect(() => {
    applyFilters()
  }, [leads, searchTerm, filterStatus, filterSource, sortBy])

  const fetchLeads = async () => {
    try {
      setLoading(true)
      setError('')
      // Add cache buster to force fresh data from server
      const response = await api.get('/leads', {
        params: { _t: Date.now() }
      })
      const leadsData = response.data.data || []
      console.log('Fetched leads with payment status:', leadsData.map(l => ({ name: l.name, status: l.registration_fee_status })))
      setLeads(Array.isArray(leadsData) ? leadsData : [])
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to fetch leads'
      setError(errorMsg)
      console.error('Error fetching leads:', err)
      setLeads([])
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = leads

    if (searchTerm.trim()) {
      filtered = filtered.filter(lead =>
        (lead.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (lead.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (lead.phone || '').includes(searchTerm)
      )
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(lead => lead.application_status === filterStatus)
    }

    if (filterSource !== 'all') {
      filtered = filtered.filter(lead => lead.lead_source === filterSource)
    }

    if (sortBy === 'recent') {
      filtered.sort((a, b) => a.id - b.id)
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => b.id - a.id)
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    }

    setFilteredLeads(filtered)
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'ACCEPTED': { bg: 'bg-green-100', text: 'text-green-800', icon: '✓' },
      'REJECTED': { bg: 'bg-red-100', text: 'text-red-800', icon: '✕' },
      'INTERVIEW_SCHEDULED': { bg: 'bg-blue-100', text: 'text-blue-800', icon: '◐' },
      'PENDING_REVIEW': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⏳' },
      'NEW': { bg: 'bg-amber-100', text: 'text-amber-800', icon: '●' }
    }
    const config = statusMap[status] || statusMap['NEW']
    return (
      <span className={`px-2 py-0.5 text-xs font-semibold rounded inline-block ${config.bg} ${config.text}`}>
        {config.icon} {status || 'NEW'}
      </span>
    )
  }

  const getSourceBadge = (source) => {
    const sourceMap = {
      'website': { color: 'bg-blue-100 text-blue-800' },
      'referral': { color: 'bg-purple-100 text-purple-800' },
      'social-media': { color: 'bg-pink-100 text-pink-800' },
      'advertisement': { color: 'bg-orange-100 text-orange-800' },
      'campus': { color: 'bg-green-100 text-green-800' }
    }
    const config = sourceMap[source] || { color: 'bg-gray-100 text-gray-800' }
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded ${config.color}`}>
        {source || 'Unknown'}
      </span>
    )
  }

  const getPaymentBadge = (status) => {
    return status === 'PAID' 
      ? <span className="px-2 py-0.5 text-xs font-semibold rounded inline-block bg-green-100 text-green-800">✓ PAID</span>
      : <span className="px-2 py-0.5 text-xs font-semibold rounded inline-block bg-orange-100 text-orange-800">⏳ PENDING</span>
  }

  const getStatusColors = (status) => {
    const colors = {
      'ACCEPTED': { bg: 'bg-white', border: 'border-green-200', badge: 'bg-green-100 text-green-800 border-green-200' },
      'REJECTED': { bg: 'bg-white', border: 'border-red-200', badge: 'bg-red-100 text-red-800 border-red-200' },
      'INTERVIEW_SCHEDULED': { bg: 'bg-white', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
      'NEW': { bg: 'bg-white', border: 'border-gray-200', badge: 'bg-amber-100 text-amber-800 border-amber-200' }
    }
    return colors[status] || colors.NEW
  }

  const getStatusIcon = (status) => {
    const icons = {
      'ACCEPTED': '✓',
      'REJECTED': '✕',
      'INTERVIEW_SCHEDULED': '◐',
      'NEW': '●'
    }
    return icons[status] || '●'
  }

  const stats = {
    total: leads.length,
    accepted: leads.filter(l => l.application_status === 'ACCEPTED').length,
    interviews: leads.filter(l => l.application_status === 'INTERVIEW_SCHEDULED').length,
    pending: leads.filter(l => l.application_status === 'NEW').length,
    paid: leads.filter(l => l.registration_fee_status === 'PAID').length
  }
  
  console.log('Stats updated:', stats)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-50 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center mb-6">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-gray-300"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 border-r-indigo-600 animate-spin"></div>
            </div>
          </div>
          <p className="text-gray-600 text-sm font-medium">Loading leads...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="sticky top-16 bg-white/80 backdrop-blur-sm z-40 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <div>
              <h1 className="text-base font-bold text-gray-900">
                👥 All Leadsd
              </h1>
              <p className="text-xs text-gray-600 font-medium">View and manage all student applications</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchLeads}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1"
              >
                🔄 Refresh
              </button>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-xs hover:shadow-lg transition-all duration-300"
              >
                <Plus className="w-4 h-4" />
                Add Lead
              </button>
            </div>
          </div>

          {/* Stats Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-0">
            <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs text-gray-700 font-semibold uppercase tracking-wide mb-1">Total Leads</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs text-gray-700 font-semibold uppercase tracking-wide mb-1">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs text-gray-700 font-semibold uppercase tracking-wide mb-1">Interview</p>
              <p className="text-2xl font-bold text-purple-600">{stats.interviews}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs text-gray-700 font-semibold uppercase tracking-wide mb-1">Under Review</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs text-gray-700 font-semibold uppercase tracking-wide mb-1">Payment Received</p>
              <p className="text-2xl font-bold text-teal-600">{stats.paid}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-600 rounded-lg flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-red-900 mb-1 uppercase tracking-wide">Something went wrong</p>
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </div>
            <button
              onClick={() => {
                setError('')
                fetchLeads()
              }}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg text-xs transition-colors whitespace-nowrap ml-4"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="space-y-3 mb-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 text-sm"
            />
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 text-sm"
            >
              <option value="all">All Status</option>
              <option value="NEW">New</option>
              <option value="PENDING_REVIEW">Under Review</option>
              <option value="INTERVIEW_SCHEDULED">Interview</option>
              <option value="ACCEPTED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 text-sm"
            >
              <option value="all">All Sources</option>
              <option value="website">Website</option>
              <option value="referral">Referral</option>
              <option value="social-media">Social Media</option>
              <option value="advertisement">Ad</option>
              <option value="campus">Campus</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 text-sm"
            >
              <option value="recent">Recent</option>
              <option value="oldest">Oldest</option>
              <option value="name">Name (A-Z)</option>
            </select>

            <button className="px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg transition-all font-medium text-gray-700 text-sm">
              <Download className="w-4 h-4 inline mr-1" />
              Export
            </button>
          </div>
        </div>

        {/* Grid View */}
        {filteredLeads.length > 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Name</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Email</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Phone</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Education</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Source</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Counselor</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Joined</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLeads.map((lead, idx) => (
                    <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
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
                      <td className="px-3 py-2">{getSourceBadge(lead.lead_source)}</td>
                      <td className="px-3 py-2 text-gray-700 text-xs truncate" title={lead.counselor_name || 'Unassigned'}>{lead.counselor_name || '-'}</td>
                      <td className="px-3 py-2">{getStatusBadge(lead.application_status)}</td>
                      <td className="px-3 py-2 text-gray-700 text-xs">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => navigate(`/leads/${lead.id}`)}
                            className="px-2 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs font-medium transition-all whitespace-nowrap"
                            title="View Details"
                          >
                            View
                          </button>
                          <button
                            onClick={() => {
                              setSelectedLead(lead)
                              setShowApplicationModal(true)
                            }}
                            className="px-2 py-0.5 bg-green-100 hover:bg-green-200 text-green-700 rounded text-xs font-medium transition-all whitespace-nowrap"
                          >
                            Review
                          </button>
                          <button
                            onClick={() => {
                              setSelectedLead(lead)
                              setShowInterviewModal(true)
                            }}
                            className="px-2 py-0.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded text-xs font-medium transition-all whitespace-nowrap"
                          >
                            Meet
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">No Students Found</h3>
            <p className="text-sm text-gray-600">No students match your search criteria. Try adjusting your filters.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateLeadModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onLeadCreated={fetchLeads}
      />
      <ApplicationActionModal
        isOpen={showApplicationModal}
        onClose={() => {
          setShowApplicationModal(false)
          setSelectedLead(null)
        }}
        lead={selectedLead}
        onActionCompleted={fetchLeads}
      />
      <ScheduleInterviewModal
        isOpen={showInterviewModal}
        onClose={() => {
          setShowInterviewModal(false)
          setSelectedLead(null)
        }}
        lead={selectedLead}
        onInterviewScheduled={fetchLeads}
      />
    </div>
  )
}
