import React, { useState, useEffect, FC } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { refreshAccessToken } from './utils/auth';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

interface Grade {
  id: number;
  student: { nom: string; prenom: string; level: string | null };
  subject: { id: number; nom: string };
  grade: string;
  grade_type: string;
  date_g: string;
}

interface SubjectStyle {
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
}

const subjectStyles: Record<string, SubjectStyle> = {
  Mathematics: { icon: 'calculate', color: '#4A90E2' },
  Science: { icon: 'science', color: '#50C878' },
  Physics: { icon: 'science', color: '#FF6347' },
  Music: { icon: 'music-note', color: '#FFB74D' },
  Drawing: { icon: 'brush', color: '#FF6F91' },
  Account: { icon: 'calculate', color: '#AB83A1' },
  Default: { icon: 'school', color: '#6C63FF' },
};

const ChildGradesScreen: FC = () => {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const router = useRouter();

  const formatDate = (date: string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const fetchChildrenGrades = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('access_token');
      const role = await AsyncStorage.getItem('user_role');
      console.log('Fetching grades with token:', token?.slice(0, 10), '...', 'role:', role);
      if (!token || role !== 'parent') {
        console.error('Invalid token or role, redirecting to login');
        setError('Please log in as a parent.');
        router.replace('/auth/login?role=parent');
        return;
      }

      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
      const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';

      let response = await fetch(`${baseUrl}/api/parent/children/grades/`, { headers });
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
        response = await fetch(`${baseUrl}/api/parent/children/grades/`, { headers });
        console.log('Retry Response Status:', response.status);
        const retryData = await response.json();
        console.log('Retry Response Data:', JSON.stringify(retryData, null, 2));
        if (!response.ok) {
          console.error('API Error:', retryData);
          throw new Error(retryData.error || retryData.message || `HTTP error! status: ${response.status}`);
        }
        setGrades(retryData);
        setRetryCount(retryCount + 1);
        return;
      }

      if (!response.ok) {
        console.error('API Error:', responseData);
        throw new Error(responseData.error || responseData.message || `HTTP error! status: ${response.status}`);
      }

      setGrades(responseData);
      setRetryCount(0);
    } catch (error: any) {
      console.error('Fetch error:', error.message);
      const message = error.message.includes('Parent profile not found')
        ? 'No parent profile associated with your account. Please contact support.'
        : error.message.includes('No students')
        ? 'No students linked to your account.'
        : 'Failed to load grades. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChildrenGrades();
  }, []);

  const handleRetry = () => {
    if (retryCount >= 3) {
      setError('Max retries reached. Please check your connection or contact support.');
      return;
    }
    setRetryCount(retryCount + 1);
    fetchChildrenGrades();
  };

  const handleRefresh = () => {
    setRetryCount(0);
    fetchChildrenGrades();
  };

  const calculateStats = () => {
    if (grades.length === 0) {
      return { average: '0.00', highest: '0.00', lowest: '0.00' };
    }

    const gradeValues = grades.map((g) => parseFloat(g.grade)).filter((g) => !isNaN(g));
    if (gradeValues.length === 0) {
      return { average: '0.00', highest: '0.00', lowest: '0.00' };
    }
    const average = gradeValues.reduce((sum, val) => sum + val, 0) / gradeValues.length;
    const highest = Math.max(...gradeValues);
    const lowest = Math.min(...gradeValues);

    return {
      average: average.toFixed(2),
      highest: highest.toFixed(2),
      lowest: lowest.toFixed(2),
    };
  };

  const stats = calculateStats();

  const GradeCard: FC<{ item: Grade; index: number }> = ({ item }) => {
    const subjectStyle = subjectStyles[item.subject.nom] || subjectStyles.Default;

    return (
      <View style={[styles.gradeCard, { backgroundColor: '#FFFFFF' }]}>
        <View style={[styles.iconContainer, { backgroundColor: subjectStyle.color }]}>
          <MaterialIcons name={subjectStyle.icon} size={24} color="#FFFFFF" />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.subject.nom}</Text>
          <Text style={styles.cardText}>Student: {item.student.nom} {item.student.prenom}</Text>
          <Text style={styles.cardText}>Grade: {item.grade}/20</Text>
          <Text style={styles.cardText}>Type: {item.grade_type}</Text>
          <Text style={styles.cardText}>Level: {item.student.level || 'N/A'}</Text>
          <Text style={styles.cardText}>Date: {formatDate(item.date_g)}</Text>
        </View>
        <MaterialIcons
          name={parseFloat(item.grade) >= 16 ? 'emoji-events' : 'school'}
          size={24}
          color={parseFloat(item.grade) >= 16 ? '#FFD700' : '#6C63FF'}
          style={styles.gradeIcon}
        />
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#6C63FF', '#8E85FF']} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Children's Grades</Text>
          <View style={styles.headerSpacer} />
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>Loading your children's grades...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#6C63FF', '#8E85FF']} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Children's Grades</Text>
          <View style={styles.headerSpacer} />
        </LinearGradient>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#6C63FF', '#8E85FF']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Children's Grades</Text>
        <TouchableOpacity onPress={handleRefresh}>
          <Ionicons name="refresh" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      <FlatList
        data={grades}
        keyExtractor={(item) => `${item.id}`}
        renderItem={({ item, index }) => <GradeCard item={item} index={index} />}
        ListEmptyComponent={<Text style={styles.emptyText}>No grades available for your children.</Text>}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <LinearGradient colors={['#6C63FF', '#8E85FF']} style={styles.titleContainer}>
            <Text style={styles.title}>📊 Children's Grades</Text>
            <Text style={styles.subtitle}>View your children's academic performance</Text>
          </LinearGradient>
        }
        ListFooterComponent={
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📈 Statistics</Text>
            <View style={styles.statisticsRow}>
              <View style={styles.statisticItem}>
                <Text style={styles.statisticValue}>{stats.average}</Text>
                <Text style={styles.statisticLabel}>Average Grade</Text>
              </View>
              <View style={styles.statisticItem}>
                <Text style={styles.statisticValue}>{stats.highest}</Text>
                <Text style={styles.statisticLabel}>Highest Grade</Text>
              </View>
              <View style={styles.statisticItem}>
                <Text style={styles.statisticValue}>{stats.lowest}</Text>
                <Text style={styles.statisticLabel}>Lowest Grade</Text>
              </View>
            </View>
          </View>
        }
      />

      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/parent-dashboard')}>
          <Ionicons name="home" size={24} color="#6C63FF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/child_schedules')}>
          <Ionicons name="calendar" size={24} color="#BDBDBD" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleRefresh}>
          <Ionicons name="stats-chart" size={24} color="#BDBDBD" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    elevation: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 24,
  },
  titleContainer: {
    padding: 20,
    borderRadius: 15,
    margin: 20,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 5,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  gradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 5,
  },
  cardText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  gradeIcon: {
    marginLeft: 10,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 5,
    marginHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  statisticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statisticItem: {
    alignItems: 'center',
    flex: 1,
  },
  statisticValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6C63FF',
  },
  statisticLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    elevation: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChildGradesScreen;