import { useState, useRef, useEffect } from "react";
import { Search, Plus, Filter, ChevronLeft, ChevronRight, Download, Trash2, Edit, Eye, X, Upload } from "lucide-react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment, Html } from "@react-three/drei";
import { useNavigate } from "react-router-dom"; // Replaced useRouter with useNavigate
import api from "../api"; // Adjust path based on your structure

// Add Student Modal Component
function AddStudentModal({ isOpen, onClose, onAddStudent, levels }) {
  const [newStudent, setNewStudent] = useState({
    nom: "",
    prenom: "",
    date_naissance: "",
    level: levels[0]?.id || "",
    adresse: "",
    mail: "",
    numero: "",
    photo: null,
    admission_s: "att",
  });
  const [previewUrl, setPreviewUrl] = useState("/media/placeholder.svg");
  const fileInputRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && levels.length > 0) {
      setNewStudent({
        nom: "",
        prenom: "",
        date_naissance: "",
        level: levels[0].id,
        adresse: "",
        mail: "",
        numero: "",
        photo: null,
        admission_s: "att",
      });
      setPreviewUrl("/media/placeholder.svg");
      setError(null);
    }
  }, [isOpen, levels]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewStudent({ ...newStudent, [name]: value });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewStudent({ ...newStudent, photo: file });
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("nom", newStudent.nom);
    formData.append("prenom", newStudent.prenom);
    formData.append("date_naissance", newStudent.date_naissance);
    formData.append("level", newStudent.level);
    formData.append("adresse", newStudent.adresse);
    formData.append("mail", newStudent.mail);
    formData.append("numero", newStudent.numero);
    formData.append("admission_s", newStudent.admission_s);
    if (newStudent.photo) {
      formData.append("photo", newStudent.photo);
    }

    try {
      const response = await api.post("/api/students/add/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onAddStudent(response.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to add student.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1e293b] rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add New Student</h2>
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
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.target.src = "/media/placeholder.svg")} />
                </div>
                <button type="button" onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm">
                  <Upload size={16} /> Upload Photo
                </button>
                <input type="file" ref={fileInputRef} onChange={handlePhotoChange} accept="image/*" className="hidden" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="prenom" className="block text-sm font-medium text-gray-300 mb-1">Prénom</label>
                <input type="text" id="prenom" name="prenom" value={newStudent.prenom} onChange={handleInputChange} required className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white" placeholder="First Name" />
              </div>
              <div>
                <label htmlFor="nom" className="block text-sm font-medium text-gray-300 mb-1">Nom</label>
                <input type="text" id="nom" name="nom" value={newStudent.nom} onChange={handleInputChange} required className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white" placeholder="Last Name" />
              </div>
            </div>
            <div className="mb-4">
              <label htmlFor="date_naissance" className="block text-sm font-medium text-gray-300 mb-1">Date de Naissance</label>
              <input type="date" id="date_naissance" name="date_naissance" value={newStudent.date_naissance} onChange={handleInputChange} className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white" />
            </div>
            <div className="mb-4">
              <label htmlFor="adresse" className="block text-sm font-medium text-gray-300 mb-1">Adresse</label>
              <input type="text" id="adresse" name="adresse" value={newStudent.adresse} onChange={handleInputChange} className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white" placeholder="Address" />
            </div>
            <div className="mb-4">
              <label htmlFor="mail" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input type="email" id="mail" name="mail" value={newStudent.mail} onChange={handleInputChange} required className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white" placeholder="Email" />
            </div>
            <div className="mb-4">
              <label htmlFor="numero" className="block text-sm font-medium text-gray-300 mb-1">Numéro</label>
              <input type="text" id="numero" name="numero" value={newStudent.numero} onChange={handleInputChange} required className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white" placeholder="Phone Number" />
            </div>
            <div className="mb-6">
              <label htmlFor="level" className="block text-sm font-medium text-gray-300 mb-1">Level</label>
              <select id="level" name="level" value={newStudent.level} onChange={handleInputChange} className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white">
                {levels.map((level) => (
                  <option key={level.id} value={level.id}>{level.level}</option>
                ))}
              </select>
            </div>
            <div className="mb-6">
              <label htmlFor="admission_s" className="block text-sm font-medium text-gray-300 mb-1">Admission Status</label>
              <select id="admission_s" name="admission_s" value={newStudent.admission_s} onChange={handleInputChange} className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white">
                <option value="att">En Attente</option>
                <option value="acc">Accepté</option>
                <option value="ref">Refusé</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white">Add Student</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Edit Student Modal Component
function EditStudentModal({ isOpen, onClose, onEditStudent, student, levels }) {
  const [editedStudent, setEditedStudent] = useState({
    nom: student.nom || "",
    prenom: student.prenom || "",
    date_naissance: student.date_naissance || "",
    level: student.level || levels[0]?.id || "",
    adresse: student.adresse || "",
    mail: student.mail || "",
    numero: student.numero || "",
    admission_s: student.admission_s || "att",
    photo: null,
  });
  const [previewUrl, setPreviewUrl] = useState(student.photo || "/media/placeholder.svg");
  const fileInputRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setEditedStudent({
        nom: student.nom || "",
        prenom: student.prenom || "",
        date_naissance: student.date_naissance || "",
        level: student.level || levels[0]?.id || "",
        adresse: student.adresse || "",
        mail: student.mail || "",
        numero: student.numero || "",
        admission_s: student.admission_s || "att",
        photo: null,
      });
      setPreviewUrl(student.photo || "/media/placeholder.svg");
      setError(null);
    }
  }, [isOpen, student, levels]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedStudent({ ...editedStudent, [name]: value });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditedStudent({ ...editedStudent, photo: file });
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("nom", editedStudent.nom);
    formData.append("prenom", editedStudent.prenom);
    formData.append("date_naissance", editedStudent.date_naissance);
    formData.append("level", editedStudent.level);
    formData.append("adresse", editedStudent.adresse);
    formData.append("mail", editedStudent.mail);
    formData.append("numero", editedStudent.numero);
    formData.append("admission_s", editedStudent.admission_s);
    if (editedStudent.photo) {
      formData.append("photo", editedStudent.photo);
    }

    try {
      const response = await api.put(`/api/students/edit/${student.id}/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onEditStudent(response.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to edit student.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1e293b] rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Edit Student</h2>
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
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.target.src = "/media/placeholder.svg")} />
                </div>
                <button type="button" onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm">
                  <Upload size={16} /> Change Photo
                </button>
                <input type="file" ref={fileInputRef} onChange={handlePhotoChange} accept="image/*" className="hidden" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="prenom" className="block text-sm font-medium text-gray-300 mb-1">Prénom</label>
                <input type="text" id="prenom" name="prenom" value={editedStudent.prenom} onChange={handleInputChange} required className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white" placeholder="First Name" />
              </div>
              <div>
                <label htmlFor="nom" className="block text-sm font-medium text-gray-300 mb-1">Nom</label>
                <input type="text" id="nom" name="nom" value={editedStudent.nom} onChange={handleInputChange} required className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white" placeholder="Last Name" />
              </div>
            </div>
            <div className="mb-4">
              <label htmlFor="date_naissance" className="block text-sm font-medium text-gray-300 mb-1">Date de Naissance</label>
              <input type="date" id="date_naissance" name="date_naissance" value={editedStudent.date_naissance} onChange={handleInputChange} className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white" />
            </div>
            <div className="mb-4">
              <label htmlFor="adresse" className="block text-sm font-medium text-gray-300 mb-1">Adresse</label>
              <input type="text" id="adresse" name="adresse" value={editedStudent.adresse} onChange={handleInputChange} className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white" placeholder="Address" />
            </div>
            <div className="mb-4">
              <label htmlFor="mail" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input type="email" id="mail" name="mail" value={editedStudent.mail} onChange={handleInputChange} required className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white" placeholder="Email" />
            </div>
            <div className="mb-4">
              <label htmlFor="numero" className="block text-sm font-medium text-gray-300 mb-1">Numéro</label>
              <input type="text" id="numero" name="numero" value={editedStudent.numero} onChange={handleInputChange} required className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white" placeholder="Phone Number" />
            </div>
            <div className="mb-6">
              <label htmlFor="level" className="block text-sm font-medium text-gray-300 mb-1">Level</label>
              <select id="level" name="level" value={editedStudent.level} onChange={handleInputChange} className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white">
                {levels.map((level) => (
                  <option key={level.id} value={level.id}>{level.level}</option>
                ))}
              </select>
            </div>
            <div className="mb-6">
              <label htmlFor="admission_s" className="block text-sm font-medium text-gray-300 mb-1">Admission Status</label>
              <select id="admission_s" name="admission_s" value={editedStudent.admission_s} onChange={handleInputChange} className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white">
                <option value="att">En Attente</option>
                <option value="acc">Accepté</option>
                <option value="ref">Refusé</option>
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

// 3D Student Card Component
function StudentCard({ student, index, totalStudents, onDelete, onEdit, levels }) {
  const levelName = levels.find((l) => l.id === student.level)?.level || "Unknown";
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
          <img src={student.photo || "/media/placeholder.svg"} alt={`${student.prenom} ${student.nom}`} className="w-full h-full object-cover" onError={(e) => (e.target.src = "/media/placeholder.svg")} />
        </div>
      </Html>
      <Html position={[0.5, 0, 0.1]} transform scale={0.4} rotation={[0, 0, 0]}>
        <div className="w-[400px] text-white font-medium relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-xl" />
          <div className="relative">
            <h3 className="text-2xl mb-2 font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              {student.prenom} {student.nom}
            </h3>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-md text-xs backdrop-blur-sm">
                ID: {student.id}
              </span>
              <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-md text-xs backdrop-blur-sm">
                Level: {levelName}
              </span>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={(e) => { e.stopPropagation(); onEdit(student); }} className="p-2 bg-green-500/20 border border-green-500/30 rounded-full hover:bg-green-500/30 transition-colors">
                <Edit size={16} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(student.id); }} className="p-2 bg-red-500/20 border border-red-500/30 rounded-full hover:bg-red-500/30 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      </Html>
      <Html position={[1.7, -0.9, 0.1]}>
        <div className="px-3 py-1 bg-gray-900/50 border border-gray-700/30 rounded-full backdrop-blur-sm text-gray-400 text-xs">{index + 1}/{totalStudents}</div>
      </Html>
    </group>
  );
}

// Scene setup component
function StudentScene({ students, currentPage, studentsPerPage, onDelete, onEdit, levels }) {
  return (
    <Canvas shadows>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />
      <ambientLight intensity={0.3} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={0.8} castShadow />
      <pointLight position={[-10, -10, -10]} color="#3b82f6" intensity={0.5} />
      <Environment preset="night" />
      {students.map((student, index) => (
        <StudentCard key={student.id} student={student} index={index + (currentPage - 1) * studentsPerPage} totalStudents={students.length} onDelete={onDelete} onEdit={onEdit} levels={levels} />
      ))}
      <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 2.5} maxPolarAngle={Math.PI / 2.5} rotateSpeed={0.5} />
    </Canvas>
  );
}

// Floating Action Button Component
function FloatingActionButton({ onClick }) {
  return (
    <button onClick={onClick} className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-lg z-10 transition-transform hover:scale-110" aria-label="Add student">
      <Plus size={24} />
    </button>
  );
}

// Main Component
export default function StudentList() {
  const PLACEHOLDER_IMAGE = "/media/placeholder.svg";
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [levels, setLevels] = useState([]);
  const [studentToEdit, setStudentToEdit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Replaced useRouter with useNavigate

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [levelsResponse, studentsResponse] = await Promise.all([
          api.get("/api/levels/list/"),
          api.get("/api/students/list/"),
        ]);
        setLevels(Array.isArray(levelsResponse.data) ? levelsResponse.data : []);
        setStudents(Array.isArray(studentsResponse.data) ? studentsResponse.data : []);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to load data. Please try again.");
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddStudent = (newStudent) => {
    setStudents((prev) => [...prev, newStudent]);
    setIsAddModalOpen(false);
  };

  const handleEditStudent = (updatedStudent) => {
    setStudents((prev) => prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s)));
    setIsEditModalOpen(false);
    setStudentToEdit(null);
  };

  const handleDelete = async (studentId) => {
    try {
      await api.delete(`/api/students/delete/${studentId}/`);
      setStudents((prev) => prev.filter((s) => s.id !== studentId));
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete student.");
    }
  };

  const openEditModal = (student) => {
    setStudentToEdit({ ...student });
    setIsEditModalOpen(true);
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      searchQuery === "" ||
      student.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.id.toString().includes(searchQuery);
    const matchesLevel = selectedLevel === "All" || student.level === parseInt(selectedLevel);
    return matchesSearch && matchesLevel;
  });

  const studentsPerPage = 1;
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const currentStudents = filteredStudents.slice((currentPage - 1) * studentsPerPage, currentPage * studentsPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const levelOptions = [{ id: "All", level: "All Levels" }, ...levels];

  const handleViewDetails = (studentId) => {
    navigate(`/admin/studentdetail?id=${studentId}`); // Use navigate instead of router.push
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
            <h1 className="text-xl font-bold">Student Management</h1>
            <p className="text-sm text-gray-400">Manage all student-related activities and information</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input type="text" className="bg-[#273549] pl-10 pr-4 py-2 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Search students..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
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
          <h2 className="text-2xl font-bold">Student Lists</h2>
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

        {!isAddModalOpen && !isEditModalOpen && currentStudents.length > 0 && (
          <div className="bg-[#1e293b] rounded-xl p-4 mb-6 h-[400px]">
            <StudentScene students={currentStudents} currentPage={currentPage} studentsPerPage={studentsPerPage} onDelete={handleDelete} onEdit={openEditModal} levels={levels} />
          </div>
        )}
        {!isAddModalOpen && !isEditModalOpen && currentStudents.length === 0 && (
          <div className="bg-[#1e293b] rounded-xl p-4 mb-6 h-[400px] flex items-center justify-center">
            <p className="text-gray-400">No students found matching your criteria</p>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-400">
            Showing {currentStudents.length > 0 ? (currentPage - 1) * studentsPerPage + 1 : 0} to {Math.min(currentPage * studentsPerPage, filteredStudents.length)} of {filteredStudents.length} students
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date de Naissance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Numéro</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Admission</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Adresse</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => {
                const levelName = levels.find((l) => l.id === student.level)?.level || "Unknown";
                return (
                  <tr key={student.id} className="border-b border-gray-800 hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{student.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <img src={student.photo || "/media/placeholder.svg"} alt={`${student.prenom} ${student.nom}`} className="h-10 w-10 rounded-full object-cover" onError={(e) => (e.target.src = "/media/placeholder.svg")} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{student.nom}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{student.prenom}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 bg-purple-500 rounded-md text-xs">{levelName}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{student.mail}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{student.date_naissance || "N/A"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{student.numero}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{student.admission_s}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{student.adresse}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button onClick={() => handleViewDetails(student.id)} className="p-1 bg-blue-500 rounded-full hover:bg-blue-600">
                          <Eye size={16} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); openEditModal(student); }} className="p-1 bg-green-500 rounded-full hover:bg-green-600">
                          <Edit size={16} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(student.id); }} className="p-1 bg-red-500 rounded-full hover:bg-red-600">
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
      <AddStudentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAddStudent={handleAddStudent} levels={levels} />
      <EditStudentModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onEditStudent={handleEditStudent} student={studentToEdit || {}} levels={levels} />
    </div>
  );
}