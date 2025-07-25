import { useState, useEffect, useCallback } from 'react';
import { Camera } from 'expo-camera';
import { Vibration, Alert, Platform } from 'react-native';
import ApiService from '../services/api';
import { notify, actionNotify, validateNotify } from '../utils/notifications';

interface UseScannerProps {
  token: string | null;
  user: { name: string; surname: string; initials: string } | null;
  onNavigateToComponent: (component: any) => void;
  onNavigateToInventory: () => void;
}

export const useScanner = ({ token, user, onNavigateToComponent, onNavigateToInventory }: UseScannerProps) => {
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

  const handleBarcodeScanned = useCallback(async ({ type, data }: { type: string; data: string }) => {
    Vibration.vibrate(100);
    setScanning(false);
    
    try {
      if (!token) {
        notify.error('Authentication token not found');
        return;
      }

      const searchResults = await ApiService.searchComponents(data, 1, 10, token);
      
      if (searchResults.data && searchResults.data.length > 0) {
        const component = searchResults.data[0];
        
        Alert.alert(
          'Component Found',
          `Found: ${component.componentName}\nStock: ${component.amount} ${component.measure}\n\nWhat would you like to do?`,
          [
            {
              text: 'View Details',
              onPress: () => onNavigateToComponent(component),
            },
            {
              text: 'Update Stock',
              onPress: () => showStockUpdateDialog(component),
            },
            {
              text: 'Scan Again',
              onPress: () => setScanning(true),
            },
          ]
        );
      } else {
        Alert.alert(
          'Component Not Found',
          `No component found with name: "${data}"\n\nWould you like to create a new component?`,
          [
            {
              text: 'Create New',
              onPress: onNavigateToInventory,
            },
            {
              text: 'Scan Again',
              onPress: () => setScanning(true),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error processing scanned data:', error);
      notify.error('Failed to process scanned data. Please try again.', () => setScanning(true));
    }
  }, [token, onNavigateToComponent, onNavigateToInventory]);

  const showStockUpdateDialog = useCallback((component: any) => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Update Stock',
        `Current stock: ${component.amount} ${component.measure}\n\nEnter new amount (use +/- for relative changes):`,
        [
          {
            text: 'Cancel',
            onPress: () => setScanning(true),
            style: 'cancel',
          },
          {
            text: 'Update',
            onPress: async (input) => {
              if (input && token) {
                await handleStockUpdate(component, input);
              }
            },
          },
        ],
        'plain-text',
        '',
        'numeric'
      );
    } else {
      Alert.alert(
        'Update Stock',
        `Component: ${component.componentName}\nCurrent stock: ${component.amount} ${component.measure}\n\nHow would you like to update the stock?`,
        [
          {
            text: 'Cancel',
            onPress: () => setScanning(true),
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
  }, [token]);

  const handleStockUpdate = useCallback(async (component: any, input: string) => {
    try {
      const amount = parseFloat(input);
      if (isNaN(amount)) {
        validateNotify.invalid('number');
        return;
      }

      const isAbsolute = !input.startsWith('+') && !input.startsWith('-');
      
      await ApiService.updateStockWithQRCode(
        component.componentName,
        amount,
        isAbsolute,
        token!,
        user ? `${user.name} ${user.surname}` : 'mobile-qr-scanner'
      );
      
      actionNotify.updated('Stock', () => setScanning(true));
    } catch (error) {
      console.error('Error updating stock with QR code:', error);
      actionNotify.updateFailed('stock');
    }
  }, [token, user]);

  const handleModalSubmit = useCallback(async () => {
    if (!inputValue.trim() || !currentComponent || !token) {
      validateNotify.invalid('number');
      return;
    }

    const amount = parseFloat(inputValue.trim());
    if (isNaN(amount)) {
      validateNotify.invalid('number');
      return;
    }

    setShowInputModal(false);
    
    try {
      await ApiService.updateStockWithQRCode(
        currentComponent.componentName,
        amount,
        isAbsoluteUpdate,
        token,
        user ? `${user.name} ${user.surname}` : 'mobile-qr-scanner'
      );

      const newAmount = isAbsoluteUpdate ? amount : currentComponent.amount + amount;
      Alert.alert(
        'Success', 
        `Stock updated successfully!\n\nNew amount: ${newAmount} ${currentComponent.measure}`, 
        [
          {
            text: 'OK',
            onPress: () => setScanning(true),
          },
        ]
      );
    } catch (error) {
      console.error('Error updating stock with QR code:', error);
      Alert.alert('Error', 'Failed to update stock. Please try again.', [
        {
          text: 'OK',
          onPress: () => setScanning(true),
        },
      ]);
    }
  }, [inputValue, currentComponent, token, isAbsoluteUpdate, user]);

  const toggleFlash = useCallback(() => {
    setFlashOn(prev => !prev);
  }, []);

  const reactivateScanner = useCallback(() => {
    setScanning(true);
  }, []);

  const handleModalCancel = useCallback(() => {
    setShowInputModal(false);
    setScanning(true);
  }, []);

  return {
    hasPermission,
    scanning,
    flashOn,
    showInputModal,
    inputValue,
    currentComponent,
    isAbsoluteUpdate,
    setInputValue,
    handleBarcodeScanned,
    handleModalSubmit,
    handleModalCancel,
    toggleFlash,
    reactivateScanner,
  };
}; 