import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Vibration,
  Dimensions,
  Platform,
  TextInput,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { CameraView, Camera } from 'expo-camera';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';
import { qrScannerScreenStyles as styles } from '../styles/QRScannerScreenStyles';
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';

const { width, height } = Dimensions.get('window');

export default function QRScannerScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { token } = useAuth();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(true);
  const [flashOn, setFlashOn] = useState(false);
  const [showInputModal, setShowInputModal] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [currentComponent, setCurrentComponent] = useState<any>(null);
  const [isAbsoluteUpdate, setIsAbsoluteUpdate] = useState(true);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();
  }, []);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleBarcodeScanned = async ({ type, data }: { type: string; data: string }) => {
    console.log('Barcode scanned:', data);
    console.log('Barcode type:', type);
    
    // Vibrate on successful scan
    Vibration.vibrate(100);
    
    // Stop scanning temporarily
    setScanning(false);
    
    try {
      // Try to find the component by name
      if (!token) {
        Alert.alert('Error', 'Authentication token not found');
        return;
      }

      console.log('Searching for component with scanned data:', data);
      
      // Search for the component using the scanned data
      const searchResults = await ApiService.searchComponents(data, 1, 10, token);
      
      if (searchResults.data && searchResults.data.length > 0) {
        const component = searchResults.data[0];
        console.log('Component found:', component.componentName);
        
        // Show component found dialog
        Alert.alert(
          'Component Found',
          `Found: ${component.componentName}\nStock: ${component.amount} ${component.measure}\n\nWhat would you like to do?`,
          [
            {
              text: 'View Details',
              onPress: () => {
                navigation.navigate('Components', { component, editMode: true });
              },
            },
            {
              text: 'Update Stock',
              onPress: () => showStockUpdateDialog(component),
            },
            {
              text: 'Scan Again',
              onPress: () => {
                setScanning(true);
              },
            },
          ]
        );
      } else {
        console.log('No component found for scanned data:', data);
        // Component not found
        Alert.alert(
          'Component Not Found',
          `No component found with name: "${data}"\n\nWould you like to create a new component?`,
          [
            {
              text: 'Create New',
              onPress: () => {
                navigation.navigate('Inventory');
              },
            },
            {
              text: 'Scan Again',
              onPress: () => {
                setScanning(true);
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error processing scanned data:', error);
      Alert.alert(
        'Error',
        'Failed to process scanned data. Please try again.',
        [
          {
            text: 'Scan Again',
            onPress: () => {
              setScanning(true);
            },
          },
        ]
      );
    }
  };

  const showStockUpdateDialog = (component: any) => {
    console.log('Showing stock update dialog for QR-scanned component:', component.componentName);
    
    // Check if we're on iOS (which supports Alert.prompt) or need Android workaround
    if (Platform.OS === 'ios') {
      // Use iOS native Alert.prompt
      Alert.prompt(
        'Update Stock',
        `Current stock: ${component.amount} ${component.measure}\n\nEnter new amount (use +/- for relative changes):`,
        [
          {
            text: 'Cancel',
            onPress: () => {
              setScanning(true);
            },
            style: 'cancel',
          },
          {
            text: 'Update',
            onPress: async (input) => {
              if (input && token) {
                try {
                  const amount = parseFloat(input);
                  if (isNaN(amount)) {
                    Alert.alert('Error', 'Please enter a valid number');
                    return;
                  }

                  const isAbsolute = !input.startsWith('+') && !input.startsWith('-');
                  
                  console.log('Updating stock via QR scan for component:', component.componentName, 'Amount:', amount, 'Absolute:', isAbsolute);
                  
                  // Use the new QR code specific update method with the component name from QR scan
                  await ApiService.updateStockWithQRCode(
                    component.componentName,
                    amount,
                    isAbsolute,
                    token
                  );

                  console.log('Stock update successful for QR-scanned component:', component.componentName);
                  
                  Alert.alert('Success', 'Stock updated successfully!', [
                    {
                      text: 'OK',
                      onPress: () => {
                        setScanning(true);
                      },
                    },
                  ]);
                } catch (error) {
                  console.error('Error updating stock with QR code:', error);
                  Alert.alert('Error', 'Failed to update stock. Please try again.');
                }
              }
            },
          },
        ],
        'plain-text',
        '',
        'numeric'
      );
    } else {
      // Android: First ask for update type, then show custom input modal
      Alert.alert(
        'Update Stock',
        `Component: ${component.componentName}\nCurrent stock: ${component.amount} ${component.measure}\n\nHow would you like to update the stock?`,
        [
          {
            text: 'Cancel',
            onPress: () => {
              setScanning(true);
            },
            style: 'cancel',
          },
          {
            text: 'Set New Total',
            onPress: () => {
              setCurrentComponent(component);
              setIsAbsoluteUpdate(true);
              setInputValue('');
              setShowInputModal(true);
            },
          },
          {
            text: 'Add/Subtract',
            onPress: () => {
              setCurrentComponent(component);
              setIsAbsoluteUpdate(false);
              setInputValue('');
              setShowInputModal(true);
            },
          },
        ]
      );
    }
  };

  const handleModalSubmit = async () => {
    if (!inputValue.trim() || !currentComponent || !token) {
      Alert.alert('Error', 'Please enter a valid number');
      return;
    }

    const amount = parseFloat(inputValue.trim());
    if (isNaN(amount)) {
      Alert.alert('Error', 'Please enter a valid number');
      return;
    }

    setShowInputModal(false);
    
    try {
      console.log('Updating stock via QR scan for component:', currentComponent.componentName, 'Amount:', amount, 'Absolute:', isAbsoluteUpdate);
      
      await ApiService.updateStockWithQRCode(
        currentComponent.componentName,
        amount,
        isAbsoluteUpdate,
        token
      );

      console.log('Stock update successful for QR-scanned component:', currentComponent.componentName);
      
      const newAmount = isAbsoluteUpdate ? amount : currentComponent.amount + amount;
      Alert.alert(
        'Success', 
        `Stock updated successfully!\n\nNew amount: ${newAmount} ${currentComponent.measure}`, 
        [
          {
            text: 'OK',
            onPress: () => {
              setScanning(true);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error updating stock with QR code:', error);
      Alert.alert('Error', 'Failed to update stock. Please try again.', [
        {
          text: 'OK',
          onPress: () => {
            setScanning(true);
          },
        },
      ]);
    }
  };

  const toggleFlash = () => {
    setFlashOn(!flashOn);
  };

  const reactivateScanner = () => {
    setScanning(true);
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color="#666666" />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            Please enable camera access in your device settings to scan QR codes.
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan QR Code</Text>
        <TouchableOpacity onPress={toggleFlash} style={styles.headerButton}>
          <Ionicons 
            name={flashOn ? "flash" : "flash-off"} 
            size={24} 
            color={flashOn ? "#FFD700" : "#FFFFFF"} 
          />
        </TouchableOpacity>
      </View>

      {/* Scanner */}
      <View style={styles.scannerContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          enableTorch={flashOn}
          barcodeScannerSettings={{
            barcodeTypes: ['qr', 'pdf417', 'aztec', 'ean13', 'ean8', 'upc_e', 'datamatrix', 'code128', 'code39', 'codabar', 'itf14', 'upc_a'],
          }}
          onBarcodeScanned={scanning ? handleBarcodeScanned : undefined}
        />
        
        {/* Scanning overlay */}
        <View style={styles.overlay}>
          <View style={styles.scanFrame} />
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <View style={styles.instructionCard}>
          <Ionicons name="qr-code-outline" size={32} color="#4318FF" />
          <Text style={styles.instructionTitle}>Scan Component QR Code</Text>
          <Text style={styles.instructionText}>
            Position the QR code or barcode within the frame to scan the component name
          </Text>
        </View>

        {!scanning && (
          <TouchableOpacity style={styles.scanAgainButton} onPress={reactivateScanner}>
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.scanAgainButtonText}>Scan Again</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Custom Input Modal for Android */}
      <Modal
        visible={showInputModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowInputModal(false);
          setScanning(true);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {isAbsoluteUpdate ? 'Set New Total' : 'Add/Subtract Amount'}
            </Text>
            <Text style={styles.modalMessage}>
              {currentComponent && (
                `Component: ${currentComponent.componentName}\nCurrent stock: ${currentComponent.amount} ${currentComponent.measure}\n\n${
                  isAbsoluteUpdate 
                    ? 'Enter the new total amount:' 
                    : 'Enter amount to add (positive) or subtract (negative):'
                }`
              )}
            </Text>
            <TextInput
              style={styles.modalInput}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder={isAbsoluteUpdate ? "e.g. 25" : "e.g. +5 or -3"}
              keyboardType="numeric"
              autoFocus={true}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowInputModal(false);
                  setScanning(true);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleModalSubmit}
              >
                <Text style={styles.submitButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
} 