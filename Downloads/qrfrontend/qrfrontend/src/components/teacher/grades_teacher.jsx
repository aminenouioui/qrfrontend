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
import api from "../api";

export default function Grades() {
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [isAddingGrade, setIsAddingGrade] = useState(false);
  const [isEditingGrade, setIsEditingGrade] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [gradesData, setGradesData] = useState({});
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    id: "",
    student: "",
    subject: "",
    grade: "0.00",
    grade_type: "Test1",
    date_g: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teachersResponse, subjectsResponse, levelsResponse] = await Promise.all([
          api.get("/api/teachers/list/"), // Assuming this endpoint returns teachers with their students
          api.get("/api/subjects/list/"),
          api.get("/api/levels/list/"),
        ]);
        setTeachers(Array.isArray(teachersResponse.data) ? teachersResponse.data : []);
        setSubjects(Array.isArray(subjectsResponse.data) ? subjectsResponse.data : []);
        setLevels(Array.isArray(levelsResponse.data) ? levelsResponse.data : []);
        setLoading(false);
      } catch (err) {
        setError(`Failed to load data: ${err.response?.data?.detail || err.message}`);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedTeacher) {
      const fetchGrades = async () => {
        try {
          const response = await api.get(`/api/grades/list/?teacher=${selectedTeacher.id}`);
          setGradesData((prev) => ({
            ...prev,
            [selectedTeacher.id]: {
              grades: Array.isArray(response.data) ? response.data : [],
              subjects,
              students: selectedTeacher.students // Assuming teacher object includes students
            },
          }));
        } catch (err) {
          setError(`Failed to load grades: ${err.response?.data?.detail || err.message}`);
        }
      };
      fetchGrades();
    }
  }, [selectedTeacher, subjects]);

  const filteredTeachers = teachers.filter(
    (teacher) =>
      (searchQuery === "" ||
        teacher.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.id.toString().includes(searchQuery)) &&
      (selectedLevel === "" || teacher.level === Number(selectedLevel))
  );

  const getSubject = (subjectId) => subjects.find((s) => s.id === subjectId) || { id: "", nom: "Unknown" };
  const getLevelName = (levelId) => levels.find((l) => l.id === levelId)?.level || "Unknown";

  // ... Keep your existing grade color and calculation functions ...

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name === "grade" ? value : value });
  };

  const handleAddGrade = () => {
    if (!selectedTeacher || subjects.length === 0 || !gradesData[selectedTeacher.id]?.students?.length) return;
    setFormData({
      id: "",
      student: gradesData[selectedTeacher.id].students[0].id,
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

  // ... Keep your existing grade handling functions, adjusting student references ...

  if (loading) return <div className="min-h-screen bg-[#111827] text-white p-6">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#111827] text-white">
      <header className="bg-[#1e293b] p-4">
        <div className="container mx-auto">
          <div className="flex items-center gap-3">
            <button className="bg-blue-600/20 border border-blue-600/30 p-2 rounded-lg hover:bg-blue-600/30" onClick={() => window.history.back()}>
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Teacher Grades</h1>
              <p className="text-sm text-gray-400">View and manage teacher assignments and student grades</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6">
        {error && <div className="bg-red-600/20 border-red-600/30 p-4 rounded-lg mb-6">{error}</div>}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-[#1e293b] rounded-xl overflow-hidden">
              <div className="p-4 border-b border-gray-800">
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      className="bg-[#273549] pl-10 pr-4 py-2 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Search teachers..."
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
                      <option key={level.id} value={level.id}>{level.level}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                {filteredTeachers.map((teacher) => (
                  <div
                    key={teacher.id}
                    className={`p-4 border-b border-gray-800 flex flex-col gap-2 cursor-pointer hover:bg-[#172033] ${selectedTeacher?.id === teacher.id ? "bg-[#172033]" : ""}`}
                    onClick={() => { setSelectedTeacher(teacher); setSelectedGrade(null); setIsAddingGrade(false); setIsEditingGrade(false); setShowDeleteConfirm(false); }}
                  >
                    <div className="flex items-center gap-3">
                      <img src={teacher.photo || "/placeholder.svg"} alt={teacher.nom} className="h-10 w-10 rounded-full object-cover" />
                      <div className="flex-1">
                        <div className="font-medium">{teacher.prenom} {teacher.nom}</div>
                        <div className="text-sm text-gray-400">ID: {teacher.id} • {getLevelName(teacher.level)}</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 ml-12">
                      Students: {teacher.students?.length || 0}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-[#1e293b] rounded-xl overflow-hidden">
              <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-green-400" />
                  <h2 className="text-lg font-medium">Teacher's Students & Grades</h2>
                </div>
                {selectedTeacher && gradesData[selectedTeacher.id] && (
                  <button className="bg-blue-600 hover:bg-blue-700 p-2 rounded-lg" onClick={handleAddGrade}><Plus className="h-5 w-5" /></button>
                )}
              </div>

              {selectedTeacher && gradesData[selectedTeacher.id] ? (
                <div>
                  <div className="p-4 border-b border-gray-800 bg-[#172033]">
                    <div className="flex items-center gap-3">
                      <img src={selectedTeacher.photo || "/placeholder.svg"} alt={selectedTeacher.nom} className="h-12 w-12 rounded-full object-cover" />
                      <div>
                        <div className="font-medium text-lg">{selectedTeacher.prenom} {selectedTeacher.nom}</div>
                        <div className="text-sm text-gray-400">ID: {selectedTeacher.id} • {getLevelName(selectedTeacher.level)}</div>
                      </div>
                    </div>
                  </div>

                  {(isAddingGrade || isEditingGrade) && (
                    <div className="p-4 border-b border-gray-800 bg-[#172033]">
                      <h3 className="font-medium text-lg mb-4">{isAddingGrade ? "Add New Grade" : "Edit Grade"}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Student</label>
                          <select
                            name="student"
                            value={formData.student}
                            onChange={handleInputChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                          >
                            {gradesData[selectedTeacher.id].students.map((student) => (
                              <option key={student.id} value={student.id}>{student.prenom} {student.nom}</option>
                            ))}
                          </select>
                        </div>
                        {/* Keep other form fields */}
                      </div>
                      {/* Keep form buttons */}
                    </div>
                  )}

                  {/* Keep delete confirmation section */}

                  {!isAddingGrade && !isEditingGrade && !showDeleteConfirm && (
                    <div className="p-4">
                      <h3 className="font-medium mb-4">Student Grades</h3>
                      <table className="w-full border border-gray-800 rounded-lg">
                        <thead className="bg-[#0f172a]">
                          <tr>
                            <th className="px-4 py-2 text-left text-gray-400">Student</th>
                            <th className="px-4 py-2 text-left text-gray-400">Subject</th>
                            <th className="px-4 py-2 text-left text-gray-400">Type</th>
                            <th className="px-4 py-2 text-left text-gray-400">Grade</th>
                            <th className="px-4 py-2 text-left text-gray-400">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {gradesData[selectedTeacher.id]?.grades?.map((grade) => (
                            <tr key={grade.id} className="hover:bg-[#172033]">
                              <td className="px-4 py-2">
                                {gradesData[selectedTeacher.id].students.find(s => s.id === grade.student)?.prenom} 
                                {gradesData[selectedTeacher.id].students.find(s => s.id === grade.student)?.nom}
                              </td>
                              <td className="px-4 py-2">{getSubject(grade.subject).nom}</td>
                              <td className="px-4 py-2">{grade.grade_type}</td>
                              <td className="px-4 py-2">{grade.grade}/20</td>
                              <td className="px-4 py-2 flex gap-2">
                                <button className="text-blue-400 hover:text-blue-300" onClick={(e) => { e.stopPropagation(); handleEditGrade(grade); }}><Edit size={14} /></button>
                                <button className="text-red-400 hover:text-red-300" onClick={(e) => { e.stopPropagation(); setSelectedGrade(grade); setShowDeleteConfirm(true); }}><Trash2 size={14} /></button>
                              </td>
                            </tr>
                          )) || <tr><td colSpan={5} className="p-4 text-center text-gray-400">No grades available</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-12 text-center text-gray-400">
                  <Award className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg">Select a teacher to view their students and grades</p>
                </div>
              )}

              {/* Keep footer buttons */}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}