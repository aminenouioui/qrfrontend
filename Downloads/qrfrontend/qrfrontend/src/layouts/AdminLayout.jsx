import { useState } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom"; // Add useNavigate
import axios from "axios"; // Import axios
import {
  Users,
  GraduationCap,
  UserRound,
  BookOpen,
  School,
  Settings,
  LogOut,
  Menu,
  DoorClosed,
  BookMarked, // Added missing BookMarked icon
} from "lucide-react";

const AdminLayout = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate(); // Hook for navigation

  // Logout handler
  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        await axios.post("http://localhost:8000/auth/logout/", {
          refresh: refreshToken,
        });
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      // Clear authentication tokens from localStorage
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("username");

      // Redirect to admin login page
      navigate("/admin/login");
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 transform ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0 transition duration-200 ease-in-out md:flex md:w-64 bg-slate-900 shadow-xl z-30`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-500 text-white p-2 rounded-md">
                <School className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold">SCHOOL</span>
            </div>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="md:hidden text-gray-400 hover:text-white"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-3">
              {[
                { name: "Home", icon: <School className="h-5 w-5" />, path: "/admin/dashboard" },
                { name: "Students", icon: <Users className="h-5 w-5" />, path: "/admin/students" },
                { name: "Teachers", icon: <GraduationCap className="h-5 w-5" />, path: "/admin/teachers" },
                { name: "Parents", icon: <UserRound className="h-5 w-5" />, path: "/admin/parents" },
                { name: "Levels", icon: <BookOpen className="h-5 w-5" />, path: "/admin/level" },
                { name: "Rooms", icon: <DoorClosed className="h-5 w-5" />, path: "/admin/rooms" },
                { name: "Subjects", icon: <BookMarked className="h-5 w-5" />, path: "/admin/subjects" },
                { name: "Settings", icon: <Settings className="h-5 w-5" />, path: "/admin/settings" },
              ].map((item, index) => (
                <li key={index}>
                  <Link
                    to={item.path || "#"}
                    className="flex items-center px-4 py-3 text-gray-300 hover:bg-slate-800 rounded-lg transition-all duration-200 group"
                  >
                    <span className="inline-flex items-center justify-center h-9 w-9 text-sm font-semibold rounded-lg bg-slate-800 group-hover:bg-slate-700 group-hover:text-white transition-all duration-200">
                      {item.icon}
                    </span>
                    <span className="ml-3 font-medium">{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="p-4 border-t border-slate-700">
            <button
              onClick={handleLogout} // Reference the defined handleLogout function
              className="flex items-center px-4 py-3 text-gray-300 hover:bg-slate-800 rounded-lg transition-all duration-200 group w-full text-left"
            >
              <span className="inline-flex items-center justify-center h-9 w-9 text-sm font-semibold rounded-lg bg-slate-800 group-hover:bg-red-600 transition-all duration-200">
                <LogOut className="h-5 w-5" />
              </span>
              <span className="ml-3 font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;