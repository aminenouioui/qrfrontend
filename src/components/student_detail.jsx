"use client"

import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"

import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  MapPin,
  BookOpen,
  Award,
  Clock,
  User,
  Download,
  QrCode,
  ClipboardCheck,
  GraduationCap,
} from "lucide-react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, PerspectiveCamera, Environment, Html } from "@react-three/drei"

// 3D Student Avatar Component
function StudentAvatar({ photo }) {
  return (
    <group position={[0, 0, 0]}>
      {/* Photo Frame */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2, 2, 0.1, 32]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.2} />
      </mesh>

      {/* Photo */}
      <mesh position={[0, 0, 0.06]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.9, 32]} />
        <meshBasicMaterial color="#2a3a4f" />
      </mesh>

      <Html position={[0, 0, 0.07]} transform rotation={[-Math.PI / 2, 0, 0]}>
        <div className="w-[200px] h-[200px] rounded-full overflow-hidden">
          <img
            src={photo || "/placeholder.svg?height=200&width=200"}
            alt="Student"
            className="w-full h-full object-cover"
            crossOrigin="anonymous"
          />
        </div>
      </Html>

      {/* Decorative ring */}
      <mesh position={[0, 0, 0.02]} castShadow>
        <torusGeometry args={[2.1, 0.05, 16, 100]} />
        <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.5} />
      </mesh>
    </group>
  )
}

// 3D Scene Component
function StudentScene({ student }) {
  return (
    <Canvas shadows>
      <PerspectiveCamera makeDefault position={[0, 0, 6]} />
      <ambientLight intensity={0.3} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={0.8} castShadow />
      <pointLight position={[-10, -10, -10]} color="#3b82f6" intensity={0.5} />
      <Environment preset="night" />

      <StudentAvatar photo={student?.photo} />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={1}
        minPolarAngle={Math.PI / 2.5}
        maxPolarAngle={Math.PI / 2.5}
      />
    </Canvas>
  )
}

// QR Code Component
function StudentQRCode({ studentId, studentName }) {
  return (
    <div className="bg-white p-4 rounded-lg">
      <img
        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=STUDENT_ID:${studentId}`}
        alt={`QR Code for ${studentName}`}
        className="w-full h-auto"
      />
    </div>
  )
}

// Student Details Component
export default function StudentDetails() {
  const { studentId } = useParams(); // Get studentId from URL

  // Ensure studentId is valid
  if (!studentId) {
    console.error("Invalid student ID");
    return null;
  }

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    // Simulate API call based on studentId
    setTimeout(() => {
      setStudent({
        id: studentId || "001",
        nom: "Dupont",
        prenom: "Jean",
        level: "L1",
        photo: "/placeholder.svg?height=200&width=200",
        email: "jean.dupont@university.edu",
        phone: "+33 6 12 34 56 78",
        birthdate: "15/05/2000",
        address: "123 Rue de l'Université, 75006 Paris",
        enrollmentDate: "01/09/2022",
        major: "Computer Science",
        gpa: "3.8/4.0",
        attendance: "92%",
        courses: [
          {
            id: "CS101",
            name: "Introduction to Programming",
            grade: "A",
            schedule: "Monday, 10:00 - 12:00",
            room: "A-101",
          },
          { id: "MATH201", name: "Linear Algebra", grade: "B+", schedule: "Tuesday, 14:00 - 16:00", room: "B-205" },
          { id: "PHYS101", name: "Physics I", grade: "A-", schedule: "Wednesday, 08:00 - 10:00", room: "C-310" },
          { id: "ENG103", name: "Technical Writing", grade: "B", schedule: "Thursday, 16:00 - 18:00", room: "D-102" },
        ],
        achievements: [
          { id: 1, title: "Dean's List", date: "2022" },
          { id: 2, title: "Programming Competition Winner", date: "2023" },
        ],
        activities: [
          { id: 1, title: "Chess Club", role: "Member" },
          { id: 2, title: "Student Council", role: "Representative" },
        ],
        attendance_records: [
          { date: "2023-11-01", status: "present" },
          { date: "2023-11-02", status: "present" },
          { date: "2023-11-03", status: "absent" },
          { date: "2023-11-06", status: "present" },
          { date: "2023-11-07", status: "present" },
          { date: "2023-11-08", status: "present" },
          { date: "2023-11-09", status: "present" },
          { date: "2023-11-10", status: "present" },
          { date: "2023-11-13", status: "absent" },
          { date: "2023-11-14", status: "present" },
          { date: "2023-11-15", status: "present" },
        ],
        grades: [
          { course: "CS101", assignment: "Midterm", score: 92, max_score: 100 },
          { course: "CS101", assignment: "Final", score: 95, max_score: 100 },
          { course: "MATH201", assignment: "Midterm", score: 87, max_score: 100 },
          { course: "MATH201", assignment: "Final", score: 88, max_score: 100 },
          { course: "PHYS101", assignment: "Midterm", score: 90, max_score: 100 },
          { course: "PHYS101", assignment: "Final", score: 91, max_score: 100 },
          { course: "ENG103", assignment: "Essay 1", score: 85, max_score: 100 },
          { course: "ENG103", assignment: "Essay 2", score: 88, max_score: 100 },
        ],
        schedule: [
          {
            day: "Monday",
            courses: [{ id: "CS101", name: "Introduction to Programming", time: "10:00 - 12:00", room: "A-101" }],
          },
          {
            day: "Tuesday",
            courses: [{ id: "MATH201", name: "Linear Algebra", time: "14:00 - 16:00", room: "B-205" }],
          },
          { day: "Wednesday", courses: [{ id: "PHYS101", name: "Physics I", time: "08:00 - 10:00", room: "C-310" }] },
          {
            day: "Thursday",
            courses: [{ id: "ENG103", name: "Technical Writing", time: "16:00 - 18:00", room: "D-102" }],
          },
          { day: "Friday", courses: [] },
        ],
      })
      setLoading(false)
    }, 1000)
  }, [studentId])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111827] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // Calculate attendance statistics
  const attendanceStats = {
    total: student.attendance_records.length,
    present: student.attendance_records.filter((record) => record.status === "present").length,
    absent: student.attendance_records.filter((record) => record.status === "absent").length,
  }
  attendanceStats.percentage = Math.round((attendanceStats.present / attendanceStats.total) * 100)

  // Calculate GPA
  const calculateGPA = (grades) => {
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
      F: 0.0,
    }

    let totalPoints = 0
    let totalCourses = 0

    student.courses.forEach((course) => {
      if (gradePoints[course.grade]) {
        totalPoints += gradePoints[course.grade]
        totalCourses++
      }
    })

    return totalCourses > 0 ? (totalPoints / totalCourses).toFixed(2) : 0
  }

  return ( 
    <div className="min-h-screen bg-[#111827] text-white"> 

      {/* Header */}
      <header className="bg-[#1e293b] p-4">
        <div className="container mx-auto">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-bold">Student Details</h1>
              <p className="text-sm text-gray-400">View and manage student information</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-6">
        {/* Student Header Card */}
        <div className="bg-[#1e293b] rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-[#0f172a] border-4 border-blue-500/30">
              <img
                src={student.photo || "/placeholder.svg?height=200&width=200"}
                alt={`${student.prenom} ${student.nom}`}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                {student.prenom} {student.nom}
              </h2>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-md text-sm">
                  ID: {student.id}
                </span>
                <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-md text-sm">
                  {student.level}
                </span>
                <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-md text-sm">
                  Major: {student.major}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-400" />
                  <span className="text-sm">{student.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-green-400" />
                  <span className="text-sm">{student.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm">{student.birthdate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-red-400" />
                  <span className="text-sm truncate">{student.address}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="mb-2">
                <QrCode className="h-6 w-6 text-blue-400 mb-1" />
                <div className="text-sm text-center">Student ID</div>
              </div>
              <StudentQRCode studentId={student.id} studentName={`${student.prenom} ${student.nom}`} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-[#1e293b] rounded-xl mb-6">
          <div className="flex flex-wrap border-b border-gray-800">
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === "overview" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-400 hover:text-white"}`}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === "attendance" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-400 hover:text-white"}`}
              onClick={() => setActiveTab("attendance")}
            >
              Attendance
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === "grades" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-400 hover:text-white"}`}
              onClick={() => setActiveTab("grades")}
            >
              Grades
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === "schedule" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-400 hover:text-white"}`}
              onClick={() => setActiveTab("schedule")}
            >
              Schedule
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === "achievements" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-400 hover:text-white"}`}
              onClick={() => setActiveTab("achievements")}
            >
              Achievements
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-[#1e293b] rounded-xl p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div>
              <h3 className="text-xl font-bold mb-6">Student Overview</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Academic Stats */}
                <div className="bg-[#0f172a] rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-500/20 p-2 rounded-full">
                      <GraduationCap className="h-5 w-5 text-blue-400" />
                    </div>
                    <h4 className="font-medium">Academic Information</h4>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Major</span>
                      <span>{student.major}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">GPA</span>
                      <span className="font-medium text-green-400">{calculateGPA(student.grades)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Attendance</span>
                      <span className="font-medium text-blue-400">{attendanceStats.percentage}%</span>
                    </div>
                  </div>
                </div>

                {/* Attendance Stats */}
                <div className="bg-[#0f172a] rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-green-500/20 p-2 rounded-full">
                      <ClipboardCheck className="h-5 w-5 text-green-400" />
                    </div>
                    <h4 className="font-medium">Attendance Summary</h4>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Present Days</span>
                      <span className="text-green-400">{attendanceStats.present}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Absent Days</span>
                      <span className="text-red-400">{attendanceStats.absent}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Days</span>
                      <span>{attendanceStats.total}</span>
                    </div>
                  </div>
                </div>

                {/* Enrollment Info */}
                <div className="bg-[#0f172a] rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-purple-500/20 p-2 rounded-full">
                      <Clock className="h-5 w-5 text-purple-400" />
                    </div>
                    <h4 className="font-medium">Enrollment Details</h4>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Enrollment Date</span>
                      <span>{student.enrollmentDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status</span>
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-md text-xs">Active</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Student Type</span>
                      <span>Full-time</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Course Summary */}
              <div className="bg-[#0f172a] rounded-xl p-5 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-500/20 p-2 rounded-full">
                    <BookOpen className="h-5 w-5 text-blue-400" />
                  </div>
                  <h4 className="font-medium">Enrolled Courses</h4>
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-800">
                  <table className="w-full">
                    <thead className="bg-[#172033]">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Course
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Grade
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Schedule
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Room
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {student.courses.map((course) => (
                        <tr key={course.id} className="hover:bg-[#172033]">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="font-medium">{course.name}</div>
                            <div className="text-xs text-gray-400">{course.id}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 rounded-md text-xs ${
                                course.grade.startsWith("A")
                                  ? "bg-green-500/20 text-green-400"
                                  : course.grade.startsWith("B")
                                    ? "bg-blue-500/20 text-blue-400"
                                    : course.grade.startsWith("C")
                                      ? "bg-yellow-500/20 text-yellow-400"
                                      : "bg-red-500/20 text-red-400"
                              }`}
                            >
                              {course.grade}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">{course.schedule}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">{course.room}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="bg-[#0f172a] hover:bg-[#172033] rounded-xl p-4 flex items-center gap-3 transition-colors">
                  <div className="bg-blue-500/20 p-2 rounded-full">
                    <Download className="h-5 w-5 text-blue-400" />
                  </div>
                  <span>Download Report</span>
                </button>
                <button className="bg-[#0f172a] hover:bg-[#172033] rounded-xl p-4 flex items-center gap-3 transition-colors">
                  <div className="bg-green-500/20 p-2 rounded-full">
                    <User className="h-5 w-5 text-green-400" />
                  </div>
                  <span>Contact Advisor</span>
                </button>
                <button className="bg-[#0f172a] hover:bg-[#172033] rounded-xl p-4 flex items-center gap-3 transition-colors">
                  <div className="bg-purple-500/20 p-2 rounded-full">
                    <Award className="h-5 w-5 text-purple-400" />
                  </div>
                  <span>View Achievements</span>
                </button>
              </div>
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === "attendance" && (
            <div>
              <h3 className="text-xl font-bold mb-6">Attendance Records</h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-[#0f172a] rounded-xl p-5 flex flex-col items-center justify-center">
                  <div className="text-4xl font-bold text-blue-400">{attendanceStats.percentage}%</div>
                  <div className="text-sm text-gray-400 mt-2">Attendance Rate</div>
                </div>

                <div className="bg-[#0f172a] rounded-xl p-5 flex flex-col items-center justify-center">
                  <div className="text-4xl font-bold text-green-400">{attendanceStats.present}</div>
                  <div className="text-sm text-gray-400 mt-2">Present Days</div>
                </div>

                <div className="bg-[#0f172a] rounded-xl p-5 flex flex-col items-center justify-center">
                  <div className="text-4xl font-bold text-red-400">{attendanceStats.absent}</div>
                  <div className="text-sm text-gray-400 mt-2">Absent Days</div>
                </div>

                <div className="bg-[#0f172a] rounded-xl p-5 flex flex-col items-center justify-center">
                  <div className="text-4xl font-bold">{attendanceStats.total}</div>
                  <div className="text-sm text-gray-400 mt-2">Total Days</div>
                </div>
              </div>

              <div className="bg-[#0f172a] rounded-xl p-5">
                <h4 className="font-medium mb-4">Attendance Calendar</h4>

                <div className="grid grid-cols-7 gap-2 mb-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="text-center text-sm text-gray-400 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {student.attendance_records.map((record, index) => {
                    const date = new Date(record.date)
                    const day = date.getDate()

                    return (
                      <div
                        key={record.date}
                        className={`h-12 rounded-lg flex flex-col items-center justify-center ${
                          record.status === "present"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        <div className="text-sm">{day}</div>
                        <div className="mt-1">
                          {record.status === "present" ? (
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          ) : (
                            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Grades Tab */}
          {activeTab === "grades" && (
            <div>
              <h3 className="text-xl font-bold mb-6">Academic Grades</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-[#0f172a] rounded-xl p-5 flex flex-col items-center justify-center">
                  <div className="text-4xl font-bold text-blue-400">{calculateGPA(student.grades)}</div>
                  <div className="text-sm text-gray-400 mt-2">Current GPA</div>
                </div>

                <div className="bg-[#0f172a] rounded-xl p-5 flex flex-col items-center justify-center">
                  <div className="text-4xl font-bold text-green-400">
                    {student.courses.filter((c) => c.grade.startsWith("A")).length}
                  </div>
                  <div className="text-sm text-gray-400 mt-2">A Grades</div>
                </div>

                <div className="bg-[#0f172a] rounded-xl p-5 flex flex-col items-center justify-center">
                  <div className="text-4xl font-bold text-yellow-400">{student.courses.length}</div>
                  <div className="text-sm text-gray-400 mt-2">Total Courses</div>
                </div>
              </div>

              <div className="bg-[#0f172a] rounded-xl p-5 mb-6">
                <h4 className="font-medium mb-4">Course Grades</h4>

                <div className="overflow-hidden rounded-lg border border-gray-800">
                  <table className="w-full">
                    <thead className="bg-[#172033]">
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
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {student.grades.map((grade, index) => (
                        <tr key={index} className="hover:bg-[#172033]">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="font-medium">{grade.course}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">{grade.assignment}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {grade.score}/{grade.max_score} ({Math.round((grade.score / grade.max_score) * 100)}%)
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 rounded-md text-xs ${
                                grade.score / grade.max_score >= 0.9
                                  ? "bg-green-500/20 text-green-400"
                                  : grade.score / grade.max_score >= 0.8
                                    ? "bg-blue-500/20 text-blue-400"
                                    : grade.score / grade.max_score >= 0.7
                                      ? "bg-yellow-500/20 text-yellow-400"
                                      : "bg-red-500/20 text-red-400"
                              }`}
                            >
                              {grade.score / grade.max_score >= 0.9
                                ? "A"
                                : grade.score / grade.max_score >= 0.8
                                  ? "B"
                                  : grade.score / grade.max_score >= 0.7
                                    ? "C"
                                    : "D"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-[#0f172a] rounded-xl p-5">
                <h4 className="font-medium mb-4">Grade Distribution</h4>

                <div className="h-48 flex items-end gap-4 mb-4">
                  {["A", "B", "C", "D", "F"].map((grade) => {
                    const count = student.courses.filter((c) => c.grade.startsWith(grade)).length
                    const height = count > 0 ? `${(count / student.courses.length) * 100}%` : "5%"

                    return (
                      <div key={grade} className="flex-1 flex flex-col items-center">
                        <div
                          className={`w-full max-w-[60px] rounded-t-md ${
                            grade === "A"
                              ? "bg-green-500/70"
                              : grade === "B"
                                ? "bg-blue-500/70"
                                : grade === "C"
                                  ? "bg-yellow-500/70"
                                  : grade === "D"
                                    ? "bg-orange-500/70"
                                    : "bg-red-500/70"
                          }`}
                          style={{ height }}
                        ></div>
                        <div className="text-sm mt-2">{grade}</div>
                        <div className="text-xs text-gray-400">{count} courses</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Schedule Tab */}
          {activeTab === "schedule" && (
            <div>
              <h3 className="text-xl font-bold mb-6">Weekly Schedule</h3>

              <div className="bg-[#0f172a] rounded-xl p-5">
                <div className="grid grid-cols-6 gap-2">
                  {/* Time column */}
                  <div className="col-span-1">
                    <div className="h-12 flex items-center justify-center font-medium bg-[#172033] rounded-t-lg">
                      Time
                    </div>
                    {["08:00", "10:00", "12:00", "14:00", "16:00"].map((time) => (
                      <div key={time} className="h-24 flex items-center justify-center text-sm text-gray-400">
                        {time}
                      </div>
                    ))}
                  </div>

                  {/* Day columns */}
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => {
                    const daySchedule = student.schedule.find((s) => s.day === day)

                    return (
                      <div key={day} className="col-span-1">
                        <div className="h-12 flex items-center justify-center font-medium bg-[#172033] rounded-t-lg">
                          {day}
                        </div>

                        {["08:00", "10:00", "12:00", "14:00", "16:00"].map((time) => {
                          const course = daySchedule?.courses.find((c) => c.time.startsWith(time))

                          return (
                            <div
                              key={`${day}-${time}`}
                              className={`h-24 p-2 border border-gray-800 ${course ? "bg-blue-500/10 border-blue-500/30" : "bg-[#172033]"}`}
                            >
                              {course && (
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 
                <div className="h-full rounded-lg p-2"> 

                                  <div className="font-medium text-sm">{course.name}</div>
                                  <div className="text-xs text-gray-400 mt-1">{course.id}</div>
                                  <div className="flex items-center gap-1 mt-2 text-xs text-blue-400">
                                    <span>{course.room}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Achievements Tab */}
          {activeTab === "achievements" && (
            <div>
              <h3 className="text-xl font-bold mb-6">Student Achievements</h3>

              <div className="space-y-4">
                {student.achievements.map((achievement) => (
                  <div key={achievement.id} className="bg-[#0f172a] rounded-xl p-5 flex items-start gap-4">
                    <div className="bg-yellow-500/20 p-3 rounded-full">
                      <Award className="h-6 w-6 text-yellow-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-lg">{achievement.title}</h4>
                      <p className="text-gray-400 text-sm mt-1">Awarded in {achievement.date}</p>
                      <p className="mt-2 text-sm">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut
                        labore et dolore magna aliqua.
                      </p>
                    </div>
                  </div>
                ))}

                <button className="w-full mt-4 py-3 border border-dashed border-gray-700 rounded-xl text-gray-400 hover:text-white hover:border-gray-500 transition-colors">
                  + Add New Achievement
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
