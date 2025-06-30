import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';

export default function LoginScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const { login } = useAuth();

  const testConnection = async () => {
    setTestingConnection(true);
    try {
      const result = await ApiService.testConnectivity();
      Alert.alert('Connection Test', result);
    } catch (error) {
      console.error('Connection test failed:', error);
      Alert.alert('Connection Test Failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleLogin = async () => {
    console.log('=== LOGIN BUTTON PRESSED ===');
    console.log('First Name:', firstName);
    console.log('Last Name:', lastName);
    console.log('Password:', password);
    
    if (!firstName.trim() || !lastName.trim() || !password.trim()) {
      console.log('Validation failed: Missing fields');
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    console.log('Validation passed, proceeding with login...');
    setLoading(true);

    try {
      const credentials = {
        name: lastName.toLowerCase().trim(),
        surname: firstName.toLowerCase().trim(),
        password: password.trim()
      };
      
      console.log('Attempting login with:', credentials);
      await login(credentials);
      console.log('Login successful!');
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Login failed. Please check your credentials.');
    } finally {
      console.log('Setting loading to false...');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/iacs.png')} 
              style={styles.iacsLogo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>SmartStock</Text>
          <Text style={styles.subtitle}>Inventory Management</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter your first name"
              placeholderTextColor="#A0A0A0"
              autoCapitalize="words"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter your last name"
              placeholderTextColor="#A0A0A0"
              autoCapitalize="words"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor="#A0A0A0"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testButton, testingConnection && styles.testButtonDisabled]}
              onPress={testConnection}
              disabled={testingConnection}
            >
              {testingConnection ? (
                <ActivityIndicator color="#4318FF" size="small" />
              ) : (
                <Text style={styles.testButtonText}>Test Connection</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Welcome to SmartStock Mobile
          </Text>
          <Text style={styles.footerSubtext}>
            Manage your inventory on the go
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#4318FF',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    padding: 15,
  },
  iacsLogo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#A0A0A0',
    fontWeight: '400',
  },
  formContainer: {
    backgroundColor: '#16213e',
    borderRadius: 20,
    padding: 30,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2a2a3e',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '400',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  loginButton: {
    backgroundColor: '#4318FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    shadowColor: '#4318FF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  testButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
    shadowColor: '#4318FF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  testButtonDisabled: {
    opacity: 0.6,
  },
  testButtonText: {
    color: '#4318FF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 14,
    color: '#A0A0A0',
    textAlign: 'center',
  },
}); 