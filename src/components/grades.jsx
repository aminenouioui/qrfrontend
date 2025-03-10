"use client"

import { useState } from "react"
import {
  ArrowLeft,
  Search,
  Filter,
  Download,
  Award,
  BookOpen,
  TrendingUp,
  BarChart,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  AlertCircle,
} from "lucide-react"

export default function Grades() {
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSemester, setSelectedSemester] = useState("Current Semester")
  const [isAddingGrade, setIsAddingGrade] = useState(false)
  const [isEditingGrade, setIsEditingGrade] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedGrade, setSelectedGrade] = useState(null)

  // Form state for adding/editing grades
  const [formData, setFormData] = useState({
    id: "",
    subjectId: "",
    assignment: "",
    score: 0,
    max_score: 100,
    date: new Date().toISOString().split("T")[0],
  })

  // Mock student data
  const students = [
    { id: "001", nom: "Dupont", prenom: "Jean", level: "L1", photo: "/placeholder.svg?height=50&width=50" },
    { id: "002", nom: "Martin", prenom: "Sophie", level: "L2", photo: "/placeholder.svg?height=50&width=50" },
    { id: "003", nom: "Bernard", prenom: "Thomas", level: "L3", photo: "/placeholder.svg?height=50&width=50" },
    { id: "004", nom: "Petit", prenom: "Emma", level: "M1", photo: "/placeholder.svg?height=50&width=50" },
    { id: "005", nom: "Robert", prenom: "Lucas", level: "M2", photo: "/placeholder.svg?height=50&width=50" },
  ]

  // Mock subjects data
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

  
  const [gradesData, setGradesData] = useState({
    "001": {
      gpa: "3.8",
      courses: [
        { id: "CS101", name: "Introduction to Programming", credits: 3, grade: "A", score: 92 },
        { id: "MATH201", name: "Linear Algebra", credits: 4, grade: "B+", score: 87 },
        { id: "PHYS101", name: "Physics I", credits: 4, grade: "A-", score: 90 },
        { id: "ENG103", name: "Technical Writing", credits: 2, grade: "B", score: 85 },
      ],
      semesters: [
        { id: 1, name: "Fall 2022", gpa: "3.7" },
        { id: 2, name: "Spring 2023", gpa: "3.8" },
        { id: 3, name: "Fall 2023", gpa: "3.9" },
      ],
      grades: [
        { id: 1, subjectId: "CS101", assignment: "Midterm", score: 92, max_score: 100, date: "2023-10-15" },
        { id: 2, subjectId: "CS101", assignment: "Final", score: 95, max_score: 100, date: "2023-12-10" },
        { id: 3, subjectId: "MATH201", assignment: "Midterm", score: 87, max_score: 100, date: "2023-10-20" },
        { id: 4, subjectId: "MATH201", assignment: "Final", score: 88, max_score: 100, date: "2023-12-15" },
        { id: 5, subjectId: "PHYS101", assignment: "Midterm", score: 90, max_score: 100, date: "2023-10-18" },
        { id: 6, subjectId: "PHYS101", assignment: "Final", score: 91, max_score: 100, date: "2023-12-12" },
        { id: 7, subjectId: "ENG103", assignment: "Essay 1", score: 85, max_score: 100, date: "2023-09-30" },
        { id: 8, subjectId: "ENG103", assignment: "Essay 2", score: 88, max_score: 100, date: "2023-11-15" },
      ],
    },
    "002": {
      gpa: "3.9",
      courses: [
        { id: "CS201", name: "Data Structures", credits: 3, grade: "A", score: 94 },
        { id: "MATH301", name: "Advanced Calculus", credits: 4, grade: "A-", score: 91 },
        { id: "PHYS201", name: "Physics II", credits: 4, grade: "A", score: 93 },
        { id: "ENG103", name: "Technical Writing", credits: 2, grade: "B+", score: 88 },
      ],
      semesters: [
        { id: 1, name: "Fall 2021", gpa: "3.6" },
        { id: 2, name: "Spring 2022", gpa: "3.8" },
        { id: 3, name: "Fall 2022", gpa: "3.9" },
        { id: 4, name: "Spring 2023", gpa: "4.0" },
      ],
      grades: [
        { id: 9, subjectId: "CS201", assignment: "Midterm", score: 94, max_score: 100, date: "2023-10-15" },
        { id: 10, subjectId: "CS201", assignment: "Final", score: 96, max_score: 100, date: "2023-12-10" },
        { id: 11, subjectId: "MATH301", assignment: "Midterm", score: 91, max_score: 100, date: "2023-10-20" },
        { id: 12, subjectId: "MATH301", assignment: "Final", score: 92, max_score: 100, date: "2023-12-15" },
        { id: 13, subjectId: "PHYS201", assignment: "Midterm", score: 93, max_score: 100, date: "2023-10-18" },
        { id: 14, subjectId: "PHYS201", assignment: "Final", score: 94, max_score: 100, date: "2023-12-12" },
        { id: 15, subjectId: "ENG103", assignment: "Essay 1", score: 88, max_score: 100, date: "2023-09-30" },
        { id: 16, subjectId: "ENG103", assignment: "Essay 2", score: 90, max_score: 100, date: "2023-11-15" },
      ],
    },
    "003": {
      gpa: "3.5",
      courses: [
        { id: "CS101", name: "Introduction to Programming", credits: 3, grade: "B+", score: 88 },
        { id: "MATH201", name: "Linear Algebra", credits: 4, grade: "A-", score: 91 },
        { id: "PHYS101", name: "Physics I", credits: 4, grade: "B", score: 85 },
        { id: "ENG103", name: "Technical Writing", credits: 2, grade: "A", score: 93 },
      ],
      semesters: [
        { id: 1, name: "Fall 2022", gpa: "3.4" },
        { id: 2, name: "Spring 2023", gpa: "3.5" },
        { id: 3, name: "Fall 2023", gpa: "3.6" },
      ],
      grades: [
        { id: 17, subjectId: "CS101", assignment: "Midterm", score: 88, max_score: 100, date: "2023-10-15" },
        { id: 18, subjectId: "CS101", assignment: "Final", score: 89, max_score: 100, date: "2023-12-10" },
        { id: 19, subjectId: "MATH201", assignment: "Midterm", score: 91, max_score: 100, date: "2023-10-20" },
        { id: 20, subjectId: "MATH201", assignment: "Final", score: 92, max_score: 100, date: "2023-12-15" },
        { id: 21, subjectId: "PHYS101", assignment: "Midterm", score: 85, max_score: 100, date: "2023-10-18" },
        { id: 22, subjectId: "PHYS101", assignment: "Final", score: 86, max_score: 100, date: "2023-12-12" },
        { id: 23, subjectId: "ENG103", assignment: "Essay 1", score: 93, max_score: 100, date: "2023-09-30" },
        { id: 24, subjectId: "ENG103", assignment: "Essay 2", score: 94, max_score: 100, date: "2023-11-15" },
      ],
    },
    "004": {
      gpa: "3.7",
      courses: [
        { id: "CS201", name: "Data Structures", credits: 3, grade: "A-", score: 91 },
        { id: "MATH301", name: "Advanced Calculus", credits: 4, grade: "B+", score: 88 },
        { id: "PHYS201", name: "Physics II", credits: 4, grade: "A", score: 94 },
        { id: "ENG103", name: "Technical Writing", credits: 2, grade: "A-", score: 92 },
      ],
      semesters: [
        { id: 1, name: "Fall 2021", gpa: "3.5" },
        { id: 2, name: "Spring 2022", gpa: "3.6" },
        { id: 3, name: "Fall 2022", gpa: "3.7" },
        { id: 4, name: "Spring 2023", gpa: "3.8" },
      ],
      grades: [
        { id: 25, subjectId: "CS201", assignment: "Midterm", score: 91, max_score: 100, date: "2023-10-15" },
        { id: 26, subjectId: "CS201", assignment: "Final", score: 92, max_score: 100, date: "2023-12-10" },
        { id: 27, subjectId: "MATH301", assignment: "Midterm", score: 88, max_score: 100, date: "2023-10-20" },
        { id: 28, subjectId: "MATH301", assignment: "Final", score: 89, max_score: 100, date: "2023-12-15" },
        { id: 29, subjectId: "PHYS201", assignment: "Midterm", score: 94, max_score: 100, date: "2023-10-18" },
        { id: 30, subjectId: "PHYS201", assignment: "Final", score: 95, max_score: 100, date: "2023-12-12" },
        { id: 31, subjectId: "ENG103", assignment: "Essay 1", score: 92, max_score: 100, date: "2023-09-30" },
        { id: 32, subjectId: "ENG103", assignment: "Essay 2", score: 93, max_score: 100, date: "2023-11-15" },
      ],
    },
    "005": {
      gpa: "4.0",
      courses: [
        { id: "CS301", name: "Database Systems", credits: 3, grade: "A", score: 95 },
        { id: "MATH301", name: "Advanced Calculus", credits: 4, grade: "A", score: 96 },
        { id: "PHYS201", name: "Physics II", credits: 4, grade: "A", score: 97 },
        { id: "ENG103", name: "Technical Writing", credits: 2, grade: "A", score: 98 },
      ],
      semesters: [
        { id: 1, name: "Fall 2021", gpa: "3.8" },
        { id: 2, name: "Spring 2022", gpa: "3.9" },
        { id: 3, name: "Fall 2022", gpa: "4.0" },
        { id: 4, name: "Spring 2023", gpa: "4.0" },
      ],
      grades: [
        { id: 33, subjectId: "CS301", assignment: "Midterm", score: 95, max_score: 100, date: "2023-10-15" },
        { id: 34, subjectId: "CS301", assignment: "Final", score: 96, max_score: 100, date: "2023-12-10" },
        { id: 35, subjectId: "MATH301", assignment: "Midterm", score: 96, max_score: 100, date: "2023-10-20" },
        { id: 36, subjectId: "MATH301", assignment: "Final", score: 97, max_score: 100, date: "2023-12-15" },
        { id: 37, subjectId: "PHYS201", assignment: "Midterm", score: 97, max_score: 100, date: "2023-10-18" },
        { id: 38, subjectId: "PHYS201", assignment: "Final", score: 98, max_score: 100, date: "2023-12-12" },
        { id: 39, subjectId: "ENG103", assignment: "Essay 1", score: 98, max_score: 100, date: "2023-09-30" },
        { id: 40, subjectId: "ENG103", assignment: "Essay 2", score: 99, max_score: 100, date: "2023-11-15" },
      ],
    },
  })

  // Helper function to get subject by ID
  const getSubject = (subjectId) => {
    return subjects.find((s) => s.id === subjectId) || { id: "", name: "", department: "" }
  }

  // Filter students based on search
  const filteredStudents = students.filter(
    (student) =>
      searchQuery === "" ||
      student.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.id.includes(searchQuery),
  )

  // Grade color mapping
  const getGradeColor = (grade) => {
    const gradeMap = {
      A: "text-green-400",
      "A-": "text-green-400",
      "B+": "text-blue-400",
      B: "text-blue-400",
      "B-": "text-blue-400",
      "C+": "text-yellow-400",
      C: "text-yellow-400",
      "C-": "text-yellow-400",
      D: "text-orange-400",
      F: "text-red-400",
    }

    return gradeMap[grade] || "text-gray-400"
  }

  // Calculate GPA color
  const getGpaColor = (gpa) => {
    const gpaNum = Number.parseFloat(gpa)
    if (gpaNum >= 3.7) return "text-green-400"
    if (gpaNum >= 3.0) return "text-blue-400"
    if (gpaNum >= 2.0) return "text-yellow-400"
    return "text-red-400"
  }

  // Calculate letter grade based on score
  const calculateGrade = (score) => {
    if (score >= 93) return "A"
    if (score >= 90) return "A-"
    if (score >= 87) return "B+"
    if (score >= 83) return "B"
    if (score >= 80) return "B-"
    if (score >= 77) return "C+"
    if (score >= 73) return "C"
    if (score >= 70) return "C-"
    if (score >= 67) return "D+"
    if (score >= 63) return "D"
    if (score >= 60) return "D-"
    return "F"
  }

  // Calculate GPA based on grades
  const calculateGPA = (studentGrades) => {
    if (!studentGrades || studentGrades.length === 0) return "0.0"

    const gradePoints = {
      A: 4.0,
      "A-": 3.7,
      "B+": 3.3,
      B: 3.0,
      "B-": 2.7,
      "C+": 2.3,
      C: 2.0,
      "C-": 1.7,
      "D+": 1.3,
      D: 1.0,
      "D-": 0.7,
      F: 0.0,
    }

    let totalPoints = 0
    let totalAssignments = 0

    studentGrades.forEach((grade) => {
      const letterGrade = calculateGrade(grade.score)
      totalPoints += gradePoints[letterGrade]
      totalAssignments++
    })

    return (totalPoints / totalAssignments).toFixed(1)
  }

  // Update GPA when grades change
  const updateStudentGPA = (studentId) => {
    if (!gradesData[studentId]) return

    const newGPA = calculateGPA(gradesData[studentId].grades)

    setGradesData((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        gpa: newGPA,
      },
    }))
  }

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: name === "score" || name === "max_score" ? Number.parseInt(value) || 0 : value,
    })
  }

  // Initialize form for adding a new grade
  const handleAddGrade = () => {
    if (!selectedStudent) return

    setFormData({
      id: Date.now(),
      subjectId: subjects[0].id,
      assignment: "",
      score: 0,
      max_score: 100,
      date: new Date().toISOString().split("T")[0],
    })

    setIsAddingGrade(true)
    setIsEditingGrade(false)
    setShowDeleteConfirm(false)
    setSelectedGrade(null)
  }

  // Initialize form for editing an existing grade
  const handleEditGrade = (grade) => {
    setFormData({
      ...grade,
    })

    setIsEditingGrade(true)
    setIsAddingGrade(false)
    setShowDeleteConfirm(false)
    setSelectedGrade(grade)
  }

  // Save a new grade
  const handleSaveNewGrade = () => {
    if (!selectedStudent) return

    const studentId = selectedStudent.id
    const newGrades = [...gradesData[studentId].grades, formData]

    setGradesData((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        grades: newGrades,
      },
    }))

    updateStudentGPA(studentId)
    setIsAddingGrade(false)
    resetForm()
  }

  // Update an existing grade
  const handleUpdateGrade = () => {
    if (!selectedStudent || !selectedGrade) return

    const studentId = selectedStudent.id
    const updatedGrades = gradesData[studentId].grades.map((g) => (g.id === formData.id ? formData : g))

    setGradesData((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        grades: updatedGrades,
      },
    }))

    updateStudentGPA(studentId)
    setIsEditingGrade(false)
    setSelectedGrade(formData)
  }

  // Delete a grade
  const handleDeleteGrade = () => {
    if (!selectedStudent || !selectedGrade) return

    const studentId = selectedStudent.id
    const filteredGrades = gradesData[studentId].grades.filter((g) => g.id !== selectedGrade.id)

    setGradesData((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        grades: filteredGrades,
      },
    }))

    updateStudentGPA(studentId)
    setShowDeleteConfirm(false)
    setSelectedGrade(null)
  }

  // Cancel form
  const handleCancelForm = () => {
    setIsAddingGrade(false)
    setIsEditingGrade(false)
    setShowDeleteConfirm(false)
  }

  // Reset form to default values
  const resetForm = () => {
    setFormData({
      id: "",
      subjectId: subjects[0].id,
      assignment: "",
      score: 0,
      max_score: 100,
      date: new Date().toISOString().split("T")[0],
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
              <h1 className="text-xl font-bold">Academic Grades</h1>
              <p className="text-sm text-gray-400">View and manage student grades and performance</p>
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
                  const studentGrades = gradesData[student.id]
                  const isSelected = selectedStudent?.id === student.id

                  return (
                    <div
                      key={student.id}
                      className={`p-4 border-b border-gray-800 flex items-center gap-3 cursor-pointer hover:bg-[#172033] transition-colors ${isSelected ? "bg-[#172033]" : ""}`}
                      onClick={() => {
                        setSelectedStudent(student)
                        setSelectedGrade(null)
                        setIsAddingGrade(false)
                        setIsEditingGrade(false)
                        setShowDeleteConfirm(false)
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
                      {studentGrades && (
                        <div className={`text-sm font-medium ${getGpaColor(studentGrades.gpa)}`}>
                          GPA: {studentGrades.gpa}
                        </div>
                      )}
                    </div>
                  )
                })}

                {filteredStudents.length === 0 && (
                  <div className="p-6 text-center text-gray-400">No students found matching your search.</div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Grades */}
          <div className="lg:col-span-2">
            <div className="bg-[#1e293b] rounded-xl overflow-hidden">
              {/* Grades Header */}
              <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-green-500/20 p-2 rounded-full">
                    <Award className="h-5 w-5 text-green-400" />
                  </div>
                  <h2 className="text-lg font-medium">Academic Performance</h2>
                </div>

                {selectedStudent && gradesData[selectedStudent.id] && (
                  <div className="flex gap-2">
                    <select
                      className="bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-sm"
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(e.target.value)}
                    >
                      <option>Current Semester</option>
                      {gradesData[selectedStudent.id].semesters.map((semester) => (
                        <option key={semester.id}>{semester.name}</option>
                      ))}
                      <option>All Semesters</option>
                    </select>

                    <button
                      className="bg-blue-600 hover:bg-blue-700 p-2 rounded-lg"
                      onClick={handleAddGrade}
                      disabled={!selectedStudent}
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>

              {selectedStudent && gradesData[selectedStudent.id] ? (
                <div>
                  {/* Student Grades Info */}
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
                      <div className="ml-auto">
                        <div className="text-sm text-gray-400">Cumulative GPA</div>
                        <div className={`text-2xl font-bold ${getGpaColor(gradesData[selectedStudent.id].gpa)}`}>
                          {gradesData[selectedStudent.id].gpa}
                        </div>
                      </div>
                    </div>

                    {/* GPA Trend */}
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium">GPA Trend</div>
                        <div className="text-xs text-gray-400">Last 3 semesters</div>
                      </div>
                      <div className="h-12 bg-[#0f172a] rounded-lg flex items-end p-2">
                        {gradesData[selectedStudent.id].semesters.slice(-3).map((semester, index) => {
                          const gpa = Number.parseFloat(semester.gpa)
                          const height = `${(gpa / 4) * 100}%`

                          return (
                            <div key={semester.id} className="flex-1 flex flex-col items-center">
                              <div
                                className={`w-full max-w-[30px] rounded-t-sm ${getGpaColor(semester.gpa)}`}
                                style={{ height, opacity: 0.7 + index * 0.1 }}
                              ></div>
                              <div className="text-xs mt-1 text-gray-400">{semester.name.split(" ")[0]}</div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Add/Edit Grade Form */}
                  {(isAddingGrade || isEditingGrade) && (
                    <div className="p-4 border-b border-gray-800 bg-[#172033]">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium text-lg">{isAddingGrade ? "Add New Grade" : "Edit Grade"}</h3>
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
                          <label className="block text-sm text-gray-400 mb-1">Assignment</label>
                          <input
                            type="text"
                            name="assignment"
                            value={formData.assignment}
                            onChange={handleInputChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                            placeholder="e.g. Midterm, Final, Quiz"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Score</label>
                          <input
                            type="number"
                            name="score"
                            value={formData.score}
                            onChange={handleInputChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                            placeholder="e.g. 85"
                            min="0"
                            max={formData.max_score}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Maximum Score</label>
                          <input
                            type="number"
                            name="max_score"
                            value={formData.max_score}
                            onChange={handleInputChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                            placeholder="e.g. 100"
                            min="1"
                            required
                          />
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm text-gray-400 mb-1">Date</label>
                        <input
                          type="date"
                          name="date"
                          value={formData.date}
                          onChange={handleInputChange}
                          className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                          required
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
                          onClick={isAddingGrade ? handleSaveNewGrade : handleUpdateGrade}
                        >
                          <Save className="h-4 w-4" />
                          <span>{isAddingGrade ? "Add Grade" : "Update Grade"}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Delete Confirmation */}
                  {showDeleteConfirm && selectedGrade && (
                    <div className="p-4 border-b border-gray-800 bg-[#172033]">
                      <div className="flex items-center gap-3 mb-4 text-yellow-400">
                        <AlertCircle className="h-5 w-5" />
                        <h3 className="font-medium">Confirm Deletion</h3>
                      </div>

                      <p className="mb-4">
                        Are you sure you want to delete the grade for "{getSubject(selectedGrade.subjectId).name}" (
                        {selectedGrade.assignment})? This action cannot be undone.
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
                          onClick={handleDeleteGrade}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete Grade</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Course Grades */}
                  {!isAddingGrade && !isEditingGrade && !showDeleteConfirm && (
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-blue-400" />
                          <h3 className="font-medium">Course Grades</h3>
                        </div>
                        <button
                          className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2"
                          onClick={handleAddGrade}
                        >
                          <Plus className="h-4 w-4" />
                          <span className="text-sm">Add Grade</span>
                        </button>
                      </div>

                      <div className="overflow-hidden rounded-lg border border-gray-800">
                        <table className="w-full">
                          <thead className="bg-[#0f172a]">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Course
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Assignment
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Score
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Grade
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800">
                            {gradesData[selectedStudent.id].grades.map((grade) => {
                              const subject = getSubject(grade.subjectId)
                              const letterGrade = calculateGrade(grade.score)
                              const isSelected = selectedGrade?.id === grade.id

                              return (
                                <tr
                                  key={grade.id}
                                  className={`hover:bg-[#172033] ${isSelected ? "bg-[#172033]" : ""}`}
                                  onClick={() => setSelectedGrade(grade)}
                                >
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="font-medium">{subject.name}</div>
                                    <div className="text-xs text-gray-400">{subject.id}</div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm">{grade.assignment}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                                    {grade.score}/{grade.max_score} ({Math.round((grade.score / grade.max_score) * 100)}
                                    %)
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span className={`px-2 py-1 rounded-md text-xs ${getGradeColor(letterGrade)}`}>
                                      {letterGrade}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                                    {new Date(grade.date).toLocaleDateString()}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex gap-2">
                                      <button
                                        className="p-1 text-blue-400 hover:text-blue-300"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleEditGrade(grade)
                                        }}
                                      >
                                        <Edit size={14} />
                                      </button>
                                      <button
                                        className="p-1 text-red-400 hover:text-red-300"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setSelectedGrade(grade)
                                          setShowDeleteConfirm(true)
                                        }}
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Performance Stats */}
                  {!isAddingGrade && !isEditingGrade && !showDeleteConfirm && (
                    <div className="p-4 border-t border-gray-800">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-[#0f172a] rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="h-4 w-4 text-green-400" />
                            <div className="text-sm font-medium">Performance</div>
                          </div>
                          <div className="text-2xl font-bold text-green-400">92%</div>
                          <div className="text-xs text-gray-400 mt-1">Top 10% in class</div>
                        </div>

                        <div className="bg-[#0f172a] rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <BarChart className="h-4 w-4 text-blue-400" />
                            <div className="text-sm font-medium">Credits Earned</div>
                          </div>
                          <div className="text-2xl font-bold text-blue-400">
                            {gradesData[selectedStudent.id].courses.reduce((sum, course) => sum + course.credits, 0)}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">Out of 120 required</div>
                        </div>

                        <div className="bg-[#0f172a] rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Award className="h-4 w-4 text-purple-400" />
                            <div className="text-sm font-medium">Academic Standing</div>
                          </div>
                          <div className="text-2xl font-bold text-purple-400">Excellent</div>
                          <div className="text-xs text-gray-400 mt-1">Dean's List Candidate</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-12 text-center text-gray-400">
                  <Award className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg">Select a student to view grades</p>
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
      </main>
    </div>
  )
}

