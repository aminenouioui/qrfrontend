"use client";

import { useState, useEffect } from "react";
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
  Copy,
  CheckCheck,
} from "lucide-react";
import api from "../api";

function StudentAccountManagement() {
  const [studentAccounts, setStudentAccounts] = useState([]);
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [notification, setNotification] = useState(null);
  const [copied, setCopied] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    status: "Active",
  });

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await api.get("/api/students/list/");
        setStudents(response.data);
      } catch (err) {
        showNotification(`Error fetching students: ${err.response?.data?.detail || err.message}`, "error");
      }
    };

    const fetchAccounts = async () => {
      try {
        const response = await api.get("/api/student-accounts/");
        setStudentAccounts(response.data);
      } catch (err) {
        showNotification(`Error fetching accounts: ${err.response?.data?.detail || err.message}`, "error");
      }
    };

    fetchStudents();
    fetchAccounts();
  }, []);

  const filteredAccounts = studentAccounts.filter((account) => {
    const matchesSearch =
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.id.toString().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || account.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStudentChange = (e) => {
    const studentId = e.target.value;
    setSelectedStudent(studentId);
    const student = students.find((s) => s.id === parseInt(studentId));
    if (student) {
      setFormData({
        name: `${student.prenom} ${student.nom}`,
        email: student.mail,
        username: student.mail.split("@")[0],
        password: "",
        status: "Active",
      });
    }
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password }));
    setShowPassword(true);
  };

  const copyToClipboard = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const createAccount = async () => {
    if (!selectedStudent) {
      showNotification("Please select a student", "error");
      return;
    }

    try {
      console.log("Creating account with token:", localStorage.getItem("access_token"));
      const response = await api.post(`/create-student-account/${selectedStudent}/`);
      setStudentAccounts((prev) => [...prev, response.data]);
      setShowCreateModal(false);
      showNotification("Account created successfully", "success");
      setFormData({ name: "", email: "", username: "", password: "", status: "Active" });
      setSelectedStudent("");
    } catch (error) {
      console.error("Create error:", error.response?.data);
      showNotification(
        error.response?.data?.error || "Failed to create account",
        "error"
      );
    }
  };

  const updateAccount = async () => {
    if (!currentAccount) return;

    try {
      const response = await api.put(`/api/student-accounts/${currentAccount.id}/`, formData);
      setStudentAccounts((prev) =>
        prev.map((acc) => (acc.id === response.data.id ? response.data : acc))
      );
      setShowEditModal(false);
      showNotification("Account updated successfully", "success");
    } catch (error) {
      showNotification(
        error.response?.data?.detail || "Failed to update account",
        "error"
      );
    }
  };

  const resetPassword = async () => {
    if (!currentAccount) return;

    try {
      const response = await api.post(`/api/student-accounts/${currentAccount.id}/reset-password/`, {
        password: formData.password,
      });
      setShowPasswordModal(false);
      showNotification(response.data.message || "Password reset successfully", "success");
    } catch (error) {
      showNotification(
        error.response?.data?.error || "Failed to reset password",
        "error"
      );
    }
  };

  const deleteAccount = async () => {
    if (!currentAccount) return;

    try {
      await api.delete(`/api/student-accounts/${currentAccount.id}/delete/`);
      setStudentAccounts((prev) => prev.filter((acc) => acc.id !== currentAccount.id));
      setShowDeleteModal(false);
      showNotification("Account deleted successfully", "success");
    } catch (error) {
      showNotification(
        error.response?.data?.detail || "Failed to delete account",
        "error"
      );
    }
  };

  const showNotification = (message, type = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleEditAccount = (account) => {
    setCurrentAccount(account);
    setFormData({
      name: account.name,
      email: account.email,
      username: account.username,
      password: "",
      status: account.status,
    });
    setShowEditModal(true);
  };

  const handleResetPassword = (account) => {
    setCurrentAccount(account);
    setFormData((prev) => ({ ...prev, password: "" }));
    generatePassword();
    setShowPasswordModal(true);
  };

  const handleDeleteAccount = (account) => {
    setCurrentAccount(account);
    setShowDeleteModal(true);
  };

  const toggleAccountStatus = async (account) => {
    const newStatus = account.status === "Active" ? "Inactive" : "Active";
    try {
      const response = await api.put(`/api/student-accounts/${account.id}/`, {
        ...account,
        status: newStatus,
      });
      setStudentAccounts((prev) =>
        prev.map((acc) => (acc.id === account.id ? response.data : acc))
      );
      showNotification(`Account ${newStatus.toLowerCase()}`, "success");
    } catch (error) {
      showNotification(
        error.response?.data?.detail || "Failed to toggle status",
        "error"
      );
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Active": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "Inactive": return "bg-slate-500/20 text-slate-400 border-slate-500/30";
      default: return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  const getNotificationStyle = (type) => {
    switch (type) {
      case "success": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "error": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "warning": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      default: return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "success": return <CheckCircle className="h-5 w-5" />;
      case "error": return <XCircle className="h-5 w-5" />;
      case "warning": return <AlertCircle className="h-5 w-5" />;
      default: return <AlertCircle className="h-5 w-5" />;
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <div className="flex-1 flex flex-col overflow-hidden">
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

        <main className="flex-1 overflow-y-auto p-4 bg-gradient-to-br from-slate-800 to-slate-900">
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
                    {["All", "Active", "Inactive"].map((status) => (
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
                  setFormData({ name: "", email: "", username: "", password: "", status: "Active" });
                  setSelectedStudent("");
                  setShowCreateModal(true);
                }}
              >
                <UserPlus className="h-4 w-4" />
                <span>Create Account</span>
              </button>
            </div>
          </div>

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
                    <th className="px-6 py-3 text-xs font-medium text-slate-300 uppercase tracking-wider">Last Login</th>
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
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(account.status)}`}>
                            {account.status === "Active" && <div className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5"></div>}
                            {account.status === "Inactive" && <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5"></div>}
                            {account.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{account.lastLogin || "Never"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                          <div className="flex items-center space-x-3">
                            <button className="text-blue-400 hover:text-blue-300 transition-colors" onClick={() => handleEditAccount(account)} title="Edit Account">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button className="text-amber-400 hover:text-amber-300 transition-colors" onClick={() => handleResetPassword(account)} title="Reset Password">
                              <Key className="h-4 w-4" />
                            </button>
                            <button
                              className={`${account.status === "Active" ? "text-red-400 hover:text-red-300" : "text-green-400 hover:text-green-300"} transition-colors`}
                              onClick={() => toggleAccountStatus(account)}
                              title={account.status === "Active" ? "Lock Account" : "Unlock Account"}
                            >
                              {account.status === "Active" ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                            </button>
                            <button className="text-red-400 hover:text-red-300 transition-colors" onClick={() => handleDeleteAccount(account)} title="Delete Account">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-sm text-slate-400">
                        No accounts found.
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
              <p className="text-sm text-slate-400">Select a student to create an account</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Select Student</label>
                  <select
                    value={selectedStudent}
                    onChange={handleStudentChange}
                    className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- Select a student --</option>
                    {students
                      .filter((student) => !student.is_account_created)
                      .map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.prenom} {student.nom} ({student.mail})
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Student's full name"
                    disabled
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
                    disabled
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
                    disabled
                  />
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
                disabled={!selectedStudent}
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

      {notification && (
        <div className={`fixed bottom-4 right-4 flex items-center p-4 rounded-lg border shadow-lg ${getNotificationStyle(notification.type)}`}>
          <div className="mr-3">{getNotificationIcon(notification.type)}</div>
          <p className="text-sm font-medium">{notification.message}</p>
        </div>
      )}
    </div>
  );
}

export default StudentAccountManagement;