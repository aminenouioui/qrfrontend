import React, { useState, useEffect, FC } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
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
  AnimatedStyleProp,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

interface Schedule {
  child_names: string;
  day: string;
  start_time: string;
  end_time: string;
  subject: string;
  teacher: string;
  classe: string;
  notes: string;
}

interface SubjectStyle {
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
}

const subjectStyles: Record<string, SubjectStyle> = {
  Drawing: { icon: "brush", color: "#7C3AED" },
  Music: { icon: "music-note", color: "#3B82F6" },
  Account: { icon: "calculate", color: "#6B7280" },
  math: { icon: "calculate", color: "#2563EB" },
  Science: { icon: "science", color: "#4C1D95" },
  physique: { icon: "science", color: "#9333EA" },
  Default: { icon: 'school', color: '#FFFFFF' },
  anglais: { icon: "book", color: "#9370DB" },
};

const daysOfWeek: (keyof ScheduleByDay)[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

interface ScheduleByDay {
  MON: Schedule[];
  TUE: Schedule[];
  WED: Schedule[];
  THU: Schedule[];
  FRI: Schedule[];
  SAT: Schedule[];
  SUN: Schedule[];
}

const ChildSchedulesScreen: FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [scheduleByDay, setScheduleByDay] = useState<ScheduleByDay>({
    MON: [],
    TUE: [],
    WED: [],
    THU: [],
    FRI: [],
    SAT: [],
    SUN: [],
  });
  const [selectedDay, setSelectedDay] = useState<keyof ScheduleByDay>('MON');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const router = useRouter();

  // Animation for day selector
  const selectedDayScale = useSharedValue<Record<string, number>>({
    MON: 1.1,
    TUE: 1,
    WED: 1,
    THU: 1,
    FRI: 1,
    SAT: 1,
    SUN: 1,
  });

  const dayAnimatedStyles = daysOfWeek.reduce((acc, day) => {
    acc[day] = useAnimatedStyle(() => ({
      transform: [{ scale: withSpring(selectedDayScale.value[day]) }],
      opacity: withSpring(selectedDayScale.value[day] === 1.1 ? 1 : 0.7),
    })) as AnimatedStyleProp<ViewStyle>;
    return acc;
  }, {} as Record<string, AnimatedStyleProp<ViewStyle>>);

  const normalizeTime = (time: string): string => {
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours, 10);
      const period = hour >= 12 ? 'PM' : 'AM';
      const adjustedHour = hour % 12 || 12;
      return `${adjustedHour}:${minutes} ${period}`;
    } catch (e) {
      return time;
    }
  };

  const fetchChildrenSchedules = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('access_token');
      const role = await AsyncStorage.getItem('user_role');
      console.log('Fetching schedules with token:', token?.slice(0, 10), '...', 'role:', role);
      if (!token || role !== 'parent') {
        console.error('Invalid token or role, redirecting to login');
        setError('Please log in as a parent.');
        router.replace('/auth/login?role=parent');
        return;
      }

      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
      const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';

      let response = await fetch(`${baseUrl}/api/parent/children/schedules/`, { headers });
      console.log('API Response Status:', response.status);
      const responseData = await response.json();
      console.log('API Response Data:', JSON.stringify(responseData, null, 2));

      if (response.status === 401 && retryCount < 3) {
        console.log('Token expired, attempting to refresh');
        const newToken = await refreshAccessToken();
        if (!newToken) {
          setError('Session expired. Please log in again.');
          router.replace('/auth/login?role=parent');
          return;
        }
        headers.Authorization = `Bearer ${newToken}`;
        response = await fetch(`${baseUrl}/api/parent/children/schedules/`, { headers });
        console.log('Retry Response Status:', response.status);
        const retryData = await response.json();
        console.log('Retry Response Data:', JSON.stringify(retryData, null, 2));
        if (!response.ok) {
          console.error('API Error:', retryData);
          throw new Error(retryData.error || retryData.message || `HTTP error! status: ${response.status}`);
        }
        setSchedules(retryData);
        setRetryCount(retryCount + 1);
        return;
      }

      if (!response.ok) {
        console.error('API Error:', responseData);
        throw new Error(responseData.error || responseData.message || `HTTP error! status: ${response.status}`);
      }

      setSchedules(responseData);
      setRetryCount(0);

      // Organize schedules by day
      const organizedSchedules: ScheduleByDay = {
        MON: [],
        TUE: [],
        WED: [],
        THU: [],
        FRI: [],
        SAT: [],
        SUN: [],
      };
      responseData.forEach((item: Schedule) => {
        const day = item.day.toUpperCase() as keyof ScheduleByDay;
        if (organizedSchedules[day]) {
          organizedSchedules[day].push({
            ...item,
            child_names: item.child_names || 'Unknown',
            subject: item.subject || 'N/A',
            teacher: item.teacher || 'N/A',
            classe: item.classe || 'N/A',
            notes: item.notes || '',
          });
        }
      });
      setScheduleByDay(organizedSchedules);
    } catch (error: any) {
      console.error('Fetch error:', error.message);
      const message = error.message.includes('Parent profile not found')
        ? 'No parent profile associated with your account. Please contact support.'
        : error.message.includes('No schedules')
        ? 'No schedules linked to your account.'
        : 'Failed to load schedules. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChildrenSchedules();
  }, []);

  const handleRetry = () => {
    if (retryCount >= 3) {
      setError('Max retries reached. Please check your connection or contact support.');
      return;
    }
    setRetryCount(retryCount + 1);
    fetchChildrenSchedules();
  };

  const AnimatedCard: FC<{ item: Schedule; index: number }> = ({ item, index }) => {
    const rotateX = useSharedValue(0);
    const rotateY = useSharedValue(0);
    const scale = useSharedValue(1);
    const translateY = useSharedValue(50);
    const opacity = useSharedValue(0);

    // Entry animation
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

    const subjectStyle = subjectStyles[item.subject] || subjectStyles.Default;
    const childInitial = item.child_names.charAt(0).toUpperCase();

    return (
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.scheduleCard, animatedStyle]}>
          <View style={[styles.childAvatar, { backgroundColor: subjectStyle.color }]}>
            <Text style={styles.childInitial}>{childInitial}</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: subjectStyle.color + '33' }]}>
                <MaterialIcons name={subjectStyle.icon} size={30} color={subjectStyle.color} />
              </View>
              <Text style={styles.cardTitle}>{item.subject}</Text>
            </View>
            <Text style={styles.cardText}>Child: {item.child_names}</Text>
            <Text style={styles.cardText}>
              Time: {normalizeTime(item.start_time)} - {normalizeTime(item.end_time)}
            </Text>
            <Text style={styles.cardText}>Teacher: {item.teacher}</Text>
            <Text style={styles.cardText}>Class: {item.classe}</Text>
            {item.notes && <Text style={styles.cardNotes}>Notes: {item.notes}</Text>}
          </View>
        </Animated.View>
      </GestureDetector>
    );
  };

  // Group schedules by child for SectionList
  const sections = () => {
    const daySchedules = scheduleByDay[selectedDay];
    const groupedByChild: { [key: string]: Schedule[] } = {};
    daySchedules.forEach((schedule) => {
      const child = schedule.child_names || 'Unknown';
      if (!groupedByChild[child]) {
        groupedByChild[child] = [];
      }
      groupedByChild[child].push(schedule);
    });

    return Object.keys(groupedByChild).map((child) => ({
      title: child,
      data: groupedByChild[child],
    }));
  };

  if (isLoading) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading schedules...</Text>
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
            <Text style={styles.headerTitle}>Children's Schedules</Text>
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
          <Text style={styles.headerTitle}>Children's Schedules</Text>
          <TouchableOpacity onPress={fetchChildrenSchedules}>
            <Ionicons name="refresh" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal contentContainerStyle={styles.daySelector}>
          {daysOfWeek.map((day) => {
            const isSelected = selectedDay === day;
            return (
              <Animated.View key={day} style={[styles.dayButtonContainer, dayAnimatedStyles[day]]}>
                <TouchableOpacity
                  style={[styles.dayButton, isSelected && styles.selectedDayButton]}
                  onPress={() => {
                    setSelectedDay(day);
                    const newScales = { ...selectedDayScale.value };
                    daysOfWeek.forEach((d) => (newScales[d] = d === day ? 1.1 : 1));
                    selectedDayScale.value = newScales;
                  }}
                >
                  <Text
                    style={[styles.dayButtonText, isSelected && styles.selectedDayButtonText]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </ScrollView>

        <SectionList
          sections={sections()}
          keyExtractor={(item, index) => `${item.child_names}-${item.day}-${index}`}
          renderItem={({ item, index }) => <AnimatedCard item={item} index={index} />}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionHeader}>{title}'s Schedule</Text>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No schedules for {selectedDay}</Text>}
          contentContainerStyle={styles.listContent}
        />

        <View style={styles.bottomNavigation}>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/parent-dashboard')}>
            <Ionicons name="home" size={28} color="#7C3AED" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={fetchChildrenSchedules}>
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
  daySelector: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
  } as ViewStyle,
  dayButtonContainer: {
    marginRight: 12,
  } as ViewStyle,
  dayButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  } as ViewStyle,
  selectedDayButton: {
    backgroundColor: '#7C3AED',
    elevation: 10,
  } as ViewStyle,
  dayButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  } as TextStyle,
  selectedDayButtonText: {
    color: '#FFFFFF',
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
    elevation: 10,
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

export default ChildSchedulesScreen;