import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import tw from 'twrnc';
import { refreshAccessToken } from './utils/auth';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';

interface Level {
  id: number;
  level: string;
}

interface Student {
  id: number;
  prenom: string;
  nom: string;
  level: Level;
  mail: string;
}

interface Teacher {
  teacher: string;
  subject: { id: number; nom: string };
}

const TeacherGradesScreen = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [grade, setGrade] = useState('');
  const [gradeType, setGradeType] = useState('Test1');
  const [gradeDate, setGradeDate] = useState(new Date().toISOString().split('T')[0]);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState({ students: true, saving: false });
  const router = useRouter();

  const validateGrade = (value: string): boolean => {
    if (!value) return false;
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0 && num <= 20;
  };

  const validateDate = (value: string): boolean => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(value)) return false;
    const date = new Date(value);
    return date instanceof Date && !isNaN(date.getTime());
  };

  useEffect(() => {
    const getToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('access_token');
        if (!storedToken) {
          const newToken = await refreshAccessToken();
          if (!newToken) {
            setError('Authentication failed. Please log in again.');
            router.replace('/auth/login');
            return;
          }
          await AsyncStorage.setItem('access_token', newToken);
          setToken(newToken);
        } else {
          setToken(storedToken);
        }
      } catch (error) {
        console.error('Token retrieval error:', error);
        setError('Failed to retrieve authentication token.');
        router.replace('/auth/login');
      }
    };
    getToken();
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      setLoading((prev) => ({ ...prev, students: true }));
      try {
        const profileResponse = await axios.get(`${BASE_URL}/api/teacher/profile/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const teacherId = profileResponse.data.teacher;
        const studentsResponse = await axios.get(
          `${BASE_URL}/api/teachers/${teacherId}/students/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log('Students fetched:', studentsResponse.data); // Debug log
        if (!Array.isArray(studentsResponse.data) || studentsResponse.data.length === 0) {
          setError('No students found for this teacher. Please contact admin.');
        } else {
          setStudents(studentsResponse.data);
        }
        setTeacher(profileResponse.data);
        setError(null);
      } catch (err: any) {
        console.error('Fetch error:', err.response?.data, err);
        if (err.response?.status === 401) {
          const newToken = await refreshAccessToken();
          if (newToken) {
            await AsyncStorage.setItem('access_token', newToken);
            setToken(newToken);
            return;
          }
          setError('Authentication failed. Please log in again.');
          router.replace('/auth/login');
        } else {
          setError(
            err.response?.data?.error || 'Failed to load teacher or student data.'
          );
        }
      } finally {
        setLoading((prev) => ({ ...prev, students: false }));
      }
    };
    fetchData();
  }, [token]);

  const addGrade = async () => {
    if (!selectedStudent || !grade || !gradeType || !gradeDate || !teacher) {
      setError('Please fill in all fields and select a student.');
      return;
    }

    if (!validateGrade(grade)) {
      setError('Grade must be a number between 0 and 20.');
      return;
    }

    if (!validateDate(gradeDate)) {
      setError('Date must be in YYYY-MM-DD format (e.g., 2025-06-12).');
      return;
    }

    if (!selectedStudent.id || !students.some(s => s.id === selectedStudent.id)) {
      setError('Please select a valid student from the list.');
      return;
    }

    Alert.alert(
      'Confirm Grade Submission',
      `Add ${gradeType} grade of ${grade} for ${selectedStudent.prenom} ${selectedStudent.nom} on ${gradeDate}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            setLoading((prev) => ({ ...prev, saving: true }));
            try {
              console.log('Selected Student:', selectedStudent); // Debug log
              const data = {
                student: selectedStudent.id,
                subject: teacher.subject.id,
                grade: parseFloat(grade),
                grade_type: gradeType,
                level: selectedStudent.level.id,
                date_g: gradeDate,
              };
              console.log('Sending grade data:', data);

              const response = await axios.post(`${BASE_URL}/api/grades/add/`, data, {
                headers: { Authorization: `Bearer ${token}` },
              });
              console.log('Grade add response:', response.data);

              Alert.alert('Success', 'Grade added successfully!');
              setGrade('');
              setGradeType('Test1');
              setGradeDate(new Date().toISOString().split('T')[0]);
              setSelectedStudent(null);
              setError(null);
            } catch (err: any) {
              console.error('Error adding grade:', {
                message: err.message,
                status: err.response?.status,
                data: err.response?.data,
              });
              setError(`Failed to add grade: ${err.response?.data?.error || err.message}`);
            } finally {
              setLoading((prev) => ({ ...prev, saving: false }));
            }
          },
        },
      ]
    );
  };

  return (
    <View style={tw`flex-1 bg-gray-100`}>
      <ScrollView contentContainerStyle={tw`p-5 flex-grow`}>
        <View style={tw`mb-8 flex-row items-center`}>
          <TouchableOpacity onPress={() => router.back()} style={tw`mr-4`}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <View>
            <Text style={tw`text-2xl font-bold text-gray-800`}>Manage Student Grades</Text>
            <Text style={tw`text-gray-600`}>Assign grades to your students</Text>
          </View>
        </View>

        {error && (
          <View
            style={tw`${
              error.includes('successfully')
                ? 'bg-green-500/20 border-green-500/30'
                : 'bg-red-500/20 border-red-500/30'
            } p-4 rounded-lg mb-6 flex-row items-center`}
          >
            <Ionicons
              name={error.includes('successfully') ? 'checkmark-circle' : 'alert-circle'}
              size={20}
              color={error.includes('successfully') ? '#22C55E' : '#EF4444'}
              style={tw`mr-2`}
            />
            <Text style={tw`text-gray-800 flex-1`}>{error}</Text>
          </View>
        )}

        <View style={tw`bg-white rounded-xl p-5 shadow-md mb-6`}>
          <Text style={tw`text-lg font-semibold text-gray-800 mb-4`}>Select a Student</Text>
          {loading.students ? (
            <ActivityIndicator size="large" color="#6C63FF" style={tw`my-10`} />
          ) : students.length === 0 ? (
            <Text style={tw`text-gray-500 text-center p-3`}>No students found.</Text>
          ) : (
            students.map((student) => (
              <TouchableOpacity
                key={student.id}
                style={tw`p-3 border-b border-gray-200 flex-row items-center ${
                  selectedStudent?.id === student.id ? 'bg-blue-500/10' : ''
                }`}
                onPress={() => setSelectedStudent(student)}
              >
                <View style={tw`w-10 h-10 rounded-full bg-gray-300`} />
                <View style={tw`ml-3 flex-1`}>
                  <Text style={tw`font-medium text-gray-800`}>{student.prenom} {student.nom}</Text>
                  <Text style={tw`text-sm text-gray-500`}>Level: {student.level.level}</Text>
                </View>
                {selectedStudent?.id === student.id && (
                  <Ionicons name="checkmark-circle" size={20} color="#6C63FF" />
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        {selectedStudent && teacher && (
          <View style={tw`bg-white rounded-xl p-6 shadow-md mb-6`}>
            <Text style={tw`text-lg font-bold text-gray-800 mb-4`}>
              Add Grade for {selectedStudent.prenom} {selectedStudent.nom}
            </Text>
            <View style={tw`mb-4`}>
              <Text style={tw`text-gray-700 font-medium mb-2`}>Subject: {teacher.subject.nom}</Text>
              <Text style={tw`text-gray-700 font-medium mb-2`}>Grade (0-20):</Text>
              <TextInput
                style={tw`bg-gray-100 border border-gray-300 rounded-lg p-2 mb-4 ${
                  !grade || validateGrade(grade) ? '' : 'border-red-300'
                }`}
                placeholder="Enter grade (e.g., 15.5)"
                value={grade}
                onChangeText={(text) => {
                  setGrade(text);
                  if (text && !validateGrade(text)) {
                    setError('Grade must be a number between 0-20.');
                  } else {
                    setError(null);
                  }
                }}
                keyboardType="numeric"
              />
              <Text style={tw`text-gray-700 font-medium mb-2`}>Grade Type:</Text>
              <View style={tw`flex-row gap-2 mb-4`}>
                {['Test1', 'Test2', 'Exam'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={tw`flex-1 p-2 rounded-lg border ${
                      gradeType === type ? 'bg-blue-200 border-blue-500' : 'bg-gray-200 border-gray-300'
                    }`}
                    onPress={() => setGradeType(type)}
                  >
                    <Text style={tw`text-center font-medium ${
                      gradeType === type ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={tw`text-gray-700 font-medium mb-2`}>Date (YYYY-MM-DD):</Text>
              <TextInput
                style={tw`bg-gray-100 border border-gray-300 rounded-lg p-2 ${
                  !gradeDate || validateDate(gradeDate) ? '' : 'border-red-300'
                }`}
                placeholder="e.g., 2025-06-12"
                value={gradeDate}
                onChangeText={(text) => {
                  setGradeDate(text);
                  if (text && !validateDate(text)) {
                    setError('Date must be in YYYY-MM-DD format.');
                  } else {
                    setError(null);
                  }
                }}
              />
            </View>
            <TouchableOpacity
              style={tw`bg-blue-600 p-3 rounded-lg flex-row justify-center items-center ${
                loading.saving || !validateGrade(grade) || !validateDate(gradeDate)
                  ? 'opacity-50'
                  : ''
              }`}
              onPress={addGrade}
              disabled={loading.saving || !validateGrade(grade) || !validateDate(gradeDate)}
            >
              {loading.saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" style={tw`mr-2`} />
              ) : (
                <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" style={tw`mr-2`} />
              )}
              <Text style={tw`text-white font-semibold`}>Add Grade</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={tw`flex-row justify-around py-4 bg-white border-t border-gray-200 shadow-md`}>
        <TouchableOpacity onPress={() => router.push('./teacher_dashboard')}>
          <View style={tw`items-center`}>
            <Ionicons name="home" size={24} color="#BDBDBD" />
            <Text style={tw`text-xs text-gray-600`}>Home</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('./teacher_schedule')}>
          <View style={tw`items-center`}>
            <Ionicons name="calendar" size={24} color="#BDBDBD" />
            <Text style={tw`text-xs text-gray-600`}>Schedule</Text>
          </View>
        </TouchableOpacity>
     
        <TouchableOpacity onPress={() => router.push('./teacher_grades')}>
          <View style={tw`items-center`}>
            <Ionicons name="document-text" size={24} color="#6C63FF" />
            <Text style={tw`text-xs text-gray-600`}>Grades</Text>
          </View>
        </TouchableOpacity>
      
      </View>
    </View>
  );
};

export default TeacherGradesScreen;