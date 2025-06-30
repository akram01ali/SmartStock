import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  console.log('AppContent: isAuthenticated =', isAuthenticated, 'loading =', loading);

  if (loading) {
    console.log('AppContent: Rendering loading screen');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4318FF" />
      </View>
    );
  }

  console.log('AppContent: Rendering', isAuthenticated ? 'HomeScreen' : 'LoginScreen');
  return isAuthenticated ? <HomeScreen /> : <LoginScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
