"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Search, Plus, Edit, Trash2, X, Save, AlertCircle, Home } from "lucide-react"
import axios from "axios"

export default function Rooms() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [isAddingRoom, setIsAddingRoom] = useState(false)
  const [isEditingRoom, setIsEditingRoom] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [roomsData, setRoomsData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    capacity: 30,
  })

  const API_URL = "http://localhost:8000/" // Adjust to your Django server URL

  // Fetch rooms from the backend
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await axios.get(`${API_URL}classe-list/`)
        console.log("API Response from classe-list:", response.data) // Debug log
        const data = Array.isArray(response.data) ? response.data : []
        setRoomsData(data)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching rooms:", err)
        setError("Failed to load rooms. Please try again later.")
        setRoomsData([])
        setLoading(false)
      }
    }
    fetchRooms()
  }, [])

  // Filter rooms based on search
  const filteredRooms = roomsData.filter(
    (room) => searchQuery === "" || room.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: name === "capacity" ? Number.parseInt(value) || 0 : value,
    })
  }

  // Initialize form for adding a new room
  const handleAddRoom = () => {
    setFormData({ id: "", name: "", capacity: 30 })
    setIsAddingRoom(true)
    setIsEditingRoom(false)
    setShowDeleteConfirm(false)
    setSelectedRoom(null)
    setError(null)
  }

  // Initialize form for editing an existing room
  const handleEditRoom = (room) => {
    setFormData({ ...room })
    setIsEditingRoom(true)
    setIsAddingRoom(false)
    setShowDeleteConfirm(false)
    setSelectedRoom(room)
    setError(null)
  }

  // Save a new room
  const handleSaveNewRoom = async () => {
    try {
      const response = await axios.post(`${API_URL}add-classe/`, formData)
      setRoomsData([...roomsData, response.data])
      setIsAddingRoom(false)
      resetForm()
      setError(null)
    } catch (err) {
      console.error("Error adding room:", err)
      if (err.response && err.response.data.errors) {
        setError("Failed to add room: " + JSON.stringify(err.response.data.errors))
      } else {
        setError("Failed to add room. Please try again.")
      }
    }
  }

  // Update an existing room (placeholder until implemented)
  const handleUpdateRoom = async () => {
    if (!selectedRoom) return
    try {
      const response = await axios.put(`${API_URL}classe/${formData.id}/`, formData)
      setRoomsData(roomsData.map((room) => (room.id === formData.id ? response.data : room)))
      setIsEditingRoom(false)
      setSelectedRoom(null)
      setError(null)
    } catch (err) {
      console.error("Error updating room:", err)
      if (err.response && err.response.data.errors) {
        setError("Failed to update room: " + JSON.stringify(err.response.data.errors))
      } else {
        setError("Update functionality not yet implemented on the backend.")
      }
    }
  }

  // Delete a room
  const handleDeleteRoom = async () => {
    if (!selectedRoom) return
    try {
      await axios.delete(`${API_URL}classe/${selectedRoom.id}/delete/`)
      setRoomsData(roomsData.filter((room) => room.id !== selectedRoom.id))
      setShowDeleteConfirm(false)
      setSelectedRoom(null)
      setError(null)
    } catch (err) {
      console.error("Error deleting room:", err)
      if (err.response && err.response.data.error) {
        setError("Failed to delete room: " + err.response.data.error)
      } else {
        setError("Failed to delete room. Please try again.")
      }
    }
  }

  // Cancel form
  const handleCancelForm = () => {
    setIsAddingRoom(false)
    setIsEditingRoom(false)
    setShowDeleteConfirm(false)
    setError(null)
  }

  // Reset form to default values
  const resetForm = () => {
    setFormData({ id: "", name: "", capacity: 30 })
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
              <h1 className="text-xl font-bold">Classrooms</h1>
              <p className="text-sm text-gray-400">Manage school rooms</p>
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
              placeholder="Search rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 ml-auto md:ml-0"
            onClick={handleAddRoom}
          >
            <Plus className="h-4 w-4" />
            <span>Add Room</span>
          </button>
        </div>

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          {filteredRooms.map((room) => (
            <div
              key={room.id}
              className="bg-[#1e293b] rounded-xl p-4 hover:bg-[#172033] transition-colors cursor-pointer"
              onClick={() => setSelectedRoom(room)}
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-blue-400" />
                  <h3 className="text-lg font-bold">{room.name}</h3>
                </div>
                <div className="flex gap-2">
                  <button
                    className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditRoom(room)
                    }}
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    className="p-2 text-red-400 hover:bg-red-400/10 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedRoom(room)
                      setShowDeleteConfirm(true)
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-400">
                Capacity: <span className="text-white">{room.capacity} students</span>
              </div>
            </div>
          ))}
        </div>

        {filteredRooms.length === 0 && (
          <div className="bg-[#1e293b] rounded-xl p-8 text-center text-gray-400">
            <Home className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg mb-2">No rooms found</p>
            <p className="text-sm">Try adjusting your search or add a new room</p>
          </div>
        )}

        {/* Add/Edit Room Form */}
        {(isAddingRoom || isEditingRoom) && (
          <div className="bg-[#1e293b] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="font-medium text-lg">{isAddingRoom ? "Add New Room" : "Edit Room"}</h3>
              <button className="p-2 text-gray-400 hover:text-white" onClick={handleCancelForm}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Room Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                    placeholder="e.g. A101, B202"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Capacity</label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                    placeholder="e.g. 30"
                    min="1"
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
                  onClick={isAddingRoom ? handleSaveNewRoom : handleUpdateRoom}
                >
                  <Save className="h-4 w-4" />
                  <span>{isAddingRoom ? "Add Room" : "Update Room"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {showDeleteConfirm && selectedRoom && (
          <div className="bg-[#1e293b] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex items-center gap-3 text-yellow-400">
              <AlertCircle className="h-5 w-5" />
              <h3 className="font-medium">Confirm Deletion</h3>
            </div>

            <div className="p-4">
              <p className="mb-4">
                Are you sure you want to delete the room <strong>{selectedRoom.name}</strong>? This action cannot be
                undone.
              </p>

              <div className="flex justify-end gap-3">
                <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg" onClick={handleCancelForm}>
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2"
                  onClick={handleDeleteRoom}
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Room</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}