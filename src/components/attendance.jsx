"use client"

import { useState } from "react"
import {
  ArrowLeft,
  Calendar,
  Check,
  X,
  Filter,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Clock,
  BookOpen,
} from "lucide-react"

export default function AttendanceTracking() {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLevel, setSelectedLevel] = useState("All")
  const [selectedClass, setSelectedClass] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)

  // Mock class schedule data
  const classSchedule = [
    { id: 1, subjectId: "MATH101", day: "Monday", startTime: "08:00", endTime: "10:00", room: "A101" },
    { id: 2, subjectId: "CS101", day: "Monday", startTime: "10:00", endTime: "12:00", room: "B202" },
    { id: 3, subjectId: "PHYS101", day: "Tuesday", startTime: "08:00", endTime: "10:00", room: "C303" },
    { id: 4, subjectId: "ENG101", day: "Wednesday", startTime: "14:00", endTime: "16:00", room: "D404" },
    { id: 5, subjectId: "CHEM101", day: "Thursday", startTime: "10:00", endTime: "12:00", room: "E505" },
    { id: 6, subjectId: "BIO101", day: "Friday", startTime: "08:00", endTime: "10:00", room: "F606" },
  ]

  // Mock subjects data
  const subjects = [
    { id: "MATH101", name: "Mathematics" },
    { id: "CS101", name: "Computer Science" },
    { id: "PHYS101", name: "Physics" },
    { id: "ENG101", name: "English" },
    { id: "CHEM101", name: "Chemistry" },
    { id: "BIO101", name: "Biology" },
  ]

  // Get subject name by ID
  const getSubjectName = (subjectId) => {
    const subject = subjects.find((s) => s.id === subjectId)
    return subject ? subject.name : subjectId
  }

  // Mock student data
  const students = [
    { id: "001", nom: "Dupont", prenom: "Jean", level: "L1", photo: "/placeholder.svg?height=50&width=50" },
    { id: "002", nom: "Martin", prenom: "Sophie", level: "L2", photo: "/placeholder.svg?height=50&width=50" },
    { id: "003", nom: "Bernard", prenom: "Thomas", level: "L3", photo: "/placeholder.svg?height=50&width=50" },
    { id: "004", nom: "Petit", prenom: "Emma", level: "M1", photo: "/placeholder.svg?height=50&width=50" },
    { id: "005", nom: "Robert", prenom: "Lucas", level: "M2", photo: "/placeholder.svg?height=50&width=50" },
  ]

  // Get unique levels for filter
  const levels = ["All", ...new Set(students.map((student) => student.level))]

  // Mock attendance data - now tracking by class session and date
  const [attendanceData, setAttendanceData] = useState({
    "001": {
      "2023-11-06-1": "present", // Monday, Nov 6, Math class (id: 1)
      "2023-11-06-2": "absent", // Monday, Nov 6, CS class (id: 2)
      "2023-11-07-3": "present", // Tuesday, Nov 7, Physics class (id: 3)
      "2023-11-08-4": "present", // Wednesday, Nov 8, English class (id: 4)
      "2023-11-09-5": "absent", // Thursday, Nov 9, Chemistry class (id: 5)
      "2023-11-10-6": "present", // Friday, Nov 10, Biology class (id: 6)
      "2023-11-13-1": "present", // Monday, Nov 13, Math class (id: 1)
      "2023-11-13-2": "present", // Monday, Nov 13, CS class (id: 2)
      "2023-11-14-3": "absent", // Tuesday, Nov 14, Physics class (id: 3)
      "2023-11-15-4": "present", // Wednesday, Nov 15, English class (id: 4)
      "2023-11-16-5": "pending", // Thursday, Nov 16, Chemistry class (id: 5)
      "2023-11-17-6": "pending", // Friday, Nov 17, Biology class (id: 6)
    },
    "002": {
      "2023-11-06-1": "present",
      "2023-11-06-2": "present",
      "2023-11-07-3": "absent",
      "2023-11-08-4": "present",
      "2023-11-09-5": "present",
      "2023-11-10-6": "present",
      "2023-11-13-1": "present",
      "2023-11-13-2": "present",
      "2023-11-14-3": "present",
      "2023-11-15-4": "present",
      "2023-11-16-5": "pending",
      "2023-11-17-6": "pending",
    },
    "003": {
      "2023-11-06-1": "absent",
      "2023-11-06-2": "absent",
      "2023-11-07-3": "present",
      "2023-11-08-4": "present",
      "2023-11-09-5": "present",
      "2023-11-10-6": "present",
      "2023-11-13-1": "present",
      "2023-11-13-2": "present",
      "2023-11-14-3": "present",
      "2023-11-15-4": "pending",
      "2023-11-16-5": "pending",
      "2023-11-17-6": "pending",
    },
    "004": {
      "2023-11-06-1": "present",
      "2023-11-06-2": "present",
      "2023-11-07-3": "present",
      "2023-11-08-4": "present",
      "2023-11-09-5": "absent",
      "2023-11-10-6": "present",
      "2023-11-13-1": "present",
      "2023-11-14-3": "present",
      "2023-11-15-4": "pending",
      "2023-11-16-5": "pending",
      "2023-11-17-6": "pending",
    },
    "005": {
      "2023-11-06-1": "present",
      "2023-11-06-2": "present",
      "2023-11-07-3": "present",
      "2023-11-08-4": "present",
      "2023-11-09-5": "present",
      "2023-11-10-6": "absent",
      "2023-11-13-1": "present",
      "2023-11-14-3": "present",
      "2023-11-15-4": "pending",
      "2023-11-16-5": "pending",
      "2023-11-17-6": "pending",
    },
  })

  // Filter students based on search and level
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      searchQuery === "" ||
      student.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.id.includes(searchQuery)

    const matchesLevel = selectedLevel === "All" || student.level === selectedLevel

    return matchesSearch && matchesLevel
  })

  // Get week dates
  const getWeekDates = (date) => {
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
    const monday = new Date(date.setDate(diff))

    const weekDates = []
    for (let i = 0; i < 5; i++) {
      // Monday to Friday
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

  const formatDateKey = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
  }

  const prevWeek = () => {
    const newDate = new Date(currentWeek)
    newDate.setDate(newDate.getDate() - 7)
    setCurrentWeek(newDate)
    setSelectedClass(null)
  }

  const nextWeek = () => {
    const newDate = new Date(currentWeek)
    newDate.setDate(newDate.getDate() + 7)
    setCurrentWeek(newDate)
    setSelectedClass(null)
  }

  // Calculate attendance statistics
  const calculateAttendance = (studentId) => {
    if (!attendanceData[studentId]) return { present: 0, absent: 0, pending: 0, percentage: 0 }

    const data = attendanceData[studentId]
    const total = Object.keys(data).length
    const present = Object.values(data).filter((status) => status === "present").length
    const absent = Object.values(data).filter((status) => status === "absent").length
    const pending = Object.values(data).filter((status) => status === "pending").length
    const percentage = total > 0 ? Math.round((present / (total - pending)) * 100) : 0

    return { present, absent, pending, percentage }
  }

  // Update attendance status
  const updateAttendanceStatus = (classId, date, status) => {
    if (!selectedStudent || !classId || !date) return

    const dateKey = `${formatDateKey(date)}-${classId}`

    setAttendanceData((prev) => ({
      ...prev,
      [selectedStudent.id]: {
        ...prev[selectedStudent.id],
        [dateKey]: status,
      },
    }))
  }

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "present":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "absent":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      default:
        return "bg-[#0f172a]"
    }
  }

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "present":
        return <Check className="h-4 w-4 text-green-400" />
      case "absent":
        return <X className="h-4 w-4 text-red-400" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-400" />
      default:
        return null
    }
  }

  // Get attendance status for a specific class and date
  const getAttendanceStatus = (studentId, classId, date) => {
    if (!studentId || !attendanceData[studentId]) return null

    const dateKey = `${formatDateKey(date)}-${classId}`
    return attendanceData[studentId][dateKey]
  }

  // Get classes for a specific day
  const getClassesForDay = (dayName) => {
    return classSchedule.filter((cls) => cls.day === dayName)
  }

  // Map day number to day name
  const getDayName = (dayNumber) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    return days[dayNumber]
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
              <h1 className="text-xl font-bold">Attendance Tracking</h1>
              <p className="text-sm text-gray-400">Monitor and manage student attendance by class</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Student List */}
          <div className="lg:col-span-1">
            <div className="bg-[#1e293b] rounded-xl overflow-hidden">
              <div className="p-4 border-b border-gray-800">
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="bg-[#273549] pl-10 pr-4 py-2 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Search students..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <select
                    className="bg-[#273549] px-3 py-2 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                  >
                    {levels.map((level) => (
                      <option key={level} value={level}>
                        {level === "All" ? "All Levels" : `Level: ${level}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="max-h-[600px] overflow-y-auto">
                {filteredStudents.map((student) => {
                  const { percentage } = calculateAttendance(student.id)
                  const isSelected = selectedStudent?.id === student.id

                  return (
                    <div
                      key={student.id}
                      className={`p-4 border-b border-gray-800 flex items-center gap-3 cursor-pointer hover:bg-[#172033] transition-colors ${isSelected ? "bg-[#172033]" : ""}`}
                      onClick={() => {
                        setSelectedStudent(student)
                        setSelectedClass(null)
                      }}
                    >
                      <img
                        src={student.photo || "/placeholder.svg"}
                        alt={`${student.prenom} ${student.nom}`}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="font-medium">
                          {student.prenom} {student.nom}
                        </div>
                        <div className="text-sm text-gray-400">
                          ID: {student.id} • {student.level}
                        </div>
                      </div>
                      <div
                        className={`text-sm font-medium ${percentage >= 90 ? "text-green-400" : percentage >= 75 ? "text-yellow-400" : "text-red-400"}`}
                      >
                        {percentage}%
                      </div>
                    </div>
                  )
                })}

                {filteredStudents.length === 0 && (
                  <div className="p-6 text-center text-gray-400">No students found matching your search.</div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Class Schedule and Attendance */}
          <div className="lg:col-span-2">
            <div className="bg-[#1e293b] rounded-xl overflow-hidden">
              {/* Week Header */}
              <div className="p-4 border-b border-gray-800 flex justify-between items-center">
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

              {selectedStudent ? (
                <div>
                  {/* Student Attendance Info */}
                  <div className="p-4 border-b border-gray-800 bg-[#172033]">
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedStudent.photo || "/placeholder.svg"}
                        alt={`${selectedStudent.prenom} ${selectedStudent.nom}`}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-medium text-lg">
                          {selectedStudent.prenom} {selectedStudent.nom}
                        </div>
                        <div className="text-sm text-gray-400">
                          ID: {selectedStudent.id} • {selectedStudent.level}
                        </div>
                      </div>
                    </div>

                    {/* Attendance Stats */}
                    <div className="grid grid-cols-4 gap-4 mt-4">
                      <div className="bg-[#0f172a] rounded-lg p-3">
                        <div className="text-sm text-gray-400">Present</div>
                        <div className="text-xl font-medium text-green-400">
                          {calculateAttendance(selectedStudent.id).present} classes
                        </div>
                      </div>
                      <div className="bg-[#0f172a] rounded-lg p-3">
                        <div className="text-sm text-gray-400">Absent</div>
                        <div className="text-xl font-medium text-red-400">
                          {calculateAttendance(selectedStudent.id).absent} classes
                        </div>
                      </div>
                      <div className="bg-[#0f172a] rounded-lg p-3">
                        <div className="text-sm text-gray-400">Pending</div>
                        <div className="text-xl font-medium text-yellow-400">
                          {calculateAttendance(selectedStudent.id).pending} classes
                        </div>
                      </div>
                      <div className="bg-[#0f172a] rounded-lg p-3">
                        <div className="text-sm text-gray-400">Attendance Rate</div>
                        <div className="text-xl font-medium text-blue-400">
                          {calculateAttendance(selectedStudent.id).percentage}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Weekly Schedule Grid */}
                  <div className="p-4">
                    <h3 className="font-medium mb-4">Weekly Class Schedule</h3>

                    {weekDates.map((date, dateIndex) => {
                      const dayName = getDayName(date.getDay())
                      const classes = getClassesForDay(dayName)

                      return (
                        <div key={dateIndex} className="mb-4">
                          <div className="bg-[#0f172a] p-2 rounded-t-lg font-medium">
                            {dayName}, {formatDate(date)}
                          </div>

                          {classes.length > 0 ? (
                            <div className="border border-gray-800 rounded-b-lg divide-y divide-gray-800">
                              {classes.map((cls) => {
                                const status = getAttendanceStatus(selectedStudent.id, cls.id, date)
                                const isSelected =
                                  selectedClass?.id === cls.id && selectedDate?.getTime() === date.getTime()

                                return (
                                  <div
                                    key={cls.id}
                                    className={`p-3 flex items-center justify-between cursor-pointer hover:bg-[#172033] ${isSelected ? "bg-[#172033]" : ""}`}
                                    onClick={() => {
                                      setSelectedClass(cls)
                                      setSelectedDate(date)
                                    }}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="bg-blue-500/20 p-2 rounded-full">
                                        <BookOpen className="h-4 w-4 text-blue-400" />
                                      </div>
                                      <div>
                                        <div className="font-medium">{getSubjectName(cls.subjectId)}</div>
                                        <div className="text-sm text-gray-400">
                                          {cls.startTime} - {cls.endTime} • Room {cls.room}
                                        </div>
                                      </div>
                                    </div>

                                    <div
                                      className={`px-3 py-1 rounded-full flex items-center gap-1 ${status ? getStatusColor(status) : "bg-[#0f172a] text-gray-400"}`}
                                    >
                                      {status ? getStatusIcon(status) : <Clock className="h-4 w-4" />}
                                      <span className="text-sm">
                                        {status ? status.charAt(0).toUpperCase() + status.slice(1) : "Not Set"}
                                      </span>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            <div className="border border-gray-800 rounded-b-lg p-4 text-center text-gray-400">
                              No classes scheduled for this day
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Attendance Status Controls */}
                  {selectedClass && selectedDate && (
                    <div className="p-4 border-t border-gray-800 bg-[#172033]">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="font-medium text-lg">{getSubjectName(selectedClass.subjectId)}</div>
                          <div className="text-sm text-gray-400">
                            {getDayName(selectedDate.getDay())}, {formatDate(selectedDate)} • {selectedClass.startTime}{" "}
                            - {selectedClass.endTime} • Room {selectedClass.room}
                          </div>
                        </div>
                        <div className="text-sm text-gray-400">Set attendance status</div>
                      </div>

                      <div className="flex gap-4">
                        <button
                          className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 ${
                            getAttendanceStatus(selectedStudent.id, selectedClass.id, selectedDate) === "present"
                              ? "bg-green-500/40 text-white"
                              : "bg-[#0f172a] text-green-400 hover:bg-green-500/20"
                          }`}
                          onClick={() => updateAttendanceStatus(selectedClass.id, selectedDate, "present")}
                        >
                          <Check className="h-5 w-5" />
                          <span>Present</span>
                        </button>
                        <button
                          className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 ${
                            getAttendanceStatus(selectedStudent.id, selectedClass.id, selectedDate) === "absent"
                              ? "bg-red-500/40 text-white"
                              : "bg-[#0f172a] text-red-400 hover:bg-red-500/20"
                          }`}
                          onClick={() => updateAttendanceStatus(selectedClass.id, selectedDate, "absent")}
                        >
                          <X className="h-5 w-5" />
                          <span>Absent</span>
                        </button>
                        <button
                          className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 ${
                            getAttendanceStatus(selectedStudent.id, selectedClass.id, selectedDate) === "pending"
                              ? "bg-yellow-500/40 text-white"
                              : "bg-[#0f172a] text-yellow-400 hover:bg-yellow-500/20"
                          }`}
                          onClick={() => updateAttendanceStatus(selectedClass.id, selectedDate, "pending")}
                        >
                          <Clock className="h-5 w-5" />
                          <span>En Attente</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-12 text-center text-gray-400">
                  <Calendar className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg">Select a student to view attendance records</p>
                </div>
              )}

              {/* Actions */}
              <div className="p-4 border-t border-gray-800 flex justify-between">
                <button className="px-4 py-2 bg-[#0f172a] hover:bg-[#172033] rounded-lg flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Filter</span>
                </button>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  <span>Export Report</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Legend */}
        <div className="mt-6 bg-[#1e293b] rounded-xl p-4">
          <h3 className="font-medium mb-4">Attendance Status Legend</h3>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-400"></div>
              <span>Present - Student attended the class</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-400"></div>
              <span>Absent - Student did not attend the class</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-400"></div>
              <span>En Attente - Attendance status pending verification</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

