"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Search, Plus, Edit, Trash2, X, Save, AlertCircle, Book } from "lucide-react"
import api from "../api"

export default function Subjects() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [isAddingSubject, setIsAddingSubject] = useState(false)
  const [isEditingSubject, setIsEditingSubject] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [subjectsData, setSubjectsData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [formData, setFormData] = useState({
    id: "",
    nom: "",
    description: "",
  })

  const API_URL = "/api/subjects/"

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await api.get(`${API_URL}list/`)
        const data = Array.isArray(response.data) ? response.data : []
        setSubjectsData(data)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching subjects:", err.response ? err.response.data : err.message)
        setError("Failed to load subjects. Please try again later.")
        setSubjectsData([])
        setLoading(false)
      }
    }
    fetchSubjects()
  }, [])

  const filteredSubjects = subjectsData.filter(
    (subject) => searchQuery === "" || subject.nom.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleAddSubject = () => {
    setFormData({ id: "", nom: "", description: "" })
    setIsAddingSubject(true)
    setIsEditingSubject(false)
    setShowDeleteConfirm(false)
    setSelectedSubject(null)
    setError(null)
  }

  const handleEditSubject = (subject) => {
    setFormData({ ...subject })
    setIsEditingSubject(true)
    setIsAddingSubject(false)
    setShowDeleteConfirm(false)
    setSelectedSubject(subject)
    setError(null)
  }

  const handleSaveNewSubject = async () => {
    try {
      const response = await api.post(`${API_URL}add/`, { nom: formData.nom, description: formData.description })
      setSubjectsData([...subjectsData, response.data])
      setIsAddingSubject(false)
      resetForm()
      setError(null)
    } catch (err) {
      console.error("Error adding subject:", err.response ? err.response.data : err.message)
      setError(`Failed to add subject: ${err.response ? err.response.data.detail || err.response.statusText : err.message}`)
    }
  }

  const handleUpdateSubject = async () => {
    if (!selectedSubject) return
    try {
      const response = await api.put(`${API_URL}${formData.id}/edit/`, { nom: formData.nom, description: formData.description })
      setSubjectsData(subjectsData.map((subject) => (subject.id === formData.id ? response.data : subject)))
      setIsEditingSubject(false)
      setSelectedSubject(null)
      setError(null)
    } catch (err) {
      console.error("Error updating subject:", err.response ? err.response.data : err.message)
      setError(`Failed to update subject: ${err.response ? err.response.data.detail || err.response.statusText : err.message}`)
    }
  }

  const handleDeleteSubject = async () => {
    if (!selectedSubject) return
    try {
      await api.delete(`${API_URL}${selectedSubject.id}/delete/`)
      setSubjectsData(subjectsData.filter((subject) => subject.id !== selectedSubject.id))
      setShowDeleteConfirm(false)
      setSelectedSubject(null)
      setError(null)
    } catch (err) {
      console.error("Error deleting subject:", err.response ? err.response.data : err.message)
      setError(`Failed to delete subject: ${err.response ? err.response.data.detail || err.response.statusText : err.message}`)
    }
  }

  const handleCancelForm = () => {
    setIsAddingSubject(false)
    setIsEditingSubject(false)
    setShowDeleteConfirm(false)
    setError(null)
  }

  const resetForm = () => {
    setFormData({ id: "", nom: "", description: "" })
  }

  if (loading) {
    return <div className="min-h-screen bg-[#111827] text-white p-6">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-[#111827] text-white">
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
              <p className="text-sm text-gray-400">Manage school subjects</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6">
        {error && (
          <div className="bg-red-600/20 border border-red-600/30 p-4 rounded-lg mb-6 text-red-400">
            {error}
          </div>
        )}

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

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          {filteredSubjects.map((subject) => (
            <div
              key={subject.id}
              className="bg-[#1e293b] rounded-xl p-4 hover:bg-[#172033] transition-colors cursor-pointer"
              onClick={() => setSelectedSubject(subject)}
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Book className="h-5 w-5 text-blue-400" />
                  <h3 className="text-lg font-bold">{subject.nom}</h3>
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
              <p className="text-sm text-gray-400">{subject.description || "No description"}</p>
            </div>
          ))}
        </div>

        {(isAddingSubject || isEditingSubject) && (
          <div className="bg-[#1e293b] rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4">
              {isAddingSubject ? "Add New Subject" : "Edit Subject"}
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Subject Name</label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleInputChange}
                  className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                  rows="3"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                className="px-4 py-2 bg-blue-600 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                onClick={isAddingSubject ? handleSaveNewSubject : handleUpdateSubject}
              >
                <Save className="h-4 w-4" /> Save
              </button>
              <button
                className="px-4 py-2 bg-gray-600 rounded-lg flex items-center gap-2 hover:bg-gray-700"
                onClick={handleCancelForm}
              >
                <X className="h-4 w-4" /> Cancel
              </button>
            </div>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="bg-[#1e293b] rounded-xl p-6 mt-6">
            <div className="flex items-center gap-2 text-red-400 mb-4">
              <AlertCircle className="h-5 w-5" />
              <h3 className="text-lg font-bold">Confirm Deletion</h3>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Are you sure you want to delete "{selectedSubject.nom}"?
            </p>
            <div className="flex gap-2">
              <button
                className="px-4 py-2 bg-red-600 rounded-lg flex items-center gap-2 hover:bg-red-700"
                onClick={handleDeleteSubject}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
              <button
                className="px-4 py-2 bg-gray-600 rounded-lg flex items-center gap-2 hover:bg-gray-700"
                onClick={() => setShowDeleteConfirm(false)}
              >
                <X className="h-4 w-4" /> Cancel
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}