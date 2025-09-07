import React, { useCallback } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
import { CheckboxField } from '../components/CheckboxField';

export default function LoginScreen() {
  const navigation = useNavigation();
  const { login } = useAuth();
  const {
    formData,
    loading,
    errorMessage,
    rememberMe,
    setLoading,
    setErrorMessage,
    setRememberMe,
    updateField,
    validateForm,
  } = useAuthForm();

  const handleLogin = useCallback(async () => {
    if (!validateForm()) return;

    setLoading(true);
    setErrorMessage('');

    try {
      await login({
        name: formData.name.trim(),
        surname: formData.surname.trim(),
      });
    } catch (error) {
      console.error('Login failed:', error);
      setErrorMessage(
        error instanceof Error ? error.message : 'Login failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm, setLoading, setErrorMessage, login]);

  const handleRegister = useCallback(() => {
    navigation.navigate('Register' as never);
  }, [navigation]);

  const toggleRememberMe = useCallback(() => {
    setRememberMe(prev => !prev);
  }, [setRememberMe]);

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
              title="Welcome to SmartStock"
              subtitle="Please sign in to continue"
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

            <ErrorMessage message={errorMessage} styles={styles} />

            <CheckboxField
              label="Remember me"
              value={rememberMe}
              onToggle={toggleRememberMe}
              styles={styles}
            />

            <View style={styles.buttonContainer}>
              <AuthButton
                title="Sign In"
                onPress={handleLogin}
                loading={loading}
                variant="primary"
                styles={styles}
              />

              <AuthButton
                title="Register"
                onPress={handleRegister}
                disabled={loading}
                variant="secondary"
                styles={styles}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
} 