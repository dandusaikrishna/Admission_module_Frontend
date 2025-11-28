import React, { useState } from 'react'
import api from '../services/api'
import { X, AlertCircle, CheckCircle, Calendar, Link as LinkIcon } from 'lucide-react'

export default function ScheduleInterviewModal({ isOpen, onClose, lead, onInterviewScheduled }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [meetLink, setMeetLink] = useState('')

  if (!isOpen || !lead) return null

  const handleSchedule = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await api.post('/schedule-meet', {
        student_id: lead.id
      })
      setMeetLink(response.data.meet_link)
      setSuccess('Interview scheduled successfully!')
      if (onInterviewScheduled) onInterviewScheduled()
      setTimeout(() => {
        setSuccess('')
        onClose()
      }, 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to schedule interview')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 scale-95">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-blue-50">
          <h2 className="text-lg font-semibold text-gray-900">📅 Schedule Interview</h2>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSchedule} className="p-6 space-y-4">
          {success && (
            <div className="p-4 bg-green-50 border-l-4 border-green-600 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-green-900">✓ {success}</p>
                {meetLink && (
                  <div className="mt-2">
                    <p className="text-xs text-green-700 font-medium mb-1">Meeting Link:</p>
                    <a
                      href={meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-green-600 hover:text-green-700 break-all bg-green-100 px-2 py-1 rounded"
                    >
                      {meetLink}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-600 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="bg-blue-50 border-l-4 border-blue-600 rounded-lg p-4">
              <p className="text-xs text-gray-700 font-medium mb-2">
                <span className="font-semibold text-gray-900">👤 Student:</span> {lead.name}
              </p>
              <p className="text-xs text-gray-700 font-medium mb-2">
                <span className="font-semibold text-gray-900">✉️ Email:</span> {lead.email}
              </p>
              <p className="text-xs text-gray-700 font-medium">
                <span className="font-semibold text-gray-900">📞 Phone:</span> {lead.phone}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-l-4 border-purple-600 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-purple-600 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-600 font-medium">Interview Time</p>
                  <p className="text-sm font-medium text-gray-900">Scheduled for 1 hour from now</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <LinkIcon className="w-5 h-5 text-purple-600 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-600 font-medium">Platform</p>
                  <p className="text-sm font-medium text-gray-900">Google Meet (Virtual)</p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border-l-4 border-amber-600 rounded-lg p-3">
              <p className="text-xs text-amber-900 font-medium">
                <span className="font-semibold">ℹ️ Note:</span> A Google Meet link will be created and the student will receive a notification with the meeting details.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Calendar className="w-5 h-5" />
            {loading ? '⏳ Scheduling...' : '📅 Schedule Interview'}
          </button>
        </form>
      </div>
    </div>
  )
}
