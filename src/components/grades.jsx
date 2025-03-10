"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Search,
  Filter,
  Download,
  Award,
  BookOpen,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  AlertCircle,
} from "lucide-react";
import axios from "axios";

export default function Grades() {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState(""); // New state for level filter
  const [isAddingGrade, setIsAddingGrade] = useState(false);
  const [isEditingGrade, setIsEditingGrade] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [gradesData, setGradesData] = useState({});
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const BASE_URL = "http://localhost:8000"; // Adjust if your backend runs elsewhere

  // Form state for adding/editing grades
  const [formData, setFormData] = useState({
    id: "",
    subject: "",
    grade: "0.00",
    grade_type: "Test1",
    date_g: new Date().toISOString().split("T")[0],
  });

  // Fetch initial data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsResponse, subjectsResponse, levelsResponse] = await Promise.all([
          axios.get(`${BASE_URL}/list/`),
          axios.get(`${BASE_URL}/subjects/`),
          axios.get(`${BASE_URL}/levels/`),
        ]);
        setStudents(studentsResponse.data);
        setSubjects(subjectsResponse.data);
        setLevels(levelsResponse.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load data: " + (err.response?.data?.error || err.message));
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch grades when a student is selected
  useEffect(() => {
    if (selectedStudent) {
      const fetchGrades = async () => {
        try {
          const response = await axios.get(`${BASE_URL}/grades/?student=${selectedStudent.id}`);
          setGradesData((prev) => ({
            ...prev,
            [selectedStudent.id]: {
              grades: response.data,
              subjects: subjects,
              gpa: calculateGPA(response.data),
            },
          }));
        } catch (err) {
          setError("Failed to load grades: " + (err.response?.data?.error || err.message));
        }
      };
      fetchGrades();
    }
  }, [selectedStudent]);

  // Filter students based on search and level
  const filteredStudents = students.filter(
    (student) =>
      (searchQuery === "" ||
        student.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.id.toString().includes(searchQuery)) &&
      (selectedLevel === "" || student.level === Number(selectedLevel))
  );

  // Helper function to get subject by ID
  const getSubject = (subjectId) => {
    return subjects.find((s) => s.id === subjectId) || { id: "", nom: "Unknown", description: "" };
  };

  // Helper function to get level name by ID
  const getLevelName = (levelId) => {
    return levels.find((l) => l.id === levelId)?.level || "Unknown";
  };

  // Grade color mapping (adjusted for 0-20 scale)
  const getGradeColor = (grade) => {
    const gradeNum = Number.parseFloat(grade);
    if (gradeNum >= 18) return "text-green-400";
    if (gradeNum >= 15) return "text-blue-400";
    if (gradeNum >= 10) return "text-yellow-400";
    return "text-red-400";
  };

  // Calculate GPA color (adjusted for 0-20 scale mapped to 0-4)
  const getGpaColor = (gpa) => {
    const gpaNum = Number.parseFloat(gpa);
    if (gpaNum >= 3.6) return "text-green-400"; // 18/20
    if (gpaNum >= 3.0) return "text-blue-400";  // 15/20
    if (gpaNum >= 2.0) return "text-yellow-400"; // 10/20
    return "text-red-400";
  };

  // Calculate letter grade based on score (0-20 scale)
  const calculateGrade = (grade) => {
    const gradeNum = Number.parseFloat(grade);
    if (gradeNum >= 18) return "A";
    if (gradeNum >= 16) return "B";
    if (gradeNum >= 13) return "C";
    if (gradeNum >= 10) return "D";
    return "F";
  };

  // Calculate GPA based on grades (mapped to 0-4 scale)
  const calculateGPA = (studentGrades) => {
    if (!studentGrades || studentGrades.length === 0) return "0.0";
    const totalPoints = studentGrades.reduce((sum, grade) => sum + (grade.grade / 20) * 4, 0);
    return (totalPoints / studentGrades.length).toFixed(1);
  };

  // Update GPA when grades change
  const updateStudentGPA = (studentId) => {
    if (!gradesData[studentId]) return;
    const newGPA = calculateGPA(gradesData[studentId].grades);
    setGradesData((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        gpa: newGPA,
      },
    }));
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "grade" ? value : value,
    });
  };

  // Initialize form for adding a new grade
  const handleAddGrade = () => {
    if (!selectedStudent || subjects.length === 0) return;
    setFormData({
      id: "",
      subject: subjects[0].id,
      grade: "0.00",
      grade_type: "Test1",
      date_g: new Date().toISOString().split("T")[0],
    });
    setIsAddingGrade(true);
    setIsEditingGrade(false);
    setShowDeleteConfirm(false);
    setSelectedGrade(null);
  };

  // Initialize form for editing an existing grade
  const handleEditGrade = (grade) => {
    setFormData({
      id: grade.id,
      subject: grade.subject,
      grade: grade.grade.toString(),
      grade_type: grade.grade_type,
      date_g: grade.date_g.split("T")[0],
    });
    setIsEditingGrade(true);
    setIsAddingGrade(false);
    setShowDeleteConfirm(false);
    setSelectedGrade(grade);
  };

  // Save a new grade to backend
  const handleSaveNewGrade = async () => {
    if (!selectedStudent) return;
    const studentId = selectedStudent.id;
    try {
      const response = await axios.post(`${BASE_URL}/grades/add/`, {
        student: studentId,
        subject: formData.subject,
        grade: formData.grade,
        grade_type: formData.grade_type,
        level: selectedStudent.level,
      });
      const newGrade = response.data;
      setGradesData((prev) => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          grades: [...(prev[studentId]?.grades || []), newGrade],
        },
      }));
      updateStudentGPA(studentId);
      setIsAddingGrade(false);
      resetForm();
    } catch (err) {
      setError("Failed to add grade: " + (err.response?.data?.error || err.message));
    }
  };

  // Update an existing grade in backend
  const handleUpdateGrade = async () => {
    if (!selectedStudent || !selectedGrade) return;
    const studentId = selectedStudent.id;
    try {
      const response = await axios.put(`${BASE_URL}/grades/edit/${formData.id}/`, {
        student: studentId,
        subject: formData.subject,
        grade: formData.grade,
        grade_type: formData.grade_type,
        level: selectedStudent.level,
      });
      const updatedGrade = response.data;
      const updatedGrades = gradesData[studentId].grades.map((g) =>
        g.id === updatedGrade.id ? updatedGrade : g
      );
      setGradesData((prev) => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          grades: updatedGrades,
        },
      }));
      updateStudentGPA(studentId);
      setIsEditingGrade(false);
      setSelectedGrade(updatedGrade);
    } catch (err) {
      setError("Failed to update grade: " + (err.response?.data?.error || err.message));
    }
  };

  // Delete a grade from backend
  const handleDeleteGrade = async () => {
    if (!selectedStudent || !selectedGrade) return;
    const studentId = selectedStudent.id;
    try {
      await axios.delete(`${BASE_URL}/grades/delete/${selectedGrade.id}/`);
      const filteredGrades = gradesData[studentId].grades.filter((g) => g.id !== selectedGrade.id);
      setGradesData((prev) => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          grades: filteredGrades,
        },
      }));
      updateStudentGPA(studentId);
      setShowDeleteConfirm(false);
      setSelectedGrade(null);
    } catch (err) {
      setError("Failed to delete grade: " + (err.response?.data?.error || err.message));
    }
  };

  // Cancel form
  const handleCancelForm = () => {
    setIsAddingGrade(false);
    setIsEditingGrade(false);
    setShowDeleteConfirm(false);
  };

  // Reset form to default values
  const resetForm = () => {
    setFormData({
      id: "",
      subject: subjects[0]?.id || "",
      grade: "0.00",
      grade_type: "Test1",
      date_g: new Date().toISOString().split("T")[0],
    });
  };

  if (loading) return <div className="min-h-screen bg-[#111827] text-white p-6">Loading...</div>;
  if (error) return <div className="min-h-screen bg-[#111827] text-white p-6 text-red-400">{error}</div>;

  return (
    <div className="min-h-screen bg-[#111827] text-white">
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

      <main className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  <div>
                    <select
                      value={selectedLevel}
                      onChange={(e) => setSelectedLevel(e.target.value)}
                      className="bg-[#273549] px-4 py-2 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Levels</option>
                      {levels.map((level) => (
                        <option key={level.id} value={level.id}>
                          {level.level}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="max-h-[600px] overflow-y-auto">
                {filteredStudents.map((student) => {
                  const studentGrades = gradesData[student.id];
                  const isSelected = selectedStudent?.id === student.id;

                  return (
                    <div
                      key={student.id}
                      className={`p-4 border-b border-gray-800 flex items-center gap-3 cursor-pointer hover:bg-[#172033] transition-colors ${isSelected ? "bg-[#172033]" : ""}`}
                      onClick={() => {
                        setSelectedStudent(student);
                        setSelectedGrade(null);
                        setIsAddingGrade(false);
                        setIsEditingGrade(false);
                        setShowDeleteConfirm(false);
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
                          ID: {student.id} • {getLevelName(student.level)}
                        </div>
                      </div>
                      {studentGrades && (
                        <div className={`text-sm font-medium ${getGpaColor(studentGrades.gpa)}`}>
                          GPA: {studentGrades.gpa}
                        </div>
                      )}
                    </div>
                  );
                })}
                {filteredStudents.length === 0 && (
                  <div className="p-6 text-center text-gray-400">No students found matching your search or level.</div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-[#1e293b] rounded-xl overflow-hidden">
              <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-green-500/20 p-2 rounded-full">
                    <Award className="h-5 w-5 text-green-400" />
                  </div>
                  <h2 className="text-lg font-medium">Academic Performance</h2>
                </div>
                {selectedStudent && gradesData[selectedStudent.id] && (
                  <button
                    className="bg-blue-600 hover:bg-blue-700 p-2 rounded-lg"
                    onClick={handleAddGrade}
                    disabled={!selectedStudent}
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                )}
              </div>

              {selectedStudent && gradesData[selectedStudent.id] ? (
                <div>
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
                          ID: {selectedStudent.id} • {getLevelName(selectedStudent.level)}
                        </div>
                      </div>
                      <div className="ml-auto">
                        <div className="text-sm text-gray-400">Cumulative GPA</div>
                        <div className={`text-2xl font-bold ${getGpaColor(gradesData[selectedStudent.id].gpa)}`}>
                          {gradesData[selectedStudent.id].gpa}
                        </div>
                      </div>
                    </div>
                  </div>

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
                            name="subject"
                            value={formData.subject}
                            onChange={handleInputChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                          >
                            {subjects.map((subject) => (
                              <option key={subject.id} value={subject.id}>
                                {subject.nom} (ID: {subject.id})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Grade Type</label>
                          <select
                            name="grade_type"
                            value={formData.grade_type}
                            onChange={handleInputChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                          >
                            <option value="Test1">Test 1</option>
                            <option value="Test2">Test 2</option>
                            <option value="Test3">Test 3</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Grade (0-20)</label>
                          <input
                            type="number"
                            name="grade"
                            value={formData.grade}
                            onChange={handleInputChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                            placeholder="e.g. 18.50"
                            min="0"
                            max="20"
                            step="0.01"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Date</label>
                          <input
                            type="date"
                            name="date_g"
                            value={formData.date_g}
                            onChange={handleInputChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                            required
                          />
                        </div>
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

                  {showDeleteConfirm && selectedGrade && (
                    <div className="p-4 border-b border-gray-800 bg-[#172033]">
                      <div className="flex items-center gap-3 mb-4 text-yellow-400">
                        <AlertCircle className="h-5 w-5" />
                        <h3 className="font-medium">Confirm Deletion</h3>
                      </div>
                      <p className="mb-4">
                        Are you sure you want to delete the grade for "{getSubject(selectedGrade.subject).nom}" (
                        {selectedGrade.grade_type})? This action cannot be undone.
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

                  {!isAddingGrade && !isEditingGrade && !showDeleteConfirm && (
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-blue-400" />
                          <h3 className="font-medium">Subjects and Grades</h3>
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
                                Subject
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Type
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Grade
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Letter
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
                            {gradesData[selectedStudent.id]?.grades?.map((grade) => {
                              const subject = getSubject(grade.subject);
                              const letterGrade = calculateGrade(grade.grade);
                              const isSelected = selectedGrade?.id === grade.id;

                              return (
                                <tr
                                  key={grade.id}
                                  className={`hover:bg-[#172033] ${isSelected ? "bg-[#172033]" : ""}`}
                                  onClick={() => setSelectedGrade(grade)}
                                >
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="font-medium">{subject.nom}</div>
                                    <div className="text-xs text-gray-400">{subject.id}</div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm">{grade.grade_type}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm">{grade.grade}/20</td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span className={`px-2 py-1 rounded-md text-xs ${getGradeColor(grade.grade)}`}>
                                      {letterGrade}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                                    {new Date(grade.date_g).toLocaleDateString()}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex gap-2">
                                      <button
                                        className="p-1 text-blue-400 hover:text-blue-300"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditGrade(grade);
                                        }}
                                      >
                                        <Edit size={14} />
                                      </button>
                                      <button
                                        className="p-1 text-red-400 hover:text-red-300"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedGrade(grade);
                                          setShowDeleteConfirm(true);
                                        }}
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            }) || (
                              <tr>
                                <td colSpan={6} className="p-4 text-center text-gray-400">
                                  No grades available.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Performance Stats */}
                  {!isAddingGrade && !isEditingGrade && !showDeleteConfirm && (
                    <div className="p-4 border-t border-gray-800">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-[#0f172a] rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <BookOpen className="h-4 w-4 text-blue-400" />
                            <div className="text-sm font-medium">Subjects Enrolled</div>
                          </div>
                          <div className="text-2xl font-bold text-blue-400">
                            {new Set(gradesData[selectedStudent.id].grades.map((g) => g.subject)).size}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">Total unique subjects</div>
                        </div>
                        <div className="bg-[#0f172a] rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Award className="h-4 w-4 text-purple-400" />
                            <div className="text-sm font-medium">Academic Standing</div>
                          </div>
                          <div className="text-2xl font-bold text-purple-400">
                            {Number.parseFloat(gradesData[selectedStudent.id].gpa) >= 3.0 ? "Good" : "Needs Improvement"}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">Based on GPA</div>
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
  );
}


