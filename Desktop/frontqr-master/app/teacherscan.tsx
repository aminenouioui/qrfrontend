import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import tw from 'twrnc';
import { refreshAccessToken } from './utils/auth';

const BASE_URL = 'http://10.0.2.2:8000';
const WS_URL = 'ws://10.0.2.2:8000/ws/attendance/';

interface AttendanceRecord {
  date: string;
  subject: number | { id: number }; // Subject ID or object
  status: 'present' | 'absent' | 'late' | 'en_attente' | 'not_set';
}

interface TeacherProfile {
  name: string;
  photo?: string | null;
  teacher: string; // Maps to teacher.id
}

interface ScheduleItem {
  id: number;
  day: string;
  subject: { id: number; nom: string; description: string };
  start_time: string;
  end_time: string;
  classe: { id: number; name: string; capacity: number };
  notes?: string;
}

interface ClassSchedule {
  id: string; // Schedule ID
  subject: string; // Subject name
  subjectId: string; // Subject ID
  day: string;
  start_time: string;
  end_time: string;
  classe: string;
}

const TeacherAttendanceScreen: React.FC = () => {
  const [teacher, setTeacher] = useState<TeacherProfile | null>(null);
  const [attendanceData, setAttendanceData] = useState<Record<string, string>>({});
  const [classSchedule, setClassSchedule] = useState<ClassSchedule[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState({
    profile: true,
    attendance: true,
    schedule: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [attendanceVersion, setAttendanceVersion] = useState(0);
  const router = useRouter();

  // Fetch token
  useEffect(() => {
    const getToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('access_token');
        if (!storedToken) {
          const newToken = await refreshAccessToken();
          if (!newToken) {
            console.log('No token available, redirecting to login');
            router.replace('/auth/login');
            return;
          }
          setToken(newToken);
        } else {
          console.log('Token retrieved:', storedToken);
          setToken(storedToken);
        }
      } catch (err: any) {
        console.error('Token fetch error:', err.message);
        setError('Authentication failed. Please log in again.');
        router.replace('/auth/login');
      }
    };
    getToken();
  }, [router]);

  // Fetch teacher profile
  useEffect(() => {
    const fetchTeacherProfile = async () => {
      if (!token) return;
      setLoading((prev) => ({ ...prev, profile: true }));
      try {
        console.log('Fetching teacher profile with token:', token);
        const response = await axios.get<TeacherProfile>(`${BASE_URL}/api/teacher/profile/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Teacher profile response:', JSON.stringify(response.data, null, 2));
        setTeacher(response.data);
        if (!response.data.teacher) {
          console.warn('Teacher profile missing teacher ID');
          setError('Profile loaded, but no teacher ID available.');
        }
        setLoading((prev) => ({ ...prev, profile: false }));
      } catch (err: any) {
        console.error('Profile fetch error:', err.response?.data || err.message);
        const errorMessage =
          err.response?.status === 401
            ? 'Unauthorized access. Please log in again.'
            : `Network error: ${err.message}. Ensure the server is running at ${BASE_URL}.`;
        setError(`Failed to load profile: ${errorMessage}`);
        setLoading((prev) => ({ ...prev, profile: false }));
        if (err.response?.status === 401) {
          router.replace('/auth/login');
        }
      }
    };
    fetchTeacherProfile();
  }, [token, router]);

  // Fetch class schedule
  useEffect(() => {
    const fetchClassSchedule = async () => {
      if (!token || !teacher?.teacher) {
        console.log('No token or teacher ID, skipping schedule fetch');
        setClassSchedule([]);
        setLoading((prev) => ({ ...prev, schedule: false }));
        return;
      }
      setLoading((prev) => ({ ...prev, schedule: true }));
      try {
        console.log('Fetching schedule for teacher:', teacher.teacher);
        const response = await axios.get<ScheduleItem[]>(
          `${BASE_URL}/api/schedules/teacher/${teacher.teacher}/`,
          {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          }
        );
        console.log('Schedule response:', JSON.stringify(response.data, null, 2));
        if (!Array.isArray(response.data)) {
          throw new Error('Invalid schedule data: Expected an array');
        }
        if (response.data.length === 0) {
          console.warn('No schedules found for teacher:', teacher.teacher);
          setError('No schedules assigned. Please add schedules in the admin panel.');
        }
        const formattedSchedule = response.data.map((item) => {
          if (!item.subject?.nom || !item.classe?.name) {
            console.warn('Invalid schedule item:', item);
          }
          return {
            id: item.id.toString(),
            subject: item.subject?.nom || `Subject ${item.subject?.id || 'Unknown'}`,
            subjectId: item.subject?.id.toString() || item.id.toString(),
            day: item.day.toUpperCase(),
            start_time: item.start_time.slice(0, 5),
            end_time: item.end_time.slice(0, 5),
            classe: item.classe?.name || `Class ${item.classe?.id || 'Unknown'}`,
          };
        });
        console.log('Formatted schedule:', JSON.stringify(formattedSchedule, null, 2));
        setClassSchedule(formattedSchedule);
        if (formattedSchedule.length > 0 && error?.includes('No schedules assigned')) {
          setError(null);
        }
      } catch (err: any) {
        console.error('Schedule fetch error:', err.response?.data || err.message);
        setError(
          `Failed to load schedule: ${
            err.response?.status === 401
              ? 'Unauthorized access'
              : err.response?.data?.detail || err.message
          }`
        );
        setClassSchedule([]);
        if (err.response?.status === 401) {
          router.replace('/auth/login');
        }
      } finally {
        setLoading((prev) => ({ ...prev, schedule: false }));
      }
    };
    fetchClassSchedule();
  }, [token, teacher?.teacher, router, error]);

  // Fetch attendance data
  useEffect(() => {
    const fetchAttendance = async () => {
      if (!token || !teacher?.teacher) {
        console.log('No token or teacher ID, skipping attendance fetch');
        setLoading((prev) => ({ ...prev, attendance: false }));
        return;
      }
      setLoading((prev) => ({ ...prev, attendance: true }));
      try {
        console.log('Fetching attendance for teacher:', teacher.teacher);
        const response = await axios.get<AttendanceRecord[]>(
          `${BASE_URL}/api/attendance-t/list/?teacher=${teacher.teacher}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log('Attendance response:', JSON.stringify(response.data, null, 2));
        console.log('Subject IDs in classSchedule:', classSchedule.map((s) => s.subjectId));
        const normalizedData: Record<string, string> = {};
        if (response.data.length === 0) {
          console.log('No attendance records found for teacher:', teacher.teacher);
        }
        response.data.forEach((record) => {
          const normalizedDate = record.date.split('T')[0];
          const subjectId = typeof record.subject === 'object' ? record.subject.id.toString() : record.subject.toString();
          const status = record.status === 'late' ? 'retard' :
                         record.status === 'en_attente' ? 'att' :
                         ['present', 'absent'].includes(record.status) ? record.status : 'not_set';
          console.log(`Processing record: ${normalizedDate}-${subjectId} = ${status}`);
          normalizedData[`${normalizedDate}-${subjectId}`] = status;
        });
        console.log('Normalized attendance data:', JSON.stringify(normalizedData, null, 2));
        setAttendanceData(normalizedData);
        setLoading((prev) => ({ ...prev, attendance: false }));
      } catch (err: any) {
        console.error('Attendance fetch error:', err.response?.data || err.message);
        setError(
          `Failed to load attendance: ${
            err.response?.status === 401 ? 'Unauthorized access' : err.response?.data?.detail || err.message
          }`
        );
        setLoading((prev) => ({ ...prev, attendance: false }));
        if (err.response?.status === 401) {
          router.replace('/auth/login');
        }
      }
    };
    fetchAttendance();
  }, [token, teacher?.teacher, attendanceVersion, router]);

  // WebSocket for real-time updates
  useEffect(() => {
    if (!teacher?.teacher || !token) return;
    console.log('Connecting to WebSocket with token:', token);
    const ws = new WebSocket(`${WS_URL}?token=${token}`);

    ws.onopen = () => console.log('WebSocket connected');
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', JSON.stringify(data, null, 2));
        console.log('Expected teacherId:', teacher.teacher);
        console.log('Received teacherId:', data.teacherId);
        console.log('Subject IDs in classSchedule:', classSchedule.map((s) => s.subjectId));
        if (data.type === 'attendance_update' && data.teacherId.toString() === teacher.teacher.toString()) {
          const normalizedStatus = data.status === 'late' ? 'retard' :
                                   data.status === 'en_attente' ? 'att' :
                                   ['present', 'absent'].includes(data.status) ? data.status : 'not_set';
          console.log(`Updating attendance: ${data.date}-${data.subjectId} = ${normalizedStatus}`);
          setAttendanceData((prev) => ({
            ...prev,
            [`${data.date}-${data.subjectId}`]: normalizedStatus,
          }));
          setAttendanceVersion((v) => v + 1);
        } else {
          console.log('Message ignored: Invalid type or teacherId mismatch', {
            type: data.type,
            teacherIdMatch: data.teacherId?.toString() === teacher.teacher.toString(),
          });
        }
      } catch (err) {
        console.error('WebSocket message parse error:', err);
        setError('Failed to process attendance update.');
      }
    };
    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      setError('Real-time updates unavailable.');
    };
    ws.onclose = () => console.log('WebSocket disconnected');

    return () => ws.close();
  }, [teacher?.teacher, token]);

  const qrCodeData = teacher?.teacher
    ? `Teacher ID: ${teacher.teacher}\nName: ${teacher.name}`
    : 'Loading...';

  const getWeekDates = (): Date[] => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  };

  const formatDate = (date: Date): string =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const formatDateKey = (date: Date): string => {
    if (!date || isNaN(date.getTime())) {
      console.error('Invalid date in formatDateKey:', date);
      return '';
    }
    return date.toISOString().split('T')[0];
  };

  const getSchedulesForDay = (date: Date): ClassSchedule[] => {
    const dayName = date.toLocaleString('en-US', { weekday: 'short' }).toUpperCase();
    console.log(`Filtering schedules for day: ${dayName}`);
    const schedules = classSchedule.filter((sch) => {
      const match = sch.day === dayName;
      console.log(`Schedule ID ${sch.id}, Subject ID ${sch.subjectId}: day=${sch.day}, match=${match}`);
      return match;
    });
    console.log(`Schedules for ${dayName}:`, JSON.stringify(schedules, null, 2));
    return schedules;
  };

  const getStatusStyle = (status?: string): StyleProp<ViewStyle> => {
    switch (status) {
      case 'present':
        return tw`bg-green-500/20 border-green-500/30`;
      case 'absent':
        return tw`bg-red-500/20 border-red-500/30`;
      case 'retard':
        return tw`bg-yellow-500/20 border-yellow-500/30`;
      case 'att':
        return tw`bg-blue-500/20 border-blue-500/30`;
      case 'not_set':
        return tw`bg-gray-200 border-gray-300`;
      default:
        console.warn(`Unknown status: ${status}`);
        return tw`bg-gray-200 border-gray-300`;
    }
  };

  const getStatusTextStyle = (status?: string): StyleProp<TextStyle> => {
    switch (status) {
      case 'present':
        return tw`text-green-600`;
      case 'absent':
        return tw`text-red-600`;
      case 'retard':
        return tw`text-yellow-600`;
      case 'att':
        return tw`text-blue-600`;
      case 'not_set':
        return tw`text-gray-600`;
      default:
        console.warn(`Unknown status: ${status}`);
        return tw`text-gray-600`;
    }
  };

  const getStatusIcon = (status?: string): JSX.Element | null => {
    switch (status) {
      case 'present':
        return <Ionicons name="checkmark" size={16} color="#16a34a" style={tw`mr-1`} />;
      case 'absent':
        return <Ionicons name="close" size={16} color="#dc2626" style={tw`mr-1`} />;
      case 'retard':
        return <Ionicons name="time-outline" size={16} color="#ca8a04" style={tw`mr-1`} />;
      case 'att':
        return <Ionicons name="hourglass-outline" size={16} color="#2563eb" style={tw`mr-1`} />;
      case 'not_set':
        return <Ionicons name="help-circle-outline" size={16} color="#4b5563" style={tw`mr-1`} />;
      default:
        console.warn(`Unknown status: ${status}`);
        return <Ionicons name="help-circle-outline" size={16} color="#4b5563" style={tw`mr-1`} />;
    }
  };

  const weekDates = getWeekDates();

  return (
    <View style={tw`flex-1 bg-gray-100`}>
      <ScrollView contentContainerStyle={tw`p-5 flex-grow`}>
        <View style={tw`items-center mb-8`}>
          <Text style={tw`text-2xl font-bold text-gray-800 mb-4`}>Your QR Code</Text>
          <View style={tw`bg-white p-4 rounded-xl shadow-md`}>
            {loading.profile ? (
              <ActivityIndicator size="large" color="#6C63FF" />
            ) : teacher ? (
              teacher.teacher ? (
                <>
                  <Text style={tw`text-gray-600 mb-2 text-center`}>QR Code for Attendance</Text>
                  <QRCode value={qrCodeData} size={180} color="#000" backgroundColor="#FFF" />
                </>
              ) : (
                <Text style={tw`text-red-500 text-center`}>Failed to load QR code: No teacher identifier</Text>
              )
            ) : (
              <Text style={tw`text-red-500 text-center`}>Failed to load teacher profile</Text>
            )}
          </View>
          <Text style={tw`text-gray-600 mt-2`}>Scan to mark attendance</Text>
        </View>

        <View style={tw`bg-white rounded-xl p-5 shadow-md`}>
          <Text style={tw`text-xl font-semibold text-gray-800 mb-4`}>
            Attendance - Week of {formatDate(weekDates[0])}
          </Text>

          {error && <Text style={tw`text-red-500 text-center mb-4`}>{error}</Text>}
          {loading.profile || loading.attendance || loading.schedule ? (
            <ActivityIndicator size="large" color="#6C63FF" style={tw`my-4`} />
          ) : classSchedule.length === 0 ? (
            <Text style={tw`text-gray-500 text-center p-3`}>No schedules assigned to this teacher. Please add schedules in the admin panel.</Text>
          ) : (
            weekDates.map((date, index) => {
              const schedules = getSchedulesForDay(date);
              return (
                <View key={index} style={tw`mb-4`}>
                  <Text style={tw`text-lg font-medium text-gray-700 bg-gray-100 p-2 rounded-t-lg`}>
                    {date.toLocaleString('en-US', { weekday: 'long' })}, {formatDate(date)}
                  </Text>
                  {schedules.length > 0 ? (
                    schedules.map((cls, clsIndex) => {
                      console.log('Schedule item ID:', cls.id, 'Subject ID:', cls.subjectId, typeof cls.subjectId);
                      const status = attendanceData[`${formatDateKey(date)}-${cls.subjectId}`] || 'not_set';
                      console.log(`Rendering schedule ID ${cls.id}, Subject ID ${cls.subjectId} for ${formatDateKey(date)}: status=${status}`);
                      return (
                        <View
                          key={cls.id ?? `fallback-${clsIndex}`}
                          style={tw`flex-row justify-between items-center p-3 border-b border-gray-200`}
                        >
                          <View style={tw`flex-1`}>
                            <Text style={tw`font-medium text-gray-800`}>{cls.subject}</Text>
                            <Text style={tw`text-sm text-gray-500`}>
                              {cls.start_time} - {cls.end_time} ({cls.classe})
                            </Text>
                          </View>
                          <View
                            style={[tw`flex-row items-center px-3 py-1 rounded-full border`, getStatusStyle(status)]}
                          >
                            {getStatusIcon(status)}
                            <Text style={[tw`text-sm capitalize`, getStatusTextStyle(status)]}>
                              {status.replace('_', ' ')}
                            </Text>
                          </View>
                        </View>
                      );
                    })
                  ) : (
                    <Text style={tw`text-gray-500 text-center p-3`}>No classes scheduled</Text>
                  )}
                </View>
              );
            })
          )}
        </View>

        <View style={tw`bg-white rounded-xl p-5 mt-4 shadow-md`}>
          <Text style={tw`text-xl font-semibold text-gray-800 mb-4`}>Attendance Legend</Text>
          <View style={tw`flex flex-wrap gap-4`}>
            {[
              { status: 'present', color: 'bg-green-500', text: 'Present - Attended class' },
              { status: 'absent', color: 'bg-red-500', text: 'Absent - Missed class' },
              { status: 'retard', color: 'bg-yellow-500', text: 'Retard - Late to class' },
              { status: 'att', color: 'bg-blue-500', text: 'En Attente - Pending verification' },
              { status: 'not_set', color: 'bg-gray-400', text: 'Not Set - No record' },
            ].map((item) => (
              <View key={item.status} style={tw`flex-row items-center gap-2`}>
                <View style={tw`w-4 h-4 rounded-full ${item.color}`} />
                <Text style={tw`text-gray-700`}>{item.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={tw`flex-row justify-around py-4 bg-white border-t border-gray-200 shadow-md`}>
        <TouchableOpacity style={tw`items-center`} onPress={() => router.push('/teacher-dashboard')}>
          <Ionicons name="home" size={24} color="#6C63FF" />
          <Text style={tw`text-xs text-gray-600`}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={tw`items-center`} onPress={() => router.push('/teacher_schedule')}>
          <Ionicons name="calendar" size={24} color="#BDBDBD" />
          <Text style={tw`text-xs text-gray-600`}>Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity style={tw`items-center`} onPress={() => router.push('/teachergrades')}>
          <Ionicons name="stats-chart" size={24} color="#BDBDBD" />
          <Text style={tw`text-xs text-gray-600`}>Grades</Text>
        </TouchableOpacity>
        <TouchableOpacity style={tw`items-center`} onPress={() => router.push('./profile')}>
          <Ionicons name="person" size={24} color="#BDBDBD" />
          <Text style={tw`text-xs text-gray-600`}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default TeacherAttendanceScreen;