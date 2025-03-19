"use client"

import { useState } from "react"
import {
  Search,
  UserPlus,
  Edit,
  Trash2,
  Key,
  Eye,
  EyeOff,
  Filter,
  ChevronDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  Lock,
  Unlock,
  Mail,
  Copy,
  CheckCheck,
} from "lucide-react"

// Mock data for student accounts
const initialStudentAccounts = [
  {
    id: "STD-1001",
    name: "Emma Thompson",
    email: "emma.t@school.edu",
    username: "emma.thompson",
    status: "Active",
    lastLogin: "2023-05-15 09:23 AM",
    created: "2022-09-01",
  },
  {
    id: "STD-1002",
    name: "James Wilson",
    email: "james.w@school.edu",
    username: "james.wilson",
    status: "Active",
    lastLogin: "2023-05-16 10:45 AM",
    created: "2022-09-01",
  },
  {
    id: "STD-1003",
    name: "Sophia Martinez",
    email: "sophia.m@school.edu",
    username: "sophia.martinez",
    status: "Active",
    lastLogin: "2023-05-14 08:30 AM",
    created: "2022-09-02",
  },
  {
    id: "STD-1004",
    name: "Noah Johnson",
    email: "noah.j@school.edu",
    username: "noah.johnson",
    status: "Locked",
    lastLogin: "2023-05-10 11:15 AM",
    created: "2022-09-02",
  },
  {
    id: "STD-1005",
    name: "Olivia Brown",
    email: "olivia.b@school.edu",
    username: "olivia.brown",
    status: "Active",
    lastLogin: "2023-05-16 09:05 AM",
    created: "2022-09-03",
  },
  {
    id: "STD-1006",
    name: "William Davis",
    email: "william.d@school.edu",
    username: "william.davis",
    status: "Inactive",
    lastLogin: "2023-04-20 02:30 PM",
    created: "2022-09-03",
  },
  {
    id: "STD-1007",
    name: "Ava Miller",
    email: "ava.m@school.edu",
    username: "ava.miller",
    status: "Active",
    lastLogin: "2023-05-15 03:45 PM",
    created: "2022-09-04",
  },
  {
    id: "STD-1008",
    name: "Liam Garcia",
    email: "liam.g@school.edu",
    username: "liam.garcia",
    status: "Active",
    lastLogin: "2023-05-16 08:20 AM",
    created: "2022-09-04",
  },
]

function StudentAccountManagement() {
  // Removed useNavigate since it's not needed for preview
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [studentAccounts, setStudentAccounts] = useState(initialStudentAccounts)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [currentAccount, setCurrentAccount] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [notification, setNotification] = useState(null)
  const [copied, setCopied] = useState(false)

  // Form state for creating/editing accounts
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    status: "Active",
  })

  // Filter accounts based on search term and status filter
  const filteredAccounts = studentAccounts.filter((account) => {
    const matchesSearch =
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "All" || account.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Generate a random password
  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
    let password = ""
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData((prev) => ({ ...prev, password }))
    setShowPassword(true)
  }

  // Copy text to clipboard
  const copyToClipboard = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Create a new student account
  const createAccount = () => {
    const newId = `STD-${1000 + studentAccounts.length + 1}`
    const newAccount = {
      id: newId,
      name: formData.name,
      email: formData.email,
      username: formData.username,
      status: formData.status,
      lastLogin: "Never",
      created: new Date().toISOString().split("T")[0],
    }

    setStudentAccounts((prev) => [...prev, newAccount])
    setShowCreateModal(false)
    showNotification("Account created successfully", "success")

    // Reset form data
    setFormData({
      name: "",
      email: "",
      username: "",
      password: "",
      status: "Active",
    })
  }

  // Update an existing student account
  const updateAccount = () => {
    setStudentAccounts((prev) =>
      prev.map((account) =>
        account.id === currentAccount.id
          ? {
              ...account,
              name: formData.name,
              email: formData.email,
              username: formData.username,
              status: formData.status,
            }
          : account,
      ),
    )
    setShowEditModal(false)
    showNotification("Account updated successfully", "success")
  }

  // Reset password for a student account
  const resetPassword = () => {
    // In a real app, this would call an API to reset the password
    setShowPasswordModal(false)
    showNotification("Password reset successfully", "success")
  }

  // Delete a student account
  const deleteAccount = () => {
    setStudentAccounts((prev) => prev.filter((account) => account.id !== currentAccount.id))
    setShowDeleteModal(false)
    showNotification("Account deleted successfully", "success")
  }

  // Show notification
  const showNotification = (message, type = "info") => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  // Edit account handler
  const handleEditAccount = (account) => {
    setCurrentAccount(account)
    setFormData({
      name: account.name,
      email: account.email,
      username: account.username,
      password: "",
      status: account.status,
    })
    setShowEditModal(true)
  }

  // Reset password handler
  const handleResetPassword = (account) => {
    setCurrentAccount(account)
    setFormData((prev) => ({
      ...prev,
      password: "",
    }))
    generatePassword()
    setShowPasswordModal(true)
  }

  // Delete account handler
  const handleDeleteAccount = (account) => {
    setCurrentAccount(account)
    setShowDeleteModal(true)
  }

  // Toggle account status
  const toggleAccountStatus = (account) => {
    const newStatus = account.status === "Active" ? "Locked" : "Active"
    setStudentAccounts((prev) => prev.map((acc) => (acc.id === account.id ? { ...acc, status: newStatus } : acc)))
    showNotification(`Account ${newStatus.toLowerCase()}`, "success")
  }

  // Get status badge color
  const getStatusBadge = (status) => {
    switch (status) {
      case "Active":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "Locked":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30"
      case "Inactive":
        return "bg-slate-500/20 text-slate-400 border-slate-500/30"
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30"
    }
  }

  // Get notification style
  const getNotificationStyle = (type) => {
    switch (type) {
      case "success":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "error":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "warning":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30"
      default:
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    }
  }

  // Get notification icon
  const getNotificationIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5" />
      case "error":
        return <XCircle className="h-5 w-5" />
      case "warning":
        return <AlertCircle className="h-5 w-5" />
      default:
        return <AlertCircle className="h-5 w-5" />
    }
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-gradient-to-br from-slate-800 to-slate-900 shadow-md dark:bg-slate-800 border-b border-slate-700">
          <div className="flex items-center justify-between p-4">
            <div className="flex-1 px-4">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-slate-100">Student Account Management</h1>
                <div className="ml-2 flex items-center text-sm text-slate-400">
                  <span className="mx-2">/</span>
                  <span>Students</span>
                  <span className="mx-2">/</span>
                  <span>Accounts</span>
                </div>
              </div>
              <p className="text-sm text-slate-400">Create and manage student accounts and credentials</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 bg-gradient-to-br from-slate-800 to-slate-900">
          {/* Action Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search accounts..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white hover:bg-slate-600 transition-colors">
                  <Filter className="h-4 w-4" />
                  <span>Status: {statusFilter}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-slate-800 border border-slate-700 z-10 hidden group-hover:block">
                  <div className="py-1">
                    {["All", "Active", "Locked", "Inactive"].map((status) => (
                      <button
                        key={status}
                        className="block w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
                        onClick={() => setStatusFilter(status)}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                onClick={() => {
                  setFormData({
                    name: "",
                    email: "",
                    username: "",
                    password: "",
                    status: "Active",
                  })
                  generatePassword()
                  setShowCreateModal(true)
                }}
              >
                <UserPlus className="h-4 w-4" />
                <span>Create Account</span>
              </button>
            </div>
          </div>

          {/* Accounts Table */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-700/50 text-left">
                    <th className="px-6 py-3 text-xs font-medium text-slate-300 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-xs font-medium text-slate-300 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-xs font-medium text-slate-300 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-xs font-medium text-slate-300 uppercase tracking-wider">Username</th>
                    <th className="px-6 py-3 text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-slate-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredAccounts.length > 0 ? (
                    filteredAccounts.map((account) => (
                      <tr key={account.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-300">{account.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{account.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{account.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{account.username}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(account.status)}`}
                          >
                            {account.status === "Active" && (
                              <div className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5"></div>
                            )}
                            {account.status === "Locked" && (
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5"></div>
                            )}
                            {account.status === "Inactive" && (
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5"></div>
                            )}
                            {account.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{account.lastLogin}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                          <div className="flex items-center space-x-3">
                            <button
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                              onClick={() => handleEditAccount(account)}
                              title="Edit Account"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              className="text-amber-400 hover:text-amber-300 transition-colors"
                              onClick={() => handleResetPassword(account)}
                              title="Reset Password"
                            >
                              <Key className="h-4 w-4" />
                            </button>
                            <button
                              className={`${account.status === "Active" ? "text-red-400 hover:text-red-300" : "text-green-400 hover:text-green-300"} transition-colors`}
                              onClick={() => toggleAccountStatus(account)}
                              title={account.status === "Active" ? "Lock Account" : "Unlock Account"}
                            >
                              {account.status === "Active" ? (
                                <Lock className="h-4 w-4" />
                              ) : (
                                <Unlock className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              className="text-red-400 hover:text-red-300 transition-colors"
                              onClick={() => handleDeleteAccount(account)}
                              title="Delete Account"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-sm text-slate-400">
                        No accounts found matching your search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Create Account Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-700">
              <h3 className="text-xl font-bold text-slate-100">Create New Student Account</h3>
              <p className="text-sm text-slate-400">Enter student details to create a new account</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter student's full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="student@school.edu"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 pr-24 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="••••••••••••"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-slate-400 hover:text-slate-300 focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="absolute right-10 top-1/2 transform -translate-y-1/2 text-xs bg-slate-600 hover:bg-slate-500 text-white px-2 py-1 rounded"
                    >
                      Generate
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Active">Active</option>
                    <option value="Locked">Locked</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-700 flex justify-end space-x-3">
              <button
                className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                onClick={createAccount}
                disabled={!formData.name || !formData.email || !formData.username || !formData.password}
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Account Modal */}
      {showEditModal && currentAccount && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-700">
              <h3 className="text-xl font-bold text-slate-100">Edit Student Account</h3>
              <p className="text-sm text-slate-400">Update account details for {currentAccount.name}</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Active">Active</option>
                    <option value="Locked">Locked</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-700 flex justify-end space-x-3">
              <button
                className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                onClick={updateAccount}
                disabled={!formData.name || !formData.email || !formData.username}
              >
                Update Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showPasswordModal && currentAccount && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-700">
              <h3 className="text-xl font-bold text-slate-100">Reset Password</h3>
              <p className="text-sm text-slate-400">Reset password for {currentAccount.name}</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 pr-24 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="••••••••••••"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-slate-400 hover:text-slate-300 focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="absolute right-10 top-1/2 transform -translate-y-1/2 text-xs bg-slate-600 hover:bg-slate-500 text-white px-2 py-1 rounded"
                    >
                      Generate
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg">
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-slate-400 mr-2" />
                    <div>
                      <p className="text-sm text-slate-300">Send credentials to student</p>
                      <p className="text-xs text-slate-400">{currentAccount.email}</p>
                    </div>
                  </div>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none">
                    <input type="checkbox" name="toggle" id="toggle" className="sr-only peer" />
                    <label
                      htmlFor="toggle"
                      className="block overflow-hidden h-6 rounded-full bg-slate-600 cursor-pointer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4"
                    ></label>
                  </div>
                </div>
                <div className="bg-slate-700/50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-300">Temporary Password</p>
                    <button
                      className="text-blue-400 hover:text-blue-300 transition-colors flex items-center text-xs"
                      onClick={() => copyToClipboard(formData.password)}
                    >
                      {copied ? (
                        <>
                          <CheckCheck className="h-3 w-3 mr-1" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <div className="bg-slate-800 p-2 rounded font-mono text-sm text-slate-300 break-all">
                    {formData.password}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    This password will be required to be changed on first login.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-700 flex justify-end space-x-3">
              <button
                className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors"
                onClick={() => setShowPasswordModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                onClick={resetPassword}
                disabled={!formData.password}
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && currentAccount && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-700">
              <h3 className="text-xl font-bold text-slate-100">Delete Account</h3>
              <p className="text-sm text-slate-400">Are you sure you want to delete this account?</p>
            </div>
            <div className="p-6">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-400">Warning: This action cannot be undone</p>
                    <p className="text-sm text-slate-400 mt-1">
                      Deleting this account will permanently remove all associated data and access credentials.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-slate-300 mb-2">Account Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-slate-400">ID:</div>
                  <div className="text-slate-300">{currentAccount.id}</div>
                  <div className="text-slate-400">Name:</div>
                  <div className="text-slate-300">{currentAccount.name}</div>
                  <div className="text-slate-400">Email:</div>
                  <div className="text-slate-300">{currentAccount.email}</div>
                  <div className="text-slate-400">Username:</div>
                  <div className="text-slate-300">{currentAccount.username}</div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-700 flex justify-end space-x-3">
              <button
                className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                onClick={deleteAccount}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div
          className={`fixed bottom-4 right-4 flex items-center p-4 rounded-lg border shadow-lg ${getNotificationStyle(notification.type)}`}
        >
          <div className="mr-3">{getNotificationIcon(notification.type)}</div>
          <p className="text-sm font-medium">{notification.message}</p>
        </div>
      )}
    </div>
  )
}

export default StudentAccountManagement

