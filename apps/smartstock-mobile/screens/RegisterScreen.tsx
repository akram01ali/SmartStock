import React, { useCallback } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { loginScreenStyles as styles } from '../styles/LoginScreenStyles';
import { useAuthForm } from '../hooks/useAuthForm';
import { AuthHeader } from '../components/AuthHeader';
import { AuthFormInput } from '../components/AuthFormInput';
import { AuthButton } from '../components/AuthButton';
import { ErrorMessage } from '../components/ErrorMessage';

export default function RegisterScreen() {
  const navigation = useNavigation();
  const { register } = useAuth();
  const {
    formData,
    loading,
    errorMessage,
    setLoading,
    setErrorMessage,
    updateField,
    validateForm,
  } = useAuthForm();

  const handleRegister = useCallback(async () => {
    if (!validateForm()) return;

    setLoading(true);
    setErrorMessage('');

    try {
      await register(
        formData.name.trim(),
        formData.surname.trim(),
        formData.password.trim()
      );
      
      Alert.alert(
        'Success',
        'Registration successful! Please login with your credentials.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login' as never)
          }
        ]
      );
    } catch (error) {
      console.error('Registration failed:', error);
      setErrorMessage(
        error instanceof Error ? error.message : 'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm, setLoading, setErrorMessage, register, navigation]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          <View style={styles.content}>
            <AuthHeader
              title="Create Your Account"
              subtitle="Join SmartStock to get started"
              styles={styles}
            />

            <AuthFormInput
              icon="person-outline"
              placeholder="First Name"
              value={formData.name}
              onChangeText={(text) => updateField('name', text)}
              autoCapitalize="words"
              editable={!loading}
              styles={styles}
            />

            <AuthFormInput
              icon="person-outline"
              placeholder="Last Name"
              value={formData.surname}
              onChangeText={(text) => updateField('surname', text)}
              autoCapitalize="words"
              editable={!loading}
              styles={styles}
            />

            <AuthFormInput
              icon="lock-closed-outline"
              placeholder="Password"
              value={formData.password}
              onChangeText={(text) => updateField('password', text)}
              secureTextEntry
              editable={!loading}
              styles={styles}
            />

            <ErrorMessage message={errorMessage} styles={styles} />

            <View style={styles.buttonContainer}>
              <AuthButton
                title="Sign Up"
                onPress={handleRegister}
                loading={loading}
                variant="primary"
                styles={styles}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
} 
