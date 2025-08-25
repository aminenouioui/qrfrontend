import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  SafeAreaView,
  Modal,
  Pressable,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useRouter, Stack } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { refreshAccessToken } from "./utils/auth";

// Define types
interface Session {
  id: number;
  subject: string;
  start_time: string;
  end_time: string;
  classe: string;
  notes: string | null;
}

interface Schedule {
  [key: string]: Session[];
}

interface SubjectStyle {
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
}

interface ScheduleItem {
  id: number;
  day: string;
  subject: { id: number; nom: string; description?: string };
  start_time: string;
  end_time: string;
  teacher: number;
  classe: { id: number; name: string; capacity?: number };
  notes: string | null;
}

interface SubjectDetail {
  id: number;
  nom: string;
}

interface ClasseDetail {
  id: number;
  name: string;
}

interface ProfileData {
  teacher: number;
  nom?: string;
  prenom?: string;
}

// Define valid route names based on likely app structure
type ScreenName = "dashboard" | "schedule" | "grades" | "user";

const subjectStyles: Record<string, SubjectStyle> = {
  Drawing: { icon: "brush", color: "#FF6F91" },
  Music: { icon: "music-note", color: "#FFB74D" },
  Account: { icon: "calculate", color: "#AB83A1" },
  math: { icon: "calculate", color: "#4A90E2" },
  Science: { icon: "science", color: "#50C878" },
  physique: { icon: "science", color: "#FF6347" },
};

const weekdays = ["MON", "TUE", "WED", "THU", "FRI"];
const timeSlots = ["08:00:00", "10:00:00", "12:00:00", "14:00:00", "16:00:00"];

const TeacherSchedule: React.FC = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [schedule, setSchedule] = useState<Schedule>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [selectedScreen, setSelectedScreen] = useState<ScreenName>("schedule"); // Default to schedule
  const router = useRouter();

  // Debug log to help verify routes
  console.log("Current route:", router);

  const fetchTeacherSchedule = async () => {
    try {
      setLoading(true);
      setError(null);

      let token = await AsyncStorage.getItem("access_token");
      console.log("Access Token:", token);
      if (!token) {
        setError("Please log in to view your schedule");
        setLoading(false);
        router.replace("/auth/login");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      const baseUrl =
        Platform.OS === "android"
          ? "http://10.0.2.2:8000"
          : "http://localhost:8000";

      // Fetch teacher profile
      let profileResponse = await fetch(`${baseUrl}/api/teacher/profile/`, {
        headers,
      });
      if (profileResponse.status === 401) {
        token = await refreshAccessToken();
        headers.Authorization = `Bearer ${token}`;
        profileResponse = await fetch(`${baseUrl}/api/teacher/profile/`, {
          headers,
        });
      }
      if (!profileResponse.ok) {
        const errorText = await profileResponse.text();
        console.log("Profile Response:", profileResponse.status, errorText);
        throw new Error(`Failed to fetch profile: ${profileResponse.status} - ${errorText}`);
      }
      const profileData: ProfileData = await profileResponse.json();
      console.log("Profile Data:", profileData);
      const teacherId = profileData.teacher;
      if (!teacherId) {
        throw new Error("Teacher ID not found in profile data");
      }
      setTeacherName(`${profileData.prenom || ""} ${profileData.nom || ""}`.trim());

      // Fetch teacher's schedule
      let scheduleResponse = await fetch(
        `${baseUrl}/api/schedules/teacher/${teacherId}/`,
        { headers }
      );
      if (scheduleResponse.status === 401) {
        token = await refreshAccessToken();
        headers.Authorization = `Bearer ${token}`;
        scheduleResponse = await fetch(
          `${baseUrl}/api/schedules/teacher/${teacherId}/`,
          { headers }
        );
      }
      if (!scheduleResponse.ok) {
        const errorText = await scheduleResponse.text();
        console.log("Schedule Response:", scheduleResponse.status, errorText);
        throw new Error(`Failed to fetch schedule: ${scheduleResponse.status} - ${errorText}`);
      }
      const scheduleData: ScheduleItem[] = await scheduleResponse.json();
      console.log("Raw Schedule Data:", scheduleData);

      // Fetch subjects
      let subjectsResponse = await fetch(`${baseUrl}/api/subjects/list/`, {
        headers,
      });
      if (subjectsResponse.status === 401) {
        token = await refreshAccessToken();
        headers.Authorization = `Bearer ${token}`;
        subjectsResponse = await fetch(`${baseUrl}/api/subjects/list/`, {
          headers,
        });
      }
      if (!subjectsResponse.ok) {
        const errorText = await subjectsResponse.text();
        console.log("Subjects Response:", subjectsResponse.status, errorText);
        throw new Error(`Failed to fetch subjects: ${subjectsResponse.status} - ${errorText}`);
      }
      const subjectsData: SubjectDetail[] = await subjectsResponse.json();
      console.log("Subjects Data:", subjectsData);

      // Fetch classes
      let classesResponse = await fetch(`${baseUrl}/api/classes/list/`, {
        headers,
      });
      if (classesResponse.status === 401) {
        token = await refreshAccessToken();
        headers.Authorization = `Bearer ${token}`;
        classesResponse = await fetch(`${baseUrl}/api/classes/list/`, {
          headers,
        });
      }
      if (!classesResponse.ok) {
        const errorText = await classesResponse.text();
        console.log("Classes Response:", subjectsResponse.status, errorText);
        throw new Error(`Failed to fetch classes: ${subjectsResponse.status} - ${errorText}`);
      }
      const classesData: ClasseDetail[] = await classesResponse.json();
      console.log("Classes Data:", classesData);

      // Create subject and class maps
      const subjectMap: Record<number, string> = subjectsData.reduce(
        (acc: Record<number, string>, subject) => {
          acc[subject.id] = subject.nom;
          return acc;
        },
        {}
      );
      const classeMap: Record<number, string> = classesData.reduce(
        (acc: Record<number, string>, classe) => {
          acc[classe.id] = classe.name;
          return acc;
        },
        {}
      );

      // Transform schedule data
      const formattedSchedule = transformScheduleData(scheduleData, subjectMap, classeMap);
      console.log("Formatted Schedule:", formattedSchedule);
      setSchedule(formattedSchedule);
      setLoading(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred while fetching the schedule";
      console.log("Fetch Error:", errorMessage);
      setError(errorMessage);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherSchedule();
  }, []);

  const transformScheduleData = (
    data: ScheduleItem[],
    subjectMap: Record<number, string>,
    classeMap: Record<number, string>
  ): Schedule => {
    const scheduleByDay: Schedule = {};
    weekdays.forEach((day) => {
      scheduleByDay[day] = [];
    });

    data.forEach((item) => {
      const day = item.day.toUpperCase();
      const subjectName = subjectMap[item.subject.id] || `Unknown Subject (ID: ${item.subject.id})`;
      const start_time = normalizeTime(item.start_time);
      const end_time = normalizeTime(item.end_time);
      const classe = classeMap[item.classe.id] || `Unknown Class (ID: ${item.classe.id})`;

      console.log(`Processing item: Day=${day}, SubjectID=${item.subject.id}, ClassID=${item.classe.id}`);

      if (scheduleByDay[day]) {
        scheduleByDay[day].push({
          id: item.id,
          subject: subjectName,
          start_time,
          end_time,
          classe,
          notes: item.notes,
        });
      }
    });

    Object.keys(scheduleByDay).forEach((day) => {
      scheduleByDay[day].sort((a, b) => a.start_time.localeCompare(b.start_time));
    });

    return scheduleByDay;
  };

  const normalizeTime = (time: string): string => {
    if (!time) return "Invalid Time";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? "PM" : "AM";
    const adjustedHour = hour % 12 || 12;
    return `${adjustedHour}:${minutes} ${period}`;
  };

  const getWeekDates = (date: Date) => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    const weekDates: Date[] = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDates.push(d);
    }
    return weekDates;
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const weekDates = getWeekDates(new Date(currentWeek));

  const handlePreviousWeek = () => {
    setCurrentWeek(new Date(currentWeek.setDate(currentWeek.getDate() - 7)));
  };

  const handleNextWeek = () => {
    setCurrentWeek(new Date(currentWeek.setDate(currentWeek.getDate() + 7)));
  };

  const handleRefresh = () => {
    fetchTeacherSchedule();
  };

  const handleSessionPress = (session: Session) => {
    setSelectedSession(session);
  };

  const closeModal = () => {
    setSelectedSession(null);
  };

  const handleNavigation = (screen: ScreenName) => {
    setSelectedScreen(screen);
    // Map screen names to actual route paths
    const routeMap: Record<ScreenName, string> = {
      dashboard: "/teacher/dashboard",
      schedule: "/schedule",
      grades: "/grades",
      user: "/user",
    };
    console.log("Navigating to:", routeMap[screen]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={["#6C63FF", "#4834D4"]}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Loading...</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <Ionicons name="hourglass-outline" size={40} color="#6C63FF" />
          <Text style={styles.loadingText}>Loading your schedule...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={["#6C63FF", "#4834D4"]}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Error</Text>
        </LinearGradient>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={40} color="#FF4D4D" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (Object.values(schedule).every((day) => day.length === 0)) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={["#6C63FF", "#4834D4"]}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Teacher Timetable</Text>
          <Text style={styles.headerSubtitle}>
            {teacherName ? `${teacherName}'s Weekly Schedule` : "Your Weekly Teaching Schedule"}
          </Text>
        </LinearGradient>
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={60} color="#BDBDBD" />
          <Text style={styles.emptyText}>
            No schedule available. Please contact your administrator.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={["#6C63FF", "#4834D4"]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Teacher Timetable</Text>
        <Text style={styles.headerSubtitle}>
          {teacherName ? `${teacherName}'s Weekly Schedule` : "Your Weekly Teaching Schedule"}
        </Text>
      </LinearGradient>

      <View style={styles.weekSelectorContainer}>
        <TouchableOpacity style={styles.weekButton} onPress={handlePreviousWeek}>
          <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.weekText}>
          {formatDate(weekDates[0])} - {formatDate(weekDates[4])}
        </Text>
        <TouchableOpacity style={styles.weekButton} onPress={handleNextWeek}>
          <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Ionicons name="refresh" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.scheduleGrid}>
        <View style={styles.timeColumn}>
          <View style={styles.timeHeader}>
            <Text style={styles.timeHeaderText}>Time</Text>
          </View>
          {timeSlots.map((time) => (
            <View key={time} style={styles.timeCell}>
              <Text style={styles.timeCellText}>{normalizeTime(time)}</Text>
            </View>
          ))}
        </View>
        <ScrollView horizontal>
          {weekdays.map((day, index) => (
            <View key={day} style={styles.dayColumn}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayHeaderText}>
                  {weekDates[index].toLocaleDateString("en-US", { weekday: "short" })}
                </Text>
                <Text style={styles.daySubHeaderText}>
                  {formatDate(weekDates[index])}
                </Text>
              </View>
              {timeSlots.map((time) => {
                const session = schedule[day]?.find(
                  (s) => s.start_time === normalizeTime(time)
                );
                return (
                  <View key={`${day}-${time}`} style={styles.sessionCell}>
                    {session ? (
                      <TouchableOpacity
                        style={styles.sessionCard}
                        onPress={() => handleSessionPress(session)}
                      >
                        <View
                          style={[
                            styles.iconContainer,
                            {
                              backgroundColor:
                                subjectStyles[session.subject]?.color || "#BDBDBD",
                            },
                          ]}
                        >
                          <MaterialIcons
                            name={subjectStyles[session.subject]?.icon || "school"}
                            size={16}
                            color="#FFFFFF"
                          />
                        </View>
                        <View style={styles.sessionDetails}>
                          <Text style={styles.sessionSubject} numberOfLines={1}>
                            {session.subject}
                          </Text>
                          <Text style={styles.sessionTime}>
                            {session.start_time} - {session.end_time}
                          </Text>
                          <Text style={styles.sessionClass}>Class: {session.classe}</Text>
                        </View>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.emptyCell}>
                        <Text style={styles.emptyCellText}>—</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </ScrollView>
      </View>

      <Modal
        visible={!!selectedSession}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedSession && (
              <>
                <Text style={styles.modalTitle}>{selectedSession.subject}</Text>
                <View style={styles.modalDetail}>
                  <Ionicons name="time-outline" size={20} color="#6C63FF" />
                  <Text style={styles.modalText}>
                    {selectedSession.start_time} - {selectedSession.end_time}
                  </Text>
                </View>
                <View style={styles.modalDetail}>
                  <Ionicons name="people-outline" size={20} color="#6C63FF" />
                  <Text style={styles.modalText}>Class: {selectedSession.classe}</Text>
                </View>
                {selectedSession.notes && (
                  <View style={styles.modalDetail}>
                    <Ionicons name="document-text-outline" size={20} color="#6C63FF" />
                    <Text style={styles.modalText}>Notes: {selectedSession.notes}</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.modalCloseButton} onPress={closeModal}>
                  <Text style={styles.modalCloseText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      <View style={styles.bottomNavigation}>
        <TouchableOpacity
          style={[styles.navItem, selectedScreen === "dashboard" && styles.selectedNavItem]}
          onPress={() => handleNavigation("dashboard")}
        >
          <Ionicons
            name="home"
            size={24}
            color={selectedScreen === "dashboard" ? "#6C63FF" : "#BDBDBD"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navItem, selectedScreen === "schedule" && styles.selectedNavItem]}
          onPress={() => handleNavigation("schedule")}
        >
          <Ionicons
            name="calendar"
            size={24}
            color={selectedScreen === "schedule" ? "#6C63FF" : "#BDBDBD"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navItem, selectedScreen === "grades" && styles.selectedNavItem]}
          onPress={() => handleNavigation("grades")}
        >
          <Ionicons
            name="stats-chart"
            size={24}
            color={selectedScreen === "grades" ? "#6C63FF" : "#BDBDBD"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navItem, selectedScreen === "user" && styles.selectedNavItem]}
          onPress={() => handleNavigation("user")}
        >
          <Ionicons
            name="person"
            size={24}
            color={selectedScreen === "user" ? "#6C63FF" : "#BDBDBD"}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    padding: 20,
    paddingTop: 50,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#E5E7EB",
    marginTop: 4,
  },
  weekSelectorContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  weekButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#6C63FF",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
  },
  weekText: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#6C63FF",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  scheduleGrid: {
    flex: 1,
    flexDirection: "row",
  },
  timeColumn: {
    width: 80,
    backgroundColor: "#FFFFFF",
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
  },
  timeHeader: {
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  timeHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  timeCell: {
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  timeCellText: {
    fontSize: 12,
    color: "#4B5563",
  },
  dayColumn: {
    width: 140,
    backgroundColor: "#F8FAFC",
  },
  dayHeader: {
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  dayHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  daySubHeaderText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  sessionCell: {
    height: 100,
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  sessionCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  sessionDetails: {
    flex: 1,
  },
  sessionSubject: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  sessionTime: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  sessionClass: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  emptyCell: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyCellText: {
    fontSize: 16,
    color: "#D1D5DB",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#4B5563",
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#FF4D4D",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#4B5563",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#6C63FF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomNavigation: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  navItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
  },
  selectedNavItem: {
    backgroundColor: "#F5F7FA",
    borderRadius: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    width: "80%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 16,
  },
  modalDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  modalText: {
    fontSize: 14,
    color: "#4B5563",
    marginLeft: 8,
    flex: 1,
  },
  modalCloseButton: {
    backgroundColor: "#6C63FF",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 16,
  },
  modalCloseText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default TeacherSchedule;