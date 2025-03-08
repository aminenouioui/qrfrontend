import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import AdminSignUp from './pages/AdminSignup';
import Dashboard from './components/AdminDashboard';
import Student_management from './components/student_management';
import StudentListe from './components/studentliste';
import AdminLayout from './layouts/AdminLayout'; // Import the shared layout
import StudentDetails from './components/studentdetail';
import Attendance from './components/attendance';
import Schedule from './components/schedule';
import Grades from './components/grades';
import Level from './components/level';
import Rooms from './components/rooms';
import Subjects from './components/subjects';
const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes (No Layout) */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/signup" element={<AdminSignUp />} />
        <Route path="/admin/studentdetail" element={<StudentDetails />} />
        <Route path="/admin/attendance" element={<Attendance />} />
        <Route path="/admin/schedule" element={<Schedule />} />
        <Route path="/admin/grades" element={<Grades />} />
        

        {/* Admin Routes with Shared Layout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="students" element={<Student_management />} />
          <Route path="students/list" element={<StudentListe />} />
          <Route path="level" element={<Level />} />
          <Route path="rooms" element={<Rooms />} />
          <Route path="subjects" element={<Subjects />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;