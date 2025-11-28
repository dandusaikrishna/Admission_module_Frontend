import React, { useEffect, useState } from 'react'
import api from '../services/api'
import { BookOpen, Users, DollarSign, Clock, Star, Plus, X, AlertCircle } from 'lucide-react'

export default function Courses() {
  // ============ Data State ============
  const [courses, setCourses] = useState([])

  // ============ Loading State ============
  const [loading, setLoading] = useState(true)

  // ============ Error State ============
  const [pageError, setPageError] = useState('')
  const [formError, setFormError] = useState('')

  // ============ Course Form Modal State ============
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: '',
    fee: ''
  })
  const [isFormSubmitting, setIsFormSubmitting] = useState(false)

  // ============ Delete Confirmation Modal State ============
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [courseToDelete, setCourseToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    loadAllCourses()
  }, [])

  // ============ Error Handler Utility ============
  const getErrorMessage = (err) => {
    // Network errors
    if (!err.response) {
      if (err.message === 'Network Error') {
        return '🔌 Network Error: Unable to connect to server. Please check your internet connection.'
      }
      if (err.code === 'ECONNABORTED') {
        return '⏱️ Request Timeout: Server took too long to respond. Please try again.'
      }
      if (err.message.includes('ERR_FAILED')) {
        return '🔴 Connection Failed: Unable to reach the server. Is the backend running?'
      }
      return `⚠️ ${err.message || 'Unknown error occurred'}`
    }

    // Server errors
    const status = err.response?.status
    const data = err.response?.data

    switch (status) {
      case 400:
        return `❌ Invalid Input: ${data?.error || data?.message || 'Please check your input and try again.'}`
      case 401:
        return '🔐 Unauthorized: Your session has expired. Please log in again.'
      case 403:
        return '⛔ Forbidden: You do not have permission to perform this action.'
      case 404:
        return '🔍 Not Found: The resource you requested does not exist.'
      case 409:
        return `⚠️ Conflict: ${data?.error || 'This resource may already exist.'}`
      case 500:
        return '❌ Server Error: Something went wrong on the server. Please try again later.'
      case 503:
        return '🚫 Service Unavailable: The server is temporarily down. Please try again later.'
      default:
        return `❌ Error: ${data?.error || data?.message || 'Something went wrong. Please try again.'}`
    }
  }

  // ============ API Calls - Read Operations ============
  const loadAllCourses = async () => {
    try {
      setLoading(true)
      setPageError('')
      const response = await api.get('/courses')
      
      // Backend returns courses array directly in response.data 
      // Format: { status, message, data: [...] }
      let coursesList = []
      if (Array.isArray(response.data)) {
        coursesList = response.data
      } else if (Array.isArray(response.data.data)) {
        coursesList = response.data.data
      } else if (response.data && response.data.courses && Array.isArray(response.data.courses)) {
        coursesList = response.data.courses
      }
      
      setCourses(coursesList)
    } catch (err) {
      const errorMsg = getErrorMessage(err)
      setPageError(errorMsg)
      console.error('Error loading courses:', err)
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  // ============ API Calls - Write Operations ============
  const createNewCourse = async (courseData) => {
    const response = await api.post('/create-course', courseData)
    return response
  }

  const updateExistingCourse = async (courseData) => {
    const response = await api.put('/update-course', courseData)
    return response
  }

  const deleteExistingCourse = async (courseId) => {
    const response = await api.delete(`/delete-course?id=${courseId}`)
    return response
  }

  // ============ Form Modal - Open/Close Handlers ============
  const openFormModalForCreate = () => {
    setEditingCourse(null)
    setFormData({
      name: '',
      description: '',
      duration: '',
      fee: ''
    })
    setFormError('')
    setIsFormModalOpen(true)
  }

  const openFormModalForEdit = (course) => {
    setEditingCourse(course)
    setFormData({
      name: course.name || '',
      description: course.description || '',
      duration: course.duration || '',
      fee: course.fee || ''
    })
    setFormError('')
    setIsFormModalOpen(true)
  }

  const closeFormModal = () => {
    setIsFormModalOpen(false)
    setEditingCourse(null)
    setFormData({
      name: '',
      description: '',
      duration: '',
      fee: ''
    })
    setFormError('')
  }

  // ============ Form Input Handler ============
  const handleFormInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'fee' || name === 'enrolled' ? (value ? parseFloat(value) : 0) : value
    }))
  }

  // ============ Form Submit Handler ============
  const handleFormSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setFormError('❌ Course name is required')
      return
    }

    try {
      setIsFormSubmitting(true)
      setFormError('')

      const payload = {
        name: formData.name,
        description: formData.description,
        duration: formData.duration,
        fee: formData.fee || 0,
        is_active: true
      }

      if (editingCourse) {
        // Update existing course - backend expects id in payload
        const updatePayload = {
          ...payload,
          id: editingCourse.id,
          is_active: true
        }
        await updateExistingCourse(updatePayload)
        setPageError('')
        setFormError('')
        alert('✅ Course updated successfully!')
      } else {
        // Create new course
        await createNewCourse(payload)
        setPageError('')
        setFormError('')
        alert('✅ Course created successfully!')
      }

      closeFormModal()
      loadAllCourses()
    } catch (err) {
      const errorMsg = getErrorMessage(err)
      setFormError(errorMsg)
      console.error('Error saving course:', err)
    } finally {
      setIsFormSubmitting(false)
    }
  }

  // ============ Delete Confirmation Modal - Open/Close Handlers ============
  const openDeleteConfirmModal = (course) => {
    setCourseToDelete(course)
    setIsDeleteConfirmOpen(true)
  }

  const closeDeleteConfirmModal = () => {
    setIsDeleteConfirmOpen(false)
    setCourseToDelete(null)
  }

  // ============ Delete Handler ============
  const handleDeleteConfirm = async () => {
    if (!courseToDelete) return

    try {
      setIsDeleting(true)
      setPageError('')
      await deleteExistingCourse(courseToDelete.id)
      setPageError('')
      alert('✅ Course deleted successfully!')
      closeDeleteConfirmModal()
      loadAllCourses()
    } catch (err) {
      const errorMsg = getErrorMessage(err)
      setPageError(errorMsg)
      console.error('Error deleting course:', err)
      // Keep modal open on error so user can retry
    } finally {
      setIsDeleting(false)
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
          <p className="text-gray-600 text-sm mt-8 font-medium">Loading courses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-50">
      <div className="sticky top-16 bg-white/80 backdrop-blur-sm z-40 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-base font-bold text-gray-900">
                📚 Course Management
              </h1>
              <p className="text-xs text-gray-600 font-medium">Manage {courses.length} course{courses.length !== 1 ? 's' : ''}</p>
            </div>
            <button 
              onClick={() => openFormModalForCreate()}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all duration-300">
              <Plus className="w-4 h-4" />
              New Course
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {pageError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-red-900">Error</p>
              <p className="text-xs text-red-700">{pageError}</p>
            </div>
            <button
              onClick={() => {
                setPageError('')
                loadAllCourses()
              }}
              className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-semibold transition-colors duration-300 border border-red-200"
            >
              Retry
            </button>
          </div>
        )}
        {courses.length > 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Course Name</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Description</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Duration</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Fee</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Enrolled</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Rating</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {courses.map((course) => (
                    <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2">
                        <span className="text-xs font-medium text-gray-900">{course.name}</span>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600 truncate max-w-xs">{course.description || '-'}</td>
                      <td className="px-3 py-2 text-xs text-gray-700">{course.duration || '-'}</td>
                      <td className="px-3 py-2">
                        <span className="text-xs font-medium text-green-700">₹{(course.fee || 0).toLocaleString('en-IN')}</span>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-700">{course.enrolled || 0}</td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-700">
                          ⭐ {course.rating || '4.8'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => openFormModalForEdit(course)}
                            disabled={(course.enrolled || 0) > 0}
                            title={(course.enrolled || 0) > 0 ? 'Cannot edit course with enrolled students' : 'Edit course'}
                            className={`px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium transition-all whitespace-nowrap ${
                              (course.enrolled || 0) > 0 
                                ? 'opacity-50 cursor-not-allowed' 
                                : 'hover:bg-blue-200'
                            }`}>
                            Edit
                          </button>
                          <button 
                            onClick={() => openDeleteConfirmModal(course)}
                            disabled={(course.enrolled || 0) > 0}
                            title={(course.enrolled || 0) > 0 ? 'Cannot delete course with enrolled students' : 'Delete course'}
                            className={`px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium transition-all whitespace-nowrap ${
                              (course.enrolled || 0) > 0 
                                ? 'opacity-50 cursor-not-allowed' 
                                : 'hover:bg-red-200'
                            }`}>
                            Delete
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
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center shadow-sm">
            <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-base font-bold text-gray-900 mb-2">No Courses Found</h3>
            <p className="text-xs text-gray-600 font-medium">Click "New Course" to add your first course</p>
          </div>
        )}
      </div>

      {/* Course Form Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                {editingCourse ? 'Edit Course' : 'New Course'}
              </h2>
              <button
                onClick={closeFormModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Course Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormInputChange}
                  placeholder="Enter course name"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormInputChange}
                  placeholder="Enter course description"
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Duration</label>
                  <input
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleFormInputChange}
                    placeholder="e.g., 3 months"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Fee</label>
                  <input
                    type="number"
                    name="fee"
                    value={formData.fee}
                    onChange={handleFormInputChange}
                    placeholder="Amount"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700">{formError}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeFormModal}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isFormSubmitting}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                >
                  {isFormSubmitting ? 'Saving...' : 'Save Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Delete Course</h2>
              <button
                onClick={closeDeleteConfirmModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-700">
                Are you sure you want to delete <strong>{courseToDelete?.name}</strong>?
              </p>
              <p className="text-xs text-gray-500 mt-2">This action cannot be undone.</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeDeleteConfirmModal}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
