import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useRouter, Stack } from "expo-router";

// Define types
interface Session {
  subject: string;
  time: string;
  teacher: string;
}

interface Schedule {
  MON: Session[];
  TUE: Session[];
  WED: Session[];
  THU: Session[];
  FRI: Session[];
  SAT: Session[];
  SUN: Session[];
}

interface SubjectStyle {
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
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

interface SubjectDetail {
  id: number;
  nom: string;
}

interface TeacherDetail {
  id: number;
  prenom: string;
  nom: string;
}

const subjectStyles: Record<string, SubjectStyle> = {
  Drawing: { icon: "brush", color: "#FF6F91" },
  Music: { icon: "music-note", color: "#FFB74D" },
  Account: { icon: "calculate", color: "#AB83A1" },
  math: { icon: "calculate", color: "#4A90E2" },
  Science: { icon: "science", color: "#50C878" },
  physique: { icon: "science", color: "#FF6347" },
  anglais: { icon: "book", color: "#9370DB" },
};

const TimetableScreen: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState<keyof Schedule>("MON");
  const [selectedScreen, setSelectedScreen] = useState<string>("schedule"); // Écran actif
  const [schedule, setSchedule] = useState<Schedule>({
    MON: [],
    TUE: [],
    WED: [],
    THU: [],
    FRI: [],
    SAT: [],
    SUN: [],
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchStudentSchedule = async () => {
      try {
        const token = await AsyncStorage.getItem("access_token");
        console.log("Access Token:", token); // Debug
        if (!token) {
          setError("Please log in first");
          setLoading(false);
          router.replace("./signin");
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

        // Fetch schedule
        const scheduleResponse = await fetch(`${baseUrl}/api/student/schedule/`, {
          headers,
        });
        if (!scheduleResponse.ok) {
          const errorData = await scheduleResponse.json();
          throw new Error(errorData.error || "Failed to fetch schedule");
        }
        const scheduleData: ScheduleItem[] = await scheduleResponse.json();
        console.log("Raw Schedule Data:", JSON.stringify(scheduleData, null, 2));

        // Fetch subjects
        const subjectsResponse = await fetch(`${baseUrl}/api/student/subjects/`, {
          headers,
        });
        if (!subjectsResponse.ok) {
          const errorText = await subjectsResponse.text();
          throw new Error(
            `Subjects fetch failed: ${subjectsResponse.status} - ${errorText}`
          );
        }
        const subjectsData: SubjectDetail[] = await subjectsResponse.json();
        console.log("Subjects Data:", JSON.stringify(subjectsData, null, 2));
        const subjectMap: Record<number, string> = subjectsData.reduce(
          (acc: Record<number, string>, subject) => {
            acc[subject.id] = subject.nom;
            return acc;
          },
          {}
        );

        // Fetch teachers
        const teachersResponse = await fetch(`${baseUrl}/api/student/teachers/`, {
          headers,
        });
        if (!teachersResponse.ok) {
          const errorText = await teachersResponse.text();
          throw new Error(
            `Teachers fetch failed: ${teachersResponse.status} - ${errorText}`
          );
        }
        const teachersData: TeacherDetail[] = await teachersResponse.json();
        console.log("Teachers Data:", JSON.stringify(teachersData, null, 2));
        const teacherMap: Record<number, string> = teachersData.reduce(
          (acc: Record<number, string>, teacher) => {
            acc[teacher.id] = `${teacher.prenom} ${teacher.nom}`;
            return acc;
          },
          {}
        );

        // Transform data
        const formattedSchedule = transformScheduleData(
          scheduleData,
          subjectMap,
          teacherMap
        );
        setSchedule(formattedSchedule);
        setLoading(false);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An unknown error occurred";
        console.error("Fetch error:", err);
        setError(errorMessage);
        setLoading(false);
      }
    };

    fetchStudentSchedule();
  }, [router]);

  const transformScheduleData = (
    data: ScheduleItem[],
    subjectMap: Record<number, string>,
    teacherMap: Record<number, string>
  ): Schedule => {
    const scheduleByDay: Schedule = {
      MON: [],
      TUE: [],
      WED: [],
      THU: [],
      FRI: [],
      SAT: [],
      SUN: [],
    };

    data.forEach((item) => {
      const day = item.day.toUpperCase() as keyof Schedule;
      const subjectName = subjectMap[item.subject] || "Unknown Subject";
      const time = `${normalizeTime(item.start_time)} – ${normalizeTime(
        item.end_time
      )}`;
      const teacher = teacherMap[item.Teacher] || "Unknown Teacher";

      scheduleByDay[day].push({ subject: subjectName, time, teacher });
    });

    return scheduleByDay;
  };

  const normalizeTime = (time: string): string => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? "PM" : "AM";
    const adjustedHour = hour % 12 || 12;
    return `${adjustedHour}:${minutes} ${period}`;
  };

  const handleDayPress = (day: keyof Schedule) => {
    setSelectedDay(day);
  };

  const handleNavigation = (screen: string) => {
    setSelectedScreen(screen);
    router.push(`./${screen}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading your schedule...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setLoading(true);
            setError(null);
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Timetable</Text>
        <Text style={styles.headerSubtitle}>Your Weekly Schedule</Text>
      </View>

      <ScrollView horizontal contentContainerStyle={styles.daySelector}>
        {Object.keys(schedule).map((day) => (
          <TouchableOpacity
            key={day}
            onPress={() => handleDayPress(day as keyof Schedule)}
            style={[
              styles.dayButton,
              selectedDay === day && styles.selectedDayButton,
            ]}
          >
            <Text
              style={[
                styles.dayButtonText,
                selectedDay === day && styles.selectedDayButtonText,
              ]}
            >
              {day}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scheduleContainer}>
        {schedule[selectedDay].length > 0 ? (
          schedule[selectedDay].map((session, index) => {
            const subject =
              subjectStyles[session.subject] || {
                icon: "info",
                color: "#CCCCCC",
              };
            return (
              <View
                key={index}
                style={[styles.sessionCard, { backgroundColor: "white" }]}
              >
                <View
                  style={[styles.iconContainer, { backgroundColor: subject.color }]}
                >
                  <MaterialIcons name={subject.icon} size={24} color="white" />
                </View>
                <View style={styles.sessionDetails}>
                  <Text style={styles.sessionText}>{session.subject}</Text>
                  <Text style={styles.sessionTime}>{session.time}</Text>
                  <Text style={styles.sessionTeacher}>{session.teacher}</Text>
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.noSessions}>
            No classes scheduled for {selectedDay}
          </Text>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity
          style={[
            styles.navItem,
            selectedScreen === "dashboard" && styles.selectedNavItem,
          ]}
          onPress={() => handleNavigation("dashboard")}
        >
          <Ionicons
            name="home"
            size={24}
            color={selectedScreen === "dashboard" ? "#4A00E0" : "#666"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.navItem,
            selectedScreen === "schedule" && styles.selectedNavItem,
          ]}
          onPress={() => handleNavigation("schedule")}
        >
          <Ionicons
            name="calendar"
            size={24}
            color={selectedScreen === "schedule" ? "#4A00E0" : "#666"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.navItem,
            selectedScreen === "grades" && styles.selectedNavItem,
          ]}
          onPress={() => handleNavigation("grades")}
        >
          <Ionicons
            name="stats-chart"
            size={24}
            color={selectedScreen === "grades" ? "#4A00E0" : "#666"}
          />
        </TouchableOpacity>
       
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  header: {
    padding: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: "center",
    backgroundColor: "#4A00E0",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#E0E0E0",
    marginTop: 4,
  },
  daySelector: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
  },
  dayButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  selectedDayButton: {
    backgroundColor: "#4A00E0",
  },
  dayButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  selectedDayButtonText: {
    color: "#FFFFFF",
  },
  scheduleContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sessionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  sessionDetails: {
    flex: 1,
  },
  sessionText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  sessionTime: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  sessionTeacher: {
    fontSize: 14,
    color: "#999",
    marginTop: 4,
  },
  noSessions: {
    textAlign: "center",
    color: "#666",
    fontSize: 16,
    marginTop: 20,
  },
  loadingText: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    flex: 1,
    justifyContent: "center",
  },
  error: {
    color: "red",
    textAlign: "center",
    marginBottom: 16,
    flex: 1,
    justifyContent: "center",
  },
  retryButton: {
    backgroundColor: "#4A00E0",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  bottomNavigation: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 5,
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
    backgroundColor: "#F5F7FA", // Légère surbrillance pour l'élément actif
    borderRadius: 10,
  },
});

export default TimetableScreen;