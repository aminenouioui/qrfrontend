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

interface UserData {
  name: string;
  photo: string | null;
  email?: string;
  class?: string;
  year?: string;
}

const teacher_Dashboard: React.FC = () => {
  const [userData, setUserData] = useState<UserData>({
    name: 'Loading...',
    photo: null,
    email: '',
    class: '9 A Science',
    year: '2023-2024',
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
      if (!token) {
        router.replace('/auth/login');
        return;
      }
      await fetchUserData(token);
    } catch (error) {
      console.error('Auth check error:', error);
      router.replace('/auth/login');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserData = async (token: string) => {
    try {
      let response = await fetch('http://10.0.2.2:8000/api/teacher/profile/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        const newToken = await refreshAccessToken();
        response = await fetch('http://10.0.2.2:8000/api/teacher/profile/', {
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

      const data: UserData = await response.json();
      setUserData({
        name: data.name || 'User',
        photo: data.photo,
        email: data.email || '',
        
        year: data.year || '2023-2024',
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUserData({
        name: 'Guest',
        photo: null,
        email: '',
        
        year: '2024-2025',
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
              userData.photo
                ? { uri: userData.photo }
                : { uri: 'https://randomuser.me/api/portraits/men/36.jpg' } as ImageSourcePropType
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
            userName={userData.name} // Pass the name
            userPhoto={userData.photo} // Pass the photo
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
              userData.photo
                ? { uri: userData.photo }
                : { uri: 'https://randomuser.me/api/portraits/men/36.jpg' } as ImageSourcePropType
            }
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
        </View>
      </Modal>

      {/* User Section */}
      <View style={styles.userSection}>
        <TouchableOpacity onPress={() => setIsImageModalVisible(true)}>
          <Image
            source={
              userData.photo
                ? { uri: userData.photo }
                : { uri: 'https://randomuser.me/api/portraits/men/36.jpg' } as ImageSourcePropType
            }
            style={styles.userImage}
          />
        </TouchableOpacity>
        <Text style={styles.userName}>{userData.name}</Text>
        {userData.email && <Text style={styles.userEmail}>{userData.email}</Text>}
        <View style={styles.userInfo}>
          <Ionicons name="school" size={16} color="#6C63FF" />
          <Text style={styles.userInfoText}>{userData.class}</Text>
        </View>
        <View style={styles.userInfo}>
          <Ionicons name="calendar" size={16} color="#6C63FF" />
          <Text style={styles.userInfoText}>{userData.year}</Text>
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
            <TouchableOpacity onPress={() => router.push('/teacher_schedule')} style={styles.categoryCard}>
              <Image
                source={require('../assets/images/schedule.png') as ImageSourcePropType}
                style={styles.categoryImage}
                resizeMode="contain"
              />
              <Text style={styles.categoryName}>Schedule</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/teachergrades')} style={styles.categoryCard}>
              <Image
                source={require('../assets/images/grades.png') as ImageSourcePropType}
                style={styles.categoryImage}
                resizeMode="contain"
              />
              <Text style={styles.categoryName}>Grades</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/teacherscan')} style={styles.categoryCard}>
              <Image
                source={require('../assets/images/scanqr.png') as ImageSourcePropType}
                style={styles.categoryImage}
                resizeMode="contain"
              />
              <Text style={styles.categoryName}>Scan QR</Text>
            </TouchableOpacity>
            
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/teacher-dashboard')}>
          <Ionicons name="home" size={24} color="#6C63FF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/teacher_schedule')}>
          <Ionicons name="calendar" size={24} color="#BDBDBD" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/teachergrades')}>
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
  userSection: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    marginHorizontal: 20,
    marginVertical: 20,
    elevation: 5,
  },
  userImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  userInfoText: {
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

export default teacher_Dashboard;