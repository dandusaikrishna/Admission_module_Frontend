import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { Search, Filter, Download, Plus, Phone, Mail, BookOpen, Users, Calendar, AlertCircle, Loader } from 'lucide-react'

export default function LeadListing() {
  const navigate = useNavigate()
  const [leads, setLeads] = useState([])
  const [filteredLeads, setFilteredLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSource, setFilterSource] = useState('all')
  const [sortBy, setSortBy] = useState('recent')

  useEffect(() => {
    fetchLeads()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [leads, searchTerm, filterStatus, filterSource, sortBy])

  const fetchLeads = async () => {
    try {
      setLoading(true)
      setError('')
      console.log('Fetching all leads...')
      const response = await api.get('/leads')
      console.log('API Response:', response.data)
      const leadsData = response.data.data || []
      setLeads(Array.isArray(leadsData) ? leadsData : [])
      console.log('Total leads loaded:', leadsData.length)
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to fetch leads'
      console.error('Error fetching leads:', err)
      setError(errorMsg)
      setLeads([])
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = leads

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(lead =>
        (lead.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (lead.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (lead.phone || '').includes(searchTerm)
      )
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(lead => lead.application_status === filterStatus)
    }

    // Lead source filter
    if (filterSource !== 'all') {
      filtered = filtered.filter(lead => lead.lead_source === filterSource)
    }

    // Sorting
    if (sortBy === 'recent') {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    }

    setFilteredLeads(filtered)
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'ACCEPTED': { bg: 'bg-gradient-to-r from-green-100 to-emerald-100', text: 'text-green-800', border: 'border-green-300', icon: '✓' },
      'REJECTED': { bg: 'bg-gradient-to-r from-red-100 to-pink-100', text: 'text-red-800', border: 'border-red-300', icon: '✕' },
      'INTERVIEW_SCHEDULED': { bg: 'bg-gradient-to-r from-purple-100 to-indigo-100', text: 'text-purple-800', border: 'border-purple-300', icon: '◐' },
      'PENDING_REVIEW': { bg: 'bg-gradient-to-r from-yellow-100 to-orange-100', text: 'text-yellow-800', border: 'border-yellow-300', icon: '⏳' },
      'NEW': { bg: 'bg-gradient-to-r from-blue-100 to-cyan-100', text: 'text-blue-800', border: 'border-blue-300', icon: '●' }
    }
    const config = statusMap[status] || statusMap['NEW']
    return (
      <span className={`px-3 py-1.5 text-xs font-semibold rounded-full border inline-flex items-center gap-1 ${config.bg} ${config.text} ${config.border}`}>
        {config.icon}
        {status || 'NEW'}
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
      <span className={`px-2 py-1 text-xs font-medium rounded ${config.color}`}>
        {source || 'Unknown'}
      </span>
    )
  }

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
          <p className="text-gray-600 text-lg font-medium">Loading leads...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="sticky top-16 bg-white/80 backdrop-blur-sm z-40 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">📋 Lead Listing</h1>
              <p className="text-sm text-gray-600 font-medium">Complete database of all student leads</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchLeads}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg transition-colors flex items-center gap-2"
              >
                🔄 Refresh
              </button>
              <div className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-lg font-medium text-sm">
                {filteredLeads.length} / {leads.length}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="NEW">New</option>
                  <option value="PENDING_REVIEW">Pending Review</option>
                  <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Lead Source</label>
                <select
                  value={filterSource}
                  onChange={(e) => setFilterSource(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Sources</option>
                  <option value="website">Website</option>
                  <option value="referral">Referral</option>
                  <option value="social-media">Social Media</option>
                  <option value="advertisement">Advertisement</option>
                  <option value="campus">Campus</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                >
                  <option value="recent">Most Recent</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Status</label>
                <select
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                  disabled
                >
                  <option>All Payment</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-900">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={fetchLeads}
              className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-semibold transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Leads Table */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {filteredLeads.length > 0 ? (
          <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Education</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Source</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Registration Fee</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLeads.map((lead, idx) => (
                    <tr key={lead.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => navigate(`/leads/${lead.id}`)}
                          className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline transition-colors"
                        >
                          {lead.name}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <a href={`mailto:${lead.email}`} className="hover:text-indigo-600 transition-colors">
                          {lead.email}
                        </a>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <a href={`tel:${lead.phone}`} className="hover:text-indigo-600 transition-colors">
                          {lead.phone || '-'}
                        </a>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{lead.education || '-'}</td>
                      <td className="px-6 py-4 text-sm">
                        {getSourceBadge(lead.lead_source)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {getStatusBadge(lead.application_status)}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          lead.registration_fee_status === 'PAID'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {lead.registration_fee_status || 'PENDING'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => navigate(`/leads/${lead.id}`)}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border-2 border-gray-200 p-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Leads Found</h3>
            <p className="text-gray-600">
              {searchTerm || filterStatus !== 'all' || filterSource !== 'all'
                ? 'No leads match your current filters. Try adjusting your search criteria.'
                : 'No leads available at the moment.'}
            </p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border-2 border-indigo-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
              <p className="text-xs text-gray-600 mb-1">Total Leads</p>
              <p className="text-2xl font-bold text-blue-600">{leads.length}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
              <p className="text-xs text-gray-600 mb-1">Accepted</p>
              <p className="text-2xl font-bold text-green-600">{leads.filter(l => l.application_status === 'ACCEPTED').length}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border-l-4 border-purple-500">
              <p className="text-xs text-gray-600 mb-1">Interviews</p>
              <p className="text-2xl font-bold text-purple-600">{leads.filter(l => l.application_status === 'INTERVIEW_SCHEDULED').length}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border-l-4 border-orange-500">
              <p className="text-xs text-gray-600 mb-1">Pending</p>
              <p className="text-2xl font-bold text-orange-600">{leads.filter(l => l.application_status === 'NEW').length}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border-l-4 border-green-600">
              <p className="text-xs text-gray-600 mb-1">Fee Paid</p>
              <p className="text-2xl font-bold text-green-600">{leads.filter(l => l.registration_fee_status === 'PAID').length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
