import React from 'react';
import { useNavigate } from 'react-router-dom';

const StudentManagement = () => {
  const navigate = useNavigate();

  const handleNavigateToList = () => {
    navigate('/student-list');
  };

  const handleNavigateToAddStudent = () => {
    navigate('/add-student'); // Add navigation for "Add Student"
  };

  const handleNavigateToAnalytics = () => {
    navigate('/student-analytics'); // Add navigation for "Student Analytics"
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Student Management</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          onClick={handleNavigateToList}
          className="bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">Students List</h2>
          <p className="text-gray-600">View and manage all students</p>
        </div>
        
        <div 
          onClick={handleNavigateToAddStudent}
          className="bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">Add Student</h2>
          <p className="text-gray-600">Register a new student</p>
        </div>

        <div 
          onClick={handleNavigateToAnalytics}
          className="bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">Student Analytics</h2>
          <p className="text-gray-600">View student statistics and reports</p>
        </div>
      </div>
    </div>
  );
};

export default StudentManagement;
