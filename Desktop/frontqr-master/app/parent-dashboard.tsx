import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
  ScrollView,
  ImageSourcePropType,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { refreshAccessToken } from './utils/auth';
import DrawerMenu from './menu';

interface ParentData {
  name: string;
  photo: string | null;
  email?: string;
  relationship?: string;
  is_emergency_contact?: boolean;
}

const ParentDashboard: React.FC = () => {
  const [parentData, setParentData] = useState<ParentData>({
    name: 'Loading...',
    photo: null,
    email: '',
    relationship: 'Father',
    is_emergency_contact: true,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMenuVisible, setIsMenuVisible] = useState<boolean>(false);
  const [isImageModalVisible, setIsImageModalVisible] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const role = await AsyncStorage.getItem('user_role');
      if (!token || role !== 'parent') {
        router.replace('/auth/login?role=parent');
        return;
      }
      await fetchParentData(token);
    } catch (error) {
      console.error('Auth check error:', error);
      router.replace('/auth/login?role=parent');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchParentData = async (token: string) => {
    try {
      let response = await fetch('http://10.0.2.2:8000/api/parent/profile/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        const newToken = await refreshAccessToken();
        response = await fetch('http://10.0.2.2:8000/api/parent/profile/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${newToken}`,
          },
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ParentData = await response.json();
      setParentData({
        name: data.name || 'Parent',
        photo: data.photo,
        email: data.email || '',
        relationship: data.relationship || 'Guardian',
        is_emergency_contact: data.is_emergency_contact !== undefined ? data.is_emergency_contact : true,
      });
    } catch (error) {
      console.error('Error fetching parent data:', error);
      setParentData({
        name: 'Guest Parent',
        photo: null,
        email: '',
        relationship: 'Guardian',
        is_emergency_contact: true,
      });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setIsMenuVisible(!isMenuVisible)}>
          <Ionicons name="menu-outline" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsImageModalVisible(true)}>
          <Image
            source={
              parentData.photo
                ? { uri: parentData.photo }
                : { uri: '' } as ImageSourcePropType
            }
            style={styles.profileImage}
          />
        </TouchableOpacity>
      </View>

      {/* Drawer Menu */}
      {isMenuVisible && (
        <View style={styles.drawerContainer}>
          <DrawerMenu
            onClose={() => setIsMenuVisible(false)}
            userName={parentData.name}
            userPhoto={parentData.photo}
          />
        </View>
      )}

      {/* Modal for Full Screen Image */}
      <Modal visible={isImageModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setIsImageModalVisible(false)}>
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
          <Image
            source={
              parentData.photo
                ? { uri: parentData.photo }
                : { uri: '' } as ImageSourcePropType
            }
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
        </View>
      </Modal>

      {/* Parent Profile Section */}
      <View style={styles.profileSection}>
        <TouchableOpacity onPress={() => setIsImageModalVisible(true)}>
          <Image
            source={
              parentData.photo
                ? { uri: parentData.photo }
                : { uri: '' } as ImageSourcePropType
            }
            style={styles.parentImage}
          />
        </TouchableOpacity>
        <Text style={styles.parentName}>{parentData.name}</Text>
        {parentData.email && <Text style={styles.parentEmail}>{parentData.email}</Text>}
        <View style={styles.parentInfo}>
          <Ionicons name="person" size={16} color="#6C63FF" />
          <Text style={styles.parentInfoText}>Relationship: {parentData.relationship}</Text>
        </View>
        <View style={styles.parentInfo}>
          <Ionicons name={parentData.is_emergency_contact ? "alert-circle" : "alert-circle-outline"} size={16} color="#6C63FF" />
          <Text style={styles.parentInfoText}>
            Emergency Contact: {parentData.is_emergency_contact ? 'Yes' : 'No'}
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for anything"
          placeholderTextColor="#999"
        />
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search" size={22} color="white" />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.categorySection}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryTitle}>Categories</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.categoriesGrid}>
            <TouchableOpacity onPress={() => router.push('/child_grades')} style={styles.categoryCard}>
              <Image
                source={require('../assets/images/grades.png') as ImageSourcePropType}
                style={styles.categoryImage}
                resizeMode="contain"
              />
              <Text style={styles.categoryName}>Child's Grades</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/child_schedules')} style={styles.categoryCard}>
              <Image
                source={require('../assets/images/schedule.png') as ImageSourcePropType}
                style={styles.categoryImage}
                resizeMode="contain"
              />
              <Text style={styles.categoryName}>Child's Schedule</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => router.push('/child_attendance')} style={styles.categoryCard}>
              <Image
                source={require('../assets/images/scanqr.png') as ImageSourcePropType}
                style={styles.categoryImage}
                resizeMode="contain"
              />
              <Text style={styles.categoryName}>Child's Attendance</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/parent-dashboard')}>
          <Ionicons name="home" size={24} color="#6C63FF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/child_schedules')}>
          <Ionicons name="calendar" size={24} color="#BDBDBD" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/child_grades')}>
          <Ionicons name="stats-chart" size={24} color="#BDBDBD" />
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  drawerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '80%',
    height: '100%',
    zIndex: 1,
    backgroundColor: '#FFFFFF',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    marginHorizontal: 20,
    marginVertical: 20,
    elevation: 5,
  },
  parentImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  parentName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  parentEmail: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  parentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  parentInfoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    height: 50,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginRight: 10,
    fontSize: 16,
  },
  searchButton: {
    width: 50,
    height: 50,
    backgroundColor: '#6C63FF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  categorySection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#6C63FF',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    height: 150,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    marginBottom: 15,
    elevation: 2,
  },
  categoryImage: {
    width: 60,
    height: 60,
    marginBottom: 10,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  fullScreenImage: {
    width: '100%',
    height: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 15,
    padding: 5,
  },
});

export default ParentDashboard;