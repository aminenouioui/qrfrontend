"use client"
 
import { useState } from "react"
import { ArrowLeft, Calendar, Check, X, Filter, Search, Download, ChevronLeft, ChevronRight, Clock } from "lucide-react"
 
export default function AttendanceTracking() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDate, setSelectedDate] = useState(null)
  const [attendanceData, setAttendanceData] = useState({
    "001": {
      "2023-11-01": "present",
      "2023-11-02": "present",
      "2023-11-03": "absent",
      "2023-11-06": "present",
      "2023-11-07": "present",
      "2023-11-08": "present",
      "2023-11-09": "present",
      "2023-11-10": "present",
      "2023-11-13": "absent",
      "2023-11-14": "present",
      "2023-11-15": "present",
      "2023-11-16": "pending",
    },
    "002": {
      "2023-11-01": "present",
      "2023-11-02": "present",
      "2023-11-03": "present",
      "2023-11-06": "present",
      "2023-11-07": "absent",
      "2023-11-08": "present",
      "2023-11-09": "present",
      "2023-11-10": "present",
      "2023-11-13": "present",
      "2023-11-14": "present",
      "2023-11-15": "present",
      "2023-11-16": "pending",
    },
    "003": {
      "2023-11-01": "present",
      "2023-11-02": "present",
      "2023-11-03": "present",
      "2023-11-06": "absent",
      "2023-11-07": "absent",
      "2023-11-08": "present",
      "2023-11-09": "present",
      "2023-11-10": "present",
      "2023-11-13": "present",
      "2023-11-14": "present",
      "2023-11-15": "pending",
      "2023-11-16": "pending",
    },
    "004": {
      "2023-11-01": "present",
      "2023-11-02": "present",
      "2023-11-03": "present",
      "2023-11-06": "present",
      "2023-11-07": "present",
      "2023-11-08": "present",
      "2023-11-09": "absent",
      "2023-11-10": "present",
      "2023-11-13": "present",
      "2023-11-14": "present",
      "2023-11-15": "pending",
      "2023-11-16": "pending",
    },
    "005": {
      "2023-11-01": "present",
      "2023-11-02": "present",
      "2023-11-03": "present",
      "2023-11-06": "present",
      "2023-11-07": "present",
      "2023-11-08": "present",
      "2023-11-09": "present",
      "2023-11-10": "absent",
      "2023-11-13": "present",
      "2023-11-14": "present",
      "2023-11-15": "pending",
      "2023-11-16": "pending",
    },
  })
 
  // Mock student data
  const students = [
    { id: "001", nom: "Dupont", prenom: "Jean", level: "L1", photo: "/placeholder.svg?height=50&width=50" },
    { id: "002", nom: "Martin", prenom: "Sophie", level: "L2", photo: "/placeholder.svg?height=50&width=50" },
    { id: "003", nom: "Bernard", prenom: "Thomas", level: "L3", photo: "/placeholder.svg?height=50&width=50" },
    { id: "004", nom: "Petit", prenom: "Emma", level: "M1", photo: "/placeholder.svg?height=50&width=50" },
    { id: "005", nom: "Robert", prenom: "Lucas", level: "M2", photo: "/placeholder.svg?height=50&width=50" },
  ]
 
  // Filter students based on search
  const filteredStudents = students.filter(
    (student) =>
      searchQuery === "" ||
      student.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.id.includes(searchQuery),
  )
 
  // Generate calendar days for the current month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate()
  }
 
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay()
  }
 
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDayOfMonth = getFirstDayOfMonth(year, month)
 
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]
 
  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1))
    setSelectedDate(null)
  }
 
  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1))
    setSelectedDate(null)
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
  const updateAttendanceStatus = (date, status) => {
    if (!selectedStudent || !date) return
 
    setAttendanceData((prev) => ({
      ...prev,
      [selectedStudent.id]: {
        ...prev[selectedStudent.id],
        [date]: status,
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
              <p className="text-sm text-gray-400">Monitor and manage student attendance</p>
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
                        setSelectedDate(null)
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
 
          {/* Right Column - Attendance Calendar */}
          <div className="lg:col-span-2">
            <div className="bg-[#1e293b] rounded-xl overflow-hidden">
              {/* Calendar Header */}
              <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/20 p-2 rounded-full">
                    <Calendar className="h-5 w-5 text-blue-400" />
                  </div>
                  <h2 className="text-lg font-medium">
                    {monthNames[month]} {year}
                  </h2>
                </div>
 
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg bg-[#0f172a] hover:bg-[#172033]" onClick={prevMonth}>
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button className="p-2 rounded-lg bg-[#0f172a] hover:bg-[#172033]" onClick={nextMonth}>
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
                          {calculateAttendance(selectedStudent.id).present} days
                        </div>
                      </div>
                      <div className="bg-[#0f172a] rounded-lg p-3">
                        <div className="text-sm text-gray-400">Absent</div>
                        <div className="text-xl font-medium text-red-400">
                          {calculateAttendance(selectedStudent.id).absent} days
                        </div>
                      </div>
                      <div className="bg-[#0f172a] rounded-lg p-3">
                        <div className="text-sm text-gray-400">Pending</div>
                        <div className="text-xl font-medium text-yellow-400">
                          {calculateAttendance(selectedStudent.id).pending} days
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
 
                  {/* Calendar Grid */}
                  <div className="p-4">
                    <div className="grid grid-cols-7 gap-2 mb-2">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                        <div key={day} className="text-center text-sm text-gray-400 py-2">
                          {day}
                        </div>
                      ))}
                    </div>
 
                    <div className="grid grid-cols-7 gap-2">
                      {/* Empty cells for days before the first day of the month */}
                      {Array.from({ length: firstDayOfMonth }).map((_, index) => (
                        <div key={`empty-${index}`} className="h-12"></div>
                      ))}
 
                      {/* Calendar days */}
                      {Array.from({ length: daysInMonth }).map((_, index) => {
                        const day = index + 1
                        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                        const attendance = attendanceData[selectedStudent.id]?.[dateStr]
                        const isSelected = selectedDate === dateStr
 
                        // Check if the date is in the future
                        const isInFuture = new Date(year, month, day) > new Date()
 
                        return (
                          <div
                            key={day}
                            className={`h-12 rounded-lg flex flex-col items-center justify-center cursor-pointer ${
                              isSelected ? "ring-2 ring-blue-500" : ""
                            } ${
                              attendance
                                ? getStatusColor(attendance)
                                : isInFuture
                                  ? "bg-[#0f172a] text-gray-500"
                                  : "bg-[#0f172a] hover:bg-[#172033]"
                            }`}
                            onClick={() => setSelectedDate(dateStr)}
                          >
                            <div className="text-sm">{day}</div>
                            {attendance && <div className="mt-1">{getStatusIcon(attendance)}</div>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
 
                  {/* Attendance Status Controls */}
                  {selectedDate && (
                    <div className="p-4 border-t border-gray-800 bg-[#172033]">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-blue-400" />
                          <span className="font-medium">
                            {new Date(selectedDate).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="text-sm text-gray-400">Set attendance status</div>
                      </div>
 
                      <div className="flex gap-4">
                        <button
                          className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 ${
                            attendanceData[selectedStudent.id]?.[selectedDate] === "present"
                              ? "bg-green-500/40 text-white"
                              : "bg-[#0f172a] text-green-400 hover:bg-green-500/20"
                          }`}
                          onClick={() => updateAttendanceStatus(selectedDate, "present")}
                        >
                          <Check className="h-5 w-5" />
                          <span>Present</span>
                        </button>
                        <button
                          className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 ${
                            attendanceData[selectedStudent.id]?.[selectedDate] === "absent"
                              ? "bg-red-500/40 text-white"
                              : "bg-[#0f172a] text-red-400 hover:bg-red-500/20"
                          }`}
                          onClick={() => updateAttendanceStatus(selectedDate, "absent")}
                        >
                          <X className="h-5 w-5" />
                          <span>Absent</span>
                        </button>
                        <button
                          className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 ${
                            attendanceData[selectedStudent.id]?.[selectedDate] === "pending"
                              ? "bg-yellow-500/40 text-white"
                              : "bg-[#0f172a] text-yellow-400 hover:bg-yellow-500/20"
                          }`}
                          onClick={() => updateAttendanceStatus(selectedDate, "pending")}
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
 
 
 