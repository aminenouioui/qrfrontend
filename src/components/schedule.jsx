"use client"

import { useState } from "react"
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  MapPin,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  AlertCircle,
} from "lucide-react"

export default function ClassSchedule() {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [selectedClass, setSelectedClass] = useState(null)
  const [isAddingClass, setIsAddingClass] = useState(false)
  const [isEditingClass, setIsEditingClass] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Form state for adding/editing classes
  const [formData, setFormData] = useState({
    id: "",
    subjectId: "",
    day: "Monday",
    startTime: "08:00",
    endTime: "10:00",
    professorId: "",
    room: "",
    level: "L1",
    students: 0,
  })

  // Mock data for subjects
  const subjects = [
    { id: "CS101", name: "Introduction to Programming", department: "Computer Science" },
    { id: "CS201", name: "Data Structures", department: "Computer Science" },
    { id: "CS301", name: "Database Systems", department: "Computer Science" },
    { id: "MATH201", name: "Linear Algebra", department: "Mathematics" },
    { id: "MATH301", name: "Advanced Calculus", department: "Mathematics" },
    { id: "PHYS101", name: "Physics I", department: "Physics" },
    { id: "PHYS201", name: "Physics II", department: "Physics" },
    { id: "ENG103", name: "Technical Writing", department: "English" },
    { id: "BIO101", name: "Introduction to Biology", department: "Biology" },
    { id: "CHEM101", name: "General Chemistry", department: "Chemistry" },
  ]

  // Mock data for professors
  const professors = [
    { id: 1, name: "Dr. Smith", department: "Computer Science" },
    { id: 2, name: "Dr. Johnson", department: "Mathematics" },
    { id: 3, name: "Dr. Williams", department: "Physics" },
    { id: 4, name: "Prof. Davis", department: "English" },
    { id: 5, name: "Dr. Brown", department: "Computer Science" },
    { id: 6, name: "Dr. Miller", department: "Mathematics" },
    { id: 7, name: "Dr. Wilson", department: "Biology" },
    { id: 8, name: "Prof. Moore", department: "Chemistry" },
    { id: 9, name: "Dr. Taylor", department: "Physics" },
    { id: 10, name: "Dr. Anderson", department: "Computer Science" },
  ]

  // Mock schedule data
  const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  const timeSlots = ["08:00", "10:00", "12:00", "14:00", "16:00"]
  const levels = ["L1", "L2", "L3", "M1", "M2"]

  const [classes, setClasses] = useState([
    {
      id: 1,
      subjectId: "CS101",
      day: "Monday",
      startTime: "08:00",
      endTime: "10:00",
      professorId: 1,
      room: "A-101",
      level: "L1",
      students: 32,
    },
    {
      id: 2,
      subjectId: "MATH201",
      day: "Monday",
      startTime: "14:00",
      endTime: "16:00",
      professorId: 2,
      room: "B-205",
      level: "L2",
      students: 28,
    },
    {
      id: 3,
      subjectId: "PHYS101",
      day: "Tuesday",
      startTime: "10:00",
      endTime: "12:00",
      professorId: 3,
      room: "C-310",
      level: "L1",
      students: 35,
    },
    {
      id: 4,
      subjectId: "ENG103",
      day: "Wednesday",
      startTime: "08:00",
      endTime: "10:00",
      professorId: 4,
      room: "D-102",
      level: "L1",
      students: 25,
    },
    {
      id: 5,
      subjectId: "CS301",
      day: "Thursday",
      startTime: "14:00",
      endTime: "16:00",
      professorId: 5,
      room: "A-205",
      level: "L3",
      students: 22,
    },
    {
      id: 6,
      subjectId: "MATH301",
      day: "Friday",
      startTime: "10:00",
      endTime: "12:00",
      professorId: 6,
      room: "B-301",
      level: "L3",
      students: 18,
    },
  ])

  // Helper function to get subject by ID
  const getSubject = (subjectId) => {
    return subjects.find((s) => s.id === subjectId) || { id: "", name: "", department: "" }
  }

  // Helper function to get professor by ID
  const getProfessor = (professorId) => {
    return professors.find((p) => p.id === professorId) || { id: "", name: "", department: "" }
  }

  // Get the week dates
  const getWeekDates = (date) => {
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
    const monday = new Date(date.setDate(diff))

    const weekDates = []
    for (let i = 0; i < 5; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      weekDates.push(date)
    }

    return weekDates
  }

  const weekDates = getWeekDates(new Date(currentWeek))

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const prevWeek = () => {
    const newDate = new Date(currentWeek)
    newDate.setDate(newDate.getDate() - 7)
    setCurrentWeek(newDate)
  }

  const nextWeek = () => {
    const newDate = new Date(currentWeek)
    newDate.setDate(newDate.getDate() + 7)
    setCurrentWeek(newDate)
  }

  // Get class for a specific day and time
  const getClassForSlot = (day, time) => {
    return classes.find((c) => c.day === day && c.startTime === time)
  }

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]:
        name === "students" ? Number.parseInt(value) || 0 : name === "professorId" ? Number.parseInt(value) : value,
    })
  }

  // Initialize form for adding a new class
  const handleAddClass = (day, time) => {
    setFormData({
      id: Date.now(), // Generate a temporary ID
      subjectId: subjects[0].id,
      day: day,
      startTime: time,
      endTime: getEndTime(time),
      professorId: professors[0].id,
      room: "",
      level: "L1",
      students: 0,
    })
    setIsAddingClass(true)
    setSelectedClass(null)
  }

  // Initialize form for editing an existing class
  const handleEditClass = (classItem) => {
    setFormData({
      ...classItem,
    })
    setIsEditingClass(true)
    setSelectedClass(classItem)
  }

  // Calculate end time based on start time (2 hour blocks)
  const getEndTime = (startTime) => {
    const [hours, minutes] = startTime.split(":").map(Number)
    const endHours = hours + 2
    return `${endHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
  }

  // Save a new class
  const handleSaveNewClass = () => {
    setClasses([...classes, formData])
    setIsAddingClass(false)
    resetForm()
  }

  // Update an existing class
  const handleUpdateClass = () => {
    setClasses(classes.map((c) => (c.id === formData.id ? formData : c)))
    setIsEditingClass(false)
    setSelectedClass(formData)
  }

  // Delete a class
  const handleDeleteClass = () => {
    setClasses(classes.filter((c) => c.id !== selectedClass.id))
    setShowDeleteConfirm(false)
    setSelectedClass(null)
  }

  // Cancel form
  const handleCancelForm = () => {
    setIsAddingClass(false)
    setIsEditingClass(false)
    setShowDeleteConfirm(false)
  }

  // Reset form to default values
  const resetForm = () => {
    setFormData({
      id: "",
      subjectId: subjects[0].id,
      day: "Monday",
      startTime: "08:00",
      endTime: "10:00",
      professorId: professors[0].id,
      room: "",
      level: "L1",
      students: 0,
    })
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
              <h1 className="text-xl font-bold">Class Schedule</h1>
              <p className="text-sm text-gray-400">View and manage class timetables</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-6">
        {/* Week Navigation */}
        <div className="bg-[#1e293b] rounded-xl p-4 mb-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-2 rounded-full">
              <Calendar className="h-5 w-5 text-blue-400" />
            </div>
            <h2 className="text-lg font-medium">
              Week of {formatDate(weekDates[0])} - {formatDate(weekDates[4])}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg bg-[#0f172a] hover:bg-[#172033]" onClick={prevWeek}>
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button className="px-3 py-1 rounded-lg bg-[#0f172a]" onClick={() => setCurrentWeek(new Date())}>
              Today
            </button>
            <button className="p-2 rounded-lg bg-[#0f172a] hover:bg-[#172033]" onClick={nextWeek}>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Class List */}
          <div className="lg:col-span-1">
            <div className="bg-[#1e293b] rounded-xl overflow-hidden">
              <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                <h3 className="font-medium">All Classes</h3>
                <button
                  className="p-2 bg-blue-600 rounded-full hover:bg-blue-700 transition-colors"
                  onClick={() => handleAddClass("Monday", "08:00")}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-[600px] overflow-y-auto">
                {classes.map((classItem) => {
                  const subject = getSubject(classItem.subjectId)
                  const professor = getProfessor(classItem.professorId)

                  return (
                    <div
                      key={classItem.id}
                      className={`p-4 border-b border-gray-800 cursor-pointer hover:bg-[#172033] transition-colors ${selectedClass?.id === classItem.id ? "bg-[#172033]" : ""}`}
                      onClick={() => setSelectedClass(classItem)}
                    >
                      <div className="flex justify-between">
                        <div className="font-medium">{subject.name}</div>
                        <div className="flex gap-2">
                          <button
                            className="p-1 text-blue-400 hover:text-blue-300"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditClass(classItem)
                            }}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            className="p-1 text-red-400 hover:text-red-300"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedClass(classItem)
                              setShowDeleteConfirm(true)
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        {subject.id} • {classItem.level}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <div className="flex items-center gap-1 text-blue-400">
                          <Clock className="h-3 w-3" />
                          <span>
                            {classItem.day}, {classItem.startTime}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-purple-400">
                          <MapPin className="h-3 w-3" />
                          <span>{classItem.room}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {classes.length === 0 && (
                  <div className="p-6 text-center text-gray-400">
                    No classes found. Click the + button to add a class.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Schedule Grid */}
          <div className="lg:col-span-3">
            <div className="bg-[#1e293b] rounded-xl overflow-hidden">
              {/* Schedule Grid */}
              <div className="p-4">
                <div className="grid grid-cols-6 gap-2">
                  {/* Time column */}
                  <div className="col-span-1">
                    <div className="h-12"></div> {/* Empty cell for the corner */}
                    {timeSlots.map((time) => (
                      <div key={time} className="h-24 flex items-center justify-center text-sm text-gray-400">
                        {time}
                      </div>
                    ))}
                  </div>

                  {/* Day columns */}
                  {weekdays.map((day, index) => (
                    <div key={day} className="col-span-1">
                      <div className="h-12 flex flex-col items-center justify-center bg-[#0f172a] rounded-t-lg">
                        <div className="font-medium">{day}</div>
                        <div className="text-xs text-gray-400">{formatDate(weekDates[index])}</div>
                      </div>

                      {timeSlots.map((time) => {
                        const classItem = getClassForSlot(day, time)
                        const subject = classItem ? getSubject(classItem.subjectId) : null

                        return (
                          <div
                            key={`${day}-${time}`}
                            className={`h-24 p-2 border border-gray-800 ${classItem ? "bg-blue-500/10 border-blue-500/30" : "bg-[#0f172a]"}`}
                            onClick={() => (classItem ? setSelectedClass(classItem) : handleAddClass(day, time))}
                          >
                            {classItem ? (
                              <div className="h-full rounded-lg p-2 cursor-pointer hover:bg-blue-500/20 transition-colors">
                                <div className="font-medium text-sm">{subject.name}</div>
                                <div className="text-xs text-gray-400 mt-1">{subject.id}</div>
                                <div className="flex items-center gap-1 mt-2 text-xs text-blue-400">
                                  <MapPin className="h-3 w-3" />
                                  <span>{classItem.room}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="h-full flex items-center justify-center text-gray-500 hover:text-gray-300 cursor-pointer">
                                <Plus className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Class Details */}
              {selectedClass && !isEditingClass && !isAddingClass && !showDeleteConfirm && (
                <div className="p-4 border-t border-gray-800 bg-[#172033]">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg">{getSubject(selectedClass.subjectId).name}</h3>
                      <div className="text-sm text-gray-400 mt-1">
                        {getSubject(selectedClass.subjectId).id} • {selectedClass.level}
                      </div>
                    </div>
                    <div className="bg-blue-500/20 px-3 py-1 rounded-lg text-blue-400 text-sm">
                      {selectedClass.day}, {selectedClass.startTime} - {selectedClass.endTime}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="bg-purple-500/20 p-2 rounded-full">
                        <BookOpen className="h-4 w-4 text-purple-400" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Professor</div>
                        <div className="text-sm">{getProfessor(selectedClass.professorId).name}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="bg-green-500/20 p-2 rounded-full">
                        <MapPin className="h-4 w-4 text-green-400" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Room</div>
                        <div className="text-sm">{selectedClass.room}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="bg-yellow-500/20 p-2 rounded-full">
                        <Users className="h-4 w-4 text-yellow-400" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Students</div>
                        <div className="text-sm">{selectedClass.students}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button
                      className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center gap-2"
                      onClick={() => handleEditClass(selectedClass)}
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit Class</span>
                    </button>
                    <button
                      className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 rounded-lg flex items-center justify-center gap-2"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete Class</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Add/Edit Class Form */}
              {(isAddingClass || isEditingClass) && (
                <div className="p-4 border-t border-gray-800 bg-[#172033]">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-lg">{isAddingClass ? "Add New Class" : "Edit Class"}</h3>
                    <button className="p-2 text-gray-400 hover:text-white" onClick={handleCancelForm}>
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Subject</label>
                      <select
                        name="subjectId"
                        value={formData.subjectId}
                        onChange={handleInputChange}
                        className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                      >
                        {subjects.map((subject) => (
                          <option key={subject.id} value={subject.id}>
                            {subject.name} ({subject.id})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Professor</label>
                      <select
                        name="professorId"
                        value={formData.professorId}
                        onChange={handleInputChange}
                        className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                      >
                        {professors.map((professor) => (
                          <option key={professor.id} value={professor.id}>
                            {professor.name} ({professor.department})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Day</label>
                      <select
                        name="day"
                        value={formData.day}
                        onChange={handleInputChange}
                        className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                      >
                        {weekdays.map((day) => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Start Time</label>
                      <select
                        name="startTime"
                        value={formData.startTime}
                        onChange={handleInputChange}
                        className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                      >
                        {timeSlots.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">End Time</label>
                      <select
                        name="endTime"
                        value={formData.endTime}
                        onChange={handleInputChange}
                        className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                      >
                        {["10:00", "12:00", "14:00", "16:00", "18:00"].map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Room</label>
                      <input
                        type="text"
                        name="room"
                        value={formData.room}
                        onChange={handleInputChange}
                        className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                        placeholder="e.g. A-101"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Level</label>
                      <select
                        name="level"
                        value={formData.level}
                        onChange={handleInputChange}
                        className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                      >
                        {levels.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm text-gray-400 mb-1">Number of Students</label>
                    <input
                      type="number"
                      name="students"
                      value={formData.students}
                      onChange={handleInputChange}
                      className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                      placeholder="e.g. 30"
                      min="0"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg"
                      onClick={handleCancelForm}
                    >
                      Cancel
                    </button>
                    <button
                      className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center gap-2"
                      onClick={isAddingClass ? handleSaveNewClass : handleUpdateClass}
                    >
                      <Save className="h-4 w-4" />
                      <span>{isAddingClass ? "Add Class" : "Update Class"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Delete Confirmation */}
              {showDeleteConfirm && selectedClass && (
                <div className="p-4 border-t border-gray-800 bg-[#172033]">
                  <div className="flex items-center gap-3 mb-4 text-yellow-400">
                    <AlertCircle className="h-5 w-5" />
                    <h3 className="font-medium">Confirm Deletion</h3>
                  </div>

                  <p className="mb-4">
                    Are you sure you want to delete the class "{getSubject(selectedClass.subjectId).name}" (
                    {getSubject(selectedClass.subjectId).id})? This action cannot be undone.
                  </p>

                  <div className="flex gap-3">
                    <button
                      className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg"
                      onClick={handleCancelForm}
                    >
                      Cancel
                    </button>
                    <button
                      className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 rounded-lg flex items-center justify-center gap-2"
                      onClick={handleDeleteClass}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete Class</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

