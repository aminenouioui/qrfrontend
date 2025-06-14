"use client";

import { useState, useEffect } from "react";
import api from "../api";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  AlertCircle,
} from "lucide-react";

export default function ClassSchedule() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [isEditingClass, setIsEditingClass] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    subject: "",
    day: "MON",
    start_time: "08:00:00",
    end_time: "10:00:00",
    teacher: "",
    classe: "",
    notes: "",
  });

  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [classrooms, setClassrooms] = useState([]);

  const weekdays = ["MON", "TUE", "WED", "THU", "FRI"];
  const timeSlots = [
    "08:00:00",
    "09:00:00",
    "10:00:00",
    "11:00:00",
    "12:00:00",
    "13:00:00",
    "14:00:00",
    "15:00:00",
    "16:00:00",
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subjectsRes, teachersRes, classroomsRes] = await Promise.all([
          api.get("/api/subjects/list/"),
          api.get("/api/teachers/list/"),
          api.get("/api/classes/list/"),
        ]);
        setSubjects(subjectsRes.data);
        setTeachers(teachersRes.data);
        setClassrooms(classroomsRes.data);
        setError(null);
      } catch (error) {
        setError(
          `Failed to load data: ${
            error.response?.data?.detail || error.message
          }`
        );
      }
    };
    fetchData();
  }, []);

  const fetchSchedulesByTeacher = async (teacherId) => {
    try {
      const response = await api.get(`/api/schedules/teacher/${teacherId}/`);
      setSchedules(response.data);
      setError(null);
    } catch (error) {
      setError(
        `Failed to load schedules: ${
          error.response?.data?.detail || error.message
        }`
      );
    }
  };

  useEffect(() => {
    if (selectedTeacher) {
      fetchSchedulesByTeacher(selectedTeacher.id);
    } else {
      setSchedules([]);
    }
  }, [selectedTeacher]);

  const handleTeacherClick = (teacher) => {
    setSelectedTeacher(teacher);
    setFormData((prev) => ({ ...prev, teacher: teacher.id }));
  };

  const getSubject = (subjectObj) => {
    return (
      subjects.find((s) => s.id === (subjectObj?.id || subjectObj)) || {
        id: "",
        nom: "Unknown Subject",
      }
    );
  };

  const getClasse = (classeObj) => {
    return (
      classrooms.find((c) => c.id === (classeObj?.id || classeObj)) || {
        id: "",
        name: "Unknown Classroom",
      }
    );
  };

  const normalizeTime = (time) => {
    if (!time) return "00:00:00";
    const parts = time.split(":");
    const hours = parts[0].padStart(2, "0");
    const minutes = parts[1]?.padStart(2, "0") || "00";
    const seconds = parts[2]?.padStart(2, "0") || "00";
    return `${hours}:${minutes}:${seconds}`;
  };

  const isTimeOverlap = (start, end, day, excludeId = null) => {
    const startTime = new Date(`1970-01-01T${start}`);
    const endTime = new Date(`1970-01-01T${end}`);
    return schedules.some((s) => {
      if (s.id === excludeId || s.day !== day) return false;
      const sStart = new Date(`1970-01-01T${normalizeTime(s.start_time)}`);
      const sEnd = new Date(`1970-01-01T${normalizeTime(s.end_time)}`);
      return (
        (startTime >= sStart && startTime < sEnd) ||
        (endTime > sStart && endTime <= sEnd) ||
        (startTime <= sStart && endTime >= sEnd)
      );
    });
  };

  const getClassForSlot = (day, time) => {
    const slotStart = new Date(`1970-01-01T${time}`);
    const slotEnd = new Date(`1970-01-01T${time}`);
    slotEnd.setHours(slotEnd.getHours() + 2);

    return schedules.find((c) => {
      if (c.day !== day) return false;
      const scheduleStart = new Date(`1970-01-01T${normalizeTime(c.start_time)}`);
      const scheduleEnd = new Date(`1970-01-01T${normalizeTime(c.end_time)}`);
      return (
        (scheduleStart >= slotStart && scheduleStart < slotEnd) ||
        (scheduleEnd > slotStart && scheduleEnd <= slotEnd) ||
        (scheduleStart <= slotStart && scheduleEnd >= slotEnd)
      );
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ["subject", "classe"].includes(name) ? Number(value) || "" : value,
    }));
  };

  const handleAddClass = (day, time) => {
    if (!selectedTeacher) {
      setError("Please select a teacher first.");
      return;
    }
    setFormData({
      subject: subjects[0]?.id || "",
      day,
      start_time: time,
      end_time: getEndTime(time),
      teacher: selectedTeacher.id,
      classe: classrooms[0]?.id || "",
      notes: "",
    });
    setIsAddingClass(true);
    setSelectedClass(null);
    setError(null);
  };

  const handleEditClass = (classItem) => {
    setFormData({
      id: classItem.id,
      subject: classItem.subject?.id || classItem.subject,
      day: classItem.day,
      start_time: normalizeTime(classItem.start_time),
      end_time: normalizeTime(classItem.end_time),
      teacher: classItem.teacher,
      classe: classItem.classe?.id || classItem.classe,
      notes: classItem.notes || "",
    });
    setIsEditingClass(true);
    setSelectedClass(classItem);
    setError(null);
  };

  const getEndTime = (startTime) => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const endHours = hours + 2;
    return `${endHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`;
  };

  const validateForm = () => {
    if (!formData.subject) return "Subject is required.";
    if (!formData.classe) return "Classroom is required.";
    if (!formData.teacher) return "Teacher is required.";
    if (!formData.day) return "Day is required.";
    if (!formData.start_time || !formData.end_time) return "Start and end times are required.";
    const start = new Date(`1970-01-01T${formData.start_time}`);
    const end = new Date(`1970-01-01T${formData.end_time}`);
    if (end <= start) return "End time must be later than start time.";
    if (isTimeOverlap(formData.start_time, formData.end_time, formData.day, formData.id)) {
      return "Time slot conflicts with an existing schedule.";
    }
    return null;
  };

  const handleSaveNewClass = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      const response = await api.post("/api/schedules/add/", formData);
      console.log("New schedule:", response.data);
      setSchedules((prev) => [...prev, response.data]);
      setIsAddingClass(false);
      resetForm();
      setError(null);
    } catch (error) {
      setError(
        `Failed to save: ${
          error.response?.data?.detail ||
          Object.values(error.response?.data || {}).join(", ") ||
          error.message
        }`
      );
    }
  };

  const handleUpdateClass = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      const response = await api.put(`/api/schedules/update/${formData.id}/`, formData);
      setSchedules((prev) => prev.map((c) => (c.id === formData.id ? response.data : c)));
      setIsEditingClass(false);
      setSelectedClass(null);
      setError(null);
    } catch (error) {
      setError(
        `Failed to update: ${
          error.response?.data?.detail ||
          Object.values(error.response?.data || {}).join(", ") ||
          error.message
        }`
      );
    }
  };

  const handleDeleteClass = async () => {
    if (!selectedClass?.id) {
      setError("No schedule selected for deletion.");
      setShowDeleteConfirm(false);
      return;
    }
    try {
      await api.delete(`/api/schedules/delete/${selectedClass.id}/`);
      setSchedules((prev) => prev.filter((c) => c.id !== selectedClass.id));
      setShowDeleteConfirm(false);
      setSelectedClass(null);
      setError(null);
    } catch (error) {
      const errorMsg =
        error.response?.data?.detail ||
        error.response?.data?.error ||
        error.message ||
        "Unknown error occurred";
      setError(`Failed to delete schedule: ${errorMsg}`);
    }
  };

  const resetForm = () => {
    setFormData({
      subject: subjects[0]?.id || "",
      day: "MON",
      start_time: "08:00:00",
      end_time: "10:00:00",
      teacher: selectedTeacher?.id || "",
      classe: classrooms[0]?.id || "",
      notes: "",
    });
  };

  const getWeekDates = (date) => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    const weekDates = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDates.push(d);
    }
    return weekDates;
  };

  const weekDates = getWeekDates(new Date(currentWeek));
  const formatDate = (date) => date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div className="bg-[#111827] text-white min-h-screen">
      <style jsx global>{`
        html, body {
          overflow-y: auto;
          scroll-behavior: smooth;
        }
      `}</style>
      <header className="bg-[#1e293b] p-4 sticky top-0 z-10">
        <div className="container mx-auto">
          <div className="flex items-center gap-3">
            <button
              className="bg-blue-600/20 border border-blue-600/30 p-2 rounded-lg"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Teacher Schedule</h1>
              <p className="text-sm text-gray-400">Manage teacher class timetables</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6">
        {error && (
          <div className="bg-red-600/20 border border-red-600/30 p-4 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 flex flex-col">
            <div className="bg-[#1e293b] rounded-xl overflow-hidden mb-6 flex-shrink-0">
              <div className="p-4 border-b border-gray-800">
                <h3 className="font-medium">Select Teacher</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {teachers.map((teacher) => (
                  <div
                    key={teacher.id}
                    className={`p-4 border-b border-gray-800 cursor-pointer hover:bg-[#172033] ${
                      selectedTeacher?.id === teacher.id ? "bg-[#172033]" : ""
                    }`}
                    onClick={() => handleTeacherClick(teacher)}
                  >
                    <div className="font-medium">{teacher.prenom} {teacher.nom}</div>
                    <div className="text-xs text-gray-400">{teacher.subject?.nom || "No subject"}</div>
                  </div>
                ))}
              </div>
            </div>

            {(isAddingClass || isEditingClass) && (
              <div className="bg-[#1e293b] rounded-xl p-6 flex-grow overflow-y-auto">
                <h3 className="text-lg font-medium mb-4">
                  {isAddingClass ? "Add New Class" : "Edit Class"}
                </h3>
                <div className="grid grid-cols-1 gap-4 mb-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Subject</label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.nom}
                        </option>
                      ))}
                    </select>
                  </div>
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
                    <input
                      type="time"
                      name="start_time"
                      value={formData.start_time.slice(0, 5)}
                      onChange={(e) =>
                        handleInputChange({
                          target: { name: "start_time", value: normalizeTime(e.target.value) },
                        })
                      }
                      className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">End Time</label>
                    <input
                      type="time"
                      name="end_time"
                      value={formData.end_time.slice(0, 5)}
                      onChange={(e) =>
                        handleInputChange({
                          target: { name: "end_time", value: normalizeTime(e.target.value) },
                        })
                      }
                      className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Classroom</label>
                    <select
                      name="classe"
                      value={formData.classe}
                      onChange={handleInputChange}
                      className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="">Select Classroom</option>
                      {classrooms.map((classe) => (
                        <option key={classe.id} value={classe.id}>
                          {classe.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Notes</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                      rows="3"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-4 py-2 bg-blue-600 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                    onClick={isAddingClass ? handleSaveNewClass : handleUpdateClass}
                  >
                    <Save className="h-4 w-4" /> Save
                  </button>
                  <button
                    className="px-4 py-2 bg-gray-600 rounded-lg flex items-center gap-2 hover:bg-gray-700"
                    onClick={() => {
                      setIsAddingClass(false);
                      setIsEditingClass(false);
                      setError(null);
                    }}
                  >
                    <X className="h-4 w-4" /> Cancel
                  </button>
                </div>
              </div>
            )}

            {showDeleteConfirm && (
              <div className="bg-[#1e293b] rounded-xl p-4 mt-6 flex-shrink-0">
                <div className="flex items-center gap-2 text-red-400 mb-4">
                  <AlertCircle className="h-5 w-5" />
                  <h3 className="text-lg font-medium">Confirm Deletion</h3>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                  Are you sure you want to delete "{getSubject(selectedClass?.subject)?.nom || "Unknown"}" on{" "}
                  {selectedClass?.day || ""} at {selectedClass?.start_time?.slice(0, 5) || ""}?
                </p>
                <div className="flex gap-2">
                  <button
                    className="px-4 py-2 bg-red-600 rounded-lg flex items-center gap-2 hover:bg-red-700"
                    onClick={handleDeleteClass}
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                  <button
                    className="px-4 py-2 bg-gray-600 rounded-lg flex items-center gap-2 hover:bg-gray-700"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    <X className="h-4 w-4" /> Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-3">
            <div className="bg-[#1e293b] rounded-xl overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <button
                    className="p-2 bg-blue-600/20 border border-blue-600/30 rounded-lg hover:bg-blue-600/40"
                    onClick={() => setCurrentWeek(new Date(currentWeek.setDate(currentWeek.getDate() - 7)))}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="text-sm font-medium">
                    {weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} -{" "}
                    {weekDates[4].toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  <button
                    className="p-2 bg-blue-600/20 border border-blue-600/30 rounded-lg hover:bg-blue-600/40"
                    onClick={() => setCurrentWeek(new Date(currentWeek.setDate(currentWeek.getDate() + 7)))}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
                {!selectedTeacher ? (
                  <div className="text-center text-gray-400 py-10">
                    Please select a teacher to view their schedule.
                  </div>
                ) : (
                  <div className="grid grid-cols-6 gap-2">
                    <div className="col-span-1 sticky left-0 bg-[#1e293b] z-10">
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
                    {weekdays.map((day, index) => (
                      <div key={day} className="col-span-1">
                        <div className="h-12 text-center font-medium border-b border-gray-800">
                          {weekDates[index].toLocaleDateString("en-US", { weekday: "short" })}
                        </div>
                        {timeSlots.map((time) => {
                          const classItem = getClassForSlot(day, time);
                          return (
                            <div
                              key={`${day}-${time}`}
                              className="h-24 border-b border-gray-800 p-2 relative"
                              onClick={() => !classItem && handleAddClass(day, time)}
                            >
                              {classItem ? (
                                <div className="bg-blue-600/20 p-2 rounded-lg h-full flex flex-col justify-between">
                                  <div>
                                    <div className="font-medium text-sm">
                                      {getSubject(classItem.subject).nom}
                                    </div>
                                    <div className="text-xs text-gray-300">
                                      {classItem.start_time.slice(0, 5)} - {classItem.end_time.slice(0, 5)}
                                    </div>
                                  </div>
                                  <div className="text-xs text-blue-300">
                                    {getClasse(classItem.classe).name}
                                  </div>
                                  <div className="absolute top-1 right-1 flex gap-1">
                                    <button
                                      className="text-blue-400 hover:text-blue-600"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditClass(classItem);
                                      }}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                    <button
                                      className="text-red-400 hover:text-red-600"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedClass(classItem);
                                        setShowDeleteConfirm(true);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="h-full flex items-center justify-center text-gray-500 hover:bg-gray-700/20 rounded-lg cursor-pointer">
                                  <Plus className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
