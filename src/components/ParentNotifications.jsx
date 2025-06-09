"use client";

import { useState, useEffect } from "react";
import { Bell, Search, Menu, Send, Loader2, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "./api";

function ParentNotifications() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [parents, setParents] = useState([]);
  const [selectedParent, setSelectedParent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState(null);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch parents and recent notifications
  useEffect(() => {
    const fetchParents = async () => {
      try {
        const response = await api.get("/api/parents/list/");
        setParents(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        const errorMessage =
          error.response?.data?.detail ||
          Object.values(error.response?.data || {}).join(", ") ||
          "Failed to fetch parents. Please try again.";
        setError(errorMessage);
        console.error("Error fetching parents:", error);
      }
    };

    const fetchRecentNotifications = async () => {
      try {
        const response = await api.get("/api/notifications/recent/");
        setRecentNotifications(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        const errorMessage =
          error.response?.data?.detail ||
          Object.values(error.response?.data || {}).join(", ") ||
          "Failed to fetch recent notifications.";
        setError(errorMessage);
        console.error("Error fetching recent notifications:", error);
      }
    };

    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchParents(), fetchRecentNotifications()]);
      setLoading(false);
    };

    fetchData();
  }, []);

  // Filter parents based on search query
  const filteredParents = parents.filter((parent) =>
    `${parent.prenom} ${parent.nom}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  // Handle sending notification
  const handleSendNotification = async () => {
    if (!selectedParent || !message.trim()) {
      setNotificationStatus({
        type: "error",
        message: "Please select a parent and enter a message.",
      });
      return;
    }

    setIsSending(true);
    setNotificationStatus(null);

    try {
      await api.post("/api/send-notification/", {
        user_id: selectedParent.id,
        message: message,
      });
      setNotificationStatus({
        type: "success",
        message: "Notification sent successfully!",
      });
      setMessage("");
      setSelectedParent(null);
      setSearchQuery("");
      // Refresh recent notifications
      const response = await api.get("/api/notifications/recent/");
      setRecentNotifications(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      const errorMessage =
        error.response?.data?.detail ||
        Object.values(error.response?.data || {}).join(", ") ||
        "Failed to send notification.";
      setNotificationStatus({ type: "error", message: errorMessage });
      console.error("Error sending notification:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login", { state: { from: location.pathname } });
  };

  // Handle login redirect
  const handleLoginRedirect = () => {
    navigate("/login", { state: { from: location.pathname } });
  };

  if (loading) {
    return <div className="min-h-screen bg-[#111827] text-white p-6">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-[#111827] text-white">
      {/* Sidebar */}
      {isMenuOpen && (
        <aside className="w-64 bg-[#1e293b] p-4 md:hidden">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Menu</h2>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>
          <nav>
            <a
              href="/admin/parents"
              className="block text-white mb-2 hover:text-blue-400"
            >
              Parent Management
            </a>
            <a
              href="/dashboard"
              className="block text-white mb-2 hover:text-blue-400"
            >
              Dashboard
            </a>
            <button
              onClick={handleLogout}
              className="block text-white mb-2 hover:text-blue-400"
            >
              Logout
            </button>
          </nav>
        </aside>
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-[#1e293b] shadow-md border-b border-gray-700">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="md:hidden text-gray-400 hover:text-white"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex-1 px-4">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-white">Send Notifications</h1>
                <div className="ml-2 flex items-center text-sm text-gray-400">
                  <span className="mx-2">/</span>
                  <span>Notifications</span>
                </div>
              </div>
              <p className="text-sm text-gray-400">Send notifications to parents</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-full hover:bg-gray-700 transition-colors">
                <Bell className="h-5 w-5 text-gray-300" />
              </button>
              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                JS
              </div>
            </div>
          </div>
          <div className="px-4 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search parents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#273549] border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#111827]">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-400">
              {error}
              <button
                onClick={handleLoginRedirect}
                className="ml-2 underline hover:text-red-300"
              >
                Log in
              </button>
            </div>
          )}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Send a Notification</h2>
            <div className="grid grid-cols-1 gap-6">
              <div className="relative overflow-hidden rounded-xl bg-[#1e293b] border border-gray-700 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                {/* Notification Status */}
                {notificationStatus && (
                  <div
                    className={`mb-4 p-3 rounded-lg ${
                      notificationStatus.type === "success"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {notificationStatus.message}
                  </div>
                )}
                {/* Parent Selection */}
                <div className="mb-6">
                  <label className="text-gray-300 font-semibold mb-2 block">
                    Select Parent
                  </label>
                  <div className="relative">
                    <select
                      value={selectedParent ? selectedParent.id : ""}
                      onChange={(e) => {
                        const parent = parents.find(
                          (p) => p.id === parseInt(e.target.value)
                        );
                        setSelectedParent(parent);
                      }}
                      className="w-full p-3 rounded-lg bg-[#273549] border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a parent...</option>
                      {filteredParents.map((parent) => (
                        <option key={parent.id} value={parent.id}>
                          {parent.prenom} {parent.nom} (ID: {parent.id})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Message Input */}
                <div className="mb-6">
                  <label className="text-gray-300 font-semibold mb-2 block">
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter your notification message..."
                    className="w-full p-3 rounded-lg bg-[#273549] border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                  />
                </div>

                {/* Send Button */}
                <button
                  onClick={handleSendNotification}
                  disabled={isSending}
                  className={`flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all duration-300 ${
                    isSending ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isSending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Send Notification
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Recent Notifications */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">
              Recent Notifications
            </h2>
            <div className="relative overflow-hidden rounded-xl bg-[#1e293b] border border-gray-700 p-6 shadow-lg">
              <div className="space-y-4">
                {recentNotifications.length > 0 ? (
                  recentNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg"
                    >
                      <div>
                        <p className="text-white font-semibold">
                          {notification.parent_name}
                        </p>
                        <p className="text-gray-400">{notification.message}</p>
                      </div>
                      <p className="text-gray-400 text-sm">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400">No recent notifications.</p>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default ParentNotifications;