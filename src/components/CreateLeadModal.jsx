import React, { useState } from 'react'
import api from '../services/api'
import { X, Upload, AlertCircle, CheckCircle, FileUp } from 'lucide-react'

export default function CreateLeadModal({ isOpen, onClose, onLeadCreated }) {
  const [tab, setTab] = useState('single')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    education: '',
    lead_source: 'website'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [bulkFile, setBulkFile] = useState(null)

  if (!isOpen) return null

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await api.post('/create-lead', formData)
      setSuccess(`Lead "${formData.name}" created successfully!`)
      setFormData({ name: '', email: '', phone: '', education: '', lead_source: 'website' })
      if (onLeadCreated) onLeadCreated()
      setTimeout(() => {
        setSuccess('')
        onClose()
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create lead')
    } finally {
      setLoading(false)
    }
  }

  const handleBulkUpload = async (e) => {
    e.preventDefault()
    if (!bulkFile) {
      setError('Please select a file')
      return
    }

    setLoading(true)
    setError('')

    try {
      const formDataWithFile = new FormData()
      formDataWithFile.append('file', bulkFile)
      
      // Send with multipart form data header
      await api.post('/upload-leads', formDataWithFile, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      setSuccess('Leads uploaded successfully!')
      setBulkFile(null)
      if (onLeadCreated) onLeadCreated()
      setTimeout(() => {
        setSuccess('')
        onClose()
      }, 2000)
    } catch (err) {
      console.error('Upload error:', err)
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to upload leads')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 scale-95">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">➕ Add New Student</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setTab('single')}
            className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-colors ${
              tab === 'single'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Single Lead
          </button>
          <button
            onClick={() => setTab('bulk')}
            className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-colors ${
              tab === 'bulk'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Bulk Upload
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success && (
            <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-600 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700 font-medium">{success}</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-600 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {tab === 'single' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-700 font-semibold uppercase tracking-wide mb-2">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-gray-700 font-semibold uppercase tracking-wide mb-2">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john@example.com"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-gray-700 font-semibold uppercase tracking-wide mb-2">Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="9876543210"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-gray-700 font-semibold uppercase tracking-wide mb-2">Background (Optional)</label>
                <input
                  type="text"
                  name="education"
                  value={formData.education}
                  onChange={handleInputChange}
                  placeholder="e.g., Bachelor of Technology, Master's in Science"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-2.5 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '⏳ Creating...' : '➕ Add Student'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleBulkUpload} className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <FileUp className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-700 font-medium mb-1">📁 Upload Excel File</p>
                <p className="text-xs text-gray-600 mb-3">Drag and drop or click to select</p>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setBulkFile(e.target.files[0])}
                  className="hidden"
                  id="file-input"
                />
                <label htmlFor="file-input" className="text-blue-600 font-semibold cursor-pointer hover:text-blue-700 text-sm">
                  Browse files
                </label>
                <p className="text-xs text-gray-500 mt-2">Supported: Excel (.xlsx, .xls)</p>
              </div>

              {bulkFile && (
                <div className="p-3 bg-blue-50 border-l-4 border-blue-600 rounded-lg">
                  <p className="text-sm text-blue-900 font-semibold">✓ Selected: {bulkFile.name}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !bulkFile}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-2.5 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '⏳ Uploading...' : '📤 Upload Students'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
