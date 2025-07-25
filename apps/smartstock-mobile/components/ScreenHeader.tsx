import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface ScreenHeaderProps {
  welcomeText?: string;
  userName?: string;
  showLogout?: boolean;
  onLogout?: () => void;
  rightComponent?: React.ReactNode;
  styles: any;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  welcomeText = "Welcome back!",
  userName,
  showLogout = true,
  onLogout,
  rightComponent,
  styles,
}) => (
  <View style={styles.header}>
    <View style={styles.welcomeSection}>
      <Text style={styles.welcomeText}>{welcomeText}</Text>
      {userName && (
        <Text style={styles.userText}>{userName}</Text>
      )}
    </View>

    {rightComponent || (showLogout && onLogout && (
      <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    ))}
  </View>
); 