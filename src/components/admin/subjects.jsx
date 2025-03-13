"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Search, Plus, Edit, Trash2, X, Save, AlertCircle, BookOpen } from "lucide-react"
import axios from "axios"

export default function Subjects() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [isAddingSubject, setIsAddingSubject] = useState(false)
  const [isEditingSubject, setIsEditingSubject] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [subjectsData, setSubjectsData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Form state for adding/editing subjects
  const [formData, setFormData] = useState({
    id: "",
    nom: "", // Changed from 'name' to match Django model
    description: "", // Added to match Django model
  })

  const API_URL = "http://localhost:8000/" // Adjust to your Django server URL

  // Fetch subjects from the backend
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await axios.get(`${API_URL}subjects/`)
        console.log("API Response from subjects:", response.data) // Debug log
        const data = Array.isArray(response.data) ? response.data : []
        setSubjectsData(data)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching subjects:", err)
        setError("Failed to load subjects. Please try again later.")
        setSubjectsData([])
        setLoading(false)
      }
    }
    fetchSubjects()
  }, [])

  // Filter subjects based on search
  const filteredSubjects = subjectsData.filter(
    (subject) => searchQuery === "" || subject.nom.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  // Initialize form for adding a new subject
  const handleAddSubject = () => {
    setFormData({
      id: "",
      nom: "",
      description: "",
    })
    setIsAddingSubject(true)
    setIsEditingSubject(false)
    setShowDeleteConfirm(false)
    setSelectedSubject(null)
    setError(null)
  }

  // Initialize form for editing an existing subject
  const handleEditSubject = (subject) => {
    setFormData({ ...subject })
    setIsEditingSubject(true)
    setIsAddingSubject(false)
    setShowDeleteConfirm(false)
    setSelectedSubject(subject)
    setError(null)
  }

  // Save a new subject
  const handleSaveNewSubject = async () => {
    try {
      const response = await axios.post(`${API_URL}addsubject/`, formData)
      setSubjectsData([...subjectsData, response.data])
      setIsAddingSubject(false)
      resetForm()
      setError(null)
    } catch (err) {
      console.error("Error adding subject:", err)
      setError(err.response?.data?.error || "Failed to add subject. Please try again.")
    }
  }

  // Update an existing subject (placeholder until endpoint is added)
  const handleUpdateSubject = async () => {
    if (!selectedSubject) return
    try {
      const response = await axios.put(`${API_URL}subjects/edit/${formData.id}/`, formData)
      setSubjectsData(subjectsData.map((subject) => (subject.id === formData.id ? response.data : subject)))
      setIsEditingSubject(false)
      setSelectedSubject(null)
      setError(null)
    } catch (err) {
      console.error("Error updating subject:", err)
      setError("Edit functionality not yet implemented on the backend.")
    }
  }

  // Delete a subject (placeholder until endpoint is added)
  const handleDeleteSubject = async () => {
    if (!selectedSubject) return
    try {
      await axios.delete(`${API_URL}subjects/delete/${selectedSubject.id}/`)
      setSubjectsData(subjectsData.filter((subject) => subject.id !== selectedSubject.id))
      setShowDeleteConfirm(false)
      setSelectedSubject(null)
      setError(null)
    } catch (err) {
      console.error("Error deleting subject:", err)
      setError("Delete functionality not yet implemented on the backend.")
    }
  }

  // Cancel form
  const handleCancelForm = () => {
    setIsAddingSubject(false)
    setIsEditingSubject(false)
    setShowDeleteConfirm(false)
    setError(null)
  }

  // Reset form to default values
  const resetForm = () => {
    setFormData({
      id: "",
      nom: "",
      description: "",
    })
  }

  if (loading) {
    return <div className="min-h-screen bg-[#111827] text-white p-6">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-[#111827] text-white">
      {/* Header */}
      <header className="bg-[#1e293b] p-4">
        <div className="container mx-auto">
          <div className="flex items-center gap-3">
            <button
              className="bg-blue-600/20 border border-blue-600/30 p-2 rounded-lg hover:bg-blue-600/30 transition-colors"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Subjects</h1>
              <p className="text-sm text-gray-400">Manage academic subjects</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-6">
        {/* Error Display */}
        {error && (
          <div className="bg-red-600/20 border border-red-600/30 p-4 rounded-lg mb-6 text-red-400">
            {error}
          </div>
        )}

        {/* Top Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="relative w-full md:w-auto">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="bg-[#1e293b] pl-10 pr-4 py-2 rounded-lg text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search subjects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 ml-auto md:ml-0"
            onClick={handleAddSubject}
          >
            <Plus className="h-4 w-4" />
            <span>Add Subject</span>
          </button>
        </div>

        {/* Subjects Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          {filteredSubjects.map((subject) => (
            <div
              key={subject.id}
              className="bg-[#1e293b] rounded-xl p-4 hover:bg-[#172033] transition-colors cursor-pointer"
              onClick={() => setSelectedSubject(subject)}
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-400" />
                  <h3 className="text-lg font-bold">{subject.nom}</h3> {/* Changed from name to nom */}
                </div>
                <div className="flex gap-2">
                  <button
                    className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditSubject(subject)
                    }}
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    className="p-2 text-red-400 hover:bg-red-400/10 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedSubject(subject)
                      setShowDeleteConfirm(true)
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-400">
                <span className="text-white">{subject.description}</span> {/* Added description */}
              </div>
            </div>
          ))}
        </div>

        {filteredSubjects.length === 0 && (
          <div className="bg-[#1e293b] rounded-xl p-8 text-center text-gray-400">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg mb-2">No subjects found</p>
            <p className="text-sm">Try adjusting your search or add a new subject</p>
          </div>
        )}

        {/* Add/Edit Subject Form */}
        {(isAddingSubject || isEditingSubject) && (
          <div className="bg-[#1e293b] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="font-medium text-lg">{isAddingSubject ? "Add New Subject" : "Edit Subject"}</h3>
              <button className="p-2 text-gray-400 hover:text-white" onClick={handleCancelForm}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Subject Name</label>
                  <input
                    type="text"
                    name="nom" // Changed from 'name' to 'nom'
                    value={formData.nom}
                    onChange={handleInputChange}
                    className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                    placeholder="e.g. Mathematics, Physics"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Description</label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                    placeholder="e.g. Study of numbers"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg" onClick={handleCancelForm}>
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2"
                  onClick={isAddingSubject ? handleSaveNewSubject : handleUpdateSubject}
                >
                  <Save className="h-4 w-4" />
                  <span>{isAddingSubject ? "Add Subject" : "Update Subject"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {showDeleteConfirm && selectedSubject && (
          <div className="bg-[#1e293b] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex items-center gap-3 text-yellow-400">
              <AlertCircle className="h-5 w-5" />
              <h3 className="font-medium">Confirm Deletion</h3>
            </div>

            <div className="p-4">
              <p className="mb-4">
                Are you sure you want to delete the subject <strong>{selectedSubject.nom}</strong>? This action cannot
                be undone.
              </p>

              <div className="flex justify-end gap-3">
                <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg" onClick={handleCancelForm}>
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2"
                  onClick={handleDeleteSubject}
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Subject</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}