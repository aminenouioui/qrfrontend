"use client";

import { useState, useEffect, useCallback } from "react";
import api from "../api"; // Ensure this points to your axios instance
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
} from "lucide-react";

export default function AttendanceTracking() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [classSchedule, setClassSchedule] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [levels, setLevels] = useState([]);
  const [levelMap, setLevelMap] = useState({});
  const [levelIdMap, setLevelIdMap] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState({
    students: true,
    levels: true,
    subjects: true,
    schedule: false,
    attendance: false,
    saving: false,
  });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [attendanceVersion, setAttendanceVersion] = useState(0);

  // Fetch students and levels on component mount
  useEffect(() => {
    const fetchStudentsAndLevels = async () => {
      setLoading((prev) => ({ ...prev, students: true, levels: true }));
      try {
        const [studentsResponse, levelsResponse] = await Promise.all([
          api.get("/api/students/list/"), // Matches student_qr
          api.get("/api/levels/list/"),   // Matches student_qr
        ]);
        console.log("Students fetched:", studentsResponse.data);
        console.log("Levels fetched:", levelsResponse.data);
        setStudents(studentsResponse.data || []);

        const levelData = levelsResponse.data || [];
        const levelNames = levelData.map((level) => level.level.toString());
        const idToName = {};
        const nameToId = {};
        levelData.forEach((level) => {
          idToName[level.id] = level.level.toString();
          nameToId[level.level.toString()] = level.id;
        });

        setLevels(["All", ...new Set(levelNames)]);
        setLevelMap(idToName);
        setLevelIdMap(nameToId);
        setError(null);

        const lastSelectedStudentId = localStorage.getItem("lastSelectedStudentId");
        if (lastSelectedStudentId) {
          const student = studentsResponse.data.find((s) => s.id === Number.parseInt(lastSelectedStudentId));
          if (student) setSelectedStudent(student);
        }
        setLoading((prev) => ({ ...prev, students: false, levels: false }));
      } catch (error) {
        console.error("Fetch students/levels error:", error);
        setError(`Failed to load students/levels: ${error.message}`);
        setLoading((prev) => ({ ...prev, students: false, levels: false }));
      }
    };
    fetchStudentsAndLevels();
  }, []);

  // Fetch subjects on component mount
  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading((prev) => ({ ...prev, subjects: true }));
      try {
        const response = await api.get("/api/subjects/list/"); // Matches teacher_qr
        console.log("Subjects fetched:", response.data);
        setSubjects(response.data || []);
        setError(null);
        setLoading((prev) => ({ ...prev, subjects: false }));
      } catch (error) {
        console.error("Fetch subjects error:", error);
        setError(`Failed to load subjects: ${error.message}`);
        setLoading((prev) => ({ ...prev, subjects: false }));
      }
    };
    fetchSubjects();
  }, []);

  // Fetch class schedules for the selected student's level
  useEffect(() => {
    if (selectedStudent) {
      const fetchClassSchedule = async () => {
        setLoading((prev) => ({ ...prev, schedule: true }));
        try {
          const levelId = selectedStudent.level;
          const response = await api.get(`/api/schedules/level/${levelId}/`); // Matches student_qr
          console.log(`Class schedule for level ${levelId}:`, response.data);
          setClassSchedule(response.data || []);
          setError(null);
          setLoading((prev) => ({ ...prev, schedule: false }));
        } catch (error) {
          console.error("Fetch class schedule error:", error);
          setError(`Failed to load class schedule: ${error.message}`);
          setLoading((prev) => ({ ...prev, schedule: false }));
        }
      };
      fetchClassSchedule();
    } else {
      setClassSchedule([]);
    }
  }, [selectedStudent]);

  // Fetch attendance data for the selected student
  useEffect(() => {
    if (selectedStudent) {
      console.log(`Fetching attendance for student ${selectedStudent.id}`);
      const fetchAttendance = async () => {
        setLoading((prev) => ({ ...prev, attendance: true }));
        try {
          const response = await api.get(`/api/attendance/${selectedStudent.id}/`); // Matches student_qr
          console.log(`Fetched attendance for ${selectedStudent.id}:`, response.data);
          setAttendanceData((prev) => ({
            ...prev,
            [selectedStudent.id]: response.data || {},
          }));
          setError(null);
          setLoading((prev) => ({ ...prev, attendance: false }));
        } catch (error) {
          console.error("Fetch attendance error:", error);
          setError(`Failed to load attendance: ${error.message}`);
          setLoading((prev) => ({ ...prev, attendance: false }));
        }
      };
      fetchAttendance();
    }
  }, [selectedStudent, attendanceVersion]);

  // Filter students based on search and level
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      searchQuery === "" ||
      student.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(student.id).includes(searchQuery);

    const studentLevelId = student.level ? student.level.toString() : null;
    const selectedLevelId = selectedLevel === "All" ? null : levelIdMap[selectedLevel]?.toString();
    const matchesLevel =
      selectedLevel === "All" || (studentLevelId && selectedLevelId && studentLevelId === selectedLevelId);

    return matchesSearch && matchesLevel;
  });

  // Get subject name by ID
  const getSubjectName = (subjectId) => {
    const subject = subjects.find((s) => s.id === subjectId);
    return subject ? subject.nom : `Subject ${subjectId}`;
  };

  const getClasseName = (classeId) => {
    // Assuming classe is an ID; you may need to fetch classes if you want to display the name
    return `Room ${classeId}`; // Replace with proper fetching if needed
  };

  // Get week dates (Monday to Friday)
  const getWeekDates = (date) => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date);
    monday.setDate(diff);

    const weekDates = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  const weekDates = getWeekDates(new Date(currentWeek));

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatDateKey = (date) => {
    const dateObj = new Date(date);
    return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;
  };

  const prevWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeek(newDate);
    setSelectedClass(null);
  };

  const nextWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeek(newDate);
    setSelectedClass(null);
  };

  // Calculate attendance statistics
  const calculateAttendance = (studentId) => {
    if (!attendanceData[studentId]) return { present: 0, absent: 0, retard: 0, att: 0, percentage: 0 };

    const data = attendanceData[studentId];
    const total = Object.keys(data).length;
    const present = Object.values(data).filter((status) => status === "present").length;
    const absent = Object.values(data).filter((status) => status === "absent").length;
    const retard = Object.values(data).filter((status) => status === "retard").length;
    const att = Object.values(data).filter((status) => status === "att").length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return { present, absent, retard, att, percentage };
  };

  // Get attendance status
  const getAttendanceStatus = useCallback(
    (studentId, classId, date) => {
      if (!studentId || !attendanceData[studentId]) {
        console.log(`No attendance data for student ${studentId}`);
        return null;
      }

      const dateKey = `${formatDateKey(date)}-${classId}`;
      const status = attendanceData[studentId][dateKey];
      console.log(`Attendance check: student=${studentId}, class=${classId}, date=${formatDateKey(date)}, status=${status || "Not Set"}`);
      return status;
    },
    [attendanceData, attendanceVersion],
  );

  // Update attendance status
  const updateAttendanceStatus = async (classId, date, status) => {
    if (!selectedStudent || !classId || !date) return;

    const dateKey = `${formatDateKey(date)}-${classId}`;
    setLoading((prev) => ({ ...prev, saving: true }));
    setError("Saving attendance status...");

    try {
      // Optimistically update the attendance data
      setAttendanceData((prev) => {
        const updatedData = { ...prev };
        if (!updatedData[selectedStudent.id]) updatedData[selectedStudent.id] = {};
        updatedData[selectedStudent.id][dateKey] = status;
        return updatedData;
      });

      const apiData = {
        student_id: selectedStudent.id,
        schedule_id: classId,
        date: formatDateKey(date),
        status,
      };

      const response = await api.post("/api/attendance/add/", apiData); // Matches student_qr
      console.log("POST response:", response.data);

      // Force a re-render and refetch to ensure sync with backend
      setAttendanceVersion((v) => v + 1);
      setError("Attendance saved successfully!");
      setTimeout(() => setError(null), 2000);
    } catch (error) {
      console.error("Update attendance error:", error);
      setError(`Failed to update attendance: ${error.response?.data?.detail || error.message}`);
      // Rollback on error
      setAttendanceData((prev) => {
        const updatedData = { ...prev };
        if (updatedData[selectedStudent.id] && updatedData[selectedStudent.id][dateKey]) {
          delete updatedData[selectedStudent.id][dateKey];
        }
        return updatedData;
      });
    } finally {
      setLoading((prev) => ({ ...prev, saving: false }));
    }
  };

  // Delete attendance record
  const deleteAttendance = async (classId, date) => {
    if (!selectedStudent || !classId || !date) return;

    const dateKey = `${formatDateKey(date)}-${classId}`;
    setError("Deleting attendance record...");

    try {
      await api.delete(`/api/attendance/delete/${selectedStudent.id}/${classId}/${formatDateKey(date)}/`); // Matches student_qr

      // Update local state immediately
      setAttendanceData((prev) => {
        const updatedData = { ...prev };
        if (updatedData[selectedStudent.id] && updatedData[selectedStudent.id][dateKey]) {
          delete updatedData[selectedStudent.id][dateKey];
        }
        return updatedData;
      });

      setAttendanceVersion((v) => v + 1);
      setSelectedClass(null);
      setSelectedDate(null);
      setConfirmDelete(null);
      setError("Attendance record deleted successfully!");
      setTimeout(() => setError(null), 2000);
    } catch (error) {
      console.error("Delete attendance error:", error);
      setError(`Failed to delete attendance: ${error.message}`);
      setConfirmDelete(null);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "present":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "absent":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "retard":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "att":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-[#0f172a] text-gray-400";
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "present":
        return <Check className="h-4 w-4 text-green-400" />;
      case "absent":
        return <X className="h-4 w-4 text-red-400" />;
      case "retard":
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case "att":
        return <Clock className="h-4 w-4 text-blue-400" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Map day number to day name
  const getDayName = (dayNumber) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[dayNumber];
  };

  // Get classes for a specific day
  const getClassesForDay = (dayName) => {
    const dayMap = {
      Monday: ["Monday", "Mon", "monday", "mon", "MON"],
      Tuesday: ["Tuesday", "Tue", "tuesday", "tue", "TUE"],
      Wednesday: ["Wednesday", "Wed", "wednesday", "wed", "WED"],
      Thursday: ["Thursday", "Thu", "thursday", "thu", "THU"],
      Friday: ["Friday", "Fri", "friday", "fri", "FRI"],
    };
    const possibleDays = dayMap[dayName] || [dayName.toLowerCase()];
    return classSchedule.filter((cls) => cls.day && possibleDays.includes(cls.day.toUpperCase()));
  };

  // Handle student selection
  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    localStorage.setItem("lastSelectedStudentId", student.id);
    setSelectedClass(null);
    setSelectedDate(null);
  };

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
              error.includes("saved successfully") || error.includes("deleted successfully")
                ? "bg-green-600/20 border-green-600/30"
                : error.includes("Saving") || error.includes("Deleting")
                ? "bg-blue-600/20 border-blue-600/30"
                : "bg-red-600/20 border-red-600/30"
            } p-4 rounded-lg mb-6 flex items-center gap-2`}
          >
            {error.includes("saved successfully") || error.includes("deleted successfully") ? (
              <Check className="h-5 w-5 text-green-400" />
            ) : error.includes("Saving") || error.includes("Deleting") ? (
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
                  const { percentage } = calculateAttendance(student.id);
                  const isSelected = selectedStudent?.id === student.id;

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
                  );
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
                      const dayName = getDayName(date.getDay());
                      const classes = getClassesForDay(dayName);

                      return (
                        <div key={dateIndex} className="mb-4">
                          <div className="bg-[#0f172a] p-2 rounded-t-lg font-medium">
                            {dayName}, {formatDate(date)}
                          </div>

                          {classes.length > 0 ? (
                            <div className="border border-gray-800 rounded-b-lg divide-y divide-gray-800">
                              {classes.map((cls) => {
                                const status = getAttendanceStatus(selectedStudent.id, cls.id, date);
                                const isSelected =
                                  selectedClass?.id === cls.id && selectedDate?.getTime() === date.getTime();
                                const isInFuture = date > new Date();

                                return (
                                  <div
                                    key={cls.id}
                                    className={`p-3 flex items-center justify-between cursor-pointer hover:bg-[#172033] ${
                                      isSelected ? "bg-[#172033]" : ""
                                    }`}
                                    onClick={() => {
                                      if (!isInFuture) {
                                        setSelectedClass(cls);
                                        setSelectedDate(date);
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
                                          {cls.start_time} - {cls.end_time} • {getClasseName(cls.classe)}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <div
                                        className={`px-3 py-1 rounded-full flex items-center gap-1 ${getStatusColor(
                                          status,
                                        )}`}
                                      >
                                        {getStatusIcon(status)}
                                        <span className="text-sm">
                                          {status ? status.charAt(0).toUpperCase() + status.slice(1) : "Not Set"}
                                        </span>
                                      </div>
                                      {status && !isInFuture && (
                                        <button
                                          className="text-red-400 hover:text-red-600"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setConfirmDelete({ classId: cls.id, date });
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="border border-gray-800 rounded-b-lg p-4 text-center text-gray-400">
                              No classes scheduled for this day
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Attendance Status Controls */}
                  {selectedClass && selectedDate && (
                    <div className="p-4 border-t border-gray-800 bg-[#172033]">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="font-medium text-lg">{getSubjectName(selectedClass.subject)}</div>
                          <div className="text-sm text-gray-400">
                            {getDayName(selectedDate.getDay())}, {formatDate(selectedDate)} •{" "}
                            {selectedClass.start_time} - {selectedClass.end_time} •{" "}
                            {getClasseName(selectedClass.classe)}
                          </div>
                        </div>
                      </div>

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
                Are you sure you want to delete the attendance record for{" "}
                {getSubjectName(selectedClass?.subject)} on {formatDate(confirmDelete.date)}?
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
  );
}