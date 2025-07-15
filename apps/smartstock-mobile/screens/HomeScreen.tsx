import React, { useState } from "react";
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

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const { user, logout, token } = useAuth();
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [amount, setAmount] = useState("");
  const [absolute, setAbsolute] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
  };

  const handleInventory = async () => {
    // Simply navigate to the inventory screen
    navigation.navigate("Inventory");
  };

  const handleScanBarcode = async () => {
    // Navigate to QR Scanner screen
    navigation.navigate("QRScanner");
  };

  const handleStockUpdate = async () => {
    if (!amount.trim()) {
      Alert.alert("Error", "Please enter an amount");
      return;
    }

    if (!token) {
      Alert.alert("Error", "Authentication token not found");
      return;
    }

    const imageUri = (global as any).selectedImageUri;
    if (!imageUri) {
      Alert.alert("Error", "No image selected");
      return;
    }

    setLoading(true);
    try {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount)) {
        Alert.alert("Error", "Please enter a valid number");
        return;
      }

      await ApiService.updateStockWithImage(
        imageUri,
        numAmount,
        absolute,
        token
      );

      Alert.alert(
        "Success",
        `Stock ${
          absolute ? "set to" : "updated by"
        } ${numAmount} successfully!`,
        [
          {
            text: "OK",
            onPress: () => {
              setStockModalVisible(false);
              setAmount("");
              setAbsolute(false);
              (global as any).selectedImageUri = null;
            },
          },
        ]
      );
    } catch (error) {
      console.error("Stock update error:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to update stock"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
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

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleInventory}
            >
              <Ionicons
                name="list-outline"
                size={20}
                color="#FFFFFF"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.actionButtonText}>View Inventory</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleScanBarcode}
            >
              <Ionicons
                name="camera-outline"
                size={20}
                color="#FFFFFF"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.actionButtonText}>Scan Barcode</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

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
                placeholderTextColor="#999"
                keyboardType="numeric"
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.toggleButton,
                absolute && styles.toggleButtonActive,
              ]}
              onPress={() => setAbsolute(!absolute)}
              disabled={loading}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  absolute && styles.toggleButtonTextActive,
                ]}
              >
                {absolute ? "✓ Set Absolute Value" : "Add/Remove from Current"}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setStockModalVisible(false);
                  setAmount("");
                  setAbsolute(false);
                }}
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
