"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Plus, Filter, ChevronLeft, ChevronRight, Download, Trash2, Edit, Eye, X, Upload } from "lucide-react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment, Html } from "@react-three/drei";
import { useNavigate } from "react-router-dom";
import api from "../api"; // Import the configured API instance

// Add Teacher Modal Component
function AddTeacherModal({ isOpen, onClose, onAddTeacher, levels, subjects }) {
  const [newTeacher, setNewTeacher] = useState({
    nom: "",
    prenom: "",
    date_naissance: "",
    subject: subjects[0]?.id || "",
    adresse: "",
    mail: "",
    numero: "",
    photo: null,
    levels: [],
  });
  const [previewUrl, setPreviewUrl] = useState("/media/placeholder.svg");
  const fileInputRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && subjects.length > 0) {
      setNewTeacher({
        nom: "",
        prenom: "",
        date_naissance: "",
        subject: subjects[0].id,
        adresse: "",
        mail: "",
        numero: "",
        photo: null,
        levels: [],
      });
      setPreviewUrl("/media/placeholder.svg");
      setError(null);
    }
  }, [isOpen, subjects]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTeacher((prev) => ({ ...prev, [name]: value }));
  };

  const handleLevelsChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (option) => Number(option.value));
    setNewTeacher((prev) => ({ ...prev, levels: selectedOptions }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewTeacher((prev) => ({ ...prev, photo: file }));
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("nom", newTeacher.nom);
    formData.append("prenom", newTeacher.prenom);
    formData.append("date_naissance", newTeacher.date_naissance);
    formData.append("subject", newTeacher.subject);
    formData.append("adresse", newTeacher.adresse);
    formData.append("mail", newTeacher.mail);
    formData.append("numero", newTeacher.numero);
    if (newTeacher.photo) {
      formData.append("photo", newTeacher.photo);
    }
    newTeacher.levels.forEach((levelId) => formData.append("levels", levelId));

    try {
      const response = await api.post("api/teachers/add/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onAddTeacher(response.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add teacher.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1e293b] rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add New Teacher</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        {error && <div className="text-red-400 mb-4">{error}</div>}
        <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">Photo</label>
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24 bg-[#2a3a4f] rounded-lg overflow-hidden">
                  <img
                    src={previewUrl}
                    alt="Teacher preview"
                    className="w-full h-full object-cover"
                    onError={(e) => (e.target.src = "/media/placeholder.svg")}
                  />
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm"
                  >
                    <Upload size={16} /> Upload Photo
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="prenom" className="block text-sm font-medium text-gray-300 mb-1">Prénom</label>
                <input
                  type="text"
                  id="prenom"
                  name="prenom"
                  value={newTeacher.prenom}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white"
                  placeholder="First Name"
                />
              </div>
              <div>
                <label htmlFor="nom" className="block text-sm font-medium text-gray-300 mb-1">Nom</label>
                <input
                  type="text"
                  id="nom"
                  name="nom"
                  value={newTeacher.nom}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white"
                  placeholder="Last Name"
                />
              </div>
            </div>
            <div className="mb-4">
              <label htmlFor="date_naissance" className="block text-sm font-medium text-gray-300 mb-1">Date de Naissance</label>
              <input
                type="date"
                id="date_naissance"
                name="date_naissance"
                value={newTeacher.date_naissance}
                onChange={handleInputChange}
                className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-1">Subject</label>
              <select
                id="subject"
                name="subject"
                value={newTeacher.subject}
                onChange={handleInputChange}
                className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white"
              >
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.nom}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="adresse" className="block text-sm font-medium text-gray-300 mb-1">Adresse</label>
              <input
                type="text"
                id="adresse"
                name="adresse"
                value={newTeacher.adresse}
                onChange={handleInputChange}
                className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white"
                placeholder="Address"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="mail" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input
                type="email"
                id="mail"
                name="mail"
                value={newTeacher.mail}
                onChange={handleInputChange}
                required
                className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white"
                placeholder="Email"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="numero" className="block text-sm font-medium text-gray-300 mb-1">Numéro</label>
              <input
                type="text"
                id="numero"
                name="numero"
                value={newTeacher.numero}
                onChange={handleInputChange}
                required
                className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white"
                placeholder="Phone Number"
              />
            </div>
            <div className="mb-6">
              <label htmlFor="levels" className="block text-sm font-medium text-gray-300 mb-1">Levels</label>
              <select
                id="levels"
                name="levels"
                multiple
                value={newTeacher.levels}
                onChange={handleLevelsChange}
                className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white"
              >
                {levels.map((level) => (
                  <option key={level.id} value={level.id}>{level.level}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white">Add Teacher</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Edit Teacher Modal Component
function EditTeacherModal({ isOpen, onClose, onEditTeacher, teacher, levels, subjects }) {
  const [editedTeacher, setEditedTeacher] = useState({
    id: teacher.id || "",
    nom: teacher.nom || "",
    prenom: teacher.prenom || "",
    date_naissance: teacher.date_naissance || "",
    subject: teacher.subject || subjects[0]?.id || "",
    adresse: teacher.adresse || "",
    mail: teacher.mail || "",
    numero: teacher.numero || "",
    photo: null,
    levels: teacher.levels || [],
  });
  const [previewUrl, setPreviewUrl] = useState(teacher.photo || "/media/placeholder.svg");
  const fileInputRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setEditedTeacher({
        id: teacher.id || "",
        nom: teacher.nom || "",
        prenom: teacher.prenom || "",
        date_naissance: teacher.date_naissance || "",
        subject: teacher.subject || subjects[0]?.id || "",
        adresse: teacher.adresse || "",
        mail: teacher.mail || "",
        numero: teacher.numero || "",
        photo: null,
        levels: teacher.levels || [],
      });
      setPreviewUrl(teacher.photo || "/media/placeholder.svg");
      setError(null);
    }
  }, [isOpen, teacher, subjects]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedTeacher((prev) => ({ ...prev, [name]: value }));
  };

  const handleLevelsChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (option) => Number(option.value));
    setEditedTeacher((prev) => ({ ...prev, levels: selectedOptions }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditedTeacher((prev) => ({ ...prev, photo: file }));
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("nom", editedTeacher.nom);
    formData.append("prenom", editedTeacher.prenom);
    formData.append("date_naissance", editedTeacher.date_naissance);
    formData.append("subject", editedTeacher.subject);
    formData.append("adresse", editedTeacher.adresse);
    formData.append("mail", editedTeacher.mail);
    formData.append("numero", editedTeacher.numero);
    if (editedTeacher.photo) {
      formData.append("photo", editedTeacher.photo);
    }
    editedTeacher.levels.forEach((levelId) => formData.append("levels", levelId));

    try {
      const response = await api.put(`api/teachers/edit/${editedTeacher.id}/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onEditTeacher(response.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to edit teacher.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1e293b] rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Edit Teacher</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        {error && <div className="text-red-400 mb-4">{error}</div>}
        <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">Photo</label>
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24 bg-[#2a3a4f] rounded-lg overflow-hidden">
                  <img
                    src={previewUrl}
                    alt="Teacher preview"
                    className="w-full h-full object-cover"
                    onError={(e) => (e.target.src = "/media/placeholder.svg")}
                  />
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm"
                  >
                    <Upload size={16} /> Change Photo
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="prenom" className="block text-sm font-medium text-gray-300 mb-1">Prénom</label>
                <input
                  type="text"
                  id="prenom"
                  name="prenom"
                  value={editedTeacher.prenom}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white"
                  placeholder="First Name"
                />
              </div>
              <div>
                <label htmlFor="nom" className="block text-sm font-medium text-gray-300 mb-1">Nom</label>
                <input
                  type="text"
                  id="nom"
                  name="nom"
                  value={editedTeacher.nom}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white"
                  placeholder="Last Name"
                />
              </div>
            </div>
            <div className="mb-4">
              <label htmlFor="date_naissance" className="block text-sm font-medium text-gray-300 mb-1">Date de Naissance</label>
              <input
                type="date"
                id="date_naissance"
                name="date_naissance"
                value={editedTeacher.date_naissance}
                onChange={handleInputChange}
                className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-1">Subject</label>
              <select
                id="subject"
                name="subject"
                value={editedTeacher.subject}
                onChange={handleInputChange}
                className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white"
              >
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.nom}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="adresse" className="block text-sm font-medium text-gray-300 mb-1">Adresse</label>
              <input
                type="text"
                id="adresse"
                name="adresse"
                value={editedTeacher.adresse}
                onChange={handleInputChange}
                className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white"
                placeholder="Address"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="mail" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input
                type="email"
                id="mail"
                name="mail"
                value={editedTeacher.mail}
                onChange={handleInputChange}
                required
                className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white"
                placeholder="Email"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="numero" className="block text-sm font-medium text-gray-300 mb-1">Numéro</label>
              <input
                type="text"
                id="numero"
                name="numero"
                value={editedTeacher.numero}
                onChange={handleInputChange}
                required
                className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white"
                placeholder="Phone Number"
              />
            </div>
            <div className="mb-6">
              <label htmlFor="levels" className="block text-sm font-medium text-gray-300 mb-1">Levels</label>
              <select
                id="levels"
                name="levels"
                multiple
                value={editedTeacher.levels}
                onChange={handleLevelsChange}
                className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white"
              >
                {levels.map((level) => (
                  <option key={level.id} value={level.id}>{level.level}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// 3D Teacher Card Component
function TeacherCard({ teacher, index, totalTeachers, onDelete, onEdit, levels, subjects }) {
  const subjectName = subjects.find((s) => s.id === teacher.subject)?.nom || "Unknown";
  const levelNames = levels.filter((l) => teacher.levels.includes(l.id)).map((l) => l.level).join(", ") || "None";
  return (
    <group position={[0, 0, 0]} rotation={[0, 0, 0]}>
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.8, 2.2, 0.1]} />
        <meshPhysicalMaterial color="#1e293b" metalness={0.9} roughness={0.1} transmission={0.5} thickness={0.5} envMapIntensity={1} />
      </mesh>
      <mesh position={[0, 0, 0.06]} castShadow>
        <planeGeometry args={[3.8, 2.2]} />
        <meshPhongMaterial color="#0f172a" opacity={0.7} transparent shininess={100} />
      </mesh>
      <mesh position={[-1.4, 0, 0.07]} castShadow>
        <planeGeometry args={[1, 1.5]} />
        <meshPhongMaterial color="#3b82f6" emissive="#1d4ed8" emissiveIntensity={0.2} transparent opacity={0.1} />
      </mesh>
      <Html position={[-1.4, 0, 0.08]} transform>
        <div className="w-[100px] h-[150px] rounded-lg overflow-hidden ring-2 ring-blue-500/30">
          <img
            src={teacher.photo || "/media/placeholder.svg"}
            alt={`${teacher.prenom} ${teacher.nom}`}
            className="w-full h-full object-cover"
            onError={(e) => (e.target.src = "/media/placeholder.svg")}
          />
        </div>
      </Html>
      <Html position={[0.5, 0, 0.1]} transform scale={0.4} rotation={[0, 0, 0]}>
        <div className="w-[400px] text-white font-medium relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-xl" />
          <div className="relative">
            <h3 className="text-2xl mb-2 font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              {teacher.prenom} {teacher.nom}
            </h3>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-md text-xs backdrop-blur-sm">
                ID: {teacher.id}
              </span>
              <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-md text-xs backdrop-blur-sm">
                Subject: {subjectName}
              </span>
            </div>
            <div className="text-sm text-gray-300 mb-3">Levels: {levelNames}</div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(teacher);
                }}
                className="p-2 bg-green-500/20 border border-green-500/30 rounded-full hover:bg-green-500/30 transition-colors"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(teacher.id);
                }}
                className="p-2 bg-red-500/20 border border-red-500/30 rounded-full hover:bg-red-500/30 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      </Html>
      <Html position={[1.7, -0.9, 0.1]}>
        <div className="px-3 py-1 bg-gray-900/50 border border-gray-700/30 rounded-full backdrop-blur-sm text-gray-400 text-xs">{index + 1}/{totalTeachers}</div>
      </Html>
    </group>
  );
}

// Scene setup component
function TeacherScene({ teachers, currentPage, teachersPerPage, onDelete, onEdit, levels, subjects }) {
  return (
    <Canvas shadows>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />
      <ambientLight intensity={0.3} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={0.8} castShadow />
      <pointLight position={[-10, -10, -10]} color="#3b82f6" intensity={0.5} />
      <Environment preset="night" />
      {teachers.map((teacher, index) => (
        <TeacherCard
          key={teacher.id}
          teacher={teacher}
          index={index + (currentPage - 1) * teachersPerPage}
          totalTeachers={teachers.length}
          onDelete={onDelete}
          onEdit={onEdit}
          levels={levels}
          subjects={subjects}
        />
      ))}
      <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 2.5} maxPolarAngle={Math.PI / 2.5} rotateSpeed={0.5} />
    </Canvas>
  );
}

// Floating Action Button Component
function FloatingActionButton({ onClick }) {
  return (
    <button onClick={onClick} className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-lg z-10 transition-transform hover:scale-110" aria-label="Add teacher">
      <Plus size={24} />
    </button>
  );
}

// Main Component
export default function TeacherList() {
  const PLACEHOLDER_IMAGE = "/media/placeholder.svg";
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [levels, setLevels] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teacherToEdit, setTeacherToEdit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [levelsResponse, subjectsResponse, teachersResponse] = await Promise.all([
          api.get("api/levels/list/"), // Fetch levels from LevelListView
          api.get("api/subjects/list/"), // Fetch subjects
          api.get("api/teachers/list/", {
            params: {
              level: selectedLevel !== "All" ? [selectedLevel] : null, // Pass level as an array for getlist
            },
          }), // Fetch teachers with level filter
        ]);
        setLevels(levelsResponse.data);
        setSubjects(subjectsResponse.data);
        setTeachers(teachersResponse.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load data. Please try again.");
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedLevel]);

  const handleAddTeacher = (newTeacher) => {
    setTeachers((prev) => [...prev, newTeacher]);
    setIsAddModalOpen(false);
  };

  const handleEditTeacher = (updatedTeacher) => {
    setTeachers((prev) =>
      prev.map((t) => (t.id === updatedTeacher.id ? { ...t, ...updatedTeacher } : t))
    );
    setIsEditModalOpen(false);
    setTeacherToEdit(null);
    setError(null);
  };

  const handleDelete = async (teacherId) => {
    try {
      await api.delete(`api/teachers/delete/${teacherId}/`);
      setTeachers((prev) => prev.filter((t) => t.id !== teacherId));
    } catch (err) {
      setError("Failed to delete teacher.");
    }
  };

  const openEditModal = (teacher) => {
    setTeacherToEdit({ ...teacher });
    setIsEditModalOpen(true);
  };

  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch =
      searchQuery === "" ||
      teacher.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.id.toString().includes(searchQuery);
    return matchesSearch;
  });

  const teachersPerPage = 1;
  const totalPages = Math.ceil(filteredTeachers.length / teachersPerPage);
  const currentTeachers = filteredTeachers.slice((currentPage - 1) * teachersPerPage, currentPage * teachersPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const levelOptions = [{ id: "All", level: "All Levels" }, ...levels];

  const handleViewDetails = (teacherId) => {
    navigate(`/admin/teacherdetail?id=${teacherId}`);
  };

  if (loading) return <div className="min-h-screen bg-[#111827] text-white p-6">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#111827] text-white" style={{ overflowY: "auto" }}>
      <header className="bg-[#1e293b] p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold">Teacher Management</h1>
            <p className="text-sm text-gray-400">Manage all teacher-related activities and information</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="bg-[#273549] pl-10 pr-4 py-2 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search teachers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="bg-blue-600 p-2 rounded-full hover:bg-blue-700" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-5 w-5" />
          </button>
          <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="font-medium">JS</span>
          </div>
        </div>
      </header>

      <main className="p-6" style={{ overflowY: "auto" }}>
        {error && <div className="text-red-400 mb-4">{error}</div>}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Teacher Lists</h2>
          <div className="flex gap-3">
            <select className="bg-[#1e293b] border border-gray-700 rounded-lg px-3 py-2 text-sm" value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)}>
              {levelOptions.map((level) => (
                <option key={level.id} value={level.id}>{level.level}</option>
              ))}
            </select>
            <button className="bg-[#1e293b] border border-gray-700 rounded-lg px-3 py-2 text-sm flex items-center gap-2">
              <Filter className="h-4 w-4" /> <span>Filter</span>
            </button>
            <button className="bg-[#1e293b] border border-gray-700 rounded-lg px-3 py-2 text-sm flex items-center gap-2">
              <Download className="h-4 w-4" /> <span>Export</span>
            </button>
          </div>
        </div>

        {!isAddModalOpen && !isEditModalOpen && currentTeachers.length > 0 && (
          <div className="bg-[#1e293b] rounded-xl p-4 mb-6 h-[400px]">
            <TeacherScene teachers={currentTeachers} currentPage={currentPage} teachersPerPage={teachersPerPage} onDelete={handleDelete} onEdit={openEditModal} levels={levels} subjects={subjects} />
          </div>
        )}
        {!isAddModalOpen && !isEditModalOpen && currentTeachers.length === 0 && (
          <div className="bg-[#1e293b] rounded-xl p-4 mb-6 h-[400px]">
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-400">No teachers found matching your criteria</p>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-400">
            Showing {currentTeachers.length > 0 ? (currentPage - 1) * teachersPerPage + 1 : 0} to {Math.min(currentPage * teachersPerPage, filteredTeachers.length)} of {filteredTeachers.length} teachers
          </div>
          <div className="flex gap-2">
            <button className={`p-2 rounded-lg ${currentPage === 1 ? "bg-gray-800 text-gray-500" : "bg-blue-600 hover:bg-blue-700"}`} onClick={prevPage} disabled={currentPage === 1}>
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="bg-[#1e293b] px-4 py-2 rounded-lg flex items-center">{currentPage} / {totalPages || 1}</div>
            <button className={`p-2 rounded-lg ${currentPage === totalPages || totalPages === 0 ? "bg-gray-800 text-gray-500" : "bg-blue-600 hover:bg-blue-700"}`} onClick={nextPage} disabled={currentPage === totalPages || totalPages === 0}>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </main>

      <div className="p-6" style={{ overflowY: "auto" }}>
        <div className="bg-[#1e293b] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Photo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Prénom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Levels</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date de Naissance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Numéro</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Adresse</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.map((teacher) => {
                const subjectName = subjects.find((s) => s.id === teacher.subject)?.nom || "Unknown";
                const levelNames = levels.filter((l) => teacher.levels.includes(l.id)).map((l) => l.level).join(", ") || "None";
                return (
                  <tr key={teacher.id} className="border-b border-gray-800 hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{teacher.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <img
                        src={teacher.photo || "/media/placeholder.svg"}
                        alt={`${teacher.prenom} ${teacher.nom}`}
                        className="h-10 w-10 rounded-full object-cover"
                        onError={(e) => (e.target.src = "/media/placeholder.svg")}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{teacher.nom}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{teacher.prenom}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 bg-purple-500 rounded-md text-xs">{subjectName}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{levelNames || "N/A"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{teacher.mail}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{teacher.date_naissance || "N/A"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{teacher.numero}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{teacher.adresse}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetails(teacher.id)}
                          className="p-1 bg-blue-500 rounded-full hover:bg-blue-600"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(teacher);
                          }}
                          className="p-1 bg-green-500 rounded-full hover:bg-green-600"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(teacher.id);
                          }}
                          className="p-1 bg-red-500 rounded-full hover:bg-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <FloatingActionButton onClick={() => setIsAddModalOpen(true)} />
      <AddTeacherModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAddTeacher={handleAddTeacher} levels={levels} subjects={subjects} />
      <EditTeacherModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onEditTeacher={handleEditTeacher} teacher={teacherToEdit || {}} levels={levels} subjects={subjects} />
    </div>
  );
}