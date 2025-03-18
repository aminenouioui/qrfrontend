"use client"

import { useState } from "react"
import {
  Users,
  GraduationCap,
  UserRound,
  BookOpen,
  School,
  FileText,
  BookMarked,
  Award,
  CalendarCheck,
  Settings,
  LogOut,
  Search,
  Bell,
  Menu,
  ListChecks,
  ClipboardList,
  Clock,
  UserCog,
  UserCheck,
  ChevronRight,
  BarChart,
  PlusCircle,
} from "lucide-react"
import { useNavigate } from 'react-router-dom';

function Student_management() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navigate = useNavigate();

  // Student management sections
  const sections = [
    {
      title: "Student Lists",
      description: "Manage all student records and information",
      icon: <ListChecks className="h-10 w-10" />,
      color: "from-blue-500 to-blue-600",
      stats: "1,248 students",
      action: "View Lists",
      onClick: () => navigate('/admin/students/list')
    },
    {
      title: "Student Grades",
      description: "Track academic performance and assessments",
      icon: <Award className="h-10 w-10" />,
      color: "from-green-500 to-green-600",
      stats: "4,392 grades",
      action: "View Grades",
      onClick: () => navigate('/admin/grades') 
    },
    {
      title: "Student Schedules",
      description: "Manage class timetables and activities",
      icon: <Clock className="h-10 w-10" />,
      color: "from-purple-500 to-purple-600",
      stats: "42 classes",
      action: "View Schedules",
      onClick: () => navigate('/admin/schedule') 

    },
    {
      title: "Student Accounts",
      description: "Manage student profiles and credentials",
      icon: <UserCog className="h-10 w-10" />,
      color: "from-amber-500 to-amber-600",
      stats: "1,248 accounts",
      action: "Manage Accounts",
    },
    {
      title: "Student Attendance",
      description: "Track student presence and absences",
      icon: <UserCheck className="h-10 w-10" />,
      color: "from-pink-500 to-pink-600",
      stats: "98.2% attendance",
      action: "View Records",
      onClick: () => navigate('/admin/attendance')
    },
  ]

  // Recent students data
  const recentStudents = [
    { id: "STD-1001", name: "Emma Thompson", grade: "A", attendance: "98%", status: "Active" },
    { id: "STD-1002", name: "James Wilson", grade: "B+", attendance: "95%", status: "Active" },
    { id: "STD-1003", name: "Sophia Martinez", grade: "A-", attendance: "97%", status: "Active" },
    { id: "STD-1004", name: "Noah Johnson", grade: "B", attendance: "92%", status: "Warning" },
    { id: "STD-1005", name: "Olivia Brown", grade: "A+", attendance: "99%", status: "Active" },
  ]

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-gradient-to-br from-slate-800 to-slate-900 shadow-md dark:bg-slate-800 border-b border-slate-700">
          <div className="flex items-center justify-between p-4">
            <button onClick={() => setIsMenuOpen(true)} className="md:hidden text-gray-400 hover:text-white">
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex-1 px-4">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-slate-100">Student Management</h1>
                <div className="ml-2 flex items-center text-sm text-slate-400">
                  <span className="mx-2">/</span>
                  <span>Students</span>
                </div>
              </div>
              <p className="text-sm text-slate-400">Manage all student-related activities and information</p>
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
                placeholder="Search students..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-4 bg-gradient-to-br from-slate-800 to-slate-900">
          {/* Performance Overview - Moved to Top */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-100">Performance Overview</h2>
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  Weekly
                </button>
                <button className="px-3 py-1 text-xs bg-slate-700 text-slate-300 rounded-md hover:bg-slate-600 transition-colors">
                  Monthly
                </button>
                <button className="px-3 py-1 text-xs bg-slate-700 text-slate-300 rounded-md hover:bg-slate-600 transition-colors">
                  Yearly
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: "Average Grade",
                  value: "B+",
                  change: "+5.2%",
                  icon: <BarChart className="h-5 w-5" />,
                  color: "from-blue-500 to-blue-600",
                },
                {
                  title: "Attendance Rate",
                  value: "96.8%",
                  change: "+2.1%",
                  icon: <UserCheck className="h-5 w-5" />,
                  color: "from-green-500 to-green-600",
                },
                {
                  title: "Completion Rate",
                  value: "92.3%",
                  change: "+3.7%",
                  icon: <ClipboardList className="h-5 w-5" />,
                  color: "from-purple-500 to-purple-600",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
                >
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br opacity-20 blur-xl filter"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-slate-400">{item.title}</p>
                      <h3 className="text-3xl font-bold mt-1 text-white">{item.value}</h3>
                      <div className="flex items-center mt-2 text-green-400">
                        <ChevronRight className="h-4 w-4 mr-1 rotate-90" />
                        <span className="text-sm">{item.change} this week</span>
                      </div>
                    </div>
                    <div
                      className={`rounded-lg bg-gradient-to-br ${item.color} p-3 shadow-lg transform transition-transform duration-300 group-hover:scale-110`}
                    >
                      {item.icon}
                    </div>
                  </div>

                  {/* Simulated chart */}
                  <div className="mt-4 h-12 w-full relative overflow-hidden rounded-md">
                    <div className="absolute inset-0 bg-slate-700/50"></div>
                    <div className="absolute bottom-0 left-0 h-full w-full bg-gradient-to-r from-blue-500/20 to-blue-600/20 flex items-end">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-blue-500 mx-px rounded-t-sm"
                          style={{
                            height: `${Math.floor(30 + Math.random() * 70)}%`,
                            opacity: 0.7 + i / 20,
                          }}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Management Sections */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-100 mb-4">Management Sections</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sections.map((section, index) => (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] perspective-3d"
                  onClick={section.onClick}
                >
                  <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br opacity-10 blur-2xl filter"></div>

                  <div className="p-6 relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div
                        className={`rounded-xl bg-gradient-to-br ${section.color} p-3 shadow-lg transform transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110`}
                      >
                        {section.icon}
                      </div>
                      <div className="text-xs font-semibold text-slate-400 bg-slate-800/50 px-3 py-1 rounded-full">
                        {section.stats}
                      </div>
                    </div>

                    <h3 className="text-xl font-bold mb-2 text-white group-hover:text-blue-300 transition-colors duration-300">
                      {section.title}
                    </h3>
                    <p className="text-slate-400 mb-6">{section.description}</p>

                    <div className="flex justify-between items-center">
                      <a
                        href="#"
                        className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors duration-300"
                      >
                        <span>{section.action}</span>
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </a>

                      <div className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-300 hover:bg-blue-600 hover:text-white transition-all duration-300 cursor-pointer transform group-hover:rotate-12">
                        <PlusCircle className="h-5 w-5" />
                      </div>
                    </div>
                  </div>

                  {/* 3D hover effect elements */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                    <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>
                    <div className="absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Student_management