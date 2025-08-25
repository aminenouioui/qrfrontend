import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const ChangePasswordScreen: React.FC = () => {
  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [oldPasswordVisible, setOldPasswordVisible] = useState<boolean>(false);
  const [newPasswordVisible, setNewPasswordVisible] = useState<boolean>(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const router = useRouter();

  const handleChangePassword = async () => {
    console.log('handleChangePassword triggered'); // Check if function runs

    if (isSubmitting) {
      console.log('Already submitting, exiting');
      return;
    }

    // Validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      console.log('Validation failed: Missing fields');
      Alert.alert('Error', 'All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      console.log('Validation failed: Passwords do not match');
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      console.log('Validation failed: New password too short');
      Alert.alert('Error', 'New password must be at least 8 characters long');
      return;
    }

    setIsSubmitting(true);
    console.log('Starting submission process');

    try {
      const token = await AsyncStorage.getItem('access_token');
      const payload = { old_password: oldPassword, new_password: newPassword };

      console.log('Token:', token);
      console.log('Payload:', payload);

      // Replace with your actual IP or 'http://localhost:8000' for emulator
      const apiUrl = 'http://10.0.2.2:8000/api/change-password/';
      console.log('Fetching from:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
        },
        body: JSON.stringify(payload),
      });

      console.log('Response received, status:', response.status);
      const data: { detail?: string } = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        console.log('Success: Password changed');
        Alert.alert('Success', 'Password changed successfully');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        router.push('/dashboard');
      } else {
        console.log('Error from server:', data.detail);
        Alert.alert('Error', data.detail || 'Failed to change password');
      }
    } catch (error) {
      console.error('Network or fetch error:', error);
      Alert.alert('Error', 'Network request failed. Please check your connection.');
    } finally {
      console.log('Submission complete');
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          console.log('Back button pressed');
          router.back();
        }}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
      </View>

      <View style={styles.formContainer}>
        {/* Old Password */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Old Password"
            value={oldPassword}
            onChangeText={(text) => {
              console.log('Old password updated:', text);
              setOldPassword(text);
            }}
            secureTextEntry={!oldPasswordVisible}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setOldPasswordVisible(!oldPasswordVisible)}
          >
            <Ionicons
              name={oldPasswordVisible ? 'eye-off' : 'eye'}
              size={24}
              color="#999"
            />
          </TouchableOpacity>
        </View>

        {/* New Password */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="New Password"
            value={newPassword}
            onChangeText={(text) => {
              console.log('New password updated:', text);
              setNewPassword(text);
            }}
            secureTextEntry={!newPasswordVisible}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setNewPasswordVisible(!newPasswordVisible)}
          >
            <Ionicons
              name={newPasswordVisible ? 'eye-off' : 'eye'}
              size={24}
              color="#999"
            />
          </TouchableOpacity>
        </View>

        {/* Confirm New Password */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChangeText={(text) => {
              console.log('Confirm password updated:', text);
              setConfirmPassword(text);
            }}
            secureTextEntry={!confirmPasswordVisible}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
          >
            <Ionicons
              name={confirmPasswordVisible ? 'eye-off' : 'eye'}
              size={24}
              color="#999"
            />
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && { opacity: 0.6 }]}
          onPress={() => {
            console.log('Submit button pressed');
            handleChangePassword();
          }}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Changing...' : 'Change Password'}
          </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginLeft: 20,
  },
  formContainer: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    backgroundColor: '#FFF',
  },
  input: {
    padding: 15,
    fontSize: 16,
    borderRadius: 10,
    paddingRight: 40,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  submitButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ChangePasswordScreen;