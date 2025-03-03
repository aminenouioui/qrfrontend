import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import AdminSignUp from './pages/AdminSignUp';
import Dashboard from './components/AdminDashboard';
import AdminLayout from './layouts/AdminLayout';

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes (No Layout) */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/signup" element={<AdminSignUp />} />

        {/* Private Routes (With Layout) */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminLayout>
              <Dashboard />
            </AdminLayout>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;