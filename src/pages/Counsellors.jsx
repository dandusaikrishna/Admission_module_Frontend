import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { Plus, Edit2, Trash2, Users, Zap, AlertCircle, Search, Filter, Phone, Mail, TrendingUp, Award } from 'lucide-react'

export default function Counsellors() {
  const navigate = useNavigate()
  const [counsellors, setCounsellors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCapacity, setFilterCapacity] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    max_capacity: 10
  })

  useEffect(() => {
    fetchCounsellors()
  }, [])

  const fetchCounsellors = async () => {
    try {
      setError('')
      const res = await api.get('/counsellors')
      setCounsellors(res.data.data || [])
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to fetch counsellors'
      setError(errorMsg)
      console.error('Error fetching counsellors:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddClick = () => {
    setEditingId(null)
    setFormData({
      name: '',
      email: '',
      phone: '',
      max_capacity: 10
    })
    setShowModal(true)
  }

  const handleEditClick = (counsellor) => {
    setEditingId(counsellor.id)
    setFormData({
      name: counsellor.name,
      email: counsellor.email,
      phone: counsellor.phone || '',
      max_capacity: counsellor.max_capacity
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        await api.put('/update-counsellor', {
          id: editingId,
          ...formData
        })
      } else {
        await api.post('/create-counsellor', formData)
      }
      setShowModal(false)
      fetchCounsellors()
    } catch (err) {
      alert(err.response?.data?.error || 'Error saving counsellor')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this counsellor?')) {
      try {
        await api.delete(`/delete-counsellor?id=${id}`)
        fetchCounsellors()
      } catch (err) {
        alert(err.response?.data?.error || 'Error deleting counsellor')
      }
    }
  }

  const filteredCounsellors = counsellors.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (filterCapacity === 'available') {
      return matchesSearch && c.available_slots > 0
    } else if (filterCapacity === 'full') {
      return matchesSearch && c.available_slots === 0
    }
    return matchesSearch
  })

  const stats = {
    total: counsellors.length,
    withAvailableSlots: counsellors.filter(c => c.available_slots > 0).length,
    totalLeads: counsellors.reduce((sum, c) => sum + c.active_leads, 0),
    totalCapacity: counsellors.reduce((sum, c) => sum + c.max_capacity, 0)
  }

  if (loading && counsellors.length === 0) {
    return (
      <div className="p-8 min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-gray-300"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 border-r-indigo-600 animate-spin"></div>
            </div>
          </div>
          <p className="text-gray-600 text-sm mt-8 font-medium">Loading counsellors...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="sticky top-16 bg-white/80 backdrop-blur-sm z-40 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Counsellors Management</h1>
              <p className="text-sm text-gray-600 font-medium mt-1">Manage admission counsellors and track their leads</p>
            </div>
            <button
              onClick={handleAddClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg font-semibold text-sm hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              Add Counsellor
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-semibold text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs font-semibold uppercase">Total Counsellors</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs font-semibold uppercase">Available Slots</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.withAvailableSlots}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs font-semibold uppercase">Total Leads</p>
                <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.totalLeads}</p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs font-semibold uppercase">Total Capacity</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{stats.totalCapacity}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 bg-white rounded-lg p-4 border border-gray-200 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 bg-white">
            <Filter className="w-4 h-4 text-gray-600" />
            <select
              value={filterCapacity}
              onChange={(e) => setFilterCapacity(e.target.value)}
              className="text-sm focus:outline-none bg-white"
            >
              <option value="all">All Counsellors</option>
              <option value="available">Available Slots</option>
              <option value="full">Full Capacity</option>
            </select>
          </div>
        </div>

        {filteredCounsellors.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-semibold text-lg">No counsellors found</p>
            <p className="text-gray-500 text-sm mt-1">Add your first counsellor to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCounsellors.map((counsellor) => (
              <div
                key={counsellor.id}
                className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                {/* Card Header Background */}
                <div className="h-2 bg-gradient-to-r from-indigo-600 to-blue-600"></div>

                {/* Card Content */}
                <div className="p-6">
                  {/* Name and Actions */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <button
                        onClick={() => navigate(`/counsellors/${counsellor.id}`)}
                        className="text-lg font-bold text-gray-900 hover:text-indigo-600 transition-colors text-left"
                      >
                        {counsellor.name}
                      </button>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditClick(counsellor)
                        }}
                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(counsellor.id)
                        }}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 mb-5 pb-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-600 truncate">{counsellor.email}</p>
                    </div>
                    {counsellor.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <p className="text-sm text-gray-600">{counsellor.phone}</p>
                      </div>
                    )}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 font-semibold">Assigned Leads</p>
                      <p className="text-2xl font-bold text-blue-600 mt-1">{counsellor.active_leads}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 font-semibold">Capacity</p>
                      <p className="text-2xl font-bold text-purple-600 mt-1">{counsellor.assigned_count}/{counsellor.max_capacity}</p>
                    </div>
                  </div>

                  {/* Utilization Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-700">Utilization</span>
                      <span className="text-xs font-bold text-gray-900">{counsellor.utilization.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${
                          counsellor.utilization >= 80
                            ? 'bg-gradient-to-r from-red-500 to-red-600'
                            : counsellor.utilization >= 50
                            ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                            : 'bg-gradient-to-r from-green-500 to-green-600'
                        }`}
                        style={{ width: `${counsellor.utilization}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Availability Status */}
                  <div className="flex items-center justify-between">
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                        counsellor.available_slots > 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      {counsellor.available_slots > 0 
                        ? `${counsellor.available_slots} slot${counsellor.available_slots > 1 ? 's' : ''} available`
                        : 'At capacity'
                      }
                    </div>
                  </div>

                  {/* View Details Button */}
                  <button
                    onClick={() => navigate(`/counsellors/${counsellor.id}`)}
                    className="w-full mt-4 px-4 py-2.5 bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-600 rounded-lg font-semibold text-sm hover:from-indigo-100 hover:to-blue-100 transition-all"
                  >
                    View Leads & Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {editingId ? 'Edit Counsellor' : 'Add New Counsellor'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  placeholder="Enter counsellor name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Maximum Capacity *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.max_capacity}
                  onChange={(e) => setFormData({ ...formData, max_capacity: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  placeholder="Enter max capacity"
                  required
                />
              </div>

              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all text-sm"
                >
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
