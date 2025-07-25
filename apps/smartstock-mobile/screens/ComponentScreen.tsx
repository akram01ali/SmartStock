import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Image,
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
import { 
  getStockStatus, 
  getStockStatusText, 
  getStockStatusColor 
} from "../utils/stockUtils";
import { convertImageToBase64 } from "../utils/imageUtils";
import { EditComponentModal } from "../components/EditComponentModal";
import { ComponentDetailCard, DetailRow } from "../components/ComponentDetailCard";
import { notify, actionNotify } from "../utils/notifications";

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
  durationOfDevelopment: number;
  triggerMinAmount: number;
}

export default function ComponentScreen() {
  const navigation = useNavigation();
  const route = useRoute<ComponentScreenRouteProp>();
  const { token } = useAuth();
  
  // State
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
        durationOfDevelopment: 0,
        triggerMinAmount: 0,
      };
    }
    return component;
  });

  // Error state if component is not available
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

  // Event handlers
  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleEditComponent = useCallback(() => {
    setEditedComponent({ ...component });
    setEditModalVisible(true);
  }, [component]);

  const saveComponent = useCallback(async () => {
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
        durationOfDevelopment: editedComponent.durationOfDevelopment,
        triggerMinAmount: editedComponent.triggerMinAmount,
        supplier: editedComponent.supplier,
        cost: editedComponent.cost,
        type: editedComponent.type,
        description: editedComponent.description,
      };

      // Add image as base64 if selected
      if (selectedImage) {
        try {
          const base64String = await convertImageToBase64(selectedImage.uri);
          if (base64String) {
            componentData.image = base64String;
          }
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
      
      actionNotify.updated("Component", () => {
        setEditModalVisible(false);
        navigation.goBack();
      });
    } catch (error) {
      console.error("Error updating component:", error);
      actionNotify.updateFailed("component");
    } finally {
      setLoading(false);
    }
  }, [token, editedComponent, selectedImage, component.componentName, navigation]);

  // Computed values
  const stockStatus = getStockStatus(component.amount, component.triggerMinAmount);
  const stockStatusText = getStockStatusText(stockStatus);
  const stockColor = getStockStatusColor(stockStatus);

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
            <TouchableOpacity onPress={handleEditComponent} style={styles.editButton}>
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
            {stockStatusText}
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
        <ComponentDetailCard title="Stock Information" styles={styles}>
          <DetailRow
            label="Current Stock"
            value={`${component.amount} ${component.measure}`}
            valueStyle={stockColor}
            styles={styles}
          />
          <DetailRow
            label="Minimum Amount"
            value={`${component.triggerMinAmount} ${component.measure}`}
            styles={styles}
          />
          <DetailRow
            label="Cost per Unit"
            value={`€${component.cost}`}
            isLast
            styles={styles}
          />
        </ComponentDetailCard>

        {/* Component Details Card */}
        <ComponentDetailCard title="Component Details" styles={styles}>
          <DetailRow label="Type" value={component.type} styles={styles} />
          <DetailRow label="Supplier" value={component.supplier} styles={styles} />
          <DetailRow 
            label="Development Time" 
            value={`${component.durationOfDevelopment} hours`} 
            styles={styles} 
          />
          <DetailRow 
            label="Last Scanned" 
            value={new Date(component.lastScanned).toLocaleDateString()} 
            styles={styles} 
          />
          <DetailRow 
            label="Scanned By" 
            value={component.scannedBy} 
            isLast 
            styles={styles} 
          />
        </ComponentDetailCard>

        {/* Description Section */}
        {component.description && (
          <ComponentDetailCard title="Description" styles={styles}>
            <Text style={styles.descriptionText}>{component.description}</Text>
          </ComponentDetailCard>
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

      <EditComponentModal
        visible={editModalVisible}
        component={editedComponent}
        loading={loading}
        selectedImage={selectedImage}
        onClose={() => setEditModalVisible(false)}
        onSave={saveComponent}
        onComponentChange={setEditedComponent}
        onImageChange={setSelectedImage}
        styles={styles}
      />
    </SafeAreaView>
  );
}
