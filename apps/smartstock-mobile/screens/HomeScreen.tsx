import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';

export default function HomeScreen() {
  const { user, logout, token } = useAuth();
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [absolute, setAbsolute] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleScanBarcode = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to scan barcodes.');
        return;
      }

      // Show options for camera or photo library
      Alert.alert(
        'Select Image Source',
        'Choose how to provide the barcode image',
        [
          {
            text: 'Camera',
            onPress: () => takePicture(),
          },
          {
            text: 'Photo Library',
            onPress: () => pickImage(),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      Alert.alert('Error', 'Failed to request camera permission');
    }
  };

  const takePicture = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setStockModalVisible(true);
        // Store the image URI for later use
        (global as any).selectedImageUri = result.assets[0].uri;
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setStockModalVisible(true);
        // Store the image URI for later use
        (global as any).selectedImageUri = result.assets[0].uri;
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleStockUpdate = async () => {
    if (!amount.trim()) {
      Alert.alert('Error', 'Please enter an amount');
      return;
    }

    if (!token) {
      Alert.alert('Error', 'Authentication token not found');
      return;
    }

    const imageUri = (global as any).selectedImageUri;
    if (!imageUri) {
      Alert.alert('Error', 'No image selected');
      return;
    }

    setLoading(true);
    try {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount)) {
        Alert.alert('Error', 'Please enter a valid number');
        return;
      }

      await ApiService.updateStockWithImage(imageUri, numAmount, absolute, token);
      
      Alert.alert(
        'Success', 
        `Stock ${absolute ? 'set to' : 'updated by'} ${numAmount} successfully!`,
        [
          {
            text: 'OK',
            onPress: () => {
              setStockModalVisible(false);
              setAmount('');
              setAbsolute(false);
              (global as any).selectedImageUri = null;
            },
          },
        ]
      );
    } catch (error) {
      console.error('Stock update error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome back!</Text>
          <Text style={styles.userText}>
            {user?.name} {user?.surname}
          </Text>
        </View>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📦 Quick Actions</Text>
          
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>📊 View Inventory</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleScanBarcode}>
            <Text style={styles.actionButtonText}>📸 Scan Barcode</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>📝 Manual Stock Update</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>📱 SmartStock Mobile</Text>
          <Text style={styles.cardDescription}>
            Manage your inventory efficiently with real-time updates and seamless synchronization.
          </Text>
        </View>
      </View>

      {/* Stock Update Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={stockModalVisible}
        onRequestClose={() => setStockModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Stock</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amount</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                placeholder="Enter amount (+ to add, - to remove)"
                placeholderTextColor="#A0A0A0"
                keyboardType="numeric"
                editable={!loading}
              />
            </View>

            <TouchableOpacity 
              style={[styles.toggleButton, absolute && styles.toggleButtonActive]}
              onPress={() => setAbsolute(!absolute)}
              disabled={loading}
            >
              <Text style={[styles.toggleButtonText, absolute && styles.toggleButtonTextActive]}>
                {absolute ? '✓ Set Absolute Value' : 'Add/Remove from Current'}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setStockModalVisible(false);
                  setAmount('');
                  setAbsolute(false);
                }}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, loading && styles.confirmButtonDisabled]}
                onPress={handleStockUpdate}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.confirmButtonText}>Update Stock</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: '#A0A0A0',
    marginBottom: 4,
  },
  userText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 30,
  },
  card: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  infoCard: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  cardDescription: {
    fontSize: 14,
    color: '#A0A0A0',
    lineHeight: 20,
  },
  actionButton: {
    backgroundColor: '#4318FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#4318FF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#16213e',
    borderRadius: 20,
    padding: 30,
    margin: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
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
  toggleButton: {
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3a3a4e',
  },
  toggleButtonActive: {
    backgroundColor: '#4318FF',
    borderColor: '#4318FF',
  },
  toggleButtonText: {
    color: '#A0A0A0',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleButtonTextActive: {
    color: '#FFFFFF',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#4318FF',
    marginLeft: 10,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 