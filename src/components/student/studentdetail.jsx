// StudentDetails.js
import { useState, useEffect } from "react";
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
} from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api"; // Import the configured axios instance with interceptors

const BASE_URL = "http://localhost:8000"; // Replace with your backend URL if different

export default function StudentDetails() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get("id");
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [qrCodeUrl, setQrCodeUrl] = useState(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!studentId) {
        setError("No student ID provided");
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(`/api/students/${studentId}/`);
        setStudent(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching student data:", err.response?.data || err.message);
        setError(err.response?.data?.detail || "Failed to load student data");
        setLoading(false);
      }
    };

    const fetchQrCode = async () => {
      try {
        console.log(`Fetching QR code from /api/qrcode/${studentId}/`);
        const response = await api.get(`/api/qrcode/${studentId}/`, { responseType: "blob" });
        const url = URL.createObjectURL(response.data);
        setQrCodeUrl(url);
        console.log("QR code fetched successfully");
      } catch (err) {
        console.error("Error fetching QR code:", {
          status: err.response?.status,
          data: err.response?.data,
          message: err.message,
        });
        setQrCodeUrl("https://via.placeholder.com/128?text=QR+Code+Failed"); // Clear fallback
      }
    };

    fetchStudentData();
    fetchQrCode();
  }, [studentId]);

  useEffect(() => {
    return () => {
      if (qrCodeUrl && qrCodeUrl.startsWith("blob:")) {
        URL.revokeObjectURL(qrCodeUrl);
      }
    };
  }, [qrCodeUrl]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111827] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-screen bg-[#111827] text-white flex items-center justify-center">
        <div className="text-red-500 p-4 bg-red-500/10 rounded-lg">{error || "Student not found"}</div>
      </div>
    );
  }

  const attendanceStats = {
    total: student.attendance_records?.length || 0,
    present: student.attendance_records?.filter((record) => record.status === "present").length || 0,
    absent: student.attendance_records?.filter((record) => record.status !== "present").length || 0,
  };
  attendanceStats.percentage =
    attendanceStats.total > 0 ? Math.round((attendanceStats.present / attendanceStats.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#111827] text-white">
      <header className="bg-[#1e293b] p-4">
        <div className="container mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin/students/list")}
              className="p-2 bg-blue-500/20 border border-blue-500/30 rounded-full hover:bg-blue-500/30 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Student Details</h1>
              <p className="text-sm text-gray-400">View and manage student information</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <div className="bg-[#1e293b] rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-[#0f172a] border-4 border-blue-500/30">
              <img
                src={student.photo ? `${BASE_URL}${student.photo}` : "https://via.placeholder.com/128?text=No+Image"}
                alt={`${student.prenom} ${student.nom}`}
                className="w-full h-full object-cover"
                onError={(e) => (e.target.src = "https://via.placeholder.com/128?text=No+Image")}
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
                  {student.level || "N/A"}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-400" />
                  <span className="text-sm">{student.email || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-green-400" />
                  <span className="text-sm">{student.phone || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm">{student.birthdate || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-red-400" />
                  <span className="text-sm truncate">{student.address || "N/A"}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="mb-2">
                <QrCode className="h-6 w-6 text-blue-400 mb-1" />
                <div className="text-sm text-center">Student ID</div>
              </div>
              <img
                src={qrCodeUrl || "https://via.placeholder.com/128?text=Loading+QR+Code"}
                alt="Student QR Code"
                className="w-32 h-32"
                onError={(e) => (e.target.src = "https://via.placeholder.com/128?text=QR+Code+Failed")}
              />
            </div>
          </div>
        </div>

        <div className="bg-[#1e293b] rounded-xl mb-6">
          <div className="flex flex-wrap border-b border-gray-800">
            <button
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === "overview" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-400 hover:text-white"
              }`}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === "attendance" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-400 hover:text-white"
              }`}
              onClick={() => setActiveTab("attendance")}
            >
              Attendance
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === "grades" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-400 hover:text-white"
              }`}
              onClick={() => setActiveTab("grades")}
            >
              Grades
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === "schedule" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-400 hover:text-white"
              }`}
              onClick={() => setActiveTab("schedule")}
            >
              Schedule
            </button>
          </div>
        </div>

        <div className="bg-[#1e293b] rounded-xl p-6">
          {activeTab === "overview" && (
            <div>
              <h3 className="text-xl font-bold mb-6">Student Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-[#0f172a] rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-500/20 p-2 rounded-full">
                      <GraduationCap className="h-5 w-5 text-blue-400" />
                    </div>
                    <h4 className="font-medium">Academic Information</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Level</span>
                      <span>{student.level || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">GPA</span>
                      <span className="font-medium text-green-400">{student.gpa || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Attendance</span>
                      <span className="font-medium text-blue-400">{student.attendance || "N/A"}</span>
                    </div>
                  </div>
                </div>
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
                <div className="bg-[#0f172a] rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-purple-500/20 p-2 rounded-full">
                      <Clock className="h-5 w-5 text-purple-400" />
                    </div>
                    <h4 className="font-medium">Enrollment Details</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status</span>
                      <span
                        className={`px-2 py-1 rounded-md text-xs ${
                          student.enrollmentDate === "acc"
                            ? "bg-green-500/20 text-green-400"
                            : student.enrollmentDate === "ref"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {student.enrollmentDate === "acc"
                          ? "Accepted"
                          : student.enrollmentDate === "ref"
                          ? "Refused"
                          : "Pending"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Level</span>
                      <span>{student.level || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>
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
                      {student.courses && student.courses.length > 0 ? (
                        student.courses.map((course) => (
                          <tr key={course.id} className="hover:bg-[#172033]">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="font-medium">{course.name || "N/A"}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 rounded-md text-xs ${
                                  course.grade === "A"
                                    ? "bg-green-500/20 text-green-400"
                                    : course.grade === "B"
                                    ? "bg-blue-500/20 text-blue-400"
                                    : course.grade === "C"
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : "bg-red-500/20 text-red-400"
                                }`}
                              >
                                {course.grade || "N/A"}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              {course.schedule || "N/A"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">{course.room || "N/A"}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="px-4 py-3 text-center text-gray-400">
                            No courses available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
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
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {student.attendance_records && student.attendance_records.length > 0 ? (
                        student.attendance_records.map((record, index) => (
                          <tr key={index} className="border-t border-gray-800">
                            <td className="px-4 py-2">{record.date || "N/A"}</td>
                            <td className="px-4 py-2">
                              <span
                                className={`px-2 py-1 rounded-md text-xs ${
                                  record.status === "present"
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-red-500/20 text-red-400"
                                }`}
                              >
                                {record.status ? record.status.charAt(0).toUpperCase() + record.status.slice(1) : "N/A"}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="2" className="px-4 py-2 text-center text-gray-400">
                            No attendance records available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {activeTab === "grades" && (
            <div>
              <h3 className="text-xl font-bold mb-6">Academic Grades</h3>
              <div className="bg-[#0f172a] rounded-xl p-5">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left">Course</th>
                        <th className="px-4 py-2 text-left">Assignment</th>
                        <th className="px-4 py-2 text-left">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {student.grades && student.grades.length > 0 ? (
                        student.grades.map((grade, index) => (
                          <tr key={index} className="border-t border-gray-800">
                            <td className="px-4 py-2">{grade.course || "N/A"}</td>
                            <td className="px-4 py-2">{grade.assignment || "N/A"}</td>
                            <td className="px-4 py-2">
                              <span
                                className={`px-2 py-1 rounded-md text-xs ${
                                  grade.score >= 90
                                    ? "bg-green-500/20 text-green-400"
                                    : grade.score >= 80
                                    ? "bg-blue-500/20 text-blue-400"
                                    : grade.score >= 70
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : "bg-red-500/20 text-red-400"
                                }`}
                              >
                                {grade.score && grade.max_score ? `${grade.score}/${grade.max_score}` : "N/A"}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="px-4 py-2 text-center text-gray-400">
                            No grades available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {activeTab === "schedule" && (
            <div>
              <h3 className="text-xl font-bold mb-6">Weekly Schedule</h3>
              <div className="bg-[#0f172a] rounded-xl p-5">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left">Day</th>
                        <th className="px-4 py-2 text-left">Course</th>
                        <th className="px-4 py-2 text-left">Time</th>
                        <th className="px-4 py-2 text-left">Room</th>
                      </tr>
                    </thead>
                    <tbody>
                      {student.schedule && student.schedule.length > 0 ? (
                        student.schedule.map((day, index) =>
                          day.courses && day.courses.length > 0 ? (
                            day.courses.map((course, courseIndex) => (
                              <tr key={`${index}-${courseIndex}`} className="border-t border-gray-800">
                                <td className="px-4 py-2">{day.day || "N/A"}</td>
                                <td className="px-4 py-2">{course.name || "N/A"}</td>
                                <td className="px-4 py-2">{course.time || "N/A"}</td>
                                <td className="px-4 py-2">{course.room || "N/A"}</td>
                              </tr>
                            ))
                          ) : (
                            <tr key={index}>
                              <td colSpan="4" className="px-4 py-2 text-center text-gray-400">
                                No courses scheduled for {day.day}
                              </td>
                            </tr>
                          )
                        )
                      ) : (
                        <tr>
                          <td colSpan="4" className="px-4 py-2 text-center text-gray-400">
                            No schedule available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}