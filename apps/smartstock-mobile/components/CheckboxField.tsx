import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CheckboxFieldProps {
  label: string;
  value: boolean;
  onToggle: () => void;
  styles: any;
}

export const CheckboxField: React.FC<CheckboxFieldProps> = ({
  label,
  value,
  onToggle,
  styles,
}) => (
  <TouchableOpacity style={styles.rememberContainer} onPress={onToggle}>
    <View style={[styles.checkbox, value && styles.checkboxChecked]}>
      {value && <Ionicons name="checkmark" size={16} color="white" />}
    </View>
    <Text style={styles.rememberText}>{label}</Text>
  </TouchableOpacity>
); 