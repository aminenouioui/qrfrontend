import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation

const StudentList = () => {
  const navigate = useNavigate(); // Initialize useNavigate
  // Example student data - replace with your actual data source
  const [students, setStudents] = useState([
    { id: 1, name: 'John Doe', class: '10A', rollNo: '001' },
    { id: 2, name: 'Jane Smith', class: '10B', rollNo: '002' },
    // Add more students as needed
  ]);

  const handleDelete = (id) => {
    setStudents(students.filter(student => student.id !== id)); // Remove student from the list
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Students List</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Class
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Roll No
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((student) => (
              <tr key={student.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{student.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{student.class}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{student.rollNo}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                  <button className="text-green-600 hover:text-green-900 mr-3" onClick={() => navigate(`/admin/student_detail/${student.id}`)}>👁️</button>
                  <button className="text-red-600 hover:text-red-900" onClick={() => handleDelete(student.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentList;
