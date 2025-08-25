import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const notificationPage = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Schedule</Text>
      <Text>Your class schedule will appear here.</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

export default notificationPage;