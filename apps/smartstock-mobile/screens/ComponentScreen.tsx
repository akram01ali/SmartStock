import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Image,
  TextInput,
  Modal,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from "../contexts/AuthContext";
import ApiService from "../services/api";
import { componentScreenStyles as styles } from "../styles/ComponentScreenStyles";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../types/navigation";

type ComponentScreenRouteProp = RouteProp<RootStackParamList, "Components">;

interface EditableComponent {
  componentName: string;
  amount: number;
  measure: string;
  supplier: string;
  cost: number;
  type: string;
  description?: string;
  lastScanned: string;
  scannedBy: string;
  durationofDevelopment: number;
  triggerMinAmount: number;
}

export default function ComponentScreen() {
  const navigation = useNavigation();
  const route = useRoute<ComponentScreenRouteProp>();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImagePicker.ImageInfo | null>(null);
  
  // Get component data from route params with fallback
  const { component, editMode = false } = route.params || {};
  
  // Initialize editedComponent state with proper fallback
  const [editedComponent, setEditedComponent] = useState<EditableComponent>(() => {
    if (!component) {
      return {
        componentName: '',
        amount: 0,
        measure: '',
        supplier: '',
        cost: 0,
        type: '',
        description: '',
        lastScanned: new Date().toISOString(),
        scannedBy: '',
        durationofDevelopment: 0,
        triggerMinAmount: 0,
      };
    }
    return component;
  });

  // If component is not available, show error
  if (!component) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle" size={64} color="#DC3545" />
          <Text style={styles.loadingText}>Component data not found</Text>
          <TouchableOpacity
            style={[styles.actionButton, styles.updateStockButton]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.actionButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleBack = () => {
    navigation.goBack();
  };

  const getStockStatus = (amount: number, minAmount: number) => {
    if (amount <= 0) return "zero";
    if (amount < minAmount) return "low";
    return "good";
  };

  const getStockColor = (amount: number, minAmount: number) => {
    const status = getStockStatus(amount, minAmount);
    switch (status) {
      case "good": return styles.stockPositive;
      case "low": return styles.stockNegative;
      case "zero": return styles.stockZero;
      default: return styles.stockPositive;
    }
  };

  const handleEditComponent = () => {
    setEditedComponent({ ...component });
    setEditModalVisible(true);
  };

  const handleImagePicker = () => {
    Alert.alert(
      "Select Image",
      "Choose how you'd like to add an image:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Take Photo",
          onPress: () => openCamera(),
        },
        {
          text: "Choose from Gallery",
          onPress: () => openImagePicker(),
        },
      ]
    );
  };

  const openCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Camera permission is required to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0]);
    }
  };

  const openImagePicker = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0]);
    }
  };

  const saveComponent = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      
      // Create JSON data object matching ComponentUpdate model
      const componentData: {
        amount: number;
        measure: string;
        scannedBy: string;
        durationOfDevelopment: number;
        triggerMinAmount: number;
        supplier: string;
        cost: number;
        type: string;
        description?: string;
        image?: string;
      } = {
        amount: editedComponent.amount,
        measure: editedComponent.measure,
        scannedBy: editedComponent.scannedBy,
        durationOfDevelopment: editedComponent.durationofDevelopment, // Fixed field name
        triggerMinAmount: editedComponent.triggerMinAmount,
        supplier: editedComponent.supplier,
        cost: editedComponent.cost,
        type: editedComponent.type,
        description: editedComponent.description,
      };

      // Add image as base64 if selected
      if (selectedImage) {
        try {
          // Read the image file and convert to base64
          const response = await fetch(selectedImage.uri);
          const blob = await response.blob();
          const reader = new FileReader();
          
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          
          const base64String = await base64Promise;
          componentData.image = base64String;
        } catch (imageError) {
          console.error("Error processing image:", imageError);
          Alert.alert(
            "Warning",
            "Could not process the selected image, but other changes will be saved.",
            [{ text: "OK" }]
          );
        }
      }
      
      await ApiService.updateComponent(component.componentName, componentData, token);
      
      Alert.alert(
        "Success",
        "Component updated successfully!",
        [
          {
            text: "OK",
            onPress: () => {
              setEditModalVisible(false);
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error updating component:", error);
      Alert.alert(
        "Error",
        "Failed to update component. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    Alert.alert(
      "Coming Soon",
      "Component editing functionality will be added in a future update.",
      [{ text: "OK" }]
    );
  };

  const stockStatus = getStockStatus(component.amount, component.triggerMinAmount);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#4318FF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {component.componentName}
            </Text>
          </View>
          
          {editMode && (
            <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stock Status Badge */}
        <View style={[
          styles.statusBadge,
          stockStatus === "low" || stockStatus === "zero" 
            ? styles.lowStockBadge 
            : styles.goodStockBadge
        ]}>
          <Text style={[
            styles.statusBadgeText,
            stockStatus === "low" || stockStatus === "zero"
              ? styles.lowStockText
              : styles.goodStockText
          ]}>
            {stockStatus === "zero" 
              ? "OUT OF STOCK" 
              : stockStatus === "low" 
                ? "LOW STOCK" 
                : "IN STOCK"}
          </Text>
        </View>

        {/* Image Section */}
        <View style={styles.imageSection}>
          {component.image ? (
            <Image
              source={{ uri: component.image }}
              style={styles.componentImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.noImageContainer}>
              <Ionicons name="image-outline" size={48} color="#CCCCCC" />
              <Text style={styles.noImageText}>No image available</Text>
            </View>
          )}
        </View>

        {/* Stock Information Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Stock Information</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Current Stock:</Text>
            <Text style={[
              styles.stockValue,
              getStockColor(component.amount, component.triggerMinAmount)
            ]}>
              {component.amount} {component.measure}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Minimum Amount:</Text>
            <Text style={styles.detailValue}>
              {component.triggerMinAmount} {component.measure}
            </Text>
          </View>

          <View style={[styles.detailRow, styles.lastDetailRow]}>
            <Text style={styles.detailLabel}>Cost per Unit:</Text>
            <Text style={styles.costValue}>
            €{component.cost}
            </Text>
          </View>
        </View>

        {/* Component Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Component Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type:</Text>
            <Text style={styles.detailValue}>{component.type}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Supplier:</Text>
            <Text style={styles.detailValue}>{component.supplier}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Development Time:</Text>
            <Text style={styles.detailValue}>
              {component.durationofDevelopment} hours
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Last Scanned:</Text>
            <Text style={styles.detailValue}>
              {new Date(component.lastScanned).toLocaleDateString()}
            </Text>
          </View>

          <View style={[styles.detailRow, styles.lastDetailRow]}>
            <Text style={styles.detailLabel}>Scanned By:</Text>
            <Text style={styles.detailValue}>{component.scannedBy}</Text>
          </View>
        </View>

        {/* Description Section */}
        {component.description && (
          <View style={styles.detailsCard}>
            <Text style={styles.cardTitle}>Description</Text>
            <Text style={styles.descriptionText}>{component.description}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.updateStockButton]}
            onPress={handleEditComponent}
            disabled={loading}
          >
            <Text style={styles.actionButtonText}>
              {loading ? "Updating..." : "Edit Component"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setEditModalVisible(false);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Component</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                style={styles.input}
                placeholder="Component Name"
                value={editedComponent.componentName || ''}
                onChangeText={(text) => setEditedComponent(prev => ({ ...prev, componentName: text }))}
              />

              <TextInput
                style={styles.input}
                placeholder="Amount"
                value={String(editedComponent.amount || 0)}
                onChangeText={(text) => setEditedComponent(prev => ({ ...prev, amount: Number(text) || 0 }))}
                keyboardType="numeric"
              />

              <TextInput
                style={styles.input}
                placeholder="Measure"
                value={editedComponent.measure || ''}
                onChangeText={(text) => setEditedComponent(prev => ({ ...prev, measure: text }))}
              />

              <TextInput
                style={styles.input}
                placeholder="Supplier"
                value={editedComponent.supplier || ''}
                onChangeText={(text) => setEditedComponent(prev => ({ ...prev, supplier: text }))}
              />

              <TextInput
                style={styles.input}
                placeholder="Cost"
                value={String(editedComponent.cost || 0)}
                onChangeText={(text) => setEditedComponent(prev => ({ ...prev, cost: Number(text) || 0 }))}
                keyboardType="numeric"
              />

              <TextInput
                style={styles.input}
                placeholder="Type"
                value={editedComponent.type || ''}
                onChangeText={(text) => setEditedComponent(prev => ({ ...prev, type: text }))}
              />

              <TextInput
                style={styles.input}
                placeholder="Duration of Development (hours)"
                value={String(editedComponent.durationofDevelopment || 0)}
                onChangeText={(text) => setEditedComponent(prev => ({ ...prev, durationofDevelopment: Number(text) || 0 }))}
                keyboardType="numeric"
              />

              <TextInput
                style={styles.input}
                placeholder="Trigger Minimum Amount"
                value={String(editedComponent.triggerMinAmount || 0)}
                onChangeText={(text) => setEditedComponent(prev => ({ ...prev, triggerMinAmount: Number(text) || 0 }))}
                keyboardType="numeric"
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description"
                value={editedComponent.description || ''}
                onChangeText={(text) => setEditedComponent(prev => ({ ...prev, description: text }))}
                multiline={true}
                numberOfLines={3}
              />

              <TextInput
                style={styles.input}
                placeholder="Scanned By"
                value={editedComponent.scannedBy || ''}
                onChangeText={(text) => setEditedComponent(prev => ({ ...prev, scannedBy: text }))}
              />

              {/* Image Section */}
              <View style={styles.imageEditSection}>
                <Text style={styles.inputLabel}>Component Image</Text>
                
                {selectedImage ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image
                      source={{ uri: selectedImage.uri }}
                      style={styles.imagePreview}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => setSelectedImage(null)}
                    >
                      <Ionicons name="close-circle" size={24} color="#DC3545" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.noImagePreview}>
                    <Ionicons name="image-outline" size={32} color="#CCCCCC" />
                    <Text style={styles.noImageText}>No image selected</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.imagePickerButton}
                  onPress={handleImagePicker}
                >
                  <Ionicons name="camera" size={20} color="#FFFFFF" />
                  <Text style={styles.imagePickerButtonText}>
                    {selectedImage ? 'Change Image' : 'Add Image'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveComponent}
                disabled={loading}
              >
                <Text style={styles.modalButtonText}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
                disabled={loading}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
