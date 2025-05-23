"use client";

import { useState, useEffect, useCallback } from "react";
import { debounce } from "lodash";
import {
  Search, UserPlus, Edit, Trash2, Key, Filter, ChevronDown,
  CheckCircle, XCircle, AlertCircle, Lock, Unlock,
} from "lucide-react";
import api from "../api";

// Reusable CreateModal Component
const CreateModal = ({ isOpen, onClose, students, onCreate, selectedStudent, setSelectedStudent, formData, setFormData, isLoading }) => {
  if (!isOpen) return null;

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

  return (
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
                className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                <option value="">-- Select a student --</option>
                {students.filter((student) => !student.is_account_created).map((student) => (
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
                value={formData.name}
                className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
              <input
                type="text"
                value={formData.username}
                className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white"
                disabled
              />
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-slate-700 flex justify-end space-x-3">
          <button
            className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
            onClick={onCreate}
            disabled={!selectedStudent || isLoading}
          >
            {isLoading ? "Creating..." : "Create Account"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Reusable EditModal Component
const EditModal = ({ isOpen, onClose, currentAccount, onUpdate, formData, setFormData, isLoading }) => {
  if (!isOpen || !currentAccount) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
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
                className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-slate-700 flex justify-end space-x-3">
          <button
            className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
            onClick={onUpdate}
            disabled={!formData.name || !formData.email || !formData.username || isLoading}
          >
            {isLoading ? "Updating..." : "Update Account"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Reusable ResetPasswordModal Component
const ResetPasswordModal = ({ isOpen, onClose, currentAccount, onReset, formData, setFormData, isLoading }) => {
  if (!isOpen || !currentAccount) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password }));
  };

  return (
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
                  type="text"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 pr-24 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter or generate a new password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={generatePassword}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs bg-slate-600 hover:bg-slate-500 text-white px-2 py-1 rounded"
                  disabled={isLoading}
                >
                  Generate
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-slate-700 flex justify-end space-x-3">
          <button
            className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
            onClick={onReset}
            disabled={!formData.password || isLoading}
          >
            {isLoading ? "Resetting..." : "Reset Password"}
          </button>
        </div>
      </div>
    </div>
  );
};

function StudentAccountManagement() {
  const [studentAccounts, setStudentAccounts] = useState([]);
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    status: "Active",
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [studentsRes, accountsRes] = await Promise.all([
          api.get("/api/students/list/"),
          api.get("/api/student-accounts/"),
        ]);
        setStudents(studentsRes.data);
        setStudentAccounts(accountsRes.data);
      } catch (err) {
        showNotification(`Error fetching data: ${err.response?.data?.detail || err.message}`, "error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const debouncedSearch = useCallback(debounce((value) => setSearchTerm(value), 300), []);

  const filteredAccounts = studentAccounts.filter((account) => {
    const matchesSearch =
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.id.toString().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || account.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const showNotification = (message, type = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const createAccount = async () => {
    if (!selectedStudent) {
      showNotification("Please select a student", "error");
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.post(`/create-student-account/${selectedStudent}/`);
      const newAccount = { ...response.data };
      setStudentAccounts((prev) => [...prev, newAccount]);
      setShowCreateModal(false);
      showNotification(
        `Account created! Username: ${newAccount.username}, Password: ${newAccount.password}`,
        "success"
      );
      setFormData({ name: "", email: "", username: "", password: "", status: "Active" });
      setSelectedStudent("");
    } catch (err) {
      showNotification(err.response?.data?.error || "Failed to create account", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const updateAccount = async () => {
    if (!currentAccount) return;
    setIsLoading(true);
    try {
      const response = await api.put(`/api/student-accounts/${currentAccount.id}/`, formData);
      setStudentAccounts((prev) =>
        prev.map((acc) => (acc.id === response.data.id ? { ...response.data } : acc))
      );
      setShowEditModal(false);
      showNotification("Account updated successfully", "success");
    } catch (err) {
      showNotification(err.response?.data?.detail || "Failed to update account", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!currentAccount) return;
    setIsLoading(true);
    try {
      const response = await api.post(`/api/student-accounts/${currentAccount.id}/reset-password/`, { password: formData.password });
      setStudentAccounts((prev) =>
        prev.map((acc) => (acc.id === currentAccount.id ? { ...acc, password: formData.password } : acc))
      );
      setShowResetPasswordModal(false);
      showNotification(`Password reset successfully: ${formData.password}`, "success");
    } catch (err) {
      showNotification(err.response?.data?.error || "Failed to reset password", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAccountStatus = async (account) => {
    const newStatus = account.status === "Active" ? "Inactive" : "Active";
    setIsLoading(true);
    try {
      const response = await api.put(`/api/student-accounts/${account.id}/`, { ...account, status: newStatus });
      setStudentAccounts((prev) =>
        prev.map((acc) => (acc.id === account.id ? { ...response.data } : acc))
      );
      showNotification(`Account set to ${newStatus}`, "success");
    } catch (err) {
      showNotification(err.response?.data?.detail || "Failed to toggle status", "error");
    } finally {
      setIsLoading(false);
    }
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
    setShowResetPasswordModal(true);
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
      default: return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "success": return <CheckCircle className="h-5 w-5" />;
      case "error": return <XCircle className="h-5 w-5" />;
      default: return <AlertCircle className="h-5 w-5" />;
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-gradient-to-br from-slate-800 to-slate-900 shadow-md border-b border-slate-700">
          <div className="p-4">
            <h1 className="text-2xl font-bold text-slate-100">Student Account Management</h1>
            <p className="text-sm text-slate-400">Manage student accounts and credentials</p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 bg-gradient-to-br from-slate-800 to-slate-900">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search accounts..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => debouncedSearch(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white hover:bg-slate-600">
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
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => setShowCreateModal(true)}
                disabled={isLoading}
              >
                <UserPlus className="h-4 w-4" />
                <span>Create Account</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
            {isLoading ? (
              <div className="text-center py-4 text-slate-400">Loading accounts...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-700/50 text-left">
                      <th className="px-6 py-3 text-xs font-medium text-slate-300 uppercase">ID</th>
                      <th className="px-6 py-3 text-xs font-medium text-slate-300 uppercase">Name</th>
                      <th className="px-6 py-3 text-xs font-medium text-slate-300 uppercase">Email</th>
                      <th className="px-6 py-3 text-xs font-medium text-slate-300 uppercase">Username</th>
                      <th className="px-6 py-3 text-xs font-medium text-slate-300 uppercase">Password</th>
                      <th className="px-6 py-3 text-xs font-medium text-slate-300 uppercase">Status</th>
                      <th className="px-6 py-3 text-xs font-medium text-slate-300 uppercase">Last Login</th>
                      <th className="px-6 py-3 text-xs font-medium text-slate-300 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {filteredAccounts.length > 0 ? (
                      filteredAccounts.map((account) => (
                        <tr key={account.id} className="hover:bg-slate-700/30 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-slate-300">{account.id}</td>
                          <td className="px-6 py-4 text-sm text-slate-300">{account.name}</td>
                          <td className="px-6 py-4 text-sm text-slate-300">{account.email}</td>
                          <td className="px-6 py-4 text-sm text-slate-300">{account.username}</td>
                          <td className="px-6 py-4 text-sm text-slate-300">{account.password || "Not set"}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(account.status)}`}>
                              {account.status === "Active" && <div className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5"></div>}
                              {account.status === "Inactive" && <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5"></div>}
                              {account.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-300">{account.lastLogin || "Never"}</td>
                          <td className="px-6 py-4 text-sm text-slate-300">
                            <div className="flex items-center space-x-3">
                              <button
                                className="text-blue-400 hover:text-blue-300"
                                onClick={() => handleEditAccount(account)}
                                title="Edit Account"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                className="text-amber-400 hover:text-amber-300"
                                onClick={() => handleResetPassword(account)}
                                title="Reset Password"
                              >
                                <Key className="h-4 w-4" />
                              </button>
                              <button
                                className={`${account.status === "Active" ? "text-red-400 hover:text-red-300" : "text-green-400 hover:text-green-300"}`}
                                onClick={() => toggleAccountStatus(account)}
                                title={account.status === "Active" ? "Lock Account" : "Unlock Account"}
                              >
                                {account.status === "Active" ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                              </button>
                              <button
                                className="text-red-400 hover:text-red-300"
                                onClick={() => alert("Delete not implemented yet")}
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
                        <td colSpan="8" className="px-6 py-4 text-center text-sm text-slate-400">
                          No accounts found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>

        <CreateModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          students={students}
          onCreate={createAccount}
          selectedStudent={selectedStudent}
          setSelectedStudent={setSelectedStudent}
          formData={formData}
          setFormData={setFormData}
          isLoading={isLoading}
        />

        <EditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          currentAccount={currentAccount}
          onUpdate={updateAccount}
          formData={formData}
          setFormData={setFormData}
          isLoading={isLoading}
        />

        <ResetPasswordModal
          isOpen={showResetPasswordModal}
          onClose={() => setShowResetPasswordModal(false)}
          currentAccount={currentAccount}
          onReset={resetPassword}
          formData={formData}
          setFormData={setFormData}
          isLoading={isLoading}
        />

        {notification && (
          <div className={`fixed bottom-4 right-4 flex items-center p-4 rounded-lg border shadow-lg ${getNotificationStyle(notification.type)}`}>
            <div className="mr-3">{getNotificationIcon(notification.type)}</div>
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
export default StudentAccountManagement;