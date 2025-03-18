import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import AdminSignUp from './pages/AdminSignup';
import Dashboard from './components/admin/AdminDashboard';
import Student_management from './components/student/student_management';
import StudentListe from './components/student/studentliste';
import AdminLayout from './layouts/AdminLayout'; // Import the shared layout
import StudentDetails from './components/student/studentdetail';
import Attendance from './components/student/attendance';
import Schedule from './components/admin/schedule';
import Grades from './components/student/grades';
import Level from './components/admin/level';
import Rooms from './components/admin/rooms';
import Subjects from './components/admin/subjects';
import TeacherList from './components/teacher/TeacherList';
import Teacher_management from './components/teacher/teacher_management';
import Grades_teacher from './components/teacher/grades_teacher';
import Schedule_teacher from './components/teacher/schedule_teacher';
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
        <Route path="/admin/grades_teacher" element={<Grades_teacher />} />
        <Route path="/admin/schedule_teacher" element={<Schedule_teacher />} />
        {/* Admin Routes with Shared Layout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="students" element={<Student_management />} />
          <Route path="students/list" element={<StudentListe />} />
          <Route path="level" element={<Level />} />
          <Route path="rooms" element={<Rooms />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="teachers/list" element={<TeacherList />} />
          <Route path="teachers" element={<Teacher_management />} />
          <Route path="grades_teacher" element={<Grades_teacher />} />
          <Route path="schedule_teacher" element={<Schedule_teacher />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
