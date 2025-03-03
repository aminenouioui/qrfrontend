import { Search, ChevronRight } from "lucide-react"

export default function Header() {
  return (
    <div className="p-4 border-b">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-lg font-medium">Admin</h1>
          <p className="text-sm text-gray-500">Jason Statham</p>
        </div>
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full overflow-hidden mr-4">
            <img src="/placeholder.svg?height=40&width=40" alt="Profile" className="w-full h-full object-cover" />
          </div>
          <ChevronRight size={20} className="text-gray-400" />
        </div>
      </div>
      <div className="mt-4 relative">
        <input type="text" placeholder="Search" className="w-full p-2 pl-10 border rounded-md" />
        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>
    </div>
  )
}

