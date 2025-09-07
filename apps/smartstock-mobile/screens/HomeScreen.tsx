import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import ApiService from "../services/api";
import { homeScreenStyles as styles } from "../styles/HomeScreenStyles";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../types/navigation";
import { notify, validateNotify } from "../utils/notifications";

const QUICK_ACTIONS = [
  {
    id: 'scanner',
    icon: "camera-outline" as const, 
    title: "Scan Barcode",
    route: "QRScanner" as keyof RootStackParamList,
  },
];

const showConfirmationAlert = (
  title: string,
  message: string,
  onConfirm: () => void,
  confirmText: string = "OK"
) => {
  notify.confirm(message, onConfirm, undefined, title);
};

const showErrorAlert = (message: string, title: string = "Error") => {
  notify.error(message);
};

const showSuccessAlert = (
  message: string, 
  title: string = "Success",
  onPress?: () => void
) => {
  notify.success(message, onPress);
};

interface ActionButtonProps {
  icon: string;
  title: string;
  onPress: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, title, onPress }) => (
  <TouchableOpacity style={styles.actionButton} onPress={onPress}>
    <Ionicons
      name={icon as any}
      size={20}
      color="#FFFFFF"
      style={{ marginRight: 8 }}
    />
    <Text style={styles.actionButtonText}>{title}</Text>
  </TouchableOpacity>
);

interface ScreenHeaderProps {
  userName?: string;
  onLogout: () => void;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({ userName, onLogout }) => (
  <View style={styles.header}>
    <View style={styles.welcomeSection}>
      <Text style={styles.welcomeText}>Welcome back!</Text>
      {userName && <Text style={styles.userText}>{userName}</Text>}
    </View>
    <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
      <Text style={styles.logoutButtonText}>Logout</Text>
    </TouchableOpacity>
  </View>
);

interface StockUpdateModalProps {
  visible: boolean;
  amount: string;
  isAbsolute: boolean;
  loading: boolean;
  onClose: () => void;
  onAmountChange: (amount: string) => void;
  onToggleAbsolute: () => void;
  onUpdate: () => void;
}

const StockUpdateModal: React.FC<StockUpdateModalProps> = ({
  visible,
  amount,
  isAbsolute,
  loading,
  onClose,
  onAmountChange,
  onToggleAbsolute,
  onUpdate,
}) => (
  <Modal
    animationType="slide"
    transparent={true}
    visible={visible}
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Update Stock</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Amount</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={onAmountChange}
            placeholder="Enter amount (+ to add, - to remove)"
            placeholderTextColor="#999"
            keyboardType="numeric"
            editable={!loading}
            autoFocus
          />
        </View>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            isAbsolute && styles.toggleButtonActive,
          ]}
          onPress={onToggleAbsolute}
          disabled={loading}
        >
          <Text
            style={[
              styles.toggleButtonText,
              isAbsolute && styles.toggleButtonTextActive,
            ]}
          >
            {isAbsolute ? "✓ Set Absolute Value" : "Add/Remove from Current"}
          </Text>
        </TouchableOpacity>

        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={[styles.modalButton, styles.cancelButton]}
            onPress={onClose}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modalButton,
              styles.confirmButton,
              loading && styles.confirmButtonDisabled,
            ]}
            onPress={onUpdate}
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
);

const useStockUpdate = (token: string | null, user: { name: string; surname: string; initials: string } | null, onSuccess?: () => void) => {
  const [loading, setLoading] = useState(false);

  const updateStock = useCallback(async (
    imageUri: string,
    amount: string,
    isAbsolute: boolean
  ) => {
    if (!amount.trim()) {
      showErrorAlert("Please enter an amount");
      return false;
    }

    if (!token) {
      showErrorAlert("Authentication token not found");
      return false;
    }

    if (!user) {
      showErrorAlert("User information not found");
      return false;
    }

    if (!imageUri) {
      showErrorAlert("No image selected");
      return false;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) {
      showErrorAlert("Please enter a valid number");
      return false;
    }

    setLoading(true);
    try {
      await ApiService.updateStockWithImage(
        imageUri,
        numAmount,
        isAbsolute,
        token,
        `${user.name} ${user.surname}`
      );

      showSuccessAlert(
        `Stock ${isAbsolute ? "set to" : "updated by"} ${numAmount} successfully!`,
        "Success",
        onSuccess
      );

      return true;
    } catch (error) {
      console.error("Stock update error:", error);
      showErrorAlert(
        error instanceof Error ? error.message : "Failed to update stock"
      );
      return false;
    } finally {
      setLoading(false);
    }
  }, [token, user, onSuccess]);

  return { updateStock, loading };
};

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user, logout, token } = useAuth();
  
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [amount, setAmount] = useState("");
  const [isAbsolute, setIsAbsolute] = useState(false);

  const { updateStock, loading } = useStockUpdate(token, user, () => {
    setStockModalVisible(false);
    resetStockForm();
  });

  const resetStockForm = useCallback(() => {
    setAmount("");
    setIsAbsolute(false);
    (global as any).selectedImageUri = null;
  }, []);

  const handleLogout = useCallback(() => {
    showConfirmationAlert(
      "Logout",
      "Are you sure you want to logout?",
      logout,
      "Logout"
    );
  }, [logout]);

  const handleQuickAction = useCallback((route: keyof RootStackParamList) => {
    navigation.navigate(route as any);
  }, [navigation]);

  const handleStockModalClose = useCallback(() => {
    setStockModalVisible(false);
    resetStockForm();
  }, [resetStockForm]);

  const handleStockUpdate = useCallback(async () => {
    const imageUri = (global as any).selectedImageUri;
    await updateStock(imageUri, amount, isAbsolute);
  }, [updateStock, amount, isAbsolute]);

  const toggleAbsolute = useCallback(() => {
    setIsAbsolute(prev => !prev);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          userName={user ? `${user.name} ${user.surname}` : undefined}
          onLogout={handleLogout}
        />

        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📦 Quick Actions</Text>
            {QUICK_ACTIONS.map((action) => (
              <ActionButton
                key={action.id}
                icon={action.icon}
                title={action.title}
                onPress={() => handleQuickAction(action.route)}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <StockUpdateModal
        visible={stockModalVisible}
        amount={amount}
        isAbsolute={isAbsolute}
        loading={loading}
        onClose={handleStockModalClose}
        onAmountChange={setAmount}
        onToggleAbsolute={toggleAbsolute}
        onUpdate={handleStockUpdate}
      />
    </SafeAreaView>
  );
}
