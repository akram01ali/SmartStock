import React from 'react';
import { View, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AuthFormInputProps {
  icon: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  editable?: boolean;
  styles: any;
}

export const AuthFormInput: React.FC<AuthFormInputProps> = ({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  autoCapitalize = 'none',
  editable = true,
  styles,
}) => (
  <View style={styles.inputContainer}>
    <Ionicons
      name={icon as any}
      size={20}
      color="#666"
      style={styles.inputIcon}
    />
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor="#999"
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      autoCapitalize={autoCapitalize}
      autoCorrect={false}
      editable={editable}
    />
  </View>
); 