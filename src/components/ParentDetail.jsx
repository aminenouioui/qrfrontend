import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, UserRound } from "lucide-react";
import api from "./api";

export default function ParentDetail() {
  const { id } = useParams();
  const [parent, setParent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchParent = async () => {
      try {
        const response = await api.get(`/api/parents/${id}/`); // Adjust endpoint
        setParent(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching parent:", err);
        setError("Failed to load parent profile. Please try again.");
        setLoading(false);
      }
    };
    fetchParent();
    console.log('ParentDetail rendered at:', window.location.pathname);
  }, [id]);

  if (loading) {
    return <div className="min-h-screen bg-[#111827] text-white p-6">Loading...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#111827] text-white p-6">
        <div className="bg-red-600/20 border border-red-600/30 p-4 rounded-lg text-red-400">
          {error}
        </div>
      </div>
    );
  }

  if (!parent) {
    return (
      <div className="min-h-screen bg-[#111827] text-white p-6">
        <div className="bg-[#1e293b] rounded-xl p-8 text-center text-gray-400">
          <p className="text-lg">Parent not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111827] text-white">
      <header className="bg-[#1e293b] p-4">
        <div className="container mx-auto">
          <div className="flex items-center gap-3">
            <button
              className="bg-blue-600/20 border border-blue-600/30 p-2 rounded-lg hover:bg-blue-600/30 transition-colors"
              onClick={() => navigate("/admin/parents")}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Parent Profile</h1>
              <p className="text-sm text-gray-400">Details for {parent.name}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <div className="bg-[#1e293b] rounded-xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <UserRound className="h-12 w-12 text-blue-400" />
            <div>
              <h2 className="text-2xl font-bold">{parent.name}</h2>
              <p className="text-gray-400">Parent ID: {parent.id}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">Email</p>
              <p className="text-white">{parent.email || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Phone</p>
              <p className="text-white">{parent.phone || "N/A"}</p>
            </div>
            {/* Add more fields as needed */}
          </div>
        </div>
      </main>
    </div>
  );
}