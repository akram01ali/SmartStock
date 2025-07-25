import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ScannerHeaderProps {
  title: string;
  flashOn: boolean;
  onBack: () => void;
  onToggleFlash: () => void;
  styles: any;
}

export const ScannerHeader: React.FC<ScannerHeaderProps> = ({
  title,
  flashOn,
  onBack,
  onToggleFlash,
  styles,
}) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onBack} style={styles.headerButton}>
      <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
    </TouchableOpacity>
    <Text style={styles.headerTitle}>{title}</Text>
    <TouchableOpacity onPress={onToggleFlash} style={styles.headerButton}>
      <Ionicons 
        name={flashOn ? "flash" : "flash-off"} 
        size={24} 
        color={flashOn ? "#FFD700" : "#FFFFFF"} 
      />
    </TouchableOpacity>
  </View>
); 