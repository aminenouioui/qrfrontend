import React, { useRef, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, SafeAreaView, Animated, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const LoginScreen = () => {
  const translateY = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const arrowOpacity = useRef(new Animated.Value(1)).current;
  const arrowTranslateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateArrow = () => {
      Animated.sequence([
        Animated.timing(arrowTranslateY, {
          toValue: -10,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(arrowTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => animateArrow());
    };

    animateArrow();
  }, []);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy < 0) {
        translateY.setValue(gestureState.dy);
        const opacity = 1 - Math.abs(gestureState.dy) / 100;
        arrowOpacity.setValue(opacity);
        buttonOpacity.setValue(1 - opacity);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy < -50) {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -200,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(arrowOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(buttonOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(arrowOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(buttonOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }
    },
  });

  const handleStudentLogin = () => {
    router.push({ pathname: '/auth/login', params: { role: 'student' } });
  };

  const handleParentLogin = () => {
    router.push({ pathname: '/auth/login', params: { role: 'parent' } });
  };

  const handleTeacherLogin = () => {
    router.push({ pathname: '/auth/login', params: { role: 'teacher' } });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>eSchool</Text>
        <Text style={styles.subtitle}>eSchool Serves You Virtual Education At Your Home</Text>
      </View>

      <Animated.View
        style={[
          styles.illustrationContainer,
          {
            transform: [{ translateY }],
          },
        ]}
      >
        <Image
          source={require('../assets/images/learning.png')}
          style={styles.illustration}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.buttonContainer,
          {
            opacity: buttonOpacity,
          },
        ]}
      >
        <TouchableOpacity style={styles.primaryButton} onPress={handleStudentLogin}>
          <Text style={styles.primaryButtonText}>Login as Student</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleParentLogin}>
          <Text style={styles.secondaryButtonText}>Login as Parent</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.teacherButton} onPress={handleTeacherLogin}>
          <Text style={styles.teacherButtonText}>Login as Teacher</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={[
          styles.arrowContainer,
          {
            opacity: arrowOpacity,
            transform: [{ translateY: arrowTranslateY }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <Ionicons name="arrow-up" size={30} color="#0a5b77" />
        <Text style={styles.arrowText}>Glisser vers le haut pour choisir</Text>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7393B3',
  },
  headerContainer: {
    paddingHorizontal: 25,
    paddingTop: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#fff',
    marginBottom: 30,
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustration: {
    width: '80%',
    height: '80%',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  primaryButton: {
    backgroundColor: '#7393B3',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#7393B3',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  teacherButton: {
    backgroundColor: '#7393B3',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  teacherButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  arrowContainer: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    alignItems: 'center',
  },
  arrowText: {
    marginTop: 5,
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoginScreen;