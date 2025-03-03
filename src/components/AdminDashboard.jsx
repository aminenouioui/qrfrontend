import {
  Users, // For students
  UserCog, // For teachers
  Users2, // For parents
  Layers, // For levels
  School, // For classes
  BookOpen, // For notes
  BookMarked, // For subjects
  Award, // For Exam Result
  CalendarCheck, // For attendance
  Cog,
} from "lucide-react";


const menuItems = [
  { name: "students", icon: Users, color: "bg-red-500" },
  { name: "teachers", icon: UserCog, color: "bg-green-500" },
  { name: "parents", icon: Users2, color: "bg-pink-500" },
  { name: "levels", icon: Layers, color: "bg-blue-500" },
  { name: "classes", icon: School, color: "bg-amber-500" },
  { name: "notes", icon: BookOpen, color: "bg-lime-500" },
  { name: "subjects", icon: BookMarked, color: "bg-purple-500" },
  { name: "Exam Result", icon: Award, color: "bg-blue-800" },
  { name: "attendance", icon: CalendarCheck, color: "bg-red-600" },
  { name : "settings", icon: Cog, color: "bg-gray-500" },
]

export default function Dashboard() {
  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {menuItems.map((item) => (
          <div key={item.name} className="flex flex-col items-center">
            <div className={`${item.color} w-16 h-16 rounded-lg flex items-center justify-center text-white mb-2`}>
              <item.icon size={24} />
            </div>
            <span className="text-sm text-center">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

