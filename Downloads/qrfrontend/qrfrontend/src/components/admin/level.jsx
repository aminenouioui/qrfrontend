"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Search, Plus, Trash2, X, Save, AlertCircle } from "lucide-react";
import api from "../api"; // Adjust path: src/components/Levels.jsx to src/api.js

export default function Levels() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [isAddingLevel, setIsAddingLevel] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [levelsData, setLevelsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    level: "", // Only `level` is needed per LevelSerializer
  });

  // Fetch levels from the backend
  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const response = await api.get("/api/levels/list/");
        console.log("API Response from levels:", response.data);
        setLevelsData(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching levels:", err);
        setError(err.response?.data?.detail || "Failed to load levels. Please try again later.");
        setLevelsData([]);
        setLoading(false);
      }
    };
    fetchLevels();
  }, []);

  // Filter levels based on search
  const filteredLevels = levelsData.filter(
    (level) => searchQuery === "" || level.level.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Initialize form for adding a new level
  const handleAddLevel = () => {
    setFormData({
      level: "",
    });
    setIsAddingLevel(true);
    setShowDeleteConfirm(false);
    setSelectedLevel(null);
    setError(null);
  };

  // Save a new level
  const handleSaveNewLevel = async () => {
    try {
      const response = await api.post("/api/levels/add/", formData);
      setLevelsData([...levelsData, response.data]);
      setIsAddingLevel(false);
      setFormData({ level: "" });
      setError(null);
    } catch (err) {
      console.error("Error adding level:", err);
      setError(err.response?.data?.level?.[0] || "Failed to add level. Please try again.");
    }
  };

  // Delete a level
  const handleDeleteLevel = async () => {
    if (!selectedLevel) return;
    try {
      await api.delete(`/api/levels/delete/${selectedLevel.id}/`);
      setLevelsData(levelsData.filter((level) => level.id !== selectedLevel.id));
      setShowDeleteConfirm(false);
      setSelectedLevel(null);
      setError(null);
    } catch (err) {
      console.error("Error deleting level:", err);
      setError(err.response?.data?.detail || "Failed to delete level.");
    }
  };

  // Cancel form
  const handleCancelForm = () => {
    setIsAddingLevel(false);
    setShowDeleteConfirm(false);
    setError(null);
  };

  if (loading) {
    return <div className="min-h-screen bg-[#111827] text-white p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#111827] text-white">
      {/* Header */}
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
              <h1 className="text-xl font-bold">Academic Levels</h1>
              <p className="text-sm text-gray-400">Manage educational levels</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-6">
        {/* Error Display */}
        {error && (
          <div className="bg-red-600/20 border border-red-600/30 p-4 rounded-lg mb-6 text-red-400">
            {error}
          </div>
        )}

        {/* Top Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="relative w-full md:w-auto">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="bg-[#1e293b] pl-10 pr-4 py-2 rounded-lg text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search levels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 ml-auto md:ml-0"
            onClick={handleAddLevel}
          >
            <Plus className="h-4 w-4" />
            <span>Add Level</span>
          </button>
        </div>

        {/* Levels Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          {filteredLevels.map((level) => (
            <div
              key={level.id}
              className="bg-[#1e293b] rounded-xl p-4 hover:bg-[#172033] transition-colors cursor-pointer"
              onClick={() => setSelectedLevel(level)}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">{level.level}</h3>
                <div className="flex gap-2">
                  <button
                    className="p-2 text-red-400 hover:bg-red-400/10 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLevel(level);
                      setShowDeleteConfirm(true);
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredLevels.length === 0 && (
          <div className="bg-[#1e293b] rounded-xl p-8 text-center text-gray-400">
            <p className="text-lg mb-2">No levels found</p>
            <p className="text-sm">Try adjusting your search or add a new level</p>
          </div>
        )}

        {/* Add Level Form */}
        {isAddingLevel && (
          <div className="bg-[#1e293b] rounded-xl overflow-hidden mt-6">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="font-medium text-lg">Add New Level</h3>
              <button className="p-2 text-gray-400 hover:text-white" onClick={handleCancelForm}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4">
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">Level Name</label>
                <input
                  type="text"
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                  placeholder="e.g. 1ere, 2eme"
                  required
                />
              </div>

              <div className="flex justify-end gap-3">
                <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg" onClick={handleCancelForm}>
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2"
                  onClick={handleSaveNewLevel}
                >
                  <Save className="h-4 w-4" />
                  <span>Add Level</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {showDeleteConfirm && selectedLevel && (
          <div className="bg-[#1e293b] rounded-xl overflow-hidden mt-6">
            <div className="p-4 border-b border-gray-800 flex items-center gap-3 text-yellow-400">
              <AlertCircle className="h-5 w-5" />
              <h3 className="font-medium">Confirm Deletion</h3>
            </div>

            <div className="p-4">
              <p className="mb-4">
                Are you sure you want to delete the level <strong>{selectedLevel.level}</strong>? This action cannot be
                undone.
              </p>

              <div className="flex justify-end gap-3">
                <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg" onClick={handleCancelForm}>
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2"
                  onClick={handleDeleteLevel}
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Level</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}