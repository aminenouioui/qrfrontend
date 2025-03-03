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
    Cog, // For settings
    LogOut, // For logout
    Menu, // For the menu icon
  } from "lucide-react";
  
  const menuItems = [
    { name: "Students", icon: Users },
    { name: "Teachers", icon: UserCog },
    { name: "Parents", icon: Users2 },
    { name: "Levels", icon: Layers },
    { name: "Classes", icon: School },
    { name: "Notes", icon: BookOpen },
    { name: "Subjects", icon: BookMarked },
    { name: "Exam Result", icon: Award },
    { name: "Attendance", icon: CalendarCheck },
    { name: "Settings", icon: Cog },
    { name: "Logout", icon: LogOut },
  ];
  
  export default function Sidebar({ activeItem, setActiveItem }) {
    return (
      <div className="w-64 bg-gray-900 text-white flex flex-col">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center">
            <div className="bg-blue-500 text-white p-1 rounded">
              <span className="text-xs">SCHOOL</span>
            </div>
          </div>
          <button className="text-gray-400 hover:text-white transition-colors">
            <Menu size={20} />
          </button>
        </div>
  
        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto">
          <nav className="mt-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  className={`flex items-center px-4 py-3 w-full text-left transition-colors ${
                    activeItem === item.name
                      ? "text-blue-400 bg-gray-800"
                      : "text-gray-400 hover:bg-gray-800"
                  }`}
                  onClick={() => setActiveItem(item.name)}
                >
                  <Icon size={18} className="mr-3" />
                  <span className="capitalize">{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    );
  }