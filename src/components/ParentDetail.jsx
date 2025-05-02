import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Phone, MapPin, User, Heart, Briefcase, Users, Eye } from "lucide-react";
import api from "./api";

const BASE_URL = "http://localhost:8000";

export default function ParentDetail() {
  const { id } = useParams();
  const [parent, setParent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchParent = async () => {
      try {
        const response = await api.get(`/api/parents/${id}/`);
        setParent(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching parent:", err);
        setError(err.response?.data?.detail || "Failed to load parent profile. Please try again.");
        setLoading(false);
      }
    };
    fetchParent();
  }, [id]);

  const handleStudentClick = (studentId) => {
    navigate(`/admin/studentdetail?id=${studentId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111827] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#111827] text-white flex items-center justify-center">
        <div className="text-red-500 p-4 bg-red-500/10 rounded-lg">{error}</div>
      </div>
    );
  }

  if (!parent) {
    return (
      <div className="min-h-screen bg-[#111827] text-white flex items-center justify-center">
        <div className="text-red-500 p-4 bg-red-500/10 rounded-lg">Parent not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111827] text-white">
      <header className="bg-[#1e293b] p-4 shadow-lg">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                className="p-2 bg-blue-600/30 border border-blue-600/50 rounded-full hover:bg-blue-600/50 transition-all duration-300 transform hover:scale-105"
                onClick={() => navigate("/admin/parents")}
                aria-label="Go back to parents list"
              >
                <ArrowLeft className="h-5 w-5 text-blue-400" />
              </button>
              <div>
                <nav className="text-sm text-gray-400 mb-1">
                  <span
                    className="hover:text-blue-400 cursor-pointer transition-colors"
                    onClick={() => navigate("/admin/parents")}
                  >
                    Parents
                  </span>{" "}
                  &gt; Parent Details
                </nav>
                <h1 className="text-2xl font-semibold text-white">Parent Details</h1>
                <p className="text-sm text-gray-300">
                  Details for {parent.prenom} {parent.nom}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <div className="bg-[#1e293b] rounded-xl p-6 mb-6 shadow-lg hover:shadow-xl transition-shadow duration-300 animate-fadeIn">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-[#0f172a] border-4 border-blue-500/30 relative z-10">
                <img
                  src={parent.photo ? `${BASE_URL}${parent.photo}` : "https://via.placeholder.com/128?text=No+Image"}
                  alt={`${parent.prenom} ${parent.nom}`}
                  className="w-full h-full object-cover"
                  onError={(e) => (e.target.src = "https://via.placeholder.com/128?text=No+Image")}
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-md -z-10"></div>
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-3">
                {parent.prenom} {parent.nom}
              </h2>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-md text-sm font-medium text-blue-300">
                  ID: {parent.id}
                </span>
                <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-md text-sm font-medium text-purple-300">
                  {parent.relationship.charAt(0).toUpperCase() + parent.relationship.slice(1) || "N/A"}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3 bg-[#0f172a] p-3 rounded-lg">
                  <div className="p-2 bg-blue-500/20 rounded-full">
                    <Mail className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="text-sm font-medium text-white">{parent.mail || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-[#0f172a] p-3 rounded-lg">
                  <div className="p-2 bg-green-500/20 rounded-full">
                    <Phone className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Phone</p>
                    <p className="text-sm font-medium text-white">{parent.numero || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-[#0f172a] p-3 rounded-lg">
                  <div className="p-2 bg-red-500/20 rounded-full">
                    <MapPin className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Address</p>
                    <p className="text-sm font-medium text-white truncate" title={parent.adresse}>
                      {parent.adresse || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-[#0f172a] p-3 rounded-lg">
                  <div className="p-2 bg-yellow-500/20 rounded-full">
                    <Heart className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Emergency Contact</p>
                    <p className="text-sm font-medium text-white">
                      {parent.is_emergency_contact ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#1e293b] rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-full">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Associated Students</h3>
            </div>
            <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-md text-sm font-medium text-blue-300">
              {parent.students.length} {parent.students.length === 1 ? "Student" : "Students"}
            </span>
          </div>
          {parent.students && parent.students.length > 0 ? (
            <div className="grid gap-4">
              {parent.students.map((student) => (
                <div
                  key={student.id}
                  className="bg-[#0f172a] rounded-xl p-5 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 shadow-md hover:shadow-lg animate-fadeIn"
                >
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-[#0f172a] border-2 border-blue-500/30">
                        <img
                          src={student.photo ? `${BASE_URL}${student.photo}` : "https://via.placeholder.com/64?text=No+Image"}
                          alt={`${student.prenom} ${student.nom}`}
                          className="w-full h-full object-cover"
                          onError={(e) => (e.target.src = "https://via.placeholder.com/64?text=No+Image")}
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-md -z-10"></div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-white">
                        {student.prenom} {student.nom}
                      </h4>
                      <div className="flex flex-wrap gap-2 mt-1 mb-3">
                        <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded-md text-xs font-medium text-blue-300">
                          ID: {student.id}
                        </span>
                        <span className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded-md text-xs font-medium text-purple-300">
                          Level: {student.level || "N/A"}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-blue-500/20 rounded-full">
                            <Mail className="h-4 w-4 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Email</p>
                            <p className="text-sm text-white truncate" title={student.mail}>
                              {student.mail || "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-green-500/20 rounded-full">
                            <Phone className="h-4 w-4 text-green-400" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Phone</p>
                            <p className="text-sm text-white">{student.numero || "N/A"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-red-500/20 rounded-full">
                            <MapPin className="h-4 w-4 text-red-400" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Address</p>
                            <p className="text-sm text-white truncate" title={student.adresse}>
                              {student.adresse || "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleStudentClick(student.id)}
                      className="px-4 py-2 bg-blue-600/20 border border-blue-600/50 rounded-lg hover:bg-blue-600/40 transition-colors flex items-center gap-2"
                      aria-label={`View details for ${student.prenom} ${student.nom}`}
                    >
                      <Eye className="h-4 w-4 text-blue-400" />
                      <span className="text-sm font-medium">View Details</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#0f172a] rounded-xl p-5 text-center text-gray-400 shadow-md">
              No students associated with this parent.
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}