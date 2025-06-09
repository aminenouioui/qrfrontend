import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import AdminSignUp from './pages/AdminSignup';
import Dashboard from './components/admin/AdminDashboard';
import Student_management from './components/student/student_management';
import StudentListe from './components/student/studentliste';
import AdminLayout from './layouts/AdminLayout';
import StudentDetails from './components/student/studentdetail';
import Attendance from './components/student/attendance';
import Schedule from './components/admin/schedule';
import Grades from './components/student/grades';
import Level from './components/admin/level';
import Rooms from './components/admin/rooms';
import Subjects from './components/admin/subjects';
import TeacherList from './components/teacher/TeacherList';
import Teacher_management from './components/teacher/teacher_management';
import StudentAccountManagement from './components/student/studentaccount';
import Grades_teacher from './components/teacher/grades_teacher';
import Schedule_teacher from './components/teacher/schedule_teacher';
import TeacherAccountManagement from './components/teacher/teacheraccount';
import TeacherAttendanceTracking from './components/teacher/teacherattendance';
import Parent_management from './components/Parent_management'; // Add this
import ParentDetail from './components/ParentDetail'; // Add this
import TeacherDetails from './components/teacher/teacherdetail';
import AddParentModal from './components/parentlist';
import ParentAccountManagement from './components/parentaccount';
import ParentNotifications from './components/ParentNotifications';

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
          <Route path="teachers/list" element={<TeacherList />} />
          <Route path="teachers" element={<Teacher_management />} />
          <Route path="parents" element={<Parent_management />} />
          <Route path="parents/:id" element={<ParentDetail />} />
          <Route path="studentaccount" element={<StudentAccountManagement />} />
          <Route path="grades_teacher" element={<Grades_teacher />} />
          <Route path="schedule_teacher" element={<Schedule_teacher />} />
          <Route path="teacheraccount" element={<TeacherAccountManagement />} />
          <Route path="teacherattendance" element={<TeacherAttendanceTracking />} />
          <Route path="teacherdetail" element={<TeacherDetails />} />
          <Route path="parentlist" element={<AddParentModal/>} />
          <Route path="/admin/parent-accounts" element={<ParentAccountManagement />} />
          <Route path="parentnotifications" element={<ParentNotifications />} />
          

        </Route>
      </Routes>
    </Router>
  );
};

export default App;