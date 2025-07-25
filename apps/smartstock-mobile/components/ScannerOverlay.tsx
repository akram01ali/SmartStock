import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ScannerOverlayProps {
  scanning: boolean;
  onScanAgain: () => void;
  styles: any;
}

export const ScannerOverlay: React.FC<ScannerOverlayProps> = ({
  scanning,
  onScanAgain,
  styles,
}) => (
  <View style={styles.instructionsContainer}>
    <View style={styles.instructionCard}>
      <Ionicons name="qr-code-outline" size={32} color="#4318FF" />
      <Text style={styles.instructionTitle}>Scan Component QR Code</Text>
      <Text style={styles.instructionText}>
        Position the QR code or barcode within the frame to scan the component name
      </Text>
    </View>

    {!scanning && (
      <TouchableOpacity style={styles.scanAgainButton} onPress={onScanAgain}>
        <Ionicons name="refresh" size={20} color="#FFFFFF" />
        <Text style={styles.scanAgainButtonText}>Scan Again</Text>
      </TouchableOpacity>
    )}
  </View>
); 