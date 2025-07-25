import React from 'react';
import { Text } from 'react-native';

interface ErrorMessageProps {
  message: string;
  styles: any;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, styles }) => {
  if (!message) return null;
  
  return <Text style={styles.errorMessage}>{message}</Text>;
}; 