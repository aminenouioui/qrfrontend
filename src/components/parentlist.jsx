import { useState, useEffect } from "react";
import { Search, Plus, Filter, ChevronLeft, ChevronRight, Download, Trash2, Edit, Eye, X } from "lucide-react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment, Html } from "@react-three/drei";
import { useNavigate } from "react-router-dom";
import api from "./api";

// Add Parent Modal Component
function AddParentModal({ isOpen, onClose, onAddParent }) {
  const [newParent, setNewParent] = useState({
    nom: "",
    prenom: "",
    adresse: "",
    mail: "",
    numero: "",
    relationship: "guardian",
    is_emergency_contact: true,
    profession: "",
  });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewParent({
        nom: "",
        prenom: "",
        adresse: "",
        mail: "",
        numero: "",
        relationship: "guardian",
        is_emergency_contact: true,
        profession: "",
      });
      setError(null);
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewParent((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("nom", newParent.nom);
    formData.append("prenom", newParent.prenom);
    formData.append("adresse", newParent.adresse);
    formData.append("mail", newParent.mail);
    formData.append("numero", newParent.numero);
    formData.append("relationship", newParent.relationship);
    formData.append("is_emergency_contact", newParent.is_emergency_contact);
    formData.append("profession", newParent.profession);

    try {
      const response = await api.post("/api/parents/add/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onAddParent(response.data);
      onClose();
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail ||
        Object.values(err.response?.data || {}).join(", ") ||
        "Failed to add parent.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1e293b] rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add New Parent</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        {error && <div className="text-red-400 mb-4">{error}</div>}
        <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="prenom" className="block text-sm font-medium text-gray-300 mb-1">
                  Prénom
                </label>
                <input
                  type="text"
                  id="prenom"
                  name="prenom"
                  value={newParent.prenom}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white"
                  placeholder="First Name"
                />
              </div>
              <div>
                <label htmlFor="nom" className="block text-sm font-medium text-gray-300 mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  id="nom"
                  name="nom"
                  value={newParent.nom}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white"
                  placeholder="Last Name"
                />
              </div>
            </div>
            <div className="mb-4">
              <label htmlFor="adresse" className="block text-sm font-medium text-gray-300 mb-1">
                Adresse
              </label>
              <input
                type="text"
                id="adresse"
                name="adresse"
                value={newParent.adresse}
                onChange={handleInputChange}
                className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white"
                placeholder="Address"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="mail" className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                id="mail"
                name="mail"
                value={newParent.mail}
                onChange={handleInputChange}
                required
                className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white"
                placeholder="Email"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="numero" className="block text-sm font-medium text-gray-300 mb-1">
                Numéro
              </label>
              <input
                type="text"
                id="numero"
                name="numero"
                value={newParent.numero}
                onChange={handleInputChange}
                required
                className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white"
                placeholder="Phone Number"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="relationship" className="block text-sm font-medium text-gray-300 mb-1">
                Relationship
              </label>
              <select
                id="relationship"
                name="relationship"
                value={newParent.relationship}
                onChange={handleInputChange}
                className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white"
              >
                <option value="father">Father</option>
                <option value="mother">Mother</option>
                <option value="guardian">Guardian</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="mb-4 flex items-center">
              <input
                type="checkbox"
                id="is_emergency_contact"
                name="is_emergency_contact"
                checked={newParent.is_emergency_contact}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 border-gray-700 rounded bg-[#273549]"
              />
              <label htmlFor="is_emergency_contact" className="ml-2 text-sm text-gray-300">
                Emergency Contact
              </label>
            </div>
            <div className="mb-6">
              <label htmlFor="profession" className="block text-sm font-medium text-gray-300 mb-1">
                Profession
              </label>
              <input
                type="text"
                id="profession"
                name="profession"
                value={newParent.profession}
                onChange={handleInputChange}
                className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white"
                placeholder="Profession"
              />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white ${
                  isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isSubmitting ? "Adding..." : "Add Parent"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Edit Parent Modal Component
function EditParentModal({ isOpen, onClose, onEditParent, parent }) {
  const [editedParent, setEditedParent] = useState({
    nom: parent.nom || "",
    prenom: parent.prenom || "",
    adresse: parent.adresse || "",
    mail: parent.mail || "",
    numero: parent.numero || "",
    relationship: parent.relationship || "guardian",
    is_emergency_contact: parent.is_emergency_contact ?? true,
    profession: parent.profession || "",
  });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEditedParent({
        nom: parent.nom || "",
        prenom: parent.prenom || "",
        adresse: parent.adresse || "",
        mail: parent.mail || "",
        numero: parent.numero || "",
        relationship: parent.relationship || "guardian",
        is_emergency_contact: parent.is_emergency_contact ?? true,
        profession: parent.profession || "",
      });
      setError(null);
    }
  }, [isOpen, parent]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditedParent((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("nom", editedParent.nom);
    formData.append("prenom", editedParent.prenom);
    formData.append("adresse", editedParent.adresse);
    formData.append("mail", editedParent.mail);
    formData.append("numero", editedParent.numero);
    formData.append("relationship", editedParent.relationship);
    formData.append("is_emergency_contact", editedParent.is_emergency_contact);
    formData.append("profession", editedParent.profession);

    try {
      const response = await api.put(`/api/parents/edit/${parent.id}/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onEditParent(response.data);
      onClose();
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail ||
        Object.values(err.response?.data || {}).join(", ") ||
        "Failed to edit parent.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1e293b] rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Edit Parent</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        {error && <div className="text-red-400 mb-4">{error}</div>}
        <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="prenom" className="block text-sm font-medium text-gray-300 mb-1">
                  Prénom
                </label>
                <input
                  type="text"
                  id="prenom"
                  name="prenom"
                  value={editedParent.prenom}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white"
                  placeholder="First Name"
                />
              </div>
              <div>
                <label htmlFor="nom" className="block text-sm font-medium text-gray-300 mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  id="nom"
                  name="nom"
                  value={editedParent.nom}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white"
                  placeholder="Last Name"
                />
              </div>
            </div>
            <div className="mb-4">
              <label htmlFor="adresse" className="block text-sm font-medium text-gray-300 mb-1">
                Adresse
              </label>
              <input
                type="text"
                id="adresse"
                name="adresse"
                value={editedParent.adresse}
                onChange={handleInputChange}
                className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white"
                placeholder="Address"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="mail" className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                id="mail"
                name="mail"
                value={editedParent.mail}
                onChange={handleInputChange}
                required
                className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white"
                placeholder="Email"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="numero" className="block text-sm font-medium text-gray-300 mb-1">
                Numéro
              </label>
              <input
                type="text"
                id="numero"
                name="numero"
                value={editedParent.numero}
                onChange={handleInputChange}
                required
                className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white"
                placeholder="Phone Number"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="relationship" className="block text-sm font-medium text-gray-300 mb-1">
                Relationship
              </label>
              <select
                id="relationship"
                name="relationship"
                value={editedParent.relationship}
                onChange={handleInputChange}
                className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white"
              >
                <option value="father">Father</option>
                <option value="mother">Mother</option>
                <option value="guardian">Guardian</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="mb-4 flex items-center">
              <input
                type="checkbox"
                id="is_emergency_contact"
                name="is_emergency_contact"
                checked={editedParent.is_emergency_contact}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 border-gray-700 rounded bg-[#273549]"
              />
              <label htmlFor="is_emergency_contact" className="ml-2 text-sm text-gray-300">
                Emergency Contact
              </label>
            </div>
            <div className="mb-6">
              <label htmlFor="profession" className="block text-sm font-medium text-gray-300 mb-1">
                Profession
              </label>
              <input
                type="text"
                id="profession"
                name="profession"
                value={editedParent.profession}
                onChange={handleInputChange}
                className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white"
                placeholder="Profession"
              />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white ${
                  isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// 3D Parent Card Component
function ParentCard({ parent, index, totalParents, onDelete, onEdit }) {
  return (
    <group position={[0, 0, 0]} rotation={[0, 0, 0]}>
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.8, 2.2, 0.1]} />
        <meshPhysicalMaterial
          color="#1e293b"
          metalness={0.9}
          roughness={0.1}
          transmission={0.5}
          thickness={0.5}
          envMapIntensity={1}
        />
      </mesh>
      <mesh position={[0, 0, 0.06]} castShadow>
        <planeGeometry args={[3.8, 2.2]} />
        <meshPhongMaterial color="#0f172a" opacity={0.7} transparent shininess={100} />
      </mesh>
      <mesh position={[-1.4, 0, 0.07]} castShadow>
        <planeGeometry args={[1, 1.5]} />
        <meshPhongMaterial
          color="#3b82f6"
          emissive="#1d4ed8"
          emissiveIntensity={0.2}
          transparent
          opacity={0.1}
        />
      </mesh>
      <Html position={[-1.4, 0, 0.08]} transform>
        <div className="w-[100px] h-[150px] rounded-lg overflow-hidden ring-2 ring-blue-500/30 flex items-center justify-center bg-gray-700">
          <span className="text-gray-400 text-sm">No Photo</span>
        </div>
      </Html>
      <Html position={[0.5, 0, 0.1]} transform scale={0.4} rotation={[0, 0, 0]}>
        <div className="w-[400px] text-white font-medium relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-xl" />
          <div className="relative">
            <h3 className="text-2xl mb-2 font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              {parent.prenom} {parent.nom}
            </h3>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-md text-xs backdrop-blur-sm">
                ID: {parent.id}
              </span>
              <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-md text-xs backdrop-blur-sm">
                Relationship: {parent.relationship.charAt(0).toUpperCase() + parent.relationship.slice(1)}
              </span>
              <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-md text-xs backdrop-blur-sm">
                Students: {parent.students.length}
              </span>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(parent);
                }}
                className="p-2 bg-green-500/20 border border-green-500/30 rounded-full hover:bg-green-500/30 transition-colors"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(parent.id);
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
        <div className="px-3 py-1 bg-gray-900/50 border border-gray-700/30 rounded-full backdrop-blur-sm text-gray-400 text-xs">
          {index + 1}/{totalParents}
        </div>
      </Html>
    </group>
  );
}

// Scene setup component
function ParentScene({ parents, currentPage, parentsPerPage, onDelete, onEdit }) {
  return (
    <Canvas shadows>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />
      <ambientLight intensity={0.3} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={0.8} castShadow />
      <pointLight position={[-10, -10, -10]} color="#3b82f6" intensity={0.5} />
      <Environment preset="night" />
      {parents.map((parent, index) => (
        <ParentCard
          key={parent.id}
          parent={parent}
          index={index + (currentPage - 1) * parentsPerPage}
          totalParents={parents.length}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 2.5}
        maxPolarAngle={Math.PI / 2.5}
        rotateSpeed={0.5}
      />
    </Canvas>
  );
}

// Floating Action Button Component
function FloatingActionButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-lg z-10 transition-transform hover:scale-110"
      aria-label="Add parent"
    >
      <Plus size={24} />
    </button>
  );
}

// Main Component
export default function ParentListPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRelationship, setSelectedRelationship] = useState("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [parents, setParents] = useState([]);
  const [parentToEdit, setParentToEdit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get("/api/parents/list/");
        setParents(Array.isArray(response.data) ? response.data : []);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to load data. Please try again.");
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddParent = (newParent) => {
    setParents((prev) => [...prev, newParent]);
    setIsAddModalOpen(false);
  };

  const handleEditParent = (updatedParent) => {
    setParents((prev) =>
      prev.map((p) => (p.id === updatedParent.id ? updatedParent : p))
    );
    setIsEditModalOpen(false);
    setParentToEdit(null);
  };

  const handleDelete = async (parentId) => {
    if (!window.confirm("Are you sure you want to delete this parent?")) {
      return;
    }

    try {
      await api.delete(`/api/parents/delete/${parentId}/`);
      setParents((prev) => prev.filter((p) => p.id !== parentId));
      setError(null);
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail || "Failed to delete parent. Please try again.";
      setError(errorMessage);
    }
  };

  const openEditModal = (parent) => {
    setParentToEdit(parent);
    setIsEditModalOpen(true);
  };

  const filteredParents = parents.filter((parent) => {
    const matchesSearch =
      searchQuery === "" ||
      parent.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      parent.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      parent.id.toString().includes(searchQuery);
    const matchesRelationship =
      selectedRelationship === "All" || parent.relationship === selectedRelationship;
    return matchesSearch && matchesRelationship;
  });

  const parentsPerPage = 1;
  const totalPages = Math.ceil(filteredParents.length / parentsPerPage);
  const currentParents = filteredParents.slice(
    (currentPage - 1) * parentsPerPage,
    currentPage * parentsPerPage
  );

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const relationshipOptions = [
    { value: "All", label: "All Relationships" },
    { value: "father", label: "Father" },
    { value: "mother", label: "Mother" },
    { value: "guardian", label: "Guardian" },
    { value: "other", label: "Other" },
  ];

  const handleViewDetails = (parentId) => {
    navigate(`/admin/parents/${parentId}`);
  };

  if (loading) return <div className="min-h-screen bg-[#111827] text-white p-6">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#111827] text-white" style={{ overflowY: "auto" }}>
      <header className="bg-[#1e293b] p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold">Parent Management</h1>
            <p className="text-sm text-gray-400">Manage all parent-related information</p>
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
              placeholder="Search parents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            className="bg-blue-600 p-2 rounded-full hover:bg-blue-700"
            onClick={() => setIsAddModalOpen(true)}
          >
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
          <h2 className="text-2xl font-bold">Parent Lists</h2>
          <div className="flex gap-3">
            <select
              className="bg-[#1e293b] border border-gray-700 rounded-lg px-3 py-2 text-sm"
              value={selectedRelationship}
              onChange={(e) => setSelectedRelationship(e.target.value)}
            >
              {relationshipOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
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

        {!isAddModalOpen && !isEditModalOpen && currentParents.length > 0 && (
          <div className="bg-[#1e293b] rounded-xl p-4 mb-6 h-[400px]">
            <ParentScene
              parents={currentParents}
              currentPage={currentPage}
              parentsPerPage={parentsPerPage}
              onDelete={handleDelete}
              onEdit={openEditModal}
            />
          </div>
        )}
        {!isAddModalOpen && !isEditModalOpen && currentParents.length === 0 && (
          <div className="bg-[#1e293b] rounded-xl p-4 mb-6 h-[400px] flex items-center justify-center">
            <p className="text-gray-400">No parents found matching your criteria</p>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-400">
            Showing {currentParents.length > 0 ? (currentPage - 1) * parentsPerPage + 1 : 0} to{" "}
            {Math.min(currentPage * parentsPerPage, filteredParents.length)} of{" "}
            {filteredParents.length} parents
          </div>
          <div className="flex gap-2">
            <button
              className={`p-2 rounded-lg ${
                currentPage === 1 ? "bg-gray-800 text-gray-500" : "bg-blue-600 hover:bg-blue-700"
              }`}
              onClick={prevPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="bg-[#1e293b] px-4 py-2 rounded-lg flex items-center">
              {currentPage} / {totalPages || 1}
            </div>
            <button
              className={`p-2 rounded-lg ${
                currentPage === totalPages || totalPages === 0
                  ? "bg-gray-800 text-gray-500"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
              onClick={nextPage}
              disabled={currentPage === totalPages || totalPages === 0}
            >
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Nom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Prénom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Numéro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Relationship
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Emergency Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Profession
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Adresse
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Number of Students
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredParents.map((parent) => (
                <tr key={parent.id} className="border-b border-gray-800 hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{parent.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{parent.nom}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{parent.prenom}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{parent.mail}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{parent.numero}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="px-2 py-1 bg-purple-500 rounded-md text-xs">
                      {parent.relationship.charAt(0).toUpperCase() + parent.relationship.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {parent.is_emergency_contact ? "Yes" : "No"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{parent.profession || "N/A"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{parent.adresse || "N/A"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{parent.students.length}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetails(parent.id)}
                        className="p-1 bg-blue-500 rounded-full hover:bg-blue-600"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(parent);
                        }}
                        className="p-1 bg-green-500 rounded-full hover:bg-green-600"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(parent.id);
                        }}
                        className="p-1 bg-red-500 rounded-full hover:bg-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <FloatingActionButton onClick={() => setIsAddModalOpen(true)} />
      <AddParentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddParent={handleAddParent}
      />
      <EditParentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onEditParent={handleEditParent}
        parent={parentToEdit || {}}
      />
    </div>
  );
}