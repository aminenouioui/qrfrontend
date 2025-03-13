"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  ArrowLeft, Calendar, Clock, MapPin, ChevronLeft, ChevronRight,
  Plus, Edit, Trash2, X, Save, AlertCircle
} from "lucide-react";

export default function ClassSchedule() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedClass, setSelectedClass] = useState(null);
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [isEditingClass, setIsEditingClass] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    id: "",
    subject: "",
    day: "MON",
    start_time: "08:00",
    end_time: "10:00",
    Teacher: "",
    classe: "",
    level: "",
    notes: "",
  });

  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [levels, setLevels] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(null);

  const weekdays = ["MON", "TUE", "WED", "THU", "FRI"];
  const timeSlots = ["08:00", "10:00", "12:00", "14:00", "16:00"];

  const API_BASE_URL = "http://localhost:8000";

  // Fetch initial data (subjects, teachers, levels, classrooms)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subjectsRes, teachersRes, levelsRes, classroomsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/subjects/`),
          axios.get(`${API_BASE_URL}/list_teacher/`),
          axios.get(`${API_BASE_URL}/levels/`),
          axios.get(`${API_BASE_URL}/classe-list/`)
        ]);
        setSubjects(subjectsRes.data);
        setTeachers(teachersRes.data);
        setLevels(levelsRes.data);
        setClassrooms(classroomsRes.data);
        setError(null);
      } catch (error) {
        console.error("Fetch error:", error.response ? error.response.data : error.message);
        setError(`Failed to load data: ${error.response ? error.response.statusText : error.message}`);
      }
    };
    fetchData();
  }, []);

  // Fetch schedules for the selected level
  const fetchSchedulesByLevel = async (levelId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/schedules/level/${levelId}/`);
      console.log("Fetched Schedules Response:", response.data); // Debug the full response
      setSchedules(response.data);
      setError(null);
    } catch (error) {
      console.error("Fetch error:", error.response ? error.response.data : error.message);
      setError(`Failed to load schedules: ${error.response ? error.response.statusText : error.message}`);
    }
  };

  // Re-fetch schedules when selectedLevel changes
  useEffect(() => {
    if (selectedLevel) {
      console.log("Selected Level:", selectedLevel);
      fetchSchedulesByLevel(selectedLevel.id);
    } else {
      setSchedules([]);
      console.log("No level selected, clearing schedules");
    }
  }, [selectedLevel]);

  // Log schedules state for debugging
  useEffect(() => {
    console.log("Schedules State:", schedules);
  }, [schedules]);

  // Handle level selection
  const handleLevelClick = (level) => {
    console.log("Selected Level:", level);
    setSelectedLevel(level);
  };

  // Utility functions to get details by ID
  const getSubject = (subjectId) => subjects.find((s) => s.id === subjectId) || { id: "", nom: "Unknown Subject" };
  const getTeacher = (teacherId) => teachers.find((t) => t.id === teacherId) || { id: "", nom: "Unknown", prenom: "" };
  const getLevel = (levelId) => levels.find((l) => l.id === levelId) || { id: "", level: "Unknown Level" };
  const getClasse = (classeId) => classrooms.find((c) => c.id === classeId) || { id: "", name: "Unknown Classroom" };

  // Get the class for a specific day and time slot
  const getClassForSlot = (day, time) => {
    const classItem = schedules.find((c) => c.day === day && c.start_time === time);
    console.log("Checking slot:", { day, time, classItem }); // Debug slot matching
    return classItem;
  };

  // Handle input changes in the form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "Teacher" || name === "subject" || name === "level" || name === "classe" ? Number(value) || "" : value,
    });
  };

  // Handle adding a new class
  const handleAddClass = (day, time) => {
    if (!selectedLevel) {
      setError("Please select a level before adding a class.");
      return;
    }
    setFormData({
      id: "",
      subject: subjects[0]?.id || "",
      day: day,
      start_time: time,
      end_time: getEndTime(time),
      Teacher: teachers[0]?.id || "",
      classe: classrooms[0]?.id || "",
      level: selectedLevel?.id || "",
      notes: "",
    });
    setIsAddingClass(true);
    setSelectedClass(null);
  };

  // Handle editing a class
  const handleEditClass = (classItem) => {
    setFormData({
      id: classItem.id,
      subject: classItem.subject,
      day: classItem.day,
      start_time: classItem.start_time,
      end_time: classItem.end_time,
      Teacher: classItem.Teacher,
      classe: classItem.classe,
      level: classItem.level,
      notes: classItem.notes || "",
    });
    setIsEditingClass(true);
    setSelectedClass(classItem);
  };

  // Calculate end time based on start time
  const getEndTime = (startTime) => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const endHours = hours + 2;
    return `${endHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

  // Save a new class
  const handleSaveNewClass = async () => {
    if (!selectedLevel) {
      setError("Please select a level before saving a class.");
      return;
    }
    try {
      const response = await axios.post(`${API_BASE_URL}/api/schedules/create/`, formData);
      console.log("Save Response:", response.data);
      await fetchSchedulesByLevel(selectedLevel.id);
      setIsAddingClass(false);
      resetForm();
    } catch (error) {
      console.error("Save error:", error.response ? error.response.data : error.message);
      setError(`Failed to save: ${error.response ? error.response.data.detail || error.response.statusText : error.message}`);
    }
  };

  // Update an existing class
  const handleUpdateClass = async () => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/schedules/${formData.id}/update/`, formData);
      setSchedules(schedules.map((c) => (c.id === formData.id ? response.data : c)));
      setIsEditingClass(false);
      setSelectedClass(response.data);
    } catch (error) {
      console.error("Update error:", error.response ? error.response.data : error.message);
      setError(`Failed to update: ${error.response ? error.response.data.detail || error.response.statusText : error.message}`);
    }
  };

  // Delete a class
  const handleDeleteClass = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/api/schedules/${selectedClass.id}/delete/`);
      setSchedules(schedules.filter((c) => c.id !== selectedClass.id));
      setShowDeleteConfirm(false);
      setSelectedClass(null);
    } catch (error) {
      console.error("Delete error:", error.response ? error.response.data : error.message);
      setError(`Failed to delete: ${error.response ? error.response.data.detail || error.response.statusText : error.message}`);
    }
  };

  // Handle delete confirmation
  const handleDeleteClick = (classItem) => {
    setSelectedClass(classItem);
    setShowDeleteConfirm(true);
  };

  // Cancel form (add/edit)
  const handleCancelForm = () => {
    setIsAddingClass(false);
    setIsEditingClass(false);
    setShowDeleteConfirm(false);
    resetForm();
  };

  // Reset form data
  const resetForm = () => {
    setFormData({
      id: "",
      subject: subjects[0]?.id || "",
      day: "MON",
      start_time: "08:00",
      end_time: "10:00",
      Teacher: teachers[0]?.id || "",
      classe: classrooms[0]?.id || "",
      level: selectedLevel?.id || "",
      notes: "",
    });
  };

  // Get dates for the current week
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
            <button className="bg-blue-600/20 border border-blue-600/30 p-2 rounded-lg" onClick={() => window.history.back()}>
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
          {/* Levels List */}
          <div className="lg:col-span-1">
            <div className="bg-[#1e293b] rounded-xl overflow-hidden">
              <div className="p-4 border-b border-gray-800">
                <h3 className="font-medium">All Levels</h3>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                {levels.map((level) => (
                  <div
                    key={level.id}
                    className={`p-4 border-b border-gray-800 cursor-pointer hover:bg-[#172033] ${selectedLevel?.id === level.id ? "bg-[#172033]" : ""}`}
                    onClick={() => handleLevelClick(level)}
                  >
                    <div className="font-medium">{level.level}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Schedule Grid */}
          <div className="lg:col-span-3">
            <div className="bg-[#1e293b] rounded-xl overflow-hidden">
              <div className="p-4">
                <div className="grid grid-cols-6 gap-2">
                  <div className="col-span-1">
                    <div className="h-12"></div>
                    {timeSlots.map((time) => (
                      <div key={time} className="h-24 flex items-center justify-center text-sm text-gray-400">
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
                                  <div className="font-medium text-sm">{getSubject(classItem.subject).nom}</div>
                                  <div className="text-xs text-gray-300">{getLevel(classItem.level).level}</div>
                                </div>
                                <div className="text-xs text-blue-300">{getClasse(classItem.classe).name}</div>
                                {/* Delete Button */}
                                <button
                                  className="absolute top-1 right-1 text-red-400 hover:text-red-600"
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent triggering addClass
                                    handleDeleteClick(classItem);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
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

              {/* Add/Edit Form */}
              {(isAddingClass || isEditingClass) && (
                <div className="p-4 border-t border-gray-800 bg-[#172033]">
                  <h3 className="text-lg font-medium mb-4">{isAddingClass ? "Add New Class" : "Edit Class"}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                        name="Teacher"
                        value={formData.Teacher}
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
                          <option key={day} value={day}>{day}</option>
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
                          <option key={classe.id} value={classe.id}>{classe.name}</option>
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
                        {levels.map((level) => (
                          <option key={level.id} value={level.id}>{level.level}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
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

              {/* Delete Confirmation */}
              {showDeleteConfirm && (
                <div className="p-4 border-t border-gray-800 bg-[#172033]">
                  <div className="flex items-center gap-2 text-red-400 mb-4">
                    <AlertCircle className="h-5 w-5" />
                    <h3 className="text-lg font-medium">Confirm Deletion</h3>
                  </div>
                  <p className="text-sm text-gray-400 mb-4">
                    Are you sure you want to delete "{getSubject(selectedClass.subject).nom}" on {selectedClass.day} at {selectedClass.start_time}?
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
          </div>
        </div>
      </main>
    </div>
  );
}