import React, { useState, useEffect, FC } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  SectionList,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { refreshAccessToken } from './utils/auth';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';


interface Attendance {
  child_names: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Pending';
  subject: string;
  notes: string;
  start_time: string;
  end_time: string;
}

interface ApiAttendance {
  child_names?: string;
  date?: string;
  status?: string;
  subject?: string;
  notes?: string;
  start_time?: string;
  end_time?: string;
}

interface ApiError {
  error?: string;
  message?: string;
}

type ApiResponse = ApiAttendance[] | ApiError;

interface StatusStyle {
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
}

interface WebSocketMessage {
  type: string;
  studentId: number;
  scheduleId: number;
  date: string;
  status: string;
}

const statusStyles: Record<string, StatusStyle> = {
  Present: { icon: 'check-circle', color: '#3B82F6' },
  Absent: { icon: 'cancel', color: '#4C1D95' },
  Late: { icon: 'access-time', color: '#9333EA' },
  Pending: { icon: 'hourglass-empty', color: '#6B7280' },
  Default: { icon: 'help-outline', color: '#6B7280' },
};

const ChildAttendanceScreen: FC = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [uniqueDates, setUniqueDates] = useState<string[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const router = useRouter();

  // Request notification permissions
  useEffect(() => {
    const setupNotifications = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Notification permissions not granted');
      }
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
    };
    setupNotifications();
  }, []);

  // WebSocket setup
  useEffect(() => {
    const connectWebSocket = async () => {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        console.error('No token found for WebSocket');
        return;
      }
      const wsUrl = Platform.OS === 'android'
        ? 'ws://10.0.2.2:8000/ws/attendance/'
        : 'ws://localhost:8000/ws/attendance/';
      const socket = new WebSocket(`${wsUrl}?token=${token}`);

      socket.onopen = () => {
        console.log('WebSocket connected');
      };

      socket.onmessage = (e) => {
        try {
          const data: WebSocketMessage = JSON.parse(e.data);
          if (data.type === 'attendance_update') {
            const { studentId, date, status } = data;
            // Find the child's name from existing records
            const record = attendanceRecords.find(
              (r) => r.date === date && r.status.toLowerCase() === status.toLowerCase()
            );
            const childName = record?.child_names || 'Your child';
            const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
            // Trigger notification
            Notifications.scheduleNotificationAsync({
              content: {
                title: 'Attendance Update',
                body: `Your child ${childName} has recorded ${capitalizedStatus} now`,
                data: { studentId, date, status },
              },
              trigger: null,
            });
            // Refresh attendance data
            fetchChildrenAttendance();
          }
        } catch (err) {
          console.error('WebSocket message error:', err);
        }
      };

      socket.onerror = (err) => {
        console.error('WebSocket error:', err);
      };

      socket.onclose = () => {
        console.log('WebSocket closed');
      };

      setWs(socket);
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  const formatDate = (date: string): string => {
    try {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { weekday: 'long', month: '2-digit', day: '2-digit', year: 'numeric' });
    } catch (e) {
      return date;
    }
  };

  const formatTimeRange = (startTime: string, endTime: string): string => {
    try {
      const start = new Date(`1970-01-01T${startTime}Z`);
      const end = new Date(`1970-01-01T${endTime}Z`);
      const startFormatted = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      const endFormatted = end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      return `${startFormatted} - ${endFormatted}`;
    } catch (e) {
      return 'Time unavailable';
    }
  };

  const fetchChildrenAttendance = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('access_token');
      const role = await AsyncStorage.getItem('user_role');
      if (!token || role !== 'parent') {
        setError('Please log in as a parent.');
        router.replace('/auth/login?role=parent');
        return;
      }

      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
      const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';

      let response = await fetch(`${baseUrl}/api/parent/children/attendance/`, { headers });
      const responseData: ApiResponse = await response.json();

      if (response.status === 401 && retryCount < 3) {
        const newToken = await refreshAccessToken();
        if (!newToken) {
          setError('Session expired. Please log in again.');
          router.replace('/auth/login?role=parent');
          return;
        }
        headers.Authorization = `Bearer ${newToken}`;
        response = await fetch(`${baseUrl}/api/parent/children/attendance/`, { headers });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const retryData: ApiResponse = await response.json();
        if (Array.isArray(retryData)) {
          const normalizedRetryData: Attendance[] = retryData.map((item: ApiAttendance) => ({
            child_names: item.child_names || 'Unknown Student',
            date: item.date || new Date().toISOString().split('T')[0],
            status: (item.status || 'Pending') as Attendance['status'],
            subject: item.subject || 'Unknown Subject',
            notes: item.notes || '',
            start_time: item.start_time || '00:00:00',
            end_time: item.end_time || '00:00:00',
          }));
          setAttendanceRecords(normalizedRetryData);
        } else {
          throw new Error('Invalid retry data format');
        }
        setRetryCount(retryCount + 1);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (Array.isArray(responseData)) {
        const normalizedData: Attendance[] = responseData.map((item: ApiAttendance) => ({
          child_names: item.child_names || 'Unknown Student',
          date: item.date || new Date().toISOString().split('T')[0],
          status: (item.status || 'Pending') as Attendance['status'],
          subject: item.subject || 'Unknown Subject',
          notes: item.notes || '',
          start_time: item.start_time || '00:00:00',
          end_time: item.end_time || '00:00:00',
        }));
        setAttendanceRecords(normalizedData);

        const dates: string[] = [...new Set(normalizedData.map((item) => item.date))].sort(
          (a: string, b: string) => new Date(b).getTime() - new Date(a).getTime(),
        );
        setUniqueDates(dates);
        setSelectedDate(dates[0] || new Date().toISOString().split('T')[0]);
        setRetryCount(0);
      } else {
        throw new Error('Invalid response data format');
      }
    } catch (error: any) {
      const message = error.message.includes('Parent profile not found')
        ? 'No parent profile associated with your account. Please contact support.'
        : error.message.includes('No attendance')
        ? 'No attendance records linked to your account.'
        : 'Failed to load attendance records. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChildrenAttendance();
  }, []);

  const handleRetry = () => {
    if (retryCount >= 3) {
      setError('Max retries reached. Please check your connection or contact support.');
      return;
    }
    setRetryCount(retryCount + 1);
    fetchChildrenAttendance();
  };

  const AnimatedCard: FC<{ item: Attendance; index: number }> = ({ item, index }) => {
    const rotateX = useSharedValue(0);
    const rotateY = useSharedValue(0);
    const scale = useSharedValue(1);
    const translateY = useSharedValue(50);
    const opacity = useSharedValue(0);

    useEffect(() => {
      translateY.value = withTiming(0, { duration: 500 + index * 100 });
      opacity.value = withTiming(1, { duration: 500 + index * 100 });
    }, []);

    const gesture = Gesture.Pan()
      .onUpdate((event) => {
        rotateY.value = (event.translationX / 100) * 5;
        rotateX.value = (-event.translationY / 100) * 5;
      })
      .onEnd(() => {
        rotateX.value = withSpring(0);
        rotateY.value = withSpring(0);
      });

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { perspective: 1000 },
        { rotateX: `${rotateX.value}deg` },
        { rotateY: `${rotateY.value}deg` },
        { scale: scale.value },
        { translateY: translateY.value },
      ],
      opacity: opacity.value,
    }));

    const handlePressIn = () => {
      scale.value = withSpring(0.95);
    };

    const handlePressOut = () => {
      scale.value = withSpring(1);
    };

    const statusStyle = statusStyles[item.status] || statusStyles.Default;
    const childInitial = item.child_names?.charAt(0)?.toUpperCase() || '?';

    return (
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.scheduleCard, animatedStyle]}>
          <View style={[styles.childAvatar, { backgroundColor: statusStyle.color }]}>
            <Text style={styles.childInitial}>{childInitial}</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: statusStyle.color + '33' }]}>
                <MaterialIcons name={statusStyle.icon as keyof typeof MaterialIcons.glyphMap} size={30} color={statusStyle.color} />
              </View>
              <Text style={styles.cardTitle}>{item.status}</Text>
            </View>
            <Text style={styles.cardText}>Child: {item.child_names}</Text>
            <Text style={styles.cardText}>Subject: {item.subject}</Text>
            <Text style={styles.cardText}>Time: {formatTimeRange(item.start_time, item.end_time)}</Text>
            {item.notes && <Text style={styles.cardNotes}>Notes: {item.notes}</Text>}
          </View>
        </Animated.View>
      </GestureDetector>
    );
  };

  const sections = () => {
    const groupedByDate: { [key: string]: Attendance[] } = {};
    attendanceRecords
      .filter((record) => !selectedDate || record.date === selectedDate)
      .forEach((record) => {
        const date = record.date || new Date().toISOString().split('T')[0];
        if (!groupedByDate[date]) {
          groupedByDate[date] = [];
        }
        groupedByDate[date].push(record);
      });

    return Object.keys(groupedByDate)
      .map((date) => ({
        title: date,
        data: groupedByDate[date].sort((a, b) => a.child_names.localeCompare(b.child_names)),
      }))
      .sort((a, b) => new Date(b.title).getTime() - new Date(a.title).getTime());
  };

  if (isLoading) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading attendance...</Text>
        </View>
      </GestureHandlerRootView>
    );
  }

  if (error) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Children's Attendance</Text>
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Children's Attendance</Text>
          <TouchableOpacity onPress={fetchChildrenAttendance}>
            <Ionicons name="refresh" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={styles.headerText}>Select a Day</Text>
          </View>
          <FlatList
            data={uniqueDates}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.tableRow, selectedDate === item && styles.selectedRow]}
                onPress={() => setSelectedDate(item)}
              >
                <Text style={[styles.tableCell, selectedDate === item && styles.selectedCell]}>
                  {formatDate(item)}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.tableContent}
          />
          <TouchableOpacity
            style={styles.showAllButton}
            onPress={() => setSelectedDate('')}
          >
            <Text style={styles.showAllButtonText}>Show All Days</Text>
          </TouchableOpacity>
        </View>

        <SectionList
          sections={sections()}
          keyExtractor={(item, index) => `${item.child_names}-${item.date}-${item.subject}-${index}`}
          renderItem={({ item, index }) => <AnimatedCard item={item} index={index} />}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionHeader}>{formatDate(title)}</Text>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No attendance records available</Text>}
          contentContainerStyle={styles.listContent}
        />

        <View style={styles.bottomNavigation}>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/parent-dashboard')}>
            <Ionicons name="home" size={28} color="#7C3AED" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/child_schedules')}>
            <Ionicons name="calendar" size={28} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/child_grades')}>
            <Ionicons name="stats-chart" size={28} color="#9333EA" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FF',
  } as ViewStyle,
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F6FF',
  } as ViewStyle,
  loadingText: {
    fontSize: 20,
    color: '#1F2937',
    marginTop: 12,
    fontWeight: '600',
  } as TextStyle,
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F5F6FF',
  } as ViewStyle,
  errorText: {
    fontSize: 18,
    color: '#4C1D95',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  } as TextStyle,
  retryButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    elevation: 4,
  } as ViewStyle,
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  } as TextStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#3B82F6',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
  } as ViewStyle,
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  } as TextStyle,
  headerSpacer: {
    width: 24,
  } as ViewStyle,
  tableContainer: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  } as ViewStyle,
  headerText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  } as TextStyle,
  tableHeader: {
    backgroundColor: '#3B82F6',
    padding: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  } as ViewStyle,
  tableContent: {
    paddingVertical: 8,
  } as ViewStyle,
  tableRow: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#BFDBFE',
  } as ViewStyle,
  selectedRow: {
    backgroundColor: '#7C3AED',
  } as ViewStyle,
  tableCell: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  } as TextStyle,
  selectedCell: {
    color: '#FFFFFF',
    fontWeight: '700',
  } as TextStyle,
  showAllButton: {
    backgroundColor: '#9333EA',
    borderRadius: 8,
    padding: 12,
    margin: 8,
    alignItems: 'center',
  } as ViewStyle,
  showAllButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  } as TextStyle,
  listContent: {
    padding: 20,
    paddingBottom: 120,
  } as ViewStyle,
  sectionHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginVertical: 12,
    paddingLeft: 16,
    backgroundColor: '#BFDBFE',
    paddingVertical: 8,
    borderRadius: 8,
  } as TextStyle,
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  } as ViewStyle,
  childAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    elevation: 4,
  } as ViewStyle,
  childInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  } as TextStyle,
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  } as ViewStyle,
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  } as ViewStyle,
  cardContent: {
    flex: 1,
  } as ViewStyle,
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  } as TextStyle,
  cardText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  } as TextStyle,
  cardNotes: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    fontStyle: 'italic',
  } as TextStyle,
  emptyText: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 24,
  } as TextStyle,
  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#BFDBFE',
    elevation: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  } as ViewStyle,
  navItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
});

const ChildAttendance = React.memo(ChildAttendanceScreen);
export default ChildAttendance;
