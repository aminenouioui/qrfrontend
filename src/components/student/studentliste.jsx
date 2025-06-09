import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Search, Plus, Filter, ChevronLeft, ChevronRight, Download, Trash2, Edit, Eye, X, Upload, Printer } from "lucide-react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment, Html } from "@react-three/drei";
import { useNavigate } from "react-router-dom";
import api from "../api";

// Optional: For table virtualization (uncomment if needed)
// import { FixedSizeList as List } from "react-window";

// Custom debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// Add Student Modal Component (unchanged)
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
    parent_id: "",
    parent_nom: "",
    parent_prenom: "",
    parent_adresse: "",
    parent_mail: "",
    parent_numero: "",
    parent_relationship: "Guardian", // Match backend enum
    parent_is_emergency_contact: true,
    parent_profession: "",
  });
  const [parents, setParents] = useState([]);
  const [useExistingParent, setUseExistingParent] = useState(true);
  const [previewUrl, setPreviewUrl] = useState("/media/placeholder.svg");
  const fileInputRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const fetchParents = async () => {
        try {
          const response = await api.get("/api/parents/list/");
          setParents(Array.isArray(response.data) ? response.data : []);
          if (response.data.length > 0) {
            setNewStudent((prev) => ({ ...prev, parent_id: response.data[0].id }));
          }
        } catch (err) {
          setError("Failed to load parents.");
        }
      };
      fetchParents();
    }
  }, [isOpen]);

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
        parent_id: parents[0]?.id || "",
        parent_nom: "",
        parent_prenom: "",
        parent_adresse: "",
        parent_mail: "",
        parent_numero: "",
        parent_relationship: "Guardian",
        parent_is_emergency_contact: true,
        parent_profession: "",
      });
      setPreviewUrl("/media/placeholder.svg");
      setError(null);
      setUseExistingParent(true);
    }
  }, [isOpen, levels, parents]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewStudent({
      ...newStudent,
      [name]: type === "checkbox" ? checked : value,
    });
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
    // Student fields
    formData.append("nom", newStudent.nom);
    formData.append("prenom", newStudent.prenom);
    formData.append("date_naissance", newStudent.date_naissance);
    formData.append("level", newStudent.level);
    formData.append("adresse", newStudent.adresse || "");
    formData.append("mail", newStudent.mail);
    formData.append("numero", newStudent.numero);
    formData.append("admission_s", newStudent.admission_s);
    if (newStudent.photo) {
      formData.append("photo", newStudent.photo);
    }
    // Parent fields
    if (useExistingParent && newStudent.parent_id) {
      formData.append("parent_id", newStudent.parent_id);
    } else {
      formData.append("parent_nom", newStudent.parent_nom);
      formData.append("parent_prenom", newStudent.parent_prenom);
      formData.append("parent_adresse", newStudent.parent_adresse || "");
      formData.append("parent_mail", newStudent.parent_mail);
      formData.append("parent_numero", newStudent.parent_numero);
      formData.append("parent_relationship", newStudent.parent_relationship);
      formData.append("parent_is_emergency_contact", newStudent.parent_is_emergency_contact.toString());
      formData.append("parent_profession", newStudent.parent_profession || "");
    }

    try {
      const response = await api.post("/api/register-student-parent/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onAddStudent(response.data.student);
      onClose();
    } catch (err) {
      // Improved error handling
      const errorData = err.response?.data?.errors || {};
      let errorMessage = "Failed to add student.";
      if (Object.keys(errorData).length > 0) {
        errorMessage = Object.entries(errorData)
          .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(", ") : errors}`)
          .join("; ");
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      setError(errorMessage);
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
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => (e.target.src = "/media/placeholder.svg")}
                  />
                </div>
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
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="prenom" className="block text-sm font-medium text-gray-300 mb-1">Prénom</label>
                <input
                  type="text"
                  id="prenom"
                  name="prenom"
                  value={newStudent.prenom}
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
                  value={newStudent.nom}
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
                value={newStudent.date_naissance}
                onChange={handleInputChange}
                required
                className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="adresse" className="block text-sm font-medium text-gray-300 mb-1">Adresse</label>
              <input
                type="text"
                id="adresse"
                name="adresse"
                value={newStudent.adresse}
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
                value={newStudent.mail}
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
                value={newStudent.numero}
                onChange={handleInputChange}
                required
                className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white"
                placeholder="Phone Number"
              />
            </div>
            <div className="mb-6">
              <label htmlFor="level" className="block text-sm font-medium text-gray-300 mb-1">Level</label>
              <select
                id="level"
                name="level"
                value={newStudent.level}
                onChange={handleInputChange}
                required
                className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white"
              >
                <option value="">Select a level</option>
                {levels.map((level) => (
                  <option key={level.id} value={level.id}>{level.level}</option>
                ))}
              </select>
            </div>
            <div className="mb-6">
              <label htmlFor="admission_s" className="block text-sm font-medium text-gray-300 mb-1">Admission Status</label>
              <select
                id="admission_s"
                name="admission_s"
                value={newStudent.admission_s}
                onChange={handleInputChange}
                className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white"
              >
                <option value="att">En Attente</option>
                <option value="acc">Accepté</option>
                <option value="ref">Refusé</option>
              </select>
            </div>
            <h3 className="text-lg font-semibold text-gray-300 mb-4">Parent Information</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">Parent Selection</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="parent_selection"
                    checked={useExistingParent}
                    onChange={() => setUseExistingParent(true)}
                    className="mr-2"
                  />
                  Use Existing Parent
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="parent_selection"
                    checked={!useExistingParent}
                    onChange={() => setUseExistingParent(false)}
                    className="mr-2"
                  />
                  Add New Parent
                </label>
              </div>
            </div>
            {useExistingParent ? (
              <div className="mb-4">
                <label htmlFor="parent_id" className="block text-sm font-medium text-gray-300 mb-1">Select Parent</label>
                <select
                  id="parent_id"
                  name="parent_id"
                  value={newStudent.parent_id}
                  onChange={handleInputChange}
                  required={useExistingParent}
                  className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="">Select a parent</option>
                  {parents.map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.prenom} {parent.nom} ({parent.mail})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="parent_prenom" className="block text-sm font-medium text-gray-300 mb-1">Parent Prénom</label>
                    <input
                      type="text"
                      id="parent_prenom"
                      name="parent_prenom"
                      value={newStudent.parent_prenom}
                      onChange={handleInputChange}
                      required={!useExistingParent}
                      className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white"
                      placeholder="Parent First Name"
                    />
                  </div>
                  <div>
                    <label htmlFor="parent_nom" className="block text-sm font-medium text-gray-300 mb-1">Parent Nom</label>
                    <input
                      type="text"
                      id="parent_nom"
                      name="parent_nom"
                      value={newStudent.parent_nom}
                      onChange={handleInputChange}
                      required={!useExistingParent}
                      className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white"
                      placeholder="Parent Last Name"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label htmlFor="parent_adresse" className="block text-sm font-medium text-gray-300 mb-1">Parent Adresse</label>
                  <input
                    type="text"
                    id="parent_adresse"
                    name="parent_adresse"
                    value={newStudent.parent_adresse}
                    onChange={handleInputChange}
                    className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white"
                    placeholder="Parent Address"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="parent_mail" className="block text-sm font-medium text-gray-300 mb-1">Parent Email</label>
                  <input
                    type="email"
                    id="parent_mail"
                    name="parent_mail"
                    value={newStudent.parent_mail}
                    onChange={handleInputChange}
                    required={!useExistingParent}
                    className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white"
                    placeholder="Parent Email"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="parent_numero" className="block text-sm font-medium text-gray-300 mb-1">Parent Numéro</label>
                  <input
                    type="text"
                    id="parent_numero"
                    name="parent_numero"
                    value={newStudent.parent_numero}
                    onChange={handleInputChange}
                    required={!useExistingParent}
                    className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white"
                    placeholder="Parent Phone Number"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="parent_relationship" className="block text-sm font-medium text-gray-300 mb-1">Parent Relationship</label>
                  <select
                    id="parent_relationship"
                    name="parent_relationship"
                    value={newStudent.parent_relationship}
                    onChange={handleInputChange}
                    required={!useExistingParent}
                    className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="mb-4 flex items-center">
                  <input
                    type="checkbox"
                    id="parent_is_emergency_contact"
                    name="parent_is_emergency_contact"
                    checked={newStudent.parent_is_emergency_contact}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 border-gray-700 rounded bg-[#273549]"
                  />
                  <label htmlFor="parent_is_emergency_contact" className="ml-2 text-sm text-gray-300">Emergency Contact</label>
                </div>
                <div className="mb-6">
                  <label htmlFor="parent_profession" className="block text-sm font-medium text-gray-300 mb-1">Parent Profession</label>
                  <input
                    type="text"
                    id="parent_profession"
                    name="parent_profession"
                    value={newStudent.parent_profession}
                    onChange={handleInputChange}
                    className="w-full bg-[#273549] border border-gray-700 rounded-lg px-3 py-2 text-white"
                    placeholder="Parent Profession"
                  />
                </div>
              </>
            )}
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
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
              >
                Add Student
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Edit Student Modal Component (unchanged)
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

// 3D Student Card Component (optimized)
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
      <Html position={[0.5, 0, 0.1]} transform scale={0.4}>
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
              <button onClick={() => onEdit(student)} className="p-2 bg-green-500/20 border border-green-500/30 rounded-full hover:bg-green-500/30 transition-colors">
                <Edit size={16} />
              </button>
              <button onClick={() => onDelete(student.id)} className="p-2 bg-red-500/20 border border-red-500/30 rounded-full hover:bg-red-500/30 transition-colors">
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

// Scene setup component (unchanged)
function StudentScene({ students, currentPage, studentsPerPage, onDelete, onEdit, levels }) {
  return (
    <Canvas shadows>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />
      <ambientLight intensity={0.3} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={0.8} castShadow />
      <pointLight position={[-10, -10, -10]} color="#3b82f6" intensity={0.5} />
      <Environment preset="night" />
      {students.map((student, index) => (
        <StudentCard
          key={student.id}
          student={student}
          index={index + (currentPage - 1) * studentsPerPage}
          totalStudents={students.length}
          onDelete={onDelete}
          onEdit={onEdit}
          levels={levels}
        />
      ))}
      <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 2.5} maxPolarAngle={Math.PI / 2.5} rotateSpeed={0.5} />
    </Canvas>
  );
}

// Floating Action Button Component (unchanged)
function FloatingActionButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-lg z-10 transition-transform hover:scale-110"
      aria-label="Add student"
    >
      <Plus size={24} />
    </button>
  );
}

// Main Component
export default function StudentList() {
  const PLACEHOLDER_IMAGE = "/media/placeholder.svg";
  const [currentPage, setCurrentPage] = useState(1);
  const [tablePage, setTablePage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [levels, setLevels] = useState([]);
  const [studentToEdit, setStudentToEdit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const tableRowsPerPage = 10;

  useEffect(() => {
    console.log("Students count:", students.length, "Levels count:", levels.length); // Debug data size
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

  const handleAddStudent = useCallback((newStudent) => {
    setStudents((prev) => [...prev, newStudent]);
    setIsAddModalOpen(false);
  }, []);

  const handleEditStudent = useCallback((updatedStudent) => {
    setStudents((prev) => prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s)));
    setIsEditModalOpen(false);
    setStudentToEdit(null);
  }, []);

  const handleDelete = useCallback(async (studentId) => {
    try {
      await api.delete(`/api/students/delete/${studentId}/`);
      setStudents((prev) => prev.filter((s) => s.id !== studentId));
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete student.");
    }
  }, []);

  const openEditModal = useCallback((student) => {
    setStudentToEdit({ ...student });
    setIsEditModalOpen(true);
  }, []);

  const filteredStudents = useMemo(() => {
    console.log("Filtering students..."); // Debug filtering performance
    return students.filter((student) => {
      const matchesSearch =
        debouncedSearchQuery === "" ||
        student.nom.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        student.prenom.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        student.id.toString().includes(debouncedSearchQuery);
      const matchesLevel = selectedLevel === "All" || student.level === parseInt(selectedLevel);
      return matchesSearch && matchesLevel;
    });
  }, [students, debouncedSearchQuery, selectedLevel]);

  const studentsPerPage = 1;
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const currentStudents = filteredStudents.slice(
    (currentPage - 1) * studentsPerPage,
    currentPage * studentsPerPage
  );

  const totalTablePages = Math.ceil(filteredStudents.length / tableRowsPerPage);
  const currentTableStudents = filteredStudents.slice(
    (tablePage - 1) * tableRowsPerPage,
    tablePage * tableRowsPerPage
  );

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  }, [currentPage, totalPages]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  }, [currentPage]);

  const nextTablePage = useCallback(() => {
    if (tablePage < totalTablePages) setTablePage(tablePage + 1);
  }, [tablePage, totalTablePages]);

  const prevTablePage = useCallback(() => {
    if (tablePage > 1) setTablePage(tablePage - 1);
  }, [tablePage]);

  const levelOptions = useMemo(() => [{ id: "All", level: "All Levels" }, ...levels], [levels]);

  const handleViewDetails = useCallback((studentId) => {
    navigate(`/admin/studentdetail?id=${studentId}`);
  }, [navigate]);

  const exportToCSV = useCallback(async () => {
    if (filteredStudents.length === 0) {
      setError("No students to export.");
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      const levelValue = selectedLevel === "All" ? "All" : levels.find((l) => l.id === parseInt(selectedLevel))?.level || "All";
      const response = await api.get("/api/export/students/", {
        params: {
          level: levelValue,
          search: debouncedSearchQuery,
        },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: "text/csv;charset=utf-8;" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `students_level_${levelValue}_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setError("Students exported successfully!");
      setTimeout(() => setError(null), 2000);
    } catch (error) {
      console.error("Export error:", error);
      setError(`Failed to export students: ${error.response?.data?.error || error.message}`);
      setTimeout(() => setError(null), 3000);
    }
  }, [filteredStudents, selectedLevel, debouncedSearchQuery, levels]);

  const printStudentList = useCallback(() => {
    if (filteredStudents.length === 0) {
      setError("No students to print.");
      setTimeout(() => setError(null), 3000);
      return;
    }

    const printWindow = window.open("", "_blank");
    const levelName = selectedLevel === "All" ? "All Levels" : levels.find((l) => l.id === parseInt(selectedLevel))?.level || "Unknown";

    // Use a template to avoid heavy string concatenation
    const rows = filteredStudents
      .map(
        (student) => `
          <tr>
            <td>${student.id}</td>
            <td>${
              student.photo
                ? `<img src="${student.photo}" alt="${student.prenom} ${student.nom}" onerror="this.style.display='none';this.nextSibling.style.display='inline-block';" /><span class="no-photo" style="display:none;"></span>`
                : `<span class="no-photo"></span>`
            }</td>
            <td>${student.nom}</td>
            <td>${student.prenom}</td>
            <td>${levels.find((l) => l.id === student.level)?.level || "Unknown"}</td>
            <td>${student.mail}</td>
            <td>${student.date_naissance || "N/A"}</td>
            <td>${student.numero}</td>
            <td>${
              student.admission_s === "att" ? "En Attente" : student.admission_s === "acc" ? "Accepté" : "Refusé"
            }</td>
            <td>${student.adresse || "N/A"}</td>
          </tr>
        `
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Student List - ${levelName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #000; }
            h1 { text-align: center; font-size: 24px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; font-size: 14px; }
            th { background-color: #f2f2f2; font-weight: bold; text-transform: uppercase; }
            img { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
            .no-photo { width: 40px; height: 40px; background-color: #ccc; border-radius: 50%; display: inline-block; }
            @media print {
              body { margin: 0; padding: 10mm; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
            }
          </style>
        </head>
        <body>
          <h1>Student List - ${levelName}</h1>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Photo</th>
                <th>Nom</th>
                <th>Prénom</th>
                <th>Level</th>
                <th>Email</th>
                <th>Date de Naissance</th>
                <th>Numéro</th>
                <th>Admission</th>
                <th>Adresse</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 500);
  }, [filteredStudents, selectedLevel, levels]);

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
            <input
              type="text"
              className="bg-[#273549] pl-10 pr-4 py-2 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search students..."
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
        {error && (
          <div
            className={`p-4 rounded-lg mb-6 flex items-center gap-2 ${
              error.includes("exported successfully")
                ? "bg-green-600/20 border-green-600/30 text-green-400"
                : "bg-red-600/20 border-red-600/30 text-red-400"
            }`}
          >
            {error.includes("exported successfully") ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <X className="h-5 w-5" />
            )}
            <span>{error}</span>
          </div>
        )}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Student Lists</h2>
          <div className="flex gap-3">
            <select
              className="bg-[#1e293b] border border-gray-700 rounded-lg px-3 py-2 text-sm"
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
            >
              {levelOptions.map((level) => (
                <option key={level.id} value={level.id}>{level.level}</option>
              ))}
            </select>
            <button className="bg-[#1e293b] border border-gray-700 rounded-lg px-3 py-2 text-sm flex items-center gap-2">
              <Filter className="h-4 w-4" /> <span>Filter</span>
            </button>
            <button
              className="bg-blue-600 hover:bg-blue-700 rounded-lg px-3 py-2 text-sm flex items-center gap-2"
              onClick={printStudentList}
            >
              <Printer className="h-4 w-4" /> <span>Print</span>
            </button>
            <button
              className="bg-blue-600 hover:bg-blue-700 rounded-lg px-3 py-2 text-sm flex items-center gap-2"
              onClick={exportToCSV}
            >
              <Download className="h-4 w-4" /> <span>Export</span>
            </button>
          </div>
        </div>

        {!isAddModalOpen && !isEditModalOpen && currentStudents.length > 0 && (
          <div className="bg-[#1e293b] rounded-xl p-4 mb-6 h-[400px]">
            <StudentScene
              students={currentStudents}
              currentPage={currentPage}
              studentsPerPage={studentsPerPage}
              onDelete={handleDelete}
              onEdit={openEditModal}
              levels={levels}
            />
          </div>
        )}
        {!isAddModalOpen && !isEditModalOpen && currentStudents.length === 0 && (
          <div className="bg-[#1e293b] rounded-xl p-4 mb-6 h-[400px] flex items-center justify-center">
            <p className="text-gray-400">No students found matching your criteria</p>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-400">
            Showing {currentStudents.length > 0 ? (currentPage - 1) * studentsPerPage + 1 : 0} to{" "}
            {Math.min(currentPage * studentsPerPage, filteredStudents.length)} of {filteredStudents.length} students
          </div>
          <div className="flex gap-2">
            <button
              className={`p-2 rounded-lg ${currentPage === 1 ? "bg-gray-800 text-gray-500" : "bg-blue-600 hover:bg-blue-700"}`}
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
                currentPage === totalPages || totalPages === 0 ? "bg-gray-800 text-gray-500" : "bg-blue-600 hover:bg-blue-700"
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
              {/* Optional: Virtualized table (uncomment to use react-window)
              <List
                height={400}
                itemCount={filteredStudents.length}
                itemSize={60}
                width="100%"
              >
                {({ index, style }) => {
                  const student = filteredStudents[index];
                  const levelName = levels.find((l) => l.id === student.level)?.level || "Unknown";
                  return (
                    <tr key={student.id} style={style} className="border-b border-gray-800 hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{student.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <img src={student.photo || PLACEHOLDER_IMAGE} alt={`${student.prenom} ${student.nom}`} className="h-10 w-10 rounded-full object-cover" onError={(e) => (e.target.src = PLACEHOLDER_IMAGE)} />
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
                          <button onClick={() => openEditModal(student)} className="p-1 bg-green-500 rounded-full hover:bg-green-600">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDelete(student.id)} className="p-1 bg-red-500 rounded-full hover:bg-red-600">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }}
              </List>
              */}
              {currentTableStudents.map((student) => {
                const levelName = levels.find((l) => l.id === student.level)?.level || "Unknown";
                return (
                  <tr key={student.id} className="border-b border-gray-800 hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{student.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <img
                        src={student.photo || PLACEHOLDER_IMAGE}
                        alt={`${student.prenom} ${student.nom}`}
                        className="h-10 w-10 rounded-full object-cover"
                        onError={(e) => (e.target.src = PLACEHOLDER_IMAGE)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{student.nom}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{student.prenom}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-purple-500 rounded-md text-xs">{levelName}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{student.mail}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{student.date_naissance || "N/A"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{student.numero}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{student.admission_s}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{student.adresse}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetails(student.id)}
                          className="p-1 bg-blue-500 rounded-full hover:bg-blue-600"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => openEditModal(student)}
                          className="p-1 bg-green-500 rounded-full hover:bg-green-600"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(student.id)}
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
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-400">
            Showing {currentTableStudents.length > 0 ? (tablePage - 1) * tableRowsPerPage + 1 : 0} to{" "}
            {Math.min(tablePage * tableRowsPerPage, filteredStudents.length)} of {filteredStudents.length} students
          </div>
          <div className="flex gap-2">
            <button
              className={`p-2 rounded-lg ${tablePage === 1 ? "bg-gray-800 text-gray-500" : "bg-blue-600 hover:bg-blue-700"}`}
              onClick={prevTablePage}
              disabled={tablePage === 1}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="bg-[#1e293b] px-4 py-2 rounded-lg flex items-center">
              {tablePage} / {totalTablePages || 1}
            </div>
            <button
              className={`p-2 rounded-lg ${
                tablePage === totalTablePages || totalTablePages === 0 ? "bg-gray-800 text-gray-500" : "bg-blue-600 hover:bg-blue-700"
              }`}
              onClick={nextTablePage}
              disabled={tablePage === totalTablePages || totalTablePages === 0}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <FloatingActionButton onClick={() => setIsAddModalOpen(true)} />
      <AddStudentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddStudent={handleAddStudent}
        levels={levels}
      />
      <EditStudentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onEditStudent={handleEditStudent}
        student={studentToEdit || {}}
        levels={levels}
      />
    </div>
  );
}