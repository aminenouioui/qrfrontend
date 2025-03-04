import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import AdminSignUp from './pages/AdminSignup';
import Dashboard from './components/AdminDashboard';
import Student_management from './components/student_management';
import AdminLayout from './layouts/AdminLayout'; // Import the shared layout

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes (No Layout) */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/signup" element={<AdminSignUp />} />

        {/* Admin Routes with Shared Layout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="students" element={<Student_management />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;