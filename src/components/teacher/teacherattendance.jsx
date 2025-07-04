"use client";

import { useState, useEffect, useCallback } from "react";
import api from "../api";
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
  AlertCircle,
} from "lucide-react";

export default function TeacherAttendanceTracking() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [classSchedule, setClassSchedule] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [levels, setLevels] = useState([]);
  const [levelMap, setLevelMap] = useState(new Map());
  const [levelIdMap, setLevelIdMap] = useState(new Map());
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState({
    teachers: true,
    levels: true,
    subjects: true,
    schedule: false,
    attendance: false,
    saving: false,
  });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Debounce utility to prevent rapid clicks
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // WebSocket for real-time attendance updates
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/attendance/'); // Replace with your backend URL
    
    ws.onopen = () => console.log('WebSocket connected');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'attendance_update' && selectedTeacher?.id === data.teacherId) {
        setAttendanceData((prev) => {
          const dateKey = `${data.date}-${data.subjectId}-${data.scheduleId}`;
          return {
            ...prev,
            [selectedTeacher.id]: {
              ...(prev[selectedTeacher.id] || {}),
              [dateKey]: data.status,
            },
          };
        });
      }
    };
    ws.onclose = () => console.log('WebSocket disconnected');
    ws.onerror = (error) => console.error('WebSocket error:', error);

    return () => ws.close();
  }, [selectedTeacher]);

  // Fetch teachers, levels, and subjects on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading((prev) => ({ ...prev, teachers: true, levels: true, subjects: true }));
      try {
        const [teachersResponse, levelsResponse, subjectsResponse] = await Promise.all([
          api.get("/api/teachers/list/"),
          api.get("/api/levels/list/"),
          api.get("/api/subjects/list/"),
        ]);
        const teachersData = Array.isArray(teachersResponse.data) ? teachersResponse.data : [];
        console.log("Teachers data:", teachersData);
        if (teachersData.length === 0) {
          setError("No teachers found. Please add teachers in the admin panel.");
        }
        setTeachers(teachersData);
        const levelData = Array.isArray(levelsResponse.data) ? levelsResponse.data : [];
        const subjectsData = Array.isArray(subjectsResponse.data) ? subjectsResponse.data : [];

        const levelNames = levelData.map((level) => level.level.toString());
        const idToName = new Map();
        const nameToId = new Map();
        levelData.forEach((level) => {
          idToName.set(level.id, level.level.toString());
          nameToId.set(level.level.toString(), level.id);
        });

        setLevels(["All", ...new Set(levelNames)]);
        setLevelMap(idToName);
        setLevelIdMap(nameToId);
        setSubjects(subjectsData);
        setError(null);

        const lastSelectedTeacherId = localStorage.getItem("lastSelectedTeacherId");
        if (lastSelectedTeacherId) {
          const teacher = teachersData.find((t) => t.id === Number.parseInt(lastSelectedTeacherId));
          if (teacher) setSelectedTeacher(teacher);
        }
      } catch (error) {
        console.error("Fetch initial data error:", error);
        const errorMessage =
          error.response?.status === 401
            ? "Authentication failed. Please log in again."
            : `Failed to load data: ${error.response?.data?.message || error.message}`;
        setError(errorMessage);
      } finally {
        setLoading((prev) => ({ ...prev, teachers: false, levels: false, subjects: false }));
      }
    };
    fetchInitialData();
  }, []);

  // Fetch class schedules for the selected teacher
  useEffect(() => {
    if (!selectedTeacher) {
      setClassSchedule([]);
      setAttendanceData({});
      setSelectedSchedule(null);
      setSelectedDate(null);
      setLoading((prev) => ({ ...prev, schedule: false }));
      return;
    }

    if (!selectedTeacher.subject || !selectedTeacher.subject.id) {
      setError(
        `Teacher ${selectedTeacher.prenom} ${selectedTeacher.nom} has no subject assigned.`
      );
      setClassSchedule([]);
      setLoading((prev) => ({ ...prev, schedule: false }));
      return;
    }

    const fetchClassSchedule = async () => {
      setLoading((prev) => ({ ...prev, schedule: true }));
      try {
        const response = await api.get(`/api/schedules/teacher/${selectedTeacher.id}/`);
        const scheduleData = Array.isArray(response.data) ? response.data : [];
        setClassSchedule(scheduleData);
        setError(null);
      } catch (error) {
        console.error("Fetch schedule error:", error);
        setError(
          `Failed to load class schedule: ${error.response?.data?.message || error.message}`
        );
        setClassSchedule([]);
      } finally {
        setLoading((prev) => ({ ...prev, schedule: false }));
      }
    };
    fetchClassSchedule();
  }, [selectedTeacher]);

  // Fetch attendance data
  const fetchAttendance = useCallback(async () => {
    if (!selectedTeacher) return;

    setLoading((prev) => ({ ...prev, attendance: true }));
    try {
      const response = await api.get(`/api/attendance-t/list/?teacher=${selectedTeacher.id}`);
      console.log("Attendance data:", response.data);
      const attendanceMap = new Map();
      if (Array.isArray(response.data)) {
        response.data.forEach((record) => {
          if (!record.date || !record.subject) return;
          const subjectId = typeof record.subject === "object" ? record.subject.id : record.subject;
          const scheduleId = typeof record.schedule === "object" ? record.schedule?.id : record.schedule || "no-schedule";
          const dateKey = `${record.date}-${subjectId}-${scheduleId}`;
          const status =
            record.status === "retard"
              ? "retard"
              : record.status === "en_attente"
              ? "att"
              : ["present", "absent"].includes(record.status)
              ? record.status
              : null;
          if (status) {
            attendanceMap.set(dateKey, status);
          }
        });
      }
      setAttendanceData((prev) => ({
        ...prev,
        [selectedTeacher.id]: Object.fromEntries(attendanceMap),
      }));
      setError(null);
    } catch (error) {
      console.error("Fetch attendance error:", error);
      let errorMessage = error.response?.data?.message || "Failed to load attendance.";
      if (error.response?.status === 401) {
        errorMessage = "Authentication failed. Please log in again.";
      } else if (error.response?.status === 404) {
        errorMessage = "Attendance endpoint not found. Please contact the administrator.";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error occurred while fetching attendance. Please try again later.";
      }
      setError(errorMessage);
    } finally {
      setLoading((prev) => ({ ...prev, attendance: false }));
    }
  }, [selectedTeacher]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // Filter teachers
  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch =
      searchQuery === "" ||
      (teacher.nom && teacher.nom.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (teacher.prenom && teacher.prenom.toLowerCase().includes(searchQuery.toLowerCase())) ||
      String(teacher.id).includes(searchQuery);

    const teacherLevelIds = (teacher.levels || []).map((levelId) => levelId.toString());
    const selectedLevelId = selectedLevel === "All" ? null : levelIdMap.get(selectedLevel)?.toString();
    const matchesLevel =
      selectedLevel === "All" ||
      (teacherLevelIds.length > 0 && selectedLevelId && teacherLevelIds.includes(selectedLevelId));

    return matchesSearch && matchesLevel;
  });

  // Get subject name
  const getSubjectName = (subjectId) => {
    const subject = subjects.find((s) => s.id === subjectId);
    return subject?.nom || "Unknown Subject";
  };

  // Get classe name
  const getClasseName = (classeObj) => {
    if (typeof classeObj === "object" && classeObj?.name) {
      return classeObj.name;
    } else if (typeof classeObj === "number" || typeof classeObj === "string") {
      return `Room ${classeObj}`;
    }
    return "Unknown Room";
  };

  // Get week dates (Monday to Friday)
  const getWeekDates = (date) => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date);
    monday.setDate(diff);
    const weekDates = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDates.push(d);
    }
    return weekDates;
  };

  const weekDates = getWeekDates(new Date(currentWeek));

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatDateKey = (date) => {
    if (!date || isNaN(new Date(date).getTime())) {
      console.error("Invalid date in formatDateKey:", date);
      return null;
    }
    const dateObj = new Date(date);
    return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(
      dateObj.getDate()
    ).padStart(2, "0")}`;
  };

  const prevWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeek(newDate);
    setSelectedSchedule(null);
    setSelectedDate(null);
  };

  const nextWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeek(newDate);
    setSelectedSchedule(null);
    setSelectedDate(null);
  };

  // Calculate attendance stats
  const calculateAttendance = (teacherId) => {
    if (!attendanceData[teacherId]) {
      return { present: 0, absent: 0, retard: 0, att: 0, percentage: 0 };
    }

    const data = attendanceData[teacherId];
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
    (teacherId, subjectId, date, scheduleId) => {
      if (!teacherId || !attendanceData[teacherId] || !subjectId || !date || !scheduleId) {
        console.warn("Invalid parameters for getAttendanceStatus:", {
          teacherId,
          subjectId,
          date,
          scheduleId,
        });
        return null;
      }
      const dateKey = `${formatDateKey(date)}-${subjectId}-${scheduleId}`;
      return attendanceData[teacherId][dateKey] || null;
    },
    [attendanceData]
  );

  // Update attendance status
  const updateAttendanceStatus = async (subjectId, date, status, scheduleId) => {
    if (isUpdating || !selectedTeacher || !subjectId || !date || !scheduleId) {
      console.warn("Update aborted:", { isUpdating, selectedTeacher, subjectId, date, scheduleId });
      setError("Cannot update attendance: Missing required data.");
      return;
    }

    const formattedDate = formatDateKey(date);
    if (!formattedDate) {
      setError("Invalid date provided.");
      return;
    }

    const dateKey = `${formattedDate}-${subjectId}-${scheduleId}`;
    setIsUpdating(true);
    setLoading((prev) => ({ ...prev, saving: true }));
    try {
      console.log("Updating attendance:", {
        teacher_id: selectedTeacher.id,
        subject_id: subjectId,
        schedule_id: scheduleId,
        date: formattedDate,
        status,
      });

      // Optimistically update UI
      setAttendanceData((prev) => ({
        ...prev,
        [selectedTeacher.id]: {
          ...(prev[selectedTeacher.id] || {}),
          [dateKey]: status,
        },
      }));

      const apiData = {
        teacher: selectedTeacher.id,
        subject: subjectId,
        schedule: scheduleId,
        date: formattedDate,
        status: statusMap[status],
      };

      // Query existing attendance records
      let query = `/api/attendance-t/list/?teacher=${selectedTeacher.id}&date=${formattedDate}&subject=${subjectId}`;
      if (scheduleId !== "no-schedule") {
        query += `&schedule=${scheduleId}`;
      }
      const existingRecords = await api.get(query);
      let response;
      const matchingRecord = Array.isArray(existingRecords.data)
        ? existingRecords.data.find((record) => {
            const recordSubjectId = typeof record.subject === "object" ? record.subject.id : record.subject;
            const recordScheduleId = typeof record.schedule === "object" ? record.schedule?.id : record.schedule || "no-schedule";
            return (
              recordSubjectId === subjectId &&
              recordScheduleId === scheduleId &&
              record.date === formattedDate
            );
          })
        : null;

      if (matchingRecord) {
        response = await api.put(`/api/attendance-t/${matchingRecord.id}/update/`, apiData);
      } else {
        response = await api.post("/api/attendance-t/create/", apiData);
      }

      await fetchAttendance();
      setError("Attendance saved successfully!");
      setTimeout(() => setError(null), 2000);
    } catch (error) {
      console.error("Update attendance error:", error);
      let errorMessage = error.response?.data?.message || "Failed to update attendance.";
      if (error.response?.status === 400) {
        errorMessage = `Validation error: ${error.response?.data?.errors || errorMessage}`;
      } else if (error.response?.status === 401) {
        errorMessage = "Authentication failed. Please log in again.";
      } else if (error.response?.status === 404) {
        errorMessage = "Attendance endpoint not found. Please contact the administrator.";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error occurred while updating attendance. Please try again later.";
      }
      setError(errorMessage);
      setAttendanceData((prev) => {
        const updatedTeacherData = { ...(prev[selectedTeacher.id] || {}) };
        delete updatedTeacherData[dateKey];
        return {
          ...prev,
          [selectedTeacher.id]: updatedTeacherData,
        };
      });
    } finally {
      setLoading((prev) => ({ ...prev, saving: false }));
      setIsUpdating(false);
    }
  };

  // Debounced version of updateAttendanceStatus
  const debouncedUpdateAttendance = useCallback(
    debounce(updateAttendanceStatus, 300),
    [selectedTeacher, isUpdating]
  );

  // Delete attendance record
  const deleteAttendance = async ({ subjectId, date, scheduleId }) => {
    if (!selectedTeacher || !subjectId || !date || !scheduleId) {
      setError("Cannot delete attendance: Missing required data.");
      return;
    }

    const formattedDate = formatDateKey(date);
    if (!formattedDate) {
      setError("Invalid date provided.");
      return;
    }

    try {
      setError("Deleting attendance...");
      let query = `/api/attendance-t/list/?teacher=${selectedTeacher.id}&date=${formattedDate}&subject=${subjectId}`;
      if (scheduleId !== "no-schedule") {
        query += `&schedule=${scheduleId}`;
      }
      const response = await api.get(query);
      const matchingRecord = Array.isArray(response.data)
        ? response.data.find((record) => {
            const recordSubjectId = typeof record.subject === "object" ? record.subject.id : record.subject;
            const recordScheduleId = typeof record.schedule === "object" ? record.schedule?.id : record.schedule || "no-schedule";
            return (
              recordSubjectId === subjectId &&
              recordScheduleId === scheduleId &&
              record.date === formattedDate
            );
          })
        : null;

      if (matchingRecord) {
        await api.delete(`/api/attendance-t/${matchingRecord.id}/delete/`);
        setAttendanceData((prev) => {
          const updatedTeacherData = { ...(prev[selectedTeacher.id] || {}) };
          const dateKey = `${formattedDate}-${subjectId}-${scheduleId}`;
          delete updatedTeacherData[dateKey];
          return {
            ...prev,
            [selectedTeacher.id]: updatedTeacherData,
          };
        });
        await fetchAttendance();
        setSelectedSchedule(null);
        setSelectedDate(null);
        setConfirmDelete(null);
        setError("Attendance record deleted successfully!");
        setTimeout(() => setError(null), 2000);
      } else {
        setError("No attendance record found to delete.");
      }
    } catch (error) {
      console.error("Delete attendance error:", error);
      let errorMessage = error.response?.data?.message || "Failed to delete attendance.";
      if (error.response?.status === 401) {
        errorMessage = "Authentication failed. Please log in again.";
      } else if (error.response?.status === 404) {
        errorMessage = "Attendance record not found.";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error occurred while deleting attendance. Please try again later.";
      }
      setError(errorMessage);
    } finally {
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
    return days[dayNumber] || "Unknown";
  };

  // Get schedules for a day
  const getSchedulesForDay = (dayName) => {
    const dayMap = {
      Monday: ["Monday", "Mon", "monday", "mon", "MON"],
      Tuesday: ["Tuesday", "Tue", "tuesday", "tue", "TUE"],
      Wednesday: ["Wednesday", "Wed", "wednesday", "wed", "WED"],
      Thursday: ["Thursday", "Thu", "thursday", "thu", "THU"],
      Friday: ["Friday", "Fri", "friday", "fri", "FRI"],
    };
    const possibleDays = dayMap[dayName] || [dayName];
    return classSchedule.filter((sch) => sch.day && possibleDays.includes(sch.day));
  };

  // Handle teacher selection
  const handleTeacherSelect = (teacher) => {
    setSelectedTeacher(teacher);
    localStorage.setItem("lastSelectedTeacherId", teacher.id);
    setSelectedSchedule(null);
    setSelectedDate(null);
  };

  // Status mapping for backend compatibility
  const statusMap = {
    present: "present",
    absent: "absent",
    retard: "retard",
    att: "en_attente",
  };

  return (
    <div className="min-h-screen bg-[#111827] text-white">
      <header className="bg-[#1e293b] p-4">
        <div className="container mx-auto">
          <div className="flex items-center gap-3">
            <button
              className="bg-blue-600/20 border border-blue-600/30 p-2 rounded-actions hover:bg-blue-600/30 transition-colors"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold">Teacher Attendance Tracking</h1>
              <p className="text-sm text-gray-400">Monitor and manage teacher attendance by schedule</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6">
        {error && (
          <div
            className={`${
              error.includes("successfully")
                ? "bg-green-600/20 border-green-600/30"
                : error.includes("Saving") || error.includes("Deleting")
                ? "bg-blue-600/20 border-blue-600/30"
                : "bg-red-600/20 border-red-600/30"
            } p-4 rounded-lg mb-6 flex items-center gap-2`}
            role="alert"
          >
            {error.includes("successfully") ? (
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
          {/* Left Column - Teacher List */}
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
                      placeholder="Search teachers..."
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
                {loading.teachers && (
                  <div className="p-6 text-center text-gray-400">
                    <div className="animate-pulse flex flex-col items-center">
                      <div className="h-10 w-10 bg-gray-700 rounded-full mb-2"></div>
                      <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </div>
                )}
                {!loading.teachers && filteredTeachers.length === 0 && (
                  <div className="p-6 text-center text-gray-400">
                    No teachers found. Please check your filters or add teachers in the admin panel.
                  </div>
                )}
                {filteredTeachers.map((teacher) => {
                  const { percentage } = calculateAttendance(teacher.id);
                  const isSelected = selectedTeacher?.id === teacher.id;
                  return (
                    <div
                      key={teacher.id}
                      className={`p-4 border-b border-gray-800 flex items-center gap-3 cursor-pointer hover:bg-[#172033] transition-colors ${
                        isSelected ? "bg-[#172033]" : ""
                      }`}
                      onClick={() => handleTeacherSelect(teacher)}
                    >
                      <img
                        src={teacher.photo || "/placeholder.svg"}
                        alt={`${teacher.prenom} ${teacher.nom}`}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      <div className="flex-1 flex items-center gap-2">
                        <div>
                          <div className="font-medium">
                            {teacher.prenom} {teacher.nom}
                          </div>
                          <div className="text-sm text-gray-400">
                            ID: {teacher.id} • Subject: {teacher.subject?.nom || "Not Assigned"}
                          </div>
                        </div>
                        {!teacher.subject?.id && (
                          <AlertCircle
                            className="h-4 w-4 text-yellow-400"
                            title="No subject assigned"
                          />
                        )}
                      </div>
                      <div
                        className={`text-sm font-medium ${
                          percentage >= 90
                            ? "text-green-400"
                            : percentage >= 70
                            ? "text-yellow-400"
                            : "text-red-400"
                        }`}
                      >
                        {percentage}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Schedule and Attendance */}
          <div className="lg:col-span-2">
            <div className="bg-[#1e293b] rounded-xl overflow-hidden">
              <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/30 p-2 rounded-full">
                    <Calendar className="h-5 w-5 text-blue-300" />
                  </div>
                  <h2 className="text-lg font-semibold">
                    Week of {formatDate(weekDates[0])} - {formatDate(weekDates[4])}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="p-2 rounded-lg bg-[#0f172a] hover:bg-[#172033]"
                    onClick={prevWeek}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    className="px-3 py-2 rounded-lg bg-[#0f172a]"
                    onClick={() => setCurrentWeek(new Date())}
                  >
                    Today
                  </button>
                  <button
                    className="p-2 rounded-lg bg-[#0f172a] hover:bg-[#172033]"
                    onClick={nextWeek}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {selectedTeacher ? (
                <div>
                  <div className="p-4 border-b border-gray-800 bg-[#172033]">
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedTeacher.photo || "/placeholder.svg"}
                        alt={`${selectedTeacher.prenom} ${selectedTeacher.nom}`}
                        className="h-12 w-12 rounded-xl object-cover"
                      />
                      <div>
                        <div className="font-semibold text-lg">
                          {selectedTeacher.prenom} {selectedTeacher.nom}
                        </div>
                        <div className="text-sm text-gray-400">
                          ID: {selectedTeacher.id} • Subject: {selectedTeacher.subject?.nom || "Not Assigned"}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 mt-4">
                      {["present", "absent", "retard", "att"].map((status) => (
                        <div key={status} className="bg-[#0f172a] rounded-lg p-3">
                          <div className="text-sm text-gray-400">
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </div>
                          <div
                            className={`text-xl font-medium ${
                              status === "present"
                                ? "text-green-400"
                                : status === "absent"
                                ? "text-red-400"
                                : status === "retard"
                                ? "text-yellow-400"
                                : "text-blue-400"
                            }`}
                          >
                            {calculateAttendance(selectedTeacher.id)[status]} classes
                          </div>
                        </div>
                      ))}
                      <div className="bg-[#0f172a] rounded-lg p-3 col-span-full">
                        <div className="text-sm text-gray-400">Attendance Rate</div>
                        <div className="text-xl font-semibold text-blue-400">
                          {calculateAttendance(selectedTeacher.id).percentage}%
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="font-semibold mb-4">Weekly Class Schedule</h3>
                    {loading.schedule ? (
                      <div className="p-6 text-center text-gray-400">
                        <div className="animate-pulse flex flex-col items-center">
                          <div className="h-6 bg-gray-700 rounded w-3/4 mb-4"></div>
                          <div className="h-20 bg-gray-700 rounded w-full mb-3"></div>
                          <div className="h-20 bg-gray-700 rounded w-full mb-3"></div>
                          <div className="h-20 bg-gray-700 rounded w-full"></div>
                        </div>
                      </div>
                    ) : classSchedule.length === 0 ? (
                      <div className="p-4 text-center text-gray-400">
                        No schedules assigned to this teacher.
                      </div>
                    ) : (
                      weekDates.map((date, dateIndex) => {
                        const dayName = getDayName(date.getDay());
                        const schedules = getSchedulesForDay(dayName);
                        const isInFuture = new Date(date) > new Date();
                        return (
                          <div key={dateIndex} className="mb-4">
                            <div className="bg-[#0f172a] p-2 rounded-t-lg font-semibold">
                              {dayName}, {formatDate(date)}
                            </div>
                            {schedules.length > 0 ? (
                              <div className="border border-gray-800 rounded-b-lg divide-y divide-gray-800">
                                {schedules.map((sch) => {
                                  const subjectId = sch.subject?.id || sch.subject;
                                  const scheduleId = sch.id || "no-schedule";
                                  const status = getAttendanceStatus(
                                    selectedTeacher.id,
                                    subjectId,
                                    date,
                                    scheduleId
                                  );
                                  const isSelected =
                                    selectedSchedule?.id === sch.id &&
                                    selectedDate?.getTime() === date.getTime();
                                  return (
                                    <div
                                      key={sch.id || `${subjectId}-${date.toISOString()}`}
                                      className={`p-3 flex items-center justify-between cursor-pointer hover:bg-[#172033] ${
                                        isSelected ? "bg-[#172033]" : ""
                                      }`}
                                      onClick={() => {
                                        setSelectedSchedule(sch);
                                        setSelectedDate(date);
                                      }}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="bg-blue-500/20 p-2 rounded-full">
                                          <BookOpen className="h-4 w-4 text-blue-400" />
                                        </div>
                                        <div>
                                          <div className="font-medium">
                                            {sch.subject?.nom || getSubjectName(subjectId)}
                                          </div>
                                          <div className="text-sm text-gray-400">
                                            {sch.start_time} - {sch.end_time} •{" "}
                                            {getClasseName(sch.classe)}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div
                                          className={`px-3 py-1 rounded-full flex items-center gap-1 ${getStatusColor(
                                            status
                                          )}`}
                                        >
                                          {getStatusIcon(status)}
                                          <span className="text-sm">
                                            {status
                                              ? status.charAt(0).toUpperCase() + status.slice(1)
                                              : "Not Set"}
                                          </span>
                                        </div>
                                        {status && !isInFuture && (
                                          <button
                                            className="text-red-400 hover:text-red-600"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setConfirmDelete({
                                                subjectId,
                                                date,
                                                scheduleId,
                                              });
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
                                No schedules for this day
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {selectedSchedule && selectedDate && (
                    <div className="p-6 border-t border-gray-800 bg-[#172033]">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="font-semibold text-lg">
                            {selectedSchedule.subject?.nom ||
                              getSubjectName(selectedSchedule.subject?.id || selectedSchedule.subject)}
                          </div>
                          <div className="text-sm text-gray-400">
                            {getDayName(selectedDate.getDay())}, {formatDate(selectedDate)} •{" "}
                            {selectedSchedule.start_time} - {selectedSchedule.end_time} •{" "}
                            {getClasseName(selectedSchedule.classe)}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        {["present", "absent", "retard", "att"].map((status) => {
                          const isInFuture = new Date(selectedDate) > new Date();
                          const subjectId = selectedSchedule.subject?.id || selectedSchedule.subject;
                          const scheduleId = selectedSchedule.id || "no-schedule";
                          return (
                            <button
                              key={status}
                              className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 ${
                                getAttendanceStatus(
                                  selectedTeacher.id,
                                  subjectId,
                                  selectedDate,
                                  scheduleId
                                ) === status
                                  ? `${
                                      status === "present"
                                        ? "bg-green-500/40 text-white"
                                        : status === "absent"
                                        ? "bg-red-500/40 text-white"
                                        : status === "retard"
                                        ? "bg-yellow-500/40 text-white"
                                        : "bg-blue-500/40 text-white"
                                    }`
                                  : `bg-[#0f172a] ${
                                      status === "present"
                                        ? "text-green-400 hover:bg-green-500/20"
                                        : status === "absent"
                                        ? "text-red-400 hover:bg-red-500/20"
                                        : status === "retard"
                                        ? "text-yellow-400 hover:bg-yellow-500/20"
                                        : "text-blue-400 hover:bg-blue-500/20"
                                    }`
                              } ${loading.saving || isUpdating || isInFuture ? "opacity-50 cursor-not-allowed" : ""}`}
                              onClick={() =>
                                debouncedUpdateAttendance(
                                  subjectId,
                                  selectedDate,
                                  status,
                                  scheduleId
                                )
                              }
                              disabled={isInFuture || loading.saving || isUpdating}
                              aria-label={`Set ${status} status`}
                            >
                              {getStatusIcon(status)}
                              <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-12 text-center text-gray-400">
                  <Calendar className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg">Select a teacher to view attendance records</p>
                </div>
              )}

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

        <div className="mt-6 bg-[#1e293b] rounded-xl p-4">
          <h3 className="font-semibold mb-4">Attendance Status Legend</h3>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-400"></div>
              <span>Present - Teacher attended the class</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-400"></div>
              <span>Absent - Teacher did not attend the class</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-400"></div>
              <span>Retard - Teacher was late</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-400"></div>
              <span>En Attente - Attendance pending verification</span>
            </div>
          </div>
        </div>

        {confirmDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#1e293b] p-6 rounded-xl max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
              <p className="mb-6 text-gray-300">
                Are you sure you want to delete the attendance record for{" "}
                {getSubjectName(confirmDelete.subjectId)} on {formatDate(confirmDelete.date)}?
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
                  onClick={() => deleteAttendance(confirmDelete)}
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