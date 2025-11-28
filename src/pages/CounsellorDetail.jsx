import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { ArrowLeft, Users, TrendingUp, Mail, Phone, Calendar, AlertCircle, Loader } from 'lucide-react'

export default function CounsellorDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [counsellor, setCounsellor] = useState(null)
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    fetchCounsellorDetails()
  }, [id])

  const fetchCounsellorDetails = async () => {
    try {
      setError('')
      const res = await api.get(`/counsellors?id=${id}`)
      const data = res.data.data
      setCounsellor(data.counsellor)
      setLeads(data.leads || [])
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to fetch counsellor details'
      setError(errorMsg)
      console.error('Error fetching counsellor:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredAndSortedLeads = leads
    .filter(lead => filterStatus === 'all' || lead.application_status === filterStatus)
    .sort((a, b) => {
      if (sortBy === 'created_at') {
        return new Date(b.created_at) - new Date(a.created_at)
      }
      return 0
    })

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      case 'INTERVIEW_SCHEDULED':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-amber-100 text-amber-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ACCEPTED':
        return '✓'
      case 'REJECTED':
        return '✕'
      case 'INTERVIEW_SCHEDULED':
        return '◐'
      default:
        return '●'
    }
  }

  if (loading) {
    return (
      <div className="p-8 min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-blue-50 to-indigo-50">
        <div className="text-center">
          <Loader className="w-12 h-12 text-indigo-600 mx-auto animate-spin mb-4" />
          <p className="text-gray-600 text-sm font-medium">Loading counsellor details...</p>
        </div>
      </div>
    )
  }

  if (!counsellor) {
    return (
      <div className="p-8 min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-blue-50 to-indigo-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">{error || 'Counsellor not found'}</p>
          <button
            onClick={() => navigate('/counsellors')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
          >
            Back to Counsellors
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="sticky top-16 bg-white/80 backdrop-blur-sm z-40 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button
            onClick={() => navigate('/counsellors')}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium text-sm mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Counsellors
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{counsellor.name}</h1>
          <p className="text-sm text-gray-600 mt-1">Counsellor Profile & Assigned Leads</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-yellow-100 border border-yellow-300 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-yellow-800 font-semibold text-sm">{error}</p>
          </div>
        )}

        {/* Counsellor Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Basic Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-600 uppercase">Contact Email</h3>
              <Mail className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 break-all">{counsellor.email}</p>
          </div>

          {/* Active Leads */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-600 uppercase">Active Leads</h3>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-3xl font-bold text-indigo-600">{leads.length}</p>
            <p className="text-xs text-gray-600 mt-1">Currently assigned</p>
          </div>

          {/* Capacity Utilization */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-600 uppercase">Capacity</h3>
              <TrendingUp className="w-4 h-4 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {counsellor.assigned_count}/{counsellor.max_capacity}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  counsellor.utilization >= 80
                    ? 'bg-red-500'
                    : counsellor.utilization >= 50
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${counsellor.utilization}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {counsellor.utilization.toFixed(1)}% utilized
            </p>
          </div>

          {/* Available Slots */}
          <div className={`rounded-lg border-2 p-6 ${
            counsellor.available_slots > 0
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <h3 className="text-xs font-semibold text-gray-600 uppercase mb-3">Available Slots</h3>
            <p className={`text-3xl font-bold ${
              counsellor.available_slots > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {counsellor.available_slots}
            </p>
            <p className={`text-xs mt-1 ${
              counsellor.available_slots > 0 ? 'text-green-700' : 'text-red-700'
            }`}>
              {counsellor.available_slots === 0 ? 'At full capacity' : 'Can take more leads'}
            </p>
          </div>
        </div>

        {/* Leads Section */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Assigned Leads</h2>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
              {filteredAndSortedLeads.length}
            </span>
          </div>

          {/* Filters */}
          <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-600 mb-2">
                Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="NEW">New</option>
                <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-600 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="created_at">Latest First</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Leads Table */}
          <div className="overflow-x-auto">
            {filteredAndSortedLeads.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No leads assigned</p>
                <p className="text-gray-500 text-sm mt-1">
                  {filterStatus !== 'all' ? 'Try changing the filter' : 'Leads will appear here when assigned'}
                </p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Assigned Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAndSortedLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => navigate(`/leads/${lead.id}`)}
                          className="font-medium text-indigo-600 hover:text-indigo-800 text-sm"
                        >
                          {lead.name}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 truncate">{lead.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{lead.phone}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 text-xs font-semibold rounded inline-flex items-center gap-1 ${getStatusColor(lead.application_status)}`}>
                          {getStatusIcon(lead.application_status)}
                          {lead.application_status || 'NEW'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => navigate(`/leads/${lead.id}`)}
                          className="px-3 py-1.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
