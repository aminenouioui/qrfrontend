import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Animatable from 'react-native-animatable';

const SignInScreen = () => {
  const params = useLocalSearchParams();
  const role = params.role ? (Array.isArray(params.role) ? params.role[0].toLowerCase() : params.role.toLowerCase()) : 'user';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSignIn = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const loginData = { username, password, role };
    const loginUrl = 'http://10.0.2.2:8000/auth/login/';
    console.log('Request URL:', loginUrl);
    console.log('Request Body:', JSON.stringify(loginData, null, 2));

    try {
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const responseText = await response.text();
      console.log('Response Status:', response.status);
      console.log('Response Body:', responseText);

      const data = JSON.parse(responseText);
      if (response.ok) {
        await AsyncStorage.setItem('access_token', data.access);
        await AsyncStorage.setItem('refresh_token', data.refresh);
        await AsyncStorage.setItem('user_role', data.role);
        console.log('Login successful, tokens stored');

        // Show the success animation
        setShowSuccess(true);

        // Navigate after a delay to allow the animation to play
        setTimeout(() => {
          switch (data.role) {
            case 'teacher':
              router.replace('/teacher-dashboard');
              break;
            case 'student':
              router.replace('/dashboard');
              break;
            case 'parent':
              router.replace('/parent-dashboard');
              break;
            default:
              router.replace('/dashboard');
          }
        }, 2000); // Delay navigation to show animation for 2 seconds
      } else {
        console.log('Login failed:', data);
        Alert.alert('Login Failed', data.detail || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Network error:', error);
      Alert.alert('Error', 'Network request failed. Check your connection or server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.illustrationContainer}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>EduHere</Text>
        </View>
        <Image
          source={require('../../assets/images/login.png')}
          style={styles.mainIllustration}
          resizeMode="contain"
        />
      </View>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Sign in as {role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User'}</Text>
        <Text style={styles.subtitle}>Enter your account details to sign in</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!passwordVisible}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setPasswordVisible(!passwordVisible)}
          >
            <Ionicons
              name={passwordVisible ? 'eye-off' : 'eye'}
              size={24}
              color="#999"
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.forgotContainer}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.signInButton, isSubmitting && { opacity: 0.6 }]}
          onPress={handleSignIn}
          disabled={isSubmitting}
        >
          <Text style={styles.signInButtonText}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Text>
        </TouchableOpacity>
        {showSuccess && (
          <Animatable.View
            animation={{
              from: { transform: [{ scale: 0.5 }, { rotateX: '90deg' }], opacity: 0 },
              to: { transform: [{ scale: 1 }, { rotateX: '0deg' }], opacity: 1 },
            }}
            duration={1000}
            style={styles.successContainer}
          >
            <Text style={styles.successText}>Login Successful!</Text>
          </Animatable.View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E6F0FA',
  },
  illustrationContainer: {
    flex: 1.5,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#B3D4FC',
    borderBottomLeftRadius: 80,
    borderBottomRightRadius: 80,
    position: 'relative',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#000',
    textTransform: 'uppercase',
  },
  mainIllustration: {
    width: '120%',
    height: '90%',
    alignSelf: 'center',
    transform: [{ scale: 1.5 }],
  },
  formContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 80,
    borderTopRightRadius: 80,
    padding: 30,
    paddingBottom: 50,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 26,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 18,
    position: 'relative',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  input: {
    padding: 18,
    fontSize: 17,
    borderRadius: 10,
    paddingRight: 40,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  forgotContainer: {
    alignItems: 'center',
    marginVertical: 18,
  },
  forgotText: {
    color: '#333',
    fontWeight: '500',
  },
  signInButton: {
    backgroundColor: '#000',
    borderRadius: 35,
    paddingVertical: 20,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  signInButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  successContainer: {
    marginTop: 20,
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  successText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SignInScreen;