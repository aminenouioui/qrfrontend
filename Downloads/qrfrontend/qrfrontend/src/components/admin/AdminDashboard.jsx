"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api"; // Adjust path: src/components/Dashboard.jsx to src/api.js
import {
  Users,
  GraduationCap,
  School,
  Search,
  Bell,
  Menu,
  TrendingUp,
  TrendingDown,
  User,
  Book,
  Bookmark,
  Settings,
  DoorClosed,
} from "lucide-react";

function Dashboard() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    students: { total: 0, increase: 0, icon: <Users className="h-6 w-6" />, color: "from-blue-500 to-blue-600" },
    teachers: { total: 0, increase: 0, icon: <GraduationCap className="h-6 w-6" />, color: "from-green-500 to-green-600" },
    rooms: { total: 0, increase: 0, icon: <School className="h-6 w-6" />, color: "from-purple-500 to-purple-600" },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/api/dashboard-stats/");
        setStats({
          students: {
            total: response.data.students.total,
            increase: response.data.students.increase,
            icon: <Users className="h-6 w-6" />,
            color: "from-blue-500 to-blue-600",
          },
          teachers: {
            total: response.data.teachers.total,
            increase: response.data.teachers.increase,
            icon: <GraduationCap className="h-6 w-6" />,
            color: "from-green-500 to-green-600",
          },
          rooms: {
            total: response.data.rooms.total,
            increase: response.data.rooms.increase,
            icon: <School className="h-6 w-6" />,
            color: "from-purple-500 to-purple-600",
          },
        });
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to load statistics");
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-gradient-to-br from-slate-800 to-slate-900 shadow-md dark:bg-slate-800 border-b border-slate-700">
        <div className="flex items-center justify-between p-4">
          <button onClick={() => setIsMenuOpen(true)} className="md:hidden text-gray-400 hover:text-white">
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex-1 px-4">
            <h1 className="text-2xl font-bold text-slate-100">Admin</h1>
            <p className="text-sm text-slate-400">Jason Statham</p>
          </div>

          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full hover:bg-slate-700 transition-colors">
              <Bell className="h-5 w-5 text-slate-300" />
            </button>
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
              JS
            </div>
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="flex-1 overflow-y-auto p-4 bg-gradient-to-br from-slate-800 to-slate-900">
        {/* Statistics Section */}
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-4 text-slate-100">School Statistics</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {Object.entries(stats).map(([key, stat]) => (
              <div
                key={key}
                className="relative overflow-hidden rounded-xl bg-white/5 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-white/10"
              >
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br opacity-20 blur-xl filter"></div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-slate-400 capitalize">{key}</p>
                    <h3 className="text-3xl font-bold mt-1">{stat.total.toLocaleString()}</h3>
                    <div className={`flex items-center mt-2 ${stat.increase >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {stat.increase >= 0 ? (
                        <TrendingUp className="h-4 w-4 mr-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 mr-1" />
                      )}
                      <span className="text-sm">
                        {Math.abs(stat.increase)}% {stat.increase >= 0 ? "increase" : "decrease"}
                      </span>
                    </div>
                  </div>
                  <div className={`rounded-lg bg-gradient-to-br ${stat.color} p-3 shadow-lg`}>{stat.icon}</div>
                </div>

                {/* Progress bar */}
                <div className="mt-4 h-1.5 w-full bg-slate-700/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${stat.color} rounded-full`}
                    style={{
                      width: `${Math.min(100, stat.total / (key === "students" ? 1500 : key === "teachers" ? 100 : 50))}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Access Cards */}
          <h2 className="text-xl font-bold mb-4 text-slate-100">Quick Access</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              { name: "students", icon: <Users className="h-8 w-8" />, color: "from-red-500 to-red-600", path: "/admin/students" },
              { name: "teachers", icon: <GraduationCap className="h-8 w-8" />, color: "from-green-500 to-green-600", path: "/admin/teachers" },
              { name: "parents", icon: <User className="h-8 w-8" />, color: "from-pink-500 to-pink-600" },
              { name: "level", icon: <Book className="h-8 w-8" />, color: "from-blue-500 to-blue-600", path: "/admin/level" },
              { name: "rooms", icon: <DoorClosed className="h-8 w-8" />, color: "from-amber-500 to-amber-600", path: "/admin/rooms" },
              { name: "subjects", icon: <Bookmark className="h-8 w-8" />, color: "from-violet-500 to-violet-600", path: "/admin/subjects" },
              { name: "settings", icon: <Settings className="h-8 w-8" />, color: "from-slate-500 to-slate-600" },
            ].map((item, index) => (
              <div
                key={index}
                className="relative overflow-hidden rounded-xl bg-white/5 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:cursor-pointer"
              >
                {item.path ? (
                  <Link to={item.path} className="block w-full h-full">
                    <div className="relative flex flex-col items-center">
                      <div className={`mb-4 rounded-xl bg-gradient-to-br ${item.color} p-3 shadow-lg`}>{item.icon}</div>
                      <h3 className="text-center font-medium capitalize text-slate-200">{item.name}</h3>
                    </div>
                  </Link>
                ) : (
                  <div className="relative flex flex-col items-center">
                    <div className={`mb-4 rounded-xl bg-gradient-to-br ${item.color} p-3 shadow-lg`}>{item.icon}</div>
                    <h3 className="text-center font-medium capitalize text-slate-200">{item.name}</h3>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;