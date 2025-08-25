import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { refreshAccessToken } from './utils/auth';

const { width } = Dimensions.get('window');

interface Grade {
  id: number;
  subject: { id: number; nom: string };
  grade: string;
  grade_type: string;
}

const GradesPage: React.FC = () => {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    try {
      let token = await AsyncStorage.getItem('access_token');
      if (!token) {
        setError('Please log in first');
        setLoading(false);
        router.replace('./signin');
        return;
      }

      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
      const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';

      let response = await fetch(`${baseUrl}/api/student/grades/`, { headers });
      if (response.status === 401) {
        token = await refreshAccessToken();
        if (!token) {
          setError('Session expired. Please log in again.');
          setLoading(false);
          router.replace('./signin');
          return;
        }
        headers.Authorization = `Bearer ${token}`;
        response = await fetch(`${baseUrl}/api/student/grades/`, { headers });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data: Grade[] = await response.json();
      console.log('Raw Grades Data:', JSON.stringify(data, null, 2));
      setGrades(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Fetch error:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (grades.length === 0) {
      return { average: 0, highest: 0, lowest: 0 };
    }

    const gradeValues = grades.map((g) => parseFloat(g.grade));
    const average = gradeValues.reduce((sum, val) => sum + val, 0) / gradeValues.length;
    const highest = Math.max(...gradeValues);
    const lowest = Math.min(...gradeValues);

    return {
      average: Math.round(average),
      highest: Math.round(highest),
      lowest: Math.round(lowest),
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading your grades...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchGrades}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <LinearGradient
          colors={['#6C63FF', '#8E85FF']}
          style={styles.titleContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.title}>📊 Résultats</Text>
          <Text style={styles.subtitle}>Vos notes en un coup d'œil</Text>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📚 Matières et Notes</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.headerText}>Matière</Text>
            <Text style={styles.headerText}>Note</Text>
          </View>

          {grades.length > 0 ? (
            grades.map((grade) => (
              <View key={grade.id} style={styles.subjectRow}>
                <Text style={styles.subjectText}>
                  {grade.subject?.nom || 'Unknown Subject'} {grade.grade_type ? `(${grade.grade_type})` : ''}
                </Text>
                <View style={styles.gradeContainer}>
                  <Text style={styles.gradeText}>{parseFloat(grade.grade)}</Text>
                  <MaterialIcons
                    name={parseFloat(grade.grade) >= 80 ? 'emoji-events' : 'school'}
                    size={20}
                    color={parseFloat(grade.grade) >= 80 ? '#FFD700' : '#6C63FF'}
                  />
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>Aucune note disponible</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Statistiques</Text>
          <View style={styles.statisticsRow}>
            <View style={styles.statisticItem}>
              <Text style={styles.statisticValue}>{stats.average}</Text>
              <Text style={styles.statisticLabel}>Moyenne</Text>
            </View>
            <View style={styles.statisticItem}>
              <Text style={styles.statisticValue}>{stats.highest}</Text>
              <Text style={styles.statisticLabel}>Meilleure note</Text>
            </View>
            <View style={styles.statisticItem}>
              <Text style={styles.statisticValue}>{stats.lowest}</Text>
              <Text style={styles.statisticLabel}>Moins bonne note</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/dashboard')}>
          <Ionicons name="home" size={24} color="#6C63FF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="calendar" size={24} color="#BDBDBD" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
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
  scrollContent: {
    paddingBottom: 20,
  },
  titleContainer: {
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
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
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  subjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 10,
  },
  subjectText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  gradeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gradeText: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
    marginRight: 10,
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
  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  navItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 20,
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: '#6C63FF',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  noDataText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 10,
  },
});

export default GradesPage;



