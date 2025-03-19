"use client";

import { useState, useEffect } from "react";
import api from "../api"; // Ensure this path is correct
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
  const [selectedClass, setSelectedClass] = useState(null);
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [isEditingClass, setIsEditingClass] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    subject: "",
    day: "MON",
    start_time: "08:00",
    end_time: "10:00",
    teacher: "",
    classe: "",
    level: "",
    notes: "",
  });

  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [levels, setLevels] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  const weekdays = ["MON", "TUE", "WED", "THU", "FRI"];
  const timeSlots = ["08:00", "10:00", "12:00", "14:00", "16:00"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subjectsRes, teachersRes, levelsRes, classroomsRes] = await Promise.all([
          api.get("/api/subjects/list/"),
          api.get("/api/teachers/list/"),
          api.get("/api/levels/list/"),
          api.get("/api/classes/list/"),
        ]);
        setSubjects(subjectsRes.data);
        setTeachers(teachersRes.data);
        setLevels(levelsRes.data || []); // Ensure levels is an array even if empty
        setClassrooms(classroomsRes.data);
        console.log("Fetched levels:", levelsRes.data); // Debug log
        setError(null);
      } catch (error) {
        console.error("Fetch error:", error.response ? error.response.data : error.message);
        setError(
          `Failed to load data: ${
            error.response ? error.response.statusText : error.message
          }`
        );
      }
    };
    fetchData();
  }, []);

  const fetchSchedulesByTeacher = async (teacherId) => {
    try {
      const response = await api.get(`/api/schedules/teacher/${teacherId}/`);
      console.log("Fetched schedules:", response.data);
      setSchedules(response.data);
      setError(null);
    } catch (error) {
      console.error("Fetch schedules error:", error.response ? error.response.data : error.message);
      setError(
        `Failed to load schedules: ${
          error.response ? error.response.statusText : error.message
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
  };

  const getSubject = (subjectId) =>
    subjects.find((s) => s.id === subjectId) || { id: "", nom: "Unknown Subject" };
  const getTeacher = (teacherId) =>
    teachers.find((t) => t.id === teacherId) || { id: "", nom: "Unknown", prenom: "" };
  const getLevel = (levelId) => {
    const level = levels.find((l) => l.id === levelId);
    console.log("Looking for levelId:", levelId, "Found:", level); // Debug log
    return level || { id: "", level: "Unknown Level" }; // Fallback
  };
  const getClasse = (classeId) =>
    classrooms.find((c) => c.id === classeId) || { id: "", name: "Unknown Classroom" };

  const normalizeTime = (time) => {
    if (!time) return time;
    const [hours, minutes] = time.split(":");
    return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
  };

  const getClassForSlot = (day, time) => {
    return schedules.find((c) => c.day === day && normalizeTime(c.start_time) === time);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: ["teacher", "subject", "classe", "level"].includes(name) ? Number(value) || "" : value,
    });
  };

  const handleAddClass = (day, time) => {
    if (!selectedTeacher) {
      setError("Please select a teacher before adding a class.");
      return;
    }
    const defaultLevelId = levels.length > 0 ? levels[0].id : "";
    setFormData({
      subject: subjects[0]?.id || "",
      day: day,
      start_time: time,
      end_time: getEndTime(time),
      teacher: selectedTeacher?.id || "",
      classe: classrooms[0]?.id || "",
      level: defaultLevelId,
      notes: "",
    });
    setIsAddingClass(true);
    setSelectedClass(null);
  };

  const handleEditClass = (classItem) => {
    setFormData({
      id: classItem.id,
      subject: classItem.subject,
      day: classItem.day,
      start_time: normalizeTime(classItem.start_time),
      end_time: normalizeTime(classItem.end_time),
      teacher: classItem.teacher,
      classe: classItem.classe,
      level: classItem.level || (levels.length > 0 ? levels[0].id : ""),
      notes: classItem.notes || "",
    });
    setIsEditingClass(true);
    setSelectedClass(classItem);
  };

  const getEndTime = (startTime) => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const endHours = hours + 2;
    return `${endHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

  const handleSaveNewClass = async () => {
    if (!selectedTeacher) {
      setError("Please select a teacher before saving a class.");
      return;
    }
    if (levels.length > 0 && !formData.level) {
      setError("Please select a level.");
      return;
    }
    // Check for duplicates, now including start_time
    const isDuplicate = schedules.some(
      (schedule) =>
        schedule.teacher === formData.teacher &&
        schedule.classe === formData.classe &&
        schedule.subject === formData.subject &&
        schedule.day === formData.day &&
        normalizeTime(schedule.start_time) === formData.start_time
    );
    if (isDuplicate) {
      setError("A schedule with the same teacher, classroom, subject, day, and start time already exists.");
      return;
    }
    try {
      console.log("Form data before save:", formData); // Debug log
      const response = await api.post("/api/schedules/add/", formData);
      console.log("New schedule added:", response.data); // Debug log
      setSchedules((prev) => [...prev, response.data]);
      await fetchSchedulesByTeacher(selectedTeacher.id);
      setIsAddingClass(false);
      resetForm();
      setError(null);
    } catch (error) {
      console.error("Save error:", error.response ? error.response.data : error.message);
      setError(
        `Failed to save: ${
          error.response ? error.response.data.detail || JSON.stringify(error.response.data) : error.message
        }`
      );
    }
  };

  const handleUpdateClass = async () => {
    try {
      const response = await api.put(`/api/schedules/update/${formData.id}/`, formData);
      setSchedules((prev) => prev.map((c) => (c.id === formData.id ? response.data : c)));
      setIsEditingClass(false);
      setSelectedClass(response.data);
      setError(null);
    } catch (error) {
      console.error("Update error:", error.response ? error.response.data : error.message);
      setError(
        `Failed to update: ${
          error.response ? error.response.data.detail || JSON.stringify(error.response.data) : error.message
        }`
      );
    }
  };

  const handleDeleteClass = async () => {
    try {
      await api.delete(`/api/schedules/delete/${selectedClass.id}/`);
      setSchedules((prev) => prev.filter((c) => c.id !== selectedClass.id));
      setShowDeleteConfirm(false);
      setSelectedClass(null);
      setError(null);
    } catch (error) {
      console.error("Delete error:", error.response ? error.response.data : error.message);
      setError(
        `Failed to delete: ${
          error.response ? error.response.data.detail || JSON.stringify(error.response.data) : error.message
        }`
      );
    }
  };

  const handleDeleteClick = (classItem) => {
    setSelectedClass(classItem);
    setShowDeleteConfirm(true);
  };

  const handleCancelForm = () => {
    setIsAddingClass(false);
    setIsEditingClass(false);
    setShowDeleteConfirm(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      subject: subjects[0]?.id || "",
      day: "MON",
      start_time: "08:00",
      end_time: "10:00",
      teacher: selectedTeacher?.id || "",
      classe: classrooms[0]?.id || "",
      level: levels.length > 0 ? levels[0].id : "",
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
  const prevWeek = () => setCurrentWeek(new Date(currentWeek.setDate(currentWeek.getDate() - 7)));
  const nextWeek = () => setCurrentWeek(new Date(currentWeek.setDate(currentWeek.getDate() + 7)));

  return (
    <div className="min-h-screen bg-[#111827] text-white">
      <header className="bg-[#1e293b] p-4">
        <div className="container mx-auto">
          <div className="flex items-center gap-3">
            <button
              className="bg-blue-600/20 border border-blue-600/30 p-2 rounded-lg"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Class Schedule</h1>
              <p className="text-sm text-gray-400">View and manage class timetables</p>
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
          <div className="lg:col-span-1 overflow-y-auto">
            <div className="bg-[#1e293b] rounded-xl overflow-hidden mb-6">
              <div className="p-4 border-b border-gray-800">
                <h3 className="font-medium">All Teachers</h3>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {teachers.map((teacher) => (
                  <div
                    key={teacher.id}
                    className={`p-4 border-b border-gray-800 cursor-pointer hover:bg-[#172033] ${
                      selectedTeacher?.id === teacher.id ? "bg-[#172033]" : ""
                    }`}
                    onClick={() => handleTeacherClick(teacher)}
                  >
                    <div className="font-medium">{teacher.prenom} {teacher.nom}</div>
                  </div>
                ))}
              </div>
            </div>

            {(isAddingClass || isEditingClass) && (
              <div className="bg-[#1e293b] rounded-xl p-4">
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
                    <label className="block text-sm text-gray-400 mb-1">Teacher</label>
                    <select
                      name="teacher"
                      value={formData.teacher}
                      onChange={handleInputChange}
                      className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="">Select Teacher</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.prenom} {teacher.nom}
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
                      value={formData.start_time}
                      onChange={handleInputChange}
                      className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">End Time</label>
                    <input
                      type="time"
                      name="end_time"
                      value={formData.end_time}
                      onChange={handleInputChange}
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
                    <label className="block text-sm text-gray-400 mb-1">Level</label>
                    <select
                      name="level"
                      value={formData.level}
                      onChange={handleInputChange}
                      className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="">Select Level</option>
                      {levels.length === 0 ? (
                        <option disabled>No levels available</option>
                      ) : (
                        levels.map((level) => (
                          <option key={level.id} value={level.id}>
                            {level.level}
                          </option>
                        ))
                      )}
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
                    onClick={handleCancelForm}
                  >
                    <X className="h-4 w-4" /> Cancel
                  </button>
                </div>
              </div>
            )}

            {showDeleteConfirm && (
              <div className="bg-[#1e293b] rounded-xl p-4 mt-6">
                <div className="flex items-center gap-2 text-red-400 mb-4">
                  <AlertCircle className="h-5 w-5" />
                  <h3 className="text-lg font-medium">Confirm Deletion</h3>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                  Are you sure you want to delete "{getSubject(selectedClass.subject).nom}" on{" "}
                  {selectedClass.day} at {selectedClass.start_time}?
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
                    onClick={prevWeek}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="text-sm font-medium">
                    {weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} -{" "}
                    {weekDates[4].toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  <button
                    className="p-2 bg-blue-600/20 border border-blue-600/30 rounded-lg hover:bg-blue-600/40"
                    onClick={nextWeek}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  <div className="col-span-1">
                    <div className="h-12"></div>
                    {timeSlots.map((time) => (
                      <div
                        key={time}
                        className="h-24 flex items-center justify-center text-sm text-gray-400"
                      >
                        {time}
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
                                    {getLevel(classItem.level).level}
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
                                      handleDeleteClick(classItem);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="h-full flex items-center justify-center text-gray-600 hover:bg-gray-700/20 rounded-lg">
                                <Plus className="h-4 w-4" />
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
          </div>
        </div>
      </main>
    </div>
  );
}