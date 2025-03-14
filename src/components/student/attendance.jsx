"use client"

import { useState, useEffect, useCallback } from "react"
import axios from "axios"
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
  Trash2,
} from "lucide-react"

export default function AttendanceTracking() {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLevel, setSelectedLevel] = useState("All")
  const [selectedClass, setSelectedClass] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [classSchedule, setClassSchedule] = useState([])
  const [subjects, setSubjects] = useState([])
  const [students, setStudents] = useState([])
  const [attendanceData, setAttendanceData] = useState({})
  const [levels, setLevels] = useState([])
  const [levelMap, setLevelMap] = useState({})
  const [levelIdMap, setLevelIdMap] = useState({})
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState({
    students: true,
    levels: true,
    subjects: true,
    schedule: false,
    attendance: false,
    saving: false,
  })
  const [confirmDelete, setConfirmDelete] = useState(null)
  // Add a state to force re-renders when attendance is updated
  const [attendanceVersion, setAttendanceVersion] = useState(0)
  // Add a new state to track if we've made local changes that need to be preserved
  const [localAttendanceChanges, setLocalAttendanceChanges] = useState({})

  const API_BASE_URL = "http://localhost:8000"

  // Fetch students and levels on component mount
  useEffect(() => {
    const fetchStudentsAndLevels = async () => {
      setLoading((prev) => ({ ...prev, students: true, levels: true }))
      try {
        const [studentsResponse, levelsResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/list/`),
          axios.get(`${API_BASE_URL}/levels/`),
        ])
        console.log("Students fetched:", studentsResponse.data)
        console.log("Levels fetched:", levelsResponse.data)
        setStudents(studentsResponse.data || [])

        const levelData = levelsResponse.data || []
        const levelNames = levelData.map((level) => level.level.toString())
        const idToName = {}
        const nameToId = {}
        levelData.forEach((level) => {
          idToName[level.id] = level.level.toString()
          nameToId[level.level.toString()] = level.id
        })

        setLevels(["All", ...new Set(levelNames)])
        setLevelMap(idToName)
        setLevelIdMap(nameToId)
        setError(null)

        const lastSelectedStudentId = localStorage.getItem("lastSelectedStudentId")
        if (lastSelectedStudentId) {
          const student = studentsResponse.data.find((s) => s.id === Number.parseInt(lastSelectedStudentId))
          if (student) setSelectedStudent(student)
        }
        setLoading((prev) => ({ ...prev, students: false, levels: false }))
      } catch (error) {
        console.error("Fetch students/levels error:", error)
        setError(`Failed to load students/levels: ${error.message}`)
        setLoading((prev) => ({ ...prev, students: false, levels: false }))
      }
    }
    fetchStudentsAndLevels()
  }, [])

  // Fetch subjects on component mount
  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading((prev) => ({ ...prev, subjects: true }))
      try {
        const response = await axios.get(`${API_BASE_URL}/subjects/`)
        console.log("Subjects fetched:", response.data)
        setSubjects(response.data || [])
        setError(null)
        setLoading((prev) => ({ ...prev, subjects: false }))
      } catch (error) {
        console.error("Fetch subjects error:", error)
        setError(`Failed to load subjects: ${error.message}`)
        setLoading((prev) => ({ ...prev, subjects: false }))
      }
    }
    fetchSubjects()
  }, [])

  // Fetch class schedules for the selected student's level
  useEffect(() => {
    if (selectedStudent) {
      const fetchClassSchedule = async () => {
        setLoading((prev) => ({ ...prev, schedule: true }))
        try {
          const levelId = selectedStudent.level
          const response = await axios.get(`${API_BASE_URL}/api/schedules/level/${levelId}/?t=${Date.now()}`)
          console.log(`Class schedule for level ${levelId}:`, response.data)
          setClassSchedule(response.data || [])
          setError(null)
          setLoading((prev) => ({ ...prev, schedule: false }))
        } catch (error) {
          console.error("Fetch class schedule error:", error)
          setError(`Failed to load class schedule: ${error.message}`)
          setLoading((prev) => ({ ...prev, schedule: false }))
        }
      }
      fetchClassSchedule()
    } else {
      setClassSchedule([])
    }
  }, [selectedStudent])

  // Fetch attendance data for the selected student with cache-busting
  useEffect(() => {
    if (selectedStudent) {
      console.log(`Fetching attendance for student ${selectedStudent.id}`)
      const fetchAttendance = async () => {
        setLoading((prev) => ({ ...prev, attendance: true }))
        try {
          const response = await axios.get(`${API_BASE_URL}/api/attendance/${selectedStudent.id}/?t=${Date.now()}`)
          console.log(`Fetched attendance for ${selectedStudent.id}:`, response.data)

          // Merge backend data with any local changes we've made
          setAttendanceData((prev) => {
            const backendData = response.data || {}
            const studentLocalChanges = localAttendanceChanges[selectedStudent.id] || {}

            // Merge backend data with local changes, prioritizing local changes
            const mergedData = {
              ...backendData,
              ...studentLocalChanges,
            }

            console.log("MERGING DATA:", {
              backend: backendData,
              localChanges: studentLocalChanges,
              merged: mergedData,
            })

            const newData = {
              ...prev,
              [selectedStudent.id]: mergedData,
            }
            console.log("Updated attendanceData:", newData)
            return newData
          })

          setError(null)
          setLoading((prev) => ({ ...prev, attendance: false }))
        } catch (error) {
          console.error("Fetch attendance error:", error)
          setError(`Failed to load attendance: ${error.message}`)
          setLoading((prev) => ({ ...prev, attendance: false }))
        }
      }
      fetchAttendance()
    }
  }, [selectedStudent, localAttendanceChanges])

  // Filter students based on search and level
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      searchQuery === "" ||
      student.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(student.id).includes(searchQuery)

    const studentLevelId = student.level ? student.level.toString() : null
    const selectedLevelId = selectedLevel === "All" ? null : levelIdMap[selectedLevel]?.toString()
    const matchesLevel =
      selectedLevel === "All" || (studentLevelId && selectedLevelId && studentLevelId === selectedLevelId)

    return matchesSearch && matchesLevel
  })

  // Get subject name by ID
  const getSubjectName = (subjectId) => {
    const subject = subjects.find((s) => s.id === subjectId)
    return subject ? subject.nom : `Subject ${subjectId}`
  }

  // Get week dates (Monday to Friday)
  const getWeekDates = (date) => {
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(date)
    monday.setDate(diff)

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

  // Modify the formatDateKey function to ensure consistent formatting
  const formatDateKey = (date) => {
    // Ensure we're working with a Date object
    const dateObj = new Date(date)
    return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(dateObj.getDate()).padStart(2, "0")}`
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
    if (!attendanceData[studentId]) return { present: 0, absent: 0, retard: 0, att: 0, percentage: 0 }

    const data = attendanceData[studentId]
    const total = Object.keys(data).length
    const present = Object.values(data).filter((status) => status === "present").length
    const absent = Object.values(data).filter((status) => status === "absent").length
    const retard = Object.values(data).filter((status) => status === "retard").length
    const att = Object.values(data).filter((status) => status === "att").length
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0

    return { present, absent, retard, att, percentage }
  }

  // Update the getAttendanceStatus function to add more detailed logging
  const getAttendanceStatus = useCallback(
    (studentId, classId, date) => {
      if (!studentId || !attendanceData[studentId]) {
        console.log(`No attendance data for student ${studentId}`)
        return null
      }

      const dateKey = `${formatDateKey(date)}-${classId}`
      const status = attendanceData[studentId][dateKey]

      console.log(
        `ATTENDANCE CHECK: student=${studentId}, class=${classId}, date=${formatDateKey(date)}, dateKey=${dateKey}, status=${status || "Not Set"}, attendanceVersion=${attendanceVersion}`,
      )

      return status
    },
    [attendanceData, attendanceVersion],
  )

  // Modify the updateAttendanceStatus function to be more robust
  const updateAttendanceStatus = async (classId, date, status) => {
    if (!selectedStudent || !classId || !date) return

    const dateKey = `${formatDateKey(date)}-${classId}`
    console.log(`UPDATING STATUS: dateKey=${dateKey}, status=${status}`)

    // Show saving indicator
    setError("Saving attendance status...")
    setLoading((prev) => ({ ...prev, saving: true }))

    // Create a local variable to store the updated attendance data
    const newAttendanceData = JSON.parse(JSON.stringify(attendanceData))

    // Ensure the student object exists
    if (!newAttendanceData[selectedStudent.id]) {
      newAttendanceData[selectedStudent.id] = {}
    }

    // Set the status in our local copy
    newAttendanceData[selectedStudent.id][dateKey] = status
    console.log(`OPTIMISTIC UPDATE: Setting ${dateKey} to ${status}`, newAttendanceData[selectedStudent.id])

    // Update the state with our local copy
    setAttendanceData(newAttendanceData)

    // Store this change in our local changes tracker
    setLocalAttendanceChanges((prev) => {
      const studentChanges = prev[selectedStudent.id] || {}
      return {
        ...prev,
        [selectedStudent.id]: {
          ...studentChanges,
          [dateKey]: status,
        },
      }
    })

    // Force a re-render
    setAttendanceVersion((v) => v + 1)

    try {
      // Prepare the data for the API call
      const apiData = {
        student_id: selectedStudent.id,
        schedule_id: classId,
        date: formatDateKey(date),
        status,
      }

      console.log(`SENDING TO API:`, apiData)

      const response = await axios.post(`${API_BASE_URL}/api/attendance/add/`, apiData)
      console.log("POST response:", response.data)

      // After successful save, refetch to ensure sync with backend
      const fetchResponse = await axios.get(`${API_BASE_URL}/api/attendance/${selectedStudent.id}/?t=${Date.now()}`)
      console.log("Refetched attendance after save:", fetchResponse.data)

      // Check if the backend data includes our updated status
      const backendData = fetchResponse.data || {}
      const backendStatus = backendData[dateKey]

      console.log(`BACKEND STATUS for ${dateKey}: ${backendStatus || "Not found"}`)

      // If the backend doesn't have our status, keep our local version
      if (!backendStatus && newAttendanceData[selectedStudent.id][dateKey]) {
        console.log(`BACKEND MISSING STATUS: Keeping local status ${newAttendanceData[selectedStudent.id][dateKey]}`)
        const mergedData = {
          ...backendData,
          [dateKey]: newAttendanceData[selectedStudent.id][dateKey],
        }

        setAttendanceData((prev) => ({
          ...prev,
          [selectedStudent.id]: mergedData,
        }))
      } else {
        // Otherwise use the backend data
        setAttendanceData((prev) => ({
          ...prev,
          [selectedStudent.id]: backendData,
        }))
      }

      // Force another re-render
      setAttendanceVersion((v) => v + 1)

      setError("Attendance saved successfully!")
      setTimeout(() => setError(null), 2000)
    } catch (error) {
      console.error("Update attendance error:", error)
      setError(`Failed to update attendance: ${error.response?.statusText || error.message}`)

      // Even on error, keep our optimistic update
      console.log("ERROR: Keeping optimistic update")
    } finally {
      setLoading((prev) => ({ ...prev, saving: false }))
    }
  }

  // Delete attendance record
  const deleteAttendance = async (classId, date) => {
    if (!selectedStudent || !classId || !date) return

    const dateKey = `${formatDateKey(date)}-${classId}`

    try {
      setError("Deleting attendance record...")
      await axios.delete(
        `${API_BASE_URL}/api/attendance/delete/${selectedStudent.id}/${classId}/${formatDateKey(date)}/`,
      )

      // Update local state immediately
      const newAttendanceData = JSON.parse(JSON.stringify(attendanceData))
      if (newAttendanceData[selectedStudent.id] && newAttendanceData[selectedStudent.id][dateKey]) {
        delete newAttendanceData[selectedStudent.id][dateKey]
        setAttendanceData(newAttendanceData)

        // Also remove from local changes
        setLocalAttendanceChanges((prev) => {
          const studentChanges = { ...(prev[selectedStudent.id] || {}) }
          if (studentChanges[dateKey]) {
            delete studentChanges[dateKey]
          }
          return {
            ...prev,
            [selectedStudent.id]: studentChanges,
          }
        })

        setAttendanceVersion((v) => v + 1)
      }

      setSelectedClass(null)
      setSelectedDate(null)
      setConfirmDelete(null)
      setError("Attendance record deleted successfully!")
      setTimeout(() => setError(null), 2000)
    } catch (error) {
      console.error("Delete attendance error:", error)
      setError(`Failed to delete attendance: ${error.message}`)
      setConfirmDelete(null)
    }
  }

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "present":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "absent":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "retard":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "att":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
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
      case "retard":
        return <Clock className="h-4 w-4 text-yellow-400" />
      case "att":
        return <Clock className="h-4 w-4 text-blue-400" />
      default:
        return null
    }
  }

  // Map day number to day name
  const getDayName = (dayNumber) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    return days[dayNumber]
  }

  // Get classes for a specific day with logging
  const getClassesForDay = (dayName) => {
    const dayMap = {
      Monday: ["Monday", "Mon", "monday", "mon", "MON"],
      Tuesday: ["Tuesday", "Tue", "tuesday", "tue", "TUE"],
      Wednesday: ["Wednesday", "Wed", "wednesday", "wed", "WED"],
      Thursday: ["Thursday", "Thu", "thursday", "thu", "THU"],
      Friday: ["Friday", "Fri", "friday", "fri", "FRI"],
    }
    const possibleDays = dayMap[dayName] || [dayName.toLowerCase()]
    const filteredClasses = classSchedule.filter((cls) => cls.day && possibleDays.includes(cls.day.toUpperCase()))
    return filteredClasses
  }

  // Handle student selection
  const handleStudentSelect = (student) => {
    setSelectedStudent(student)
    localStorage.setItem("lastSelectedStudentId", student.id)
    setSelectedClass(null)
  }

  // Force refresh attendance data
  const refreshAttendanceData = async () => {
    if (!selectedStudent) return

    setLoading((prev) => ({ ...prev, attendance: true }))
    try {
      const response = await axios.get(`${API_BASE_URL}/api/attendance/${selectedStudent.id}/?t=${Date.now()}`)
      console.log(`Force refreshed attendance for ${selectedStudent.id}:`, response.data)
      setAttendanceData((prev) => ({
        ...prev,
        [selectedStudent.id]: response.data || {},
      }))
      setAttendanceVersion((v) => v + 1)
      setLoading((prev) => ({ ...prev, attendance: false }))
      setError("Attendance data refreshed!")
      setTimeout(() => setError(null), 2000)
    } catch (error) {
      console.error("Force refresh error:", error)
      setLoading((prev) => ({ ...prev, attendance: false }))
      setError("Failed to refresh attendance data")
    }
  }

  // Update the debugAttendance function to show more information
  const debugAttendance = () => {
    if (!selectedStudent || !selectedClass || !selectedDate) return null

    const dateKey = `${formatDateKey(selectedDate)}-${selectedClass.id}`
    const status = attendanceData[selectedStudent.id]?.[dateKey]
    const localChange = localAttendanceChanges[selectedStudent.id]?.[dateKey]

    // Get all keys for this student to help debug
    const allKeys = attendanceData[selectedStudent.id] ? Object.keys(attendanceData[selectedStudent.id]) : []
    const allStatuses = attendanceData[selectedStudent.id]
      ? Object.entries(attendanceData[selectedStudent.id])
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ")
      : "None"
    const localChangesCount = Object.keys(localAttendanceChanges[selectedStudent.id] || {}).length

    return (
      <div className="mt-2 p-2 bg-[#0f172a] rounded text-xs">
        <div>Debug Info:</div>
        <div>Date Key: {dateKey}</div>
        <div>Status: {status || "Not Set"}</div>
        <div>Local Change: {localChange || "None"}</div>
        <div>Version: {attendanceVersion}</div>
        <div>Student ID: {selectedStudent.id}</div>
        <div>Class ID: {selectedClass.id}</div>
        <div>Date: {formatDateKey(selectedDate)}</div>
        <div>Total Keys: {allKeys.length}</div>
        <div>Local Changes: {localChangesCount}</div>
        <div className="mt-1">
          All Statuses: {allStatuses.length > 100 ? allStatuses.substring(0, 100) + "..." : allStatuses}
        </div>
      </div>
    )
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
        {error && (
          <div
            className={`${
              error.includes("saved successfully") || error.includes("refreshed")
                ? "bg-green-600/20 border-green-600/30"
                : error.includes("Saving")
                  ? "bg-blue-600/20 border-blue-600/30"
                  : "bg-red-600/20 border-red-600/30"
            } p-4 rounded-lg mb-6 flex items-center gap-2`}
          >
            {error.includes("saved successfully") || error.includes("refreshed") ? (
              <Check className="h-5 w-5 text-green-400" />
            ) : error.includes("Saving") ? (
              <Clock className="h-5 w-5 text-blue-400" />
            ) : (
              <X className="h-5 w-5 text-red-400" />
            )}
            <span>{error}</span>
          </div>
        )}

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
                        {level === "All" ? "All Levels" : level}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="max-h-[600px] overflow-y-auto">
                {/* Student List Loading */}
                {loading.students && (
                  <div className="p-6 text-center text-gray-400">
                    <div className="animate-pulse flex flex-col items-center">
                      <div className="h-10 w-10 bg-gray-700 rounded-full mb-2"></div>
                      <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </div>
                )}

                {filteredStudents.map((student) => {
                  const { percentage } = calculateAttendance(student.id)
                  const isSelected = selectedStudent?.id === student.id

                  return (
                    <div
                      key={student.id}
                      className={`p-4 border-b border-gray-800 flex items-center gap-3 cursor-pointer hover:bg-[#172033] transition-colors ${
                        isSelected ? "bg-[#172033]" : ""
                      }`}
                      onClick={() => handleStudentSelect(student)}
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
                          ID: {student.id} • {levelMap[student.level] || student.level}
                        </div>
                      </div>
                      <div
                        className={`text-sm font-medium ${
                          percentage >= 90 ? "text-green-400" : percentage >= 75 ? "text-yellow-400" : "text-red-400"
                        }`}
                      >
                        {percentage}%
                      </div>
                    </div>
                  )
                })}

                {filteredStudents.length === 0 && !loading.students && (
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
                          ID: {selectedStudent.id} • {levelMap[selectedStudent.level] || selectedStudent.level}
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
                        <div className="text-sm text-gray-400">Retard</div>
                        <div className="text-xl font-medium text-yellow-400">
                          {calculateAttendance(selectedStudent.id).retard} classes
                        </div>
                      </div>
                      <div className="bg-[#0f172a] rounded-lg p-3">
                        <div className="text-sm text-gray-400">En Attente</div>
                        <div className="text-xl font-medium text-blue-400">
                          {calculateAttendance(selectedStudent.id).att} classes
                        </div>
                      </div>
                      <div className="bg-[#0f172a] rounded-lg p-3 col-span-4">
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

                    {/* Class Schedule Loading */}
                    {loading.schedule && (
                      <div className="p-6 text-center text-gray-400">
                        <div className="animate-pulse flex flex-col items-center">
                          <div className="h-6 bg-gray-700 rounded w-3/4 mb-4"></div>
                          <div className="h-20 bg-gray-700 rounded w-full mb-3"></div>
                          <div className="h-20 bg-gray-700 rounded w-full mb-3"></div>
                          <div className="h-20 bg-gray-700 rounded w-full"></div>
                        </div>
                      </div>
                    )}

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
                                // Force re-evaluation of status with the key
                                const status = getAttendanceStatus(selectedStudent.id, cls.id, date)
                                const isSelected =
                                  selectedClass?.id === cls.id && selectedDate?.getTime() === date.getTime()
                                const isInFuture = date > new Date()

                                return (
                                  <div
                                    key={cls.id}
                                    className={`p-3 flex items-center justify-between cursor-pointer hover:bg-[#172033] ${
                                      isSelected ? "bg-[#172033]" : ""
                                    }`}
                                    onClick={() => {
                                      if (!isInFuture) {
                                        setSelectedClass(cls)
                                        setSelectedDate(date)
                                      }
                                    }}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="bg-blue-500/20 p-2 rounded-full">
                                        <BookOpen className="h-4 w-4 text-blue-400" />
                                      </div>
                                      <div>
                                        <div className="font-medium">{getSubjectName(cls.subject)}</div>
                                        <div className="text-sm text-gray-400">
                                          {cls.start_time} - {cls.end_time} • Room {cls.classe}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <div
                                        className={`px-3 py-1 rounded-full flex items-center gap-1 ${
                                          status ? getStatusColor(status) : "bg-[#0f172a] text-gray-400"
                                        }`}
                                      >
                                        {status ? getStatusIcon(status) : <Clock className="h-4 w-4" />}
                                        <span className="text-sm">
                                          {status ? status.charAt(0).toUpperCase() + status.slice(1) : "Not Set"}
                                        </span>
                                      </div>
                                      {status && !isInFuture && (
                                        <button
                                          className="text-red-400 hover:text-red-600"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setConfirmDelete({ classId: cls.id, date })
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      )}
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
                          <div className="font-medium text-lg">{getSubjectName(selectedClass.subject)}</div>
                          <div className="text-sm text-gray-400">
                            {getDayName(selectedDate.getDay())}, {formatDate(selectedDate)} • {selectedClass.start_time}{" "}
                            - {selectedClass.end_time} • Room {selectedClass.classe}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-gray-400">Set attendance status</div>
                          <button
                            onClick={refreshAttendanceData}
                            className="p-1 rounded-full bg-[#0f172a] hover:bg-[#172033]"
                            title="Refresh attendance data"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M21 2v6h-6"></path>
                              <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                              <path d="M3 22v-6h6"></path>
                              <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Debug info */}
                      {debugAttendance()}

                      <div className="flex gap-4">
                        <button
                          className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 ${
                            getAttendanceStatus(selectedStudent.id, selectedClass.id, selectedDate) === "present"
                              ? "bg-green-500/40 text-white"
                              : "bg-[#0f172a] text-green-400 hover:bg-green-500/20"
                          }`}
                          onClick={() => updateAttendanceStatus(selectedClass.id, selectedDate, "present")}
                          disabled={new Date(selectedDate) > new Date() || loading.saving}
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
                          disabled={new Date(selectedDate) > new Date() || loading.saving}
                        >
                          <X className="h-5 w-5" />
                          <span>Absent</span>
                        </button>
                        <button
                          className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 ${
                            getAttendanceStatus(selectedStudent.id, selectedClass.id, selectedDate) === "retard"
                              ? "bg-yellow-500/40 text-white"
                              : "bg-[#0f172a] text-yellow-400 hover:bg-yellow-500/20"
                          }`}
                          onClick={() => updateAttendanceStatus(selectedClass.id, selectedDate, "retard")}
                          disabled={new Date(selectedDate) > new Date() || loading.saving}
                        >
                          <Clock className="h-5 w-5" />
                          <span>Retard</span>
                        </button>
                        <button
                          className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 ${
                            getAttendanceStatus(selectedStudent.id, selectedClass.id, selectedDate) === "att"
                              ? "bg-blue-500/40 text-white"
                              : "bg-[#0f172a] text-blue-400 hover:bg-blue-500/20"
                          }`}
                          onClick={() => updateAttendanceStatus(selectedClass.id, selectedDate, "att")}
                          disabled={new Date(selectedDate) > new Date() || loading.saving}
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
              <span>Retard - Student was late</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-400"></div>
              <span>En Attente - Attendance pending verification</span>
            </div>
          </div>
        </div>

        {/* Confirmation Dialog */}
        {confirmDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#1e293b] p-6 rounded-xl max-w-md w-full">
              <h3 className="text-lg font-medium mb-4">Confirm Deletion</h3>
              <p className="mb-6">
                Are you sure you want to delete the attendance record for {getSubjectName(confirmDelete.classId)} on{" "}
                {formatDate(confirmDelete.date)}?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 bg-[#0f172a] hover:bg-[#172033] rounded-lg"
                  onClick={() => setConfirmDelete(null)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
                  onClick={() => deleteAttendance(confirmDelete.classId, confirmDelete.date)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

