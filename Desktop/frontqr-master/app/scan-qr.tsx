import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StyleProp,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import tw from 'twrnc';
import * as Notifications from 'expo-notifications';

// Configure Expo Notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Use 10.0.2.2 for Android emulator to access host machine
const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';
const WS_URL = Platform.OS === 'android' ? 'ws://10.0.2.2:8000/ws/attendance/' : 'ws://localhost:8000/ws/attendance/';

interface AttendanceRecord {
  date: string;
  schedule_id: string;
  status: 'present' | 'absent' | 'retard' | 'att' | 'not_set';
}

interface StudentProfile {
  name: string;
  photo?: string;
  studentId: string;
  email?: string;
  prenom?: string;
  nom?: string;
  level?: number;
  qrCode?: string;
}

interface ScheduleItem {
  id: number;
  day: string;
  subject: number;
  start_time: string;
  end_time: string;
  Teacher: number;
  classe: number;
  level: number;
  notes: string;
}

interface ClassSchedule {
  id: string;
  subject: string;
  day: string;
  start_time: string;
  end_time: string;
  teacher: string;
}

interface Subject {
  id: number;
  nom: string;
}

interface TeacherDetail {
  id: number;
  prenom: string;
  nom: string;
}

const StudentAttendanceScreen: React.FC = () => {
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [attendanceData, setAttendanceData] = useState<Record<string, string>>({});
  const [classSchedule, setClassSchedule] = useState<ClassSchedule[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState({
    profile: true,
    attendance: true,
    schedule: true,
    subjects: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [attendanceVersion, setAttendanceVersion] = useState(0);
  const router = useRouter();

  // Request notification permissions
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          console.log('Notification permissions not granted');
          setError('Please enable notifications to receive attendance updates.');
          return;
        }

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('attendance', {
            name: 'Attendance Updates',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
          });
        }

        console.log('Notification permissions granted');
      } catch (err) {
        console.error('Notification setup error:', err);
        setError('Failed to set up notifications.');
      }
    };

    setupNotifications();
  }, []);

  // Send a local notification
  const sendLocalNotification = async (title: string, body: string) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: 'default',
          data: { type: 'attendance_update' },
        },
        trigger: null, // Send immediately
      });
      console.log('Local notification scheduled:', title, body);
    } catch (err) {
      console.error('Error scheduling notification:', err);
      setError('Failed to send notification.');
    }
  };

  // Fetch token
  useEffect(() => {
    const getToken = async () => {
      try {
        let storedToken = await AsyncStorage.getItem('access_token');
        if (!storedToken) {
          storedToken = await refreshAccessToken();
          if (!storedToken) {
            console.log('No token available, redirecting to login');
            router.replace('/auth/login');
            return;
          }
        }
        console.log('Token retrieved:', storedToken);
        setToken(storedToken);
      } catch (err) {
        console.error('Token fetch error:', err);
        setError('Authentication failed. Please log in again.');
        router.replace('/auth/login');
      }
    };
    getToken();
  }, [router]);

  // Fetch student profile
  useEffect(() => {
    const fetchStudentProfile = async () => {
      if (!token) return;
      setLoading((prev) => ({ ...prev, profile: true }));
      try {
        console.log('Fetching student profile with token:', token);
        const response = await axios.get<StudentProfile>(`${BASE_URL}/api/student/profile/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Student profile response:', JSON.stringify(response.data, null, 2));
        setStudent(response.data);
        setLoading((prev) => ({ ...prev, profile: false }));
      } catch (err: any) {
        console.error('Profile fetch error:', err.response?.data || err.message);
        setError('Failed to load your profile: ' + (err.response?.data?.error || err.message));
        setLoading((prev) => ({ ...prev, profile: false }));
      }
    };
    fetchStudentProfile();
  }, [token]);

  // Fetch attendance data
  useEffect(() => {
    const fetchAttendance = async () => {
      if (!token) return;
      setLoading((prev) => ({ ...prev, attendance: true }));
      try {
        console.log('Fetching attendance for authenticated student');
        const response = await axios.get<Record<string, string>>(`${BASE_URL}/api/student/attendance/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Attendance response:', JSON.stringify(response.data, null, 2));
        const normalizedData: Record<string, string> = {};
        Object.keys(response.data || {}).forEach((key) => {
          const status = response.data[key].toLowerCase();
          normalizedData[key] = status === 'pending' ? 'att' : status;
        });
        setAttendanceData(normalizedData);
        setLoading((prev) => ({ ...prev, attendance: false }));
      } catch (err: any) {
        console.error('Attendance fetch error:', err.response?.data || err.message);
        setError('Failed to load attendance data: ' + (err.response?.data?.error || err.message));
        setLoading((prev) => ({ ...prev, attendance: false }));
      }
    };
    fetchAttendance();
  }, [token, attendanceVersion]);

  // Fetch class schedule with retry
  useEffect(() => {
    const fetchClassSchedule = async (retryCount = 3, delay = 2000) => {
      if (!token) return;
      setLoading((prev) => ({ ...prev, schedule: true }));
      let attempts = 0;

      while (attempts < retryCount) {
        try {
          console.log(`Fetching schedule (attempt ${attempts + 1})`);
          const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

          const scheduleResponse = await axios.get<ScheduleItem[]>(`${BASE_URL}/api/student/schedule/`, { headers });
          console.log('Schedule response:', JSON.stringify(scheduleResponse.data, null, 2));

          const subjectsResponse = await axios.get<Subject[]>(`${BASE_URL}/api/student/subjects/`, { headers });
          console.log('Subjects response:', JSON.stringify(subjectsResponse.data, null, 2));
          const subjectMap: Record<number, string> = subjectsResponse.data.reduce(
            (acc: Record<number, string>, subject) => {
              acc[subject.id] = subject.nom;
              console.log(`Mapping subject ID ${subject.id} to ${subject.nom}`);
              return acc;
            },
            {}
          );

          const teachersResponse = await axios.get<TeacherDetail[]>(`${BASE_URL}/api/student/teachers/`, { headers });
          console.log('Teachers response:', JSON.stringify(teachersResponse.data, null, 2));
          const teacherMap: Record<number, string> = teachersResponse.data.reduce(
            (acc: Record<number, string>, teacher) => {
              acc[teacher.id] = `${teacher.prenom} ${teacher.nom}`;
              return acc;
            },
            {}
          );

          const formattedSchedule = scheduleResponse.data.map((item) => {
            const schedule = {
              id: item.id.toString(),
              subject: subjectMap[item.subject] || 'Unknown Subject',
              day: item.day.toUpperCase(),
              start_time: item.start_time.slice(0, 5),
              end_time: item.end_time.slice(0, 5),
              classe: item.classe,
              teacher: teacherMap[item.Teacher] || 'Unknown Teacher',
            };
            console.log(`Formatted schedule item: ${JSON.stringify(schedule, null, 2)}`);
            return schedule;
          });

          setClassSchedule(formattedSchedule);
          setLoading((prev) => ({ ...prev, schedule: false }));
          return;
        } catch (err: any) {
          attempts++;
          console.error(`Schedule fetch error (attempt ${attempts}):`, err.response?.data || err.message);
          if (attempts >= retryCount) {
            setError('Failed to load class schedule after multiple attempts: ' + (err.response?.data?.error || err.message));
            setLoading((prev) => ({ ...prev, schedule: false }));
            return;
          }
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    };
    fetchClassSchedule();
  }, [token]);

  // Fetch subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!token) return;
      setLoading((prev) => ({ ...prev, subjects: true }));
      try {
        console.log('Fetching subjects');
        const response = await axios.get<Subject[]>(`${BASE_URL}/api/student/subjects/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Subjects response:', JSON.stringify(response.data, null, 2));
        setSubjects(response.data || []);
        setLoading((prev) => ({ ...prev, subjects: false }));
      } catch (err: any) {
        console.error('Subjects fetch error:', err.response?.data || err.message);
        setError('Failed to load subjects: ' + (err.response?.data?.error || err.message));
        setLoading((prev) => ({ ...prev, subjects: false }));
      }
    };
    fetchSubjects();
  }, [token]);

  // WebSocket for real-time updates
  useEffect(() => {
    if (!student?.studentId || !token || classSchedule.length === 0) {
      console.log('WebSocket setup skipped: Missing studentId, token, or classSchedule');
      return;
    }

    console.log('Connecting to WebSocket with token:', token);
    const ws = new WebSocket(`${WS_URL}?token=${token}`);

    ws.onopen = () => console.log('WebSocket connected');

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('WebSocket message received:', JSON.stringify(message, null, 2));

        // Validate message structure
        if (
          message.type !== 'attendance_update' ||
          !message.studentId ||
          !message.scheduleId ||
          !message.date
        ) {
          console.error('Invalid WebSocket message format:', message);
          return;
        }

        // Ensure the message is for the current student
        if (message.studentId.toString() !== student.studentId.toString()) {
          console.log('Message ignored: studentId mismatch');
          return;
        }

        // Normalize and validate status
        const validStatuses = ['present', 'absent', 'retard', 'att', 'not_set'];
        let normalizedStatus = message.status ? message.status.toLowerCase() : null;

        // Map unexpected statuses
        if (normalizedStatus === 'pending') {
          normalizedStatus = 'att'; // Map "pending" to "att" (En Attente)
          console.log('Mapped status "pending" to "att"');
        } else if (!normalizedStatus || !validStatuses.includes(normalizedStatus)) {
          normalizedStatus = 'not_set'; // Default to "not_set" for invalid or missing status
          console.log(`Invalid or missing status "${message.status}", defaulting to "not_set"`);
        }

        console.log(`Normalized status (WebSocket): ${normalizedStatus}`);

        // Update attendance data
        const dateKey = `${message.date}-${message.scheduleId}`;
        setAttendanceData((prev) => {
          const updatedData = { ...prev };
          if (normalizedStatus === 'not_set') {
            delete updatedData[dateKey]; // Remove record if status is "not_set"
            console.log(`Deleted attendance for dateKey ${dateKey}`);
          } else {
            updatedData[dateKey] = normalizedStatus;
            console.log(`Updated attendance for dateKey ${dateKey}: ${normalizedStatus}`);
          }
          console.log('Updated attendanceData:', JSON.stringify(updatedData, null, 2));
          return updatedData;
        });

        setAttendanceVersion((v) => v + 1);

        // Find schedule for notification
        const schedule = classSchedule.find((cls) => cls.id === message.scheduleId.toString());
        const statusText = normalizedStatus.replace('_', ' ').toUpperCase();
        const notificationBody = schedule
          ? `Your attendance for ${schedule.subject} on ${message.date} has been marked as ${statusText}.`
          : `Your attendance on ${message.date} has been marked as ${statusText}.`;
        sendLocalNotification('Attendance Updated', notificationBody);
      } catch (err) {
        console.error('WebSocket message parsing error:', err);
        setError('Failed to process attendance update.');
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      setError('Real-time updates unavailable. Check server connection.');
    };

    ws.onclose = () => console.log('WebSocket disconnected');

    return () => ws.close();
  }, [student?.studentId, token, classSchedule]);

  const qrCodeData = student?.studentId
    ? `Student ID: ${student.studentId}\nName: ${student.name}\nEmail: ${student.email || 'N/A'}`
    : 'Loading...';

  const getSubjectName = (subject: string): string => subject;

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

  const weekDates = getWeekDates();
  const formatDate = (date: Date): string => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const formatDateKey = (date: Date): string => date.toISOString().split('T')[0];

  const getClassesForDay = (date: Date): ClassSchedule[] => {
    const dayName = date.toLocaleString('en-US', { weekday: 'short' }).toUpperCase();
    return classSchedule.filter((cls) => cls.day === dayName);
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
      default:
        console.warn(`Unknown status: ${status}, using default style`);
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
      default:
        console.warn(`Unknown status: ${status}, using default text style`);
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
      default:
        console.warn(`Unknown status: ${status}, using default icon`);
        return <Ionicons name="help-circle-outline" size={16} color="#4b5563" style={tw`mr-1`} />;
    }
  };

  return (
    <View style={tw`flex-1 bg-gray-100`}>
      <ScrollView contentContainerStyle={tw`p-5 flex-grow`}>
        {error && <Text style={tw`text-red-500 text-center mb-4`}>{error}</Text>}
        <View style={tw`items-center mb-8`}>
          <Text style={tw`text-2xl font-bold text-gray-800 mb-4`}>Your QR Code</Text>
          <View style={tw`bg-white p-4 rounded-xl shadow-md`}>
            {loading.profile ? (
              <ActivityIndicator size="large" color="#6C63FF" />
            ) : student ? (
              student.qrCode ? (
                <>
                  <Text style={tw`text-gray-600 mb-2`}>Displaying stored QR code</Text>
                  <Image
                    source={{ uri: student.qrCode }}
                    style={tw`w-45 h-45`}
                    onError={(e) => console.log('QR code image load error:', e.nativeEvent.error)}
                  />
                </>
              ) : student.studentId ? (
                <>
                  <Text style={tw`text-gray-600 mb-2`}>Generating QR code client-side</Text>
                  <QRCode value={qrCodeData} size={180} color="#000" backgroundColor="#FFF" />
                </>
              ) : (
                <Text style={tw`text-red-500`}>Failed to load QR code data: No student ID available</Text>
              )
            ) : (
              <Text style={tw`text-red-500`}>Failed to load QR code data: Student profile not loaded</Text>
            )}
          </View>
          <Text style={tw`text-gray-600 mt-2`}>Scan to Mark Attendance</Text>
        </View>

        <View style={tw`bg-white rounded-xl p-5 shadow-md`}>
          <Text style={tw`text-xl font-semibold text-gray-800 mb-4`}>
            Attendance - Week of {formatDate(weekDates[0])}
          </Text>

          {loading.profile || loading.attendance || loading.schedule || loading.subjects ? (
            <ActivityIndicator size="large" color="#6C63FF" />
          ) : classSchedule.length === 0 ? (
            <Text style={tw`text-gray-500 text-center p-3`}>No class schedule available</Text>
          ) : (
            weekDates.map((date, index) => {
              const classes = getClassesForDay(date);
              return (
                <View key={index} style={tw`mb-4`}>
                  <Text style={tw`text-lg font-medium text-gray-700 bg-gray-100 p-2 rounded-t-lg`}>
                    {date.toLocaleString('en-US', { weekday: 'long' })}, {formatDate(date)}
                  </Text>
                  {classes.length > 0 ? (
                    classes.map((cls) => {
                      const status = attendanceData[`${formatDateKey(date)}-${cls.id}`] || 'not_set';
                      return (
                        <View
                          key={cls.id}
                          style={tw`flex-row justify-between items-center p-3 border-b border-gray-200`}
                        >
                          <View>
                            <Text style={tw`font-medium text-gray-800`}>{getSubjectName(cls.subject)}</Text>
                            <Text style={tw`text-sm text-gray-500`}>
                              {cls.start_time} - {cls.end_time} ({cls.teacher})
                            </Text>
                          </View>
                          <View style={[tw`flex-row items-center px-3 py-1 rounded-full border`, getStatusStyle(status)]}>
                            {getStatusIcon(status)}
                            <Text style={[tw`text-sm capitalize`, getStatusTextStyle(status)]}>
                              {status === 'att' ? 'En Attente' : status.replace('_', ' ')}
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

        {/* Attendance Legend */}
        <View style={tw`bg-white rounded-xl p-5 mt-4 shadow-md`}>
          <Text style={tw`text-xl font-semibold text-gray-800 mb-4`}>Attendance Legend</Text>
          <View style={tw`flex flex-wrap gap-4`}>
            <View style={tw`flex-row items-center gap-2`}>
              <View style={tw`w-4 h-4 rounded-full bg-green-500`}></View>
              <Text style={tw`text-gray-700`}>Present - Attended class</Text>
            </View>
            <View style={tw`flex-row items-center gap-2`}>
              <View style={tw`w-4 h-4 rounded-full bg-red-500`}></View>
              <Text style={tw`text-gray-700`}>Absent - Missed class</Text>
            </View>
            <View style={tw`flex-row items-center gap-2`}>
              <View style={tw`w-4 h-4 rounded-full bg-yellow-500`}></View>
              <Text style={tw`text-gray-700`}>Retard - Late to class</Text>
            </View>
            <View style={tw`flex-row items-center gap-2`}>
              <View style={tw`w-4 h-4 rounded-full bg-blue-500`}></View>
              <Text style={tw`text-gray-700`}>En Attente - Attendance pending verification</Text>
            </View>
            <View style={tw`flex-row items-center gap-2`}>
              <View style={tw`w-4 h-4 rounded-full bg-gray-400`}></View>
              <Text style={tw`text-gray-700`}>Not Set - No record</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={tw`flex-row justify-around py-4 bg-white border-t border-gray-200 shadow-md`}>
        <TouchableOpacity style={tw`items-center`} onPress={() => router.push('/dashboard')}>
          <Ionicons name="home" size={24} color="#6C63FF" />
        </TouchableOpacity>
        <TouchableOpacity style={tw`items-center`} onPress={() => router.push('/schedule')}>
          <Ionicons name="calendar" size={24} color="#BDBDBD" />
        </TouchableOpacity>
        <TouchableOpacity style={tw`items-center`} onPress={() => router.push('/grades')}>
          <Ionicons name="stats-chart" size={24} color="#BDBDBD" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Placeholder for refreshAccessToken (replace with your actual implementation)
const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const refreshToken = await AsyncStorage.getItem('refresh_token');
    if (!refreshToken) return null;
    const response = await axios.post(`${BASE_URL}/api/token/refresh/`, { refresh: refreshToken });
    const newToken = response.data.access;
    await AsyncStorage.setItem('access_token', newToken);
    return newToken;
  } catch (err) {
    console.error('Token refresh error:', err);
    return null;
  }
};

export default StudentAttendanceScreen;