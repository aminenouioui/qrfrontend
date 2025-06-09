import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  BookOpen,
  Clock,
  Briefcase,
  Users,
  Award,
} from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api";

const BASE_URL = "http://localhost:8000";

export default function TeacherDetails() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const teacherId = searchParams.get("id");
  const [teacherData, setTeacherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const weekdays = ["MON", "TUE", "WED", "THU", "FRI"];
  const timeSlots = ["08:00:00", "10:00:00", "12:00:00", "14:00:00", "16:00:00"];

  useEffect(() => {
    const fetchTeacherData = async () => {
      if (!teacherId) {
        setError("No teacher ID provided");
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(`/api/teachers/${teacherId}/`);
        setTeacherData(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching teacher data:", err.response?.data || err.message);
        setError(err.response?.data?.detail || "Failed to load teacher data");
        setLoading(false);
      }
    };

    fetchTeacherData();
  }, [teacherId]);

  const getSubject = (subjectObj) => {
    return subjectObj?.nom ? subjectObj : { nom: "Unknown Subject" };
  };

  const getClasse = (classeObj) => {
    return classeObj?.name ? classeObj : { name: "Unknown Classroom" };
  };

  const normalizeTime = (time) => {
    if (!time) return "00:00:00";
    return time.slice(0, 8); // Ensure HH:MM:SS format
  };

  const getClassForSlot = (day, time) => {
    return teacherData?.schedules?.find(
      (c) => c.day === day && normalizeTime(c.start_time) === time
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111827] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !teacherData) {
    return (
      <div className="min-h-screen bg-[#111827] text-white flex items-center justify-center">
        <div className="text-red-500 p-4 bg-red-500/10 rounded-lg">{error || "Teacher not found"}</div>
      </div>
    );
  }

  const { teacher, schedules, attendances, students, grades } = teacherData;

  // Calculate attendance stats
  const attendanceStats = {
    total: attendances?.length || 0,
    present: attendances?.filter((record) => record.status === "present").length || 0,
    absent: attendances?.filter((record) => record.status !== "present").length || 0,
  };
  attendanceStats.percentage =
    attendanceStats.total > 0 ? Math.round((attendanceStats.present / attendanceStats.total) * 100) : 0;

  // Filter students by teacher's levels and prepare their grades
  const filteredStudents = students?.filter((student) =>
    teacher.levels?.map((l) => l.id).includes(student.level?.id)
  ) || [];

  const studentsWithGrades = filteredStudents.map((student) => {
    const studentGrades = grades?.filter(
      (grade) => grade.student?.id === student.id && grade.subject?.id === teacher.subject?.id
    ) || [];
    return { ...student, grades: studentGrades };
  });

  return (
    <div className="min-h-screen bg-[#111827] text-white">
      <header className="bg-[#1e293b] p-4">
        <div className="container mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin/teachers/list")}
              className="p-2 bg-blue-500/20 border border-blue-500/30 rounded-full hover:bg-blue-500/30 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Teacher Details</h1>
              <p className="text-sm text-gray-400">View and manage teacher information</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <div className="bg-[#1e293b] rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-[#0f172a] border-4 border-blue-500/30">
              <img
                src={teacher.photo ? `${BASE_URL}${teacher.photo}` : "https://via.placeholder.com/128?text=No+Image"}
                alt={`${teacher.prenom} ${teacher.nom}`}
                className="w-full h-full object-cover"
                onError={(e) => (e.target.src = "https://via.placeholder.com/128?text=No+Image")}
              />
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                {teacher.prenom} {teacher.nom}
              </h2>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-md text-sm">
                  ID: {teacher.id}
                </span>
                <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-md text-sm">
                  {getSubject(teacher.subject).nom}
                </span>
                <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-md text-sm">
                  {teacher.status || "N/A"}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-400" />
                  <span className="text-sm">{teacher.mail || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-green-400" />
                  <span className="text-sm">{teacher.numero || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-red-400" />
                  <span className="text-sm truncate">{teacher.adresse || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#1e293b] rounded-xl mb-6">
          <div className="flex flex-wrap border-b border-gray-800">
            {["overview", "schedule", "attendance", "students", "grades"].map((tab) => (
              <button
                key={tab}
                className={`px-4 py-3 text-sm font-medium ${
                  activeTab === tab ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-400 hover:text-white"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#1e293b] rounded-xl p-6">
          {activeTab === "overview" && (
            <div>
              <h3 className="text-xl font-bold mb-6">Teacher Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-[#0f172a] rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-500/20 p-2 rounded-full">
                      <Briefcase className="h-5 w-5 text-blue-400" />
                    </div>
                    <h4 className="font-medium">Professional Information</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Subject</span>
                      <span>{getSubject(teacher.subject).nom}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Date of Birth</span>
                      <span>{teacher.date_naissance || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status</span>
                      <span
                        className={`px-2 py-1 rounded-md text-xs ${
                          teacher.status === "Active"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {teacher.status || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-[#0f172a] rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-purple-500/20 p-2 rounded-full">
                      <BookOpen className="h-5 w-5 text-purple-400" />
                    </div>
                    <h4 className="font-medium">Teaching Summary</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Schedules</span>
                      <span>{schedules?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Students</span>
                      <span>{filteredStudents?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === "schedule" && (
            <div>
              <h3 className="text-xl font-bold mb-6">Weekly Schedule</h3>
              <div className="bg-[#0f172a] rounded-xl p-5">
                <div className="grid grid-cols-6 gap-2">
                  <div className="col-span-1">
                    <div className="h-12"></div>
                    {timeSlots.map((time) => (
                      <div
                        key={time}
                        className="h-24 flex items-center justify-center text-sm text-gray-400"
                      >
                        {time.slice(0, 5)}
                      </div>
                    ))}
                  </div>
                  {weekdays.map((day) => (
                    <div key={day} className="col-span-1">
                      <div className="h-12 text-center font-medium border-b border-gray-800">
                        {day}
                      </div>
                      {timeSlots.map((time) => {
                        const classItem = getClassForSlot(day, time);
                        return (
                          <div
                            key={`${day}-${time}`}
                            className="h-24 border-b border-gray-800 p-2"
                          >
                            {classItem ? (
                              <div className="bg-blue-600/20 p-2 rounded-lg h-full flex flex-col justify-between">
                                <div>
                                  <div className="font-medium text-sm">
                                    {getSubject(classItem.subject).nom}
                                  </div>
                                  <div className="text-xs text-gray-300">
                                    {normalizeTime(classItem.start_time).slice(0, 5)} -{" "}
                                    {normalizeTime(classItem.end_time).slice(0, 5)}
                                  </div>
                                </div>
                                <div className="text-xs text-blue-300">
                                  {getClasse(classItem.classe).name}
                                </div>
                              </div>
                            ) : (
                              <div className="h-full flex items-center justify-center text-gray-600">
                                -
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
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
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-left">Subject</th>
                        <th className="px-4 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendances && attendances.length > 0 ? (
                        attendances.map((record) => (
                          <tr key={record.id} className="border-t border-gray-800">
                            <td className="px-4 py-2">{record.date || "N/A"}</td>
                            <td className="px-4 py-2">{getSubject(record.subject).nom}</td>
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
                          <td colSpan="3" className="px-4 py-2 text-center text-gray-400">
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
          {activeTab === "students" && (
            <div>
              <h3 className="text-xl font-bold mb-6">Assigned Students and Grades</h3>
              <div className="bg-[#0f172a] rounded-xl p-5">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left">ID</th>
                        <th className="px-4 py-2 text-left">Name</th>
                        <th className="px-4 py-2 text-left">Level</th>
                        <th className="px-4 py-2 text-left">Grades</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentsWithGrades.length > 0 ? (
                        studentsWithGrades.map((student) => (
                          <tr key={student.id} className="border-t border-gray-800">
                            <td className="px-4 py-2">{student.id}</td>
                            <td className="px-4 py-2">
                              {student.prenom && student.nom ? `${student.prenom} ${student.nom}` : "Unknown"}
                            </td>
                            <td className="px-4 py-2">{student.level?.level || "N/A"}</td>
                            <td className="px-4 py-2">
                              {student.grades.length > 0 ? (
                                <ul className="space-y-1">
                                  {student.grades.map((grade) => (
                                    <li key={grade.id} className="flex items-center gap-2">
                                      <span
                                        className={`px-2 py-1 rounded-md text-xs ${
                                          grade.grade >= 90
                                            ? "bg-green-500/20 text-green-400"
                                            : grade.grade >= 80
                                            ? "bg-blue-500/20 text-blue-400"
                                            : grade.grade >= 70
                                            ? "bg-yellow-500/20 text-yellow-400"
                                            : "bg-red-500/20 text-red-400"
                                        }`}
                                      >
                                        {grade.grade}
                                      </span>
                                      <span className="text-xs text-gray-400">
                                        ({grade.grade_type}, {grade.date_g})
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <span className="text-gray-400">No grades assigned</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="px-4 py-2 text-center text-gray-400">
                            No students found for the teacher's subject and level
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
              <h3 className="text-xl font-bold mb-6">Grades Assigned</h3>
              <div className="bg-[#0f172a] rounded-xl p-5">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left">Student</th>
                        <th className="px-4 py-2 text-left">Subject</th>
                        <th className="px-4 py-2 text-left">Grade</th>
                        <th className="px-4 py-2 text-left">Type</th>
                        <th className="px-4 py-2 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grades && grades.length > 0 ? (
                        grades.map((grade) => (
                          <tr key={grade.id} className="border-t border-gray-800">
                            <td className="px-4 py-2">
                              {grade.student && (grade.student.prenom || grade.student.nom)
                                ? `${grade.student.prenom || ""} ${grade.student.nom || ""}`.trim()
                                : "Unknown"}
                            </td>
                            <td className="px-4 py-2">{getSubject(grade.subject).nom}</td>
                            <td className="px-4 py-2">
                              <span
                                className={`px-2 py-1 rounded-md text-xs ${
                                  grade.grade >= 90
                                    ? "bg-green-500/20 text-green-400"
                                    : grade.grade >= 80
                                    ? "bg-blue-500/20 text-blue-400"
                                    : grade.grade >= 70
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : "bg-red-500/20 text-red-400"
                                }`}
                              >
                                {grade.grade || "N/A"}
                              </span>
                            </td>
                            <td className="px-4 py-2">{grade.grade_type || "N/A"}</td>
                            <td className="px-4 py-2">{grade.date_g || "N/A"}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="px-4 py-2 text-center text-gray-400">
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
        </div>
      </main>
    </div>
  );
}