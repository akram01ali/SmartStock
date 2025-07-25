import React from 'react';
import {
  View,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { CameraView } from 'expo-camera';
import { useAuth } from '../contexts/AuthContext';
import { qrScannerScreenStyles as styles } from '../styles/QRScannerScreenStyles';
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';
import { useScanner } from '../hooks/useScanner';
import { CameraPermissionView } from '../components/CameraPermissionView';
import { ScannerHeader } from '../components/ScannerHeader';
import { ScannerOverlay } from '../components/ScannerOverlay';
import { StockUpdateModal } from '../components/StockUpdateModal';

export default function QRScannerScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { token, user } = useAuth();

  const {
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
  } = useScanner({
    token,
    user,
    onNavigateToComponent: (component) => {
      navigation.navigate('Components', { component, editMode: true });
    },
    onNavigateToInventory: () => {
      navigation.navigate('Inventory');
    },
  });

  const handleBack = () => {
    navigation.goBack();
  };

  // Show permission screens if needed
  const permissionView = (
    <CameraPermissionView
      hasPermission={hasPermission}
      onGoBack={handleBack}
      styles={styles}
    />
  );

  if (hasPermission !== true) {
    return (
      <SafeAreaView style={styles.container}>
        {permissionView}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <ScannerHeader
        title="Scan QR Code"
        flashOn={flashOn}
        onBack={handleBack}
        onToggleFlash={toggleFlash}
        styles={styles}
      />

      {/* Scanner */}
      <View style={styles.scannerContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          enableTorch={flashOn}
          barcodeScannerSettings={{
            barcodeTypes: [
              'qr', 'pdf417', 'aztec', 'ean13', 'ean8', 
              'upc_e', 'datamatrix', 'code128', 'code39', 
              'codabar', 'itf14', 'upc_a'
            ],
          }}
          onBarcodeScanned={scanning ? handleBarcodeScanned : undefined}
        />
        
        {/* Scanning overlay */}
        <View style={styles.overlay}>
          <View style={styles.scanFrame} />
        </View>
      </View>

      <ScannerOverlay
        scanning={scanning}
        onScanAgain={reactivateScanner}
        styles={styles}
      />

      <StockUpdateModal
        visible={showInputModal}
        component={currentComponent}
        isAbsoluteUpdate={isAbsoluteUpdate}
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSubmit={handleModalSubmit}
        onCancel={handleModalCancel}
        styles={styles}
      />
    </SafeAreaView>
  );
} 