"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Search,
  Filter,
  Download,
  Award,
  Plus,
  Edit,
  Trash2,
  Save,
  AlertCircle,
} from "lucide-react";
import api from "../api";

export default function AdminTeacherGrades() {
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [gradesData, setGradesData] = useState({});
  const [levels, setLevels] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [isAddingGrade, setIsAddingGrade] = useState(false);
  const [isEditingGrade, setIsEditingGrade] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false); // New state for student fetch
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    id: "",
    student: "",
    subject: "",
    grade: "0.00",
    grade_type: "Test1",
    date_g: new Date().toISOString().split("T")[0],
  });

  // Fetch initial data: teachers, subjects, levels
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teachersResponse, subjectsResponse, levelsResponse] = await Promise.all([
          api.get("/api/teachers/list/"),
          api.get("/api/subjects/list/"),
          api.get("/api/levels/list/"),
        ]);
        console.log("Teachers fetched:", teachersResponse.data);
        console.log("Subjects fetched:", subjectsResponse.data);
        console.log("Levels fetched:", levelsResponse.data);
        setTeachers(teachersResponse.data);
        setSubjects(subjectsResponse.data);
        setLevels(levelsResponse.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching initial data:", {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
        });
        setError(`Failed to load initial data: ${err.response?.data?.error || err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch students when a teacher is selected
  useEffect(() => {
    if (selectedTeacher) {
      const fetchTeacherStudents = async () => {
        setStudentsLoading(true);
        try {
          console.log("Fetching students for teacher ID:", selectedTeacher.id);
          const response = await api.get(`/api/teachers/${selectedTeacher.id}/students/`);
          console.log("API response status:", response.status);
          console.log("Students fetched:", response.data);
          const studentsData = response.data.map((student) => ({
            ...student,
            level: student.level?.id || student.level, // Ensure level is the ID
          }));
          setStudents(studentsData);
          setGradesData({});
          setError(null);
        } catch (err) {
          console.error("Error fetching students:", {
            message: err.message,
            status: err.response?.status,
            data: err.response?.data,
          });
          setError(
            `Failed to load students: ${err.response?.data?.error || err.message}`
          );
          setStudents([]);
        } finally {
          setStudentsLoading(false);
        }
      };
      fetchTeacherStudents();
    } else {
      setStudents([]);
      setGradesData({});
      setSelectedStudent(null);
      setError(null);
      setStudentsLoading(false);
    }
  }, [selectedTeacher]);

  // Fetch grades when a student is selected
  useEffect(() => {
    if (selectedStudent && selectedTeacher) {
      const fetchStudentGrades = async () => {
        try {
          console.log(
            `Fetching grades for student ${selectedStudent.id}, subject ${selectedTeacher.subject.id}`
          );
          const response = await api.get(
            `/api/grades/list/?student=${selectedStudent.id}&subject=${selectedTeacher.subject.id}`
          );
          console.log(`Grades fetched for student ${selectedStudent.id}:`, response.data);
          setGradesData((prev) => ({
            ...prev,
            [selectedStudent.id]: {
              grades: response.data,
              subjects,
              gpa: calculateGPA(response.data),
            },
          }));
          setError(null);
        } catch (err) {
          console.error("Error fetching grades:", {
            message: err.message,
            status: err.response?.status,
            data: err.response?.data,
          });
          setError(
            `Failed to load grades: ${err.response?.data?.error || err.message}`
          );
          setGradesData((prev) => ({
            ...prev,
            [selectedStudent.id]: { grades: [], subjects, gpa: "0.0" },
          }));
        }
      };
      fetchStudentGrades();
    }
  }, [selectedStudent, selectedTeacher]);

  // Filter students based on search and level
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      searchQuery === "" ||
      (student.nom &&
        student.nom.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (student.prenom &&
        student.prenom.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (student.id && student.id.toString().includes(searchQuery));
    const matchesLevel =
      selectedLevel === "" ||
      (student.level != null && student.level === Number(selectedLevel));
    return matchesSearch && matchesLevel;
  });

  const getSubject = (subjectId) =>
    subjects.find((s) => s.id === subjectId) || { id: "", nom: "Unknown" };
  const getLevelName = (levelId) =>
    levels.find((l) => l.id === levelId)?.level || "Unknown";

  const getGradeColor = (grade) => {
    const gradeNum = Number.parseFloat(grade);
    if (gradeNum >= 18) return "text-green-400";
    if (gradeNum >= 15) return "text-blue-400";
    if (gradeNum >= 10) return "text-yellow-400";
    return "text-red-400";
  };

  const getGpaColor = (gpa) => {
    const gpaNum = Number.parseFloat(gpa);
    if (gpaNum >= 3.6) return "text-green-400";
    if (gpaNum >= 3.0) return "text-blue-400";
    if (gpaNum >= 2.0) return "text-yellow-400";
    return "text-red-400";
  };

  const calculateGrade = (grade) => {
    const gradeNum = Number.parseFloat(grade);
    if (gradeNum >= 18) return "A";
    if (gradeNum >= 16) return "B";
    if (gradeNum >= 13) return "C";
    if (gradeNum >= 10) return "D";
    return "F";
  };

  const calculateGPA = (studentGrades) => {
    if (!studentGrades || studentGrades.length === 0) return "0.0";
    const totalPoints = studentGrades.reduce(
      (sum, grade) => sum + (Number(grade.grade) / 20) * 4,
      0
    );
    return (totalPoints / studentGrades.length).toFixed(1);
  };

  const updateStudentGPA = (studentId) => {
    if (!gradesData[studentId]) return;
    const newGPA = calculateGPA(gradesData[studentId].grades);
    setGradesData((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], gpa: newGPA },
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddGrade = (student) => {
    if (!selectedTeacher) return;
    setSelectedStudent(student);
    setFormData({
      id: "",
      student: student.id,
      subject: selectedTeacher.subject.id,
      grade: "0.00",
      grade_type: "Test1",
      date_g: new Date().toISOString().split("T")[0],
    });
    setIsAddingGrade(true);
    setIsEditingGrade(false);
    setShowDeleteConfirm(false);
    setSelectedGrade(null);
    setError(null);
  };

  const handleEditGrade = (grade, student) => {
    setSelectedStudent(student);
    setFormData({
      id: grade.id,
      student: student.id,
      subject: grade.subject.id,
      grade: grade.grade.toString(),
      grade_type: grade.grade_type,
      date_g: grade.date_g.split("T")[0],
    });
    setIsEditingGrade(true);
    setIsAddingGrade(false);
    setShowDeleteConfirm(false);
    setSelectedGrade(grade);
    setError(null);
  };

  const handleSaveNewGrade = async () => {
    if (isSubmitting || !selectedStudent || !selectedTeacher) return;
    if (
      Number.parseFloat(formData.grade) < 0 ||
      Number.parseFloat(formData.grade) > 20
    ) {
      setError("Grade must be between 0 and 20.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await api.post("/api/grades/add/", {
        student: formData.student,
        subject: formData.subject,
        grade: Number.parseFloat(formData.grade),
        grade_type: formData.grade_type,
        level: selectedStudent.level,
        date_g: formData.date_g,
      });
      const newGrade = response.data;
      setGradesData((prev) => ({
        ...prev,
        [selectedStudent.id]: {
          ...prev[selectedStudent.id],
          grades: [...(prev[selectedStudent.id]?.grades || []), newGrade],
        },
      }));
      updateStudentGPA(selectedStudent.id);
      setIsAddingGrade(false);
      resetForm();
      setError(null);
    } catch (err) {
      console.error("Error adding grade:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      setError(`Failed to add grade: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateGrade = async () => {
    if (isSubmitting || !selectedStudent || !selectedGrade) return;
    if (
      Number.parseFloat(formData.grade) < 0 ||
      Number.parseFloat(formData.grade) > 20
    ) {
      setError("Grade must be between 0 and 20.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await api.put(`/api/grades/edit/${formData.id}/`, {
        student: formData.student,
        subject: formData.subject,
        grade: Number.parseFloat(formData.grade),
        grade_type: formData.grade_type,
        level: selectedStudent.level,
        date_g: formData.date_g,
      });
      const updatedGrade = response.data;
      const updatedGrades = gradesData[selectedStudent.id].grades.map((g) =>
        g.id === updatedGrade.id ? updatedGrade : g
      );
      setGradesData((prev) => ({
        ...prev,
        [selectedStudent.id]: { ...prev[selectedStudent.id], grades: updatedGrades },
      }));
      updateStudentGPA(selectedStudent.id);
      setIsEditingGrade(false);
      setSelectedGrade(null);
      setError(null);
    } catch (err) {
      console.error("Error updating grade:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      setError(
        `Failed to update grade: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGrade = async () => {
    if (isSubmitting || !selectedStudent || !selectedGrade) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/api/grades/delete/${selectedGrade.id}/`);
      const filteredGrades = gradesData[selectedStudent.id].grades.filter(
        (g) => g.id !== selectedGrade.id
      );
      setGradesData((prev) => ({
        ...prev,
        [selectedStudent.id]: { ...prev[selectedStudent.id], grades: filteredGrades },
      }));
      updateStudentGPA(selectedStudent.id);
      setShowDeleteConfirm(false);
      setSelectedGrade(null);
      setError(null);
    } catch (err) {
      console.error("Error deleting grade:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      setError(
        `Failed to delete grade: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelForm = () => {
    setIsAddingGrade(false);
    setIsEditingGrade(false);
    setShowDeleteConfirm(false);
    setError(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      id: "",
      student: selectedStudent?.id || "",
      subject: selectedTeacher?.subject?.id || "",
      grade: "0.00",
      grade_type: "Test1",
      date_g: new Date().toISOString().split("T")[0],
    });
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#111827] text-white p-6">Loading...</div>
    );

  return (
    <div className="min-h-screen bg-[#111827] text-white">
      <header className="bg-[#1e293b] p-4">
        <div className="container mx-auto">
          <div className="flex items-center gap-3">
            <button
              className="bg-blue-600/20 border border-blue-600/30 p-2 rounded-lg hover:bg-blue-600/30"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Admin Teacher Grades</h1>
              <p className="text-sm text-gray-400">
                View and manage grades for all teachers
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6">
        {error && (
          <div className="bg-red-600/20 border border-red-600/30 p-4 rounded-lg mb-6 text-red-400 flex justify-between items-center">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-300 hover:text-red-200"
            >
              ✕
            </button>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Teachers List */}
          <div className="lg:col-span-1">
            <div className="bg-[#1e293b] rounded-xl overflow-hidden">
              <div className="p-4 border-b border-gray-800">
                <h2 className="text-lg font-medium">Teachers</h2>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                {teachers.length > 0 ? (
                  teachers.map((teacher) => (
                    <div
                      key={teacher.id}
                      className={`p-4 border-b border-gray-800 flex items-center gap-3 cursor-pointer hover:bg-[#172033] ${
                        selectedTeacher?.id === teacher.id ? "bg-[#172033]" : ""
                      }`}
                      onClick={() => {
                        console.log("Selecting teacher:", teacher);
                        setSelectedTeacher(teacher);
                        setSelectedStudent(null);
                        setIsAddingGrade(false);
                        setIsEditingGrade(false);
                        setShowDeleteConfirm(false);
                        setSelectedLevel("");
                        setSearchQuery("");
                      }}
                    >
                      <img
                        src={teacher.photo || "/placeholder.svg"}
                        alt={teacher.nom}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="font-medium">
                          {teacher.prenom} {teacher.nom}
                        </div>
                        <div className="text-sm text-gray-400">
                          Subject: {teacher.subject?.nom || "Unknown"}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-400">
                    No teachers available
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Students List */}
          <div className="lg:col-span-1">
            <div className="bg-[#1e293b] rounded-xl overflow-hidden">
              <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-medium">
                    {selectedTeacher
                      ? `${selectedTeacher.prenom} ${selectedTeacher.nom} - Students`
                      : "Select a Teacher"}
                  </h2>
                </div>
              </div>

              {selectedTeacher ? (
                <div>
                  <div className="p-4 border-b border-gray-800">
                    <div className="flex flex-col gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                          type="text"
                          className="bg-[#273549] pl-10 pr-4 py-2 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Search students..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
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
                  <div className="max-h-[600px] overflow-y-auto">
                    {studentsLoading ? (
                      <div className="p-4 text-center text-gray-400">
                        Loading students...
                      </div>
                    ) : filteredStudents.length > 0 ? (
                      filteredStudents.map((student) => (
                        <div
                          key={student.id}
                          className={`p-4 border-b border-gray-800 flex items-center gap-3 cursor-pointer hover:bg-[#172033] ${
                            selectedStudent?.id === student.id
                              ? "bg-[#172033]"
                              : ""
                          }`}
                          onClick={() => {
                            console.log("Selecting student:", student);
                            setSelectedStudent(student);
                            setIsAddingGrade(false);
                            setIsEditingGrade(false);
                            setShowDeleteConfirm(false);
                          }}
                        >
                          <div className="flex-1">
                            <div className="font-medium">
                              {student.prenom} {student.nom}
                            </div>
                            <div className="text-sm text-gray-400">
                              Level: {getLevelName(student.level)}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-400">
                        {selectedLevel
                          ? "No students found for this level"
                          : "No students assigned to this teacher"}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-gray-400">
                  <p className="text-lg">Select a teacher to view students</p>
                </div>
              )}
            </div>
          </div>

          {/* Grades for Selected Student */}
          <div className="lg:col-span-2">
            <div className="bg-[#1e293b] rounded-xl overflow-hidden">
              <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-green-400" />
                  <h2 className="text-lg font-medium">
                    {selectedStudent && selectedTeacher
                      ? `${selectedStudent.prenom} ${selectedStudent.nom} - Grades for ${selectedTeacher.subject.nom}`
                      : "Select a Student"}
                  </h2>
                </div>
              </div>

              {selectedStudent && selectedTeacher ? (
                <div>
                  {(isAddingGrade || isEditingGrade) && (
                    <div className="p-4 border-b border-gray-800 bg-[#172033]">
                      <h3 className="font-medium text-lg mb-4">
                        {isAddingGrade ? "Add New Grade" : "Edit Grade"}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">
                            Subject
                          </label>
                          <input
                            type="text"
                            value={selectedTeacher.subject.nom}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                            disabled
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">
                            Grade Type
                          </label>
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
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">
                            Grade (0-20)
                          </label>
                          <input
                            type="number"
                            name="grade"
                            value={formData.grade}
                            onChange={handleInputChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                            min="0"
                            max="20"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">
                            Date
                          </label>
                          <input
                            type="date"
                            name="date_g"
                            value={formData.date_g}
                            onChange={handleInputChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                          onClick={handleCancelForm}
                        >
                          Cancel
                        </button>
                        <button
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2"
                          onClick={isAddingGrade ? handleSaveNewGrade : handleUpdateGrade}
                          disabled={isSubmitting}
                        >
                          <Save className="h-4 w-4" />{" "}
                          {isSubmitting
                            ? "Saving..."
                            : isAddingGrade
                            ? "Add"
                            : "Update"}
                        </button>
                      </div>
                    </div>
                  )}

                  {showDeleteConfirm && selectedGrade && (
                    <div className="p-4 border-b border-gray-800 bg-[#172033]">
                      <div className="flex items-center gap-2 text-yellow-400 mb-4">
                        <AlertCircle className="h-5 w-5" />
                        <h3 className="font-medium">Confirm Deletion</h3>
                      </div>
                      <p className="mb-4">
                        Are you sure you want to delete the grade for "
                        {selectedTeacher.subject.nom}"?
                      </p>
                      <div className="flex gap-3">
                        <button
                          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                          onClick={handleCancelForm}
                        >
                          Cancel
                        </button>
                        <button
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2"
                          onClick={handleDeleteGrade}
                          disabled={isSubmitting}
                        >
                          <Trash2 className="h-4 w-4" />{" "}
                          {isSubmitting ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  )}

                  {!isAddingGrade && !isEditingGrade && !showDeleteConfirm && (
                    <div className="p-4">
                      <table className="w-full border border-gray-800 rounded-lg">
                        <thead className="bg-[#0f172a]">
                          <tr>
                            <th className="px-4 py-2 text-left text-gray-400">
                              Subject
                            </th>
                            <th className="px-4 py-2 text-left text-gray-400">
                              Grade Type
                            </th>
                            <th className="px-4 py-2 text-left text-gray-400">
                              Grade
                            </th>
                            <th className="px-4 py-2 text-left text-gray-400">
                              Date
                            </th>
                            <th className="px-4 py-2 text-left text-gray-400">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {gradesData[selectedStudent?.id]?.grades?.length > 0 ? (
                            gradesData[selectedStudent.id].grades.map((grade) => (
                              <tr key={grade.id} className="hover:bg-[#172033]">
                                <td className="px-4 py-2">
                                  {grade.subject.nom}
                                </td>
                                <td className="px-4 py-2">{grade.grade_type}</td>
                                <td className="px-4 py-2">
                                  <span className={getGradeColor(grade.grade)}>
                                    {grade.grade}/20 ({calculateGrade(grade.grade)})
                                  </span>
                                </td>
                                <td className="px-4 py-2">
                                  {new Date(grade.date_g).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-2 flex gap-2">
                                  <button
                                    className="text-blue-400 hover:text-blue-300"
                                    onClick={() =>
                                      handleEditGrade(grade, selectedStudent)
                                    }
                                  >
                                    <Edit size={14} />
                                  </button>
                                  <button
                                    className="text-red-400 hover:text-red-300"
                                    onClick={() => {
                                      setSelectedGrade(grade);
                                      setShowDeleteConfirm(true);
                                    }}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan={5}
                                className="p-4 text-center text-gray-400"
                              >
                                No grades found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                      <div className="mt-4">
                        <span className="font-medium">GPA: </span>
                        <span
                          className={getGpaColor(
                            gradesData[selectedStudent?.id]?.gpa
                          )}
                        >
                          {gradesData[selectedStudent?.id]?.gpa || "0.0"}
                        </span>
                      </div>
                      <button
                        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2"
                        onClick={() => handleAddGrade(selectedStudent)}
                      >
                        <Plus className="h-4 w-4" /> Add Grade
                      </button>
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
                  <Filter className="h-4 w-4" /> Filter
                </button>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2">
                  <Download className="h-4 w-4" /> Export Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}