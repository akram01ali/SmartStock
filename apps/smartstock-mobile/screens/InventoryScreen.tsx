import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Alert,
  TextInput,
  Image,
  Modal,
  FlatList,
  RefreshControl,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import { useAuth } from "../contexts/AuthContext";
import { ApiService } from "../services/api";
import { inventoryScreenStyles as styles } from "../styles/InventoryScreenStyles";
import type { RootStackParamList, Component } from "../types/navigation";
import { getStockStatus, getStockStatusColor } from "../utils/stockUtils";
import { convertImageToBase64, showImagePickerAlert, openCamera, openImagePicker } from "../utils/imageUtils";
import { notify, actionNotify, validateNotify } from "../utils/notifications";

interface NewComponent {
  componentName: string;
  amount: number;
  measure: string;
  supplier: string;
  cost: number;
  type: string;
  description?: string;
  scannedBy: string;
  durationOfDevelopment: number;
  triggerMinAmount: number;
}

// Utility Functions
const validateComponentForm = (component: NewComponent): string | null => {
  if (!component.componentName?.trim()) {
    return "Component name is required";
  }
  if (component.amount < 0) {
    return "Amount cannot be negative";
  }
  if (component.cost < 0) {
    return "Cost cannot be negative";
  }
  return null;
};

const resetComponentForm = (defaultScannedBy: string = 'mobile-app'): NewComponent => ({
  componentName: '',
  amount: 0,
  measure: 'amount',
  supplier: '',
  cost: 0,
  type: 'component',
  description: '',
  scannedBy: defaultScannedBy,
  durationOfDevelopment: 0,
  triggerMinAmount: 0,
});

// Custom Hook for Debounced Search
const useDebounce = function<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default function InventoryScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user, token } = useAuth();

  // State
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Component[]>([]);
  const [searchPagination, setSearchPagination] = useState<any>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImagePicker.ImageInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchCurrentPage, setSearchCurrentPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [newComponent, setNewComponent] = useState<NewComponent>(
    resetComponentForm(user?.name || 'mobile-app')
  );

  // Debounced search
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Computed values
  const displayComponents = searchQuery ? searchResults : components;
  const displayTotalCount = searchQuery 
    ? (searchPagination?.total_count || 0) 
    : totalCount;

  // Effects
  useEffect(() => {
    fetchComponents();
  }, []);

  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      performSearch(debouncedSearchQuery, 1, true);
    } else {
      setSearchResults([]);
      setSearchPagination(null);
      setSearchCurrentPage(1);
      setIsSearching(false);
    }
  }, [debouncedSearchQuery]);

  // API Functions
  const fetchComponents = useCallback(async (page: number = 1, reset: boolean = true) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      if (token) {
        const response = await ApiService.getAllComponentsLightPaginated(page, 30, token);
        
        if (reset || page === 1) {
          setComponents(response.data);
        } else {
          setComponents(prev => [...prev, ...response.data]);
        }
        
        setTotalCount(response.pagination.total_count);
        setHasMoreData(response.pagination.has_next);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error("Error fetching components:", error);
      actionNotify.loadFailed();
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [token]);

  const performSearch = useCallback(async (query: string, page: number = 1, reset: boolean = true) => {
    if (!token || !query.trim()) return;

    try {
      setIsSearching(true);
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await ApiService.searchComponents(query.trim(), page, 30, token);
      
      if (reset || page === 1) {
        setSearchResults(response.data);
      } else {
        setSearchResults(prev => [...prev, ...response.data]);
      }
      
      setSearchPagination(response.pagination);
      setSearchCurrentPage(page);
    } catch (error) {
      console.error("Error searching components:", error);
      notify.error("Search failed. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setIsSearching(false);
    }
  }, [token]);

  // Event Handlers
  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleComponentPress = useCallback((component: Component) => {
    navigation.navigate('Components', { 
      component: component,
      editMode: false 
    });
  }, [navigation]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore) return;

    if (searchQuery.trim()) {
      if (searchPagination?.has_next && token) {
        performSearch(searchQuery, searchCurrentPage + 1, false);
      }
    } else {
      if (hasMoreData && token) {
        fetchComponents(currentPage + 1, false);
      }
    }
  }, [searchQuery, searchPagination, searchCurrentPage, hasMoreData, currentPage, token, loadingMore, performSearch, fetchComponents]);

  const handleRefresh = useCallback(() => {
    if (searchQuery.trim()) {
      setSearchCurrentPage(1);
      performSearch(searchQuery, 1, true);
    } else {
      setCurrentPage(1);
      setHasMoreData(true);
      fetchComponents(1, true);
    }
  }, [searchQuery, performSearch, fetchComponents]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  const handleCreateComponent = useCallback(() => {
    setCreateModalVisible(true);
  }, []);

  const handleImagePicker = useCallback(() => {
    showImagePickerAlert(
      async () => {
        const image = await openCamera();
        if (image) setSelectedImage(image);
      },
      async () => {
        const image = await openImagePicker();
        if (image) setSelectedImage(image);
      }
    );
  }, []);

  const resetCreateForm = useCallback(() => {
    setNewComponent(resetComponentForm(user?.name || 'mobile-app'));
    setSelectedImage(null);
  }, [user?.name]);

  const handleCreateModalClose = useCallback(() => {
    setCreateModalVisible(false);
    resetCreateForm();
  }, [resetCreateForm]);

  const saveNewComponent = useCallback(async () => {
    if (!token) return;
    
    // Validation
    const validationError = validateComponentForm(newComponent);
    if (validationError) {
      notify.error(validationError);
      return;
    }

    try {
      setCreateLoading(true);
      
      // Create component data object
      const componentData: any = {
        componentName: newComponent.componentName.trim(),
        amount: newComponent.amount,
        measure: newComponent.measure,
        scannedBy: newComponent.scannedBy,
        durationOfDevelopment: newComponent.durationOfDevelopment,
        triggerMinAmount: newComponent.triggerMinAmount,
        supplier: newComponent.supplier,
        cost: newComponent.cost,
        type: newComponent.type,
        description: newComponent.description,
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
          notify.info("Image could not be processed, but component will be created without it.");
        }
      }
      
      await ApiService.createComponent(componentData, "", token);
      
      // Refresh the components list
      handleRefresh();
      
      actionNotify.created("Component", handleCreateModalClose);
    } catch (error) {
      console.error("Error creating component:", error);
      actionNotify.createFailed("component");
    } finally {
      setCreateLoading(false);
    }
  }, [token, newComponent, selectedImage, handleRefresh, handleCreateModalClose]);

  // Component rendering
  const renderComponentCard = useCallback(({ item }: { item: Component }) => {
    const stockStatus = getStockStatus(item.amount, item.triggerMinAmount);
    const stockColor = getStockStatusColor(stockStatus);

    return (
      <TouchableOpacity
        style={styles.componentCard}
        onPress={() => handleComponentPress(item)}
        activeOpacity={0.7}
      >
        {/* Card Header with Component Name and Stock */}
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Text
              style={styles.cardTitle}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {item.componentName}
            </Text>
          </View>
          <View style={styles.stockContainer}>
            <Text style={[styles.stockText, stockColor]}>
              {item.amount} {item.measure}
            </Text>
          </View>
        </View>

        {/* Card Details */}
        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type:</Text>
            <Text
              style={styles.detailValue}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.type}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Supplier:</Text>
            <Text
              style={styles.detailValue}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.supplier}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Cost:</Text>
            <Text style={styles.costValue}>
              €{item.cost.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Image Preview */}
        {item.image && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: item.image }}
              style={styles.componentImage}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Description Preview */}
        {item.description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionLabel}>Description:</Text>
            <Text
              style={styles.descriptionText}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {item.description}
            </Text>
          </View>
        )}

        {/* Click Indicator */}
        <View style={styles.clickIndicator}>
          <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    );
  }, [handleComponentPress]);

  // Loading state
  if (loading && !searchQuery) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4318FF" />
          <Text style={styles.loadingText}>Loading inventory...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#4318FF" />
        </TouchableOpacity>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Inventory</Text>
          <Text style={styles.userText}>
            {searchQuery
              ? `${displayTotalCount} component${displayTotalCount !== 1 ? "s" : ""} found`
              : `${displayTotalCount} component${displayTotalCount !== 1 ? "s" : ""} total`}
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <Text style={styles.searchLabel}>Search Components:</Text>
        <View style={styles.searchInputContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by component name..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={clearSearch} style={styles.clearSearchButton}>
              <Ionicons name="close-circle" size={20} color="#666666" />
            </TouchableOpacity>
          ) : null}
        </View>
        {isSearching && (
          <View style={styles.searchingIndicator}>
            <ActivityIndicator size="small" color="#4318FF" />
            <Text style={styles.searchingText}>Searching...</Text>
          </View>
        )}
      </View>

      {/* Create Button */}
      <TouchableOpacity style={styles.createButton} onPress={handleCreateComponent}>
        <Text style={styles.createButtonText}>+ Create Component</Text>
      </TouchableOpacity>

      {/* Components List */}
      <FlatList
        data={displayComponents}
        keyExtractor={(item, index) => `${item.componentName}-${index}-${searchQuery ? 'search' : 'normal'}`}
        renderItem={renderComponentCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            colors={['#4318FF']}
            tintColor="#4318FF"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery ? "No components found matching your search." : "No components available."}
            </Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color="#4318FF" />
              <Text style={styles.loadingMoreText}>Loading more...</Text>
            </View>
          ) : null
        }
      />

      {/* Create Component Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={createModalVisible}
        onRequestClose={handleCreateModalClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Component</Text>
              <TouchableOpacity style={styles.closeButton} onPress={handleCreateModalClose}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              {/* Component Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Component Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newComponent.componentName}
                  onChangeText={(text) => setNewComponent({...newComponent, componentName: text})}
                  placeholder="Enter component name"
                />
              </View>

              {/* Amount */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount</Text>
                <TextInput
                  style={styles.textInput}
                  value={String(newComponent.amount)}
                  onChangeText={(text) => setNewComponent({...newComponent, amount: parseFloat(text) || 0})}
                  placeholder="Enter amount"
                  keyboardType="numeric"
                />
              </View>

              {/* Measure */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Measure</Text>
                <TextInput
                  style={styles.textInput}
                  value={newComponent.measure}
                  onChangeText={(text) => setNewComponent({...newComponent, measure: text})}
                  placeholder="Enter measure unit"
                />
              </View>

              {/* Supplier */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Supplier</Text>
                <TextInput
                  style={styles.textInput}
                  value={newComponent.supplier}
                  onChangeText={(text) => setNewComponent({...newComponent, supplier: text})}
                  placeholder="Enter supplier name"
                />
              </View>

              {/* Cost */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Cost</Text>
                <TextInput
                  style={styles.textInput}
                  value={String(newComponent.cost)}
                  onChangeText={(text) => setNewComponent({...newComponent, cost: parseFloat(text) || 0})}
                  placeholder="Enter cost"
                  keyboardType="numeric"
                />
              </View>

              {/* Type */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Type</Text>
                <TextInput
                  style={styles.textInput}
                  value={newComponent.type}
                  onChangeText={(text) => setNewComponent({...newComponent, type: text})}
                  placeholder="Enter component type"
                />
              </View>

              {/* Duration of Development */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Duration of Development (days)</Text>
                <TextInput
                  style={styles.textInput}
                  value={String(newComponent.durationOfDevelopment)}
                  onChangeText={(text) => setNewComponent({...newComponent, durationOfDevelopment: parseInt(text) || 0})}
                  placeholder="Enter development duration"
                  keyboardType="numeric"
                />
              </View>

              {/* Trigger Min Amount */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Trigger Min Amount</Text>
                <TextInput
                  style={styles.textInput}
                  value={String(newComponent.triggerMinAmount)}
                  onChangeText={(text) => setNewComponent({...newComponent, triggerMinAmount: parseFloat(text) || 0})}
                  placeholder="Enter minimum trigger amount"
                  keyboardType="numeric"
                />
              </View>

              {/* Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={newComponent.description}
                  onChangeText={(text) => setNewComponent({...newComponent, description: text})}
                  placeholder="Enter description"
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Scanned By */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Scanned By</Text>
                <TextInput
                  style={styles.textInput}
                  value={newComponent.scannedBy}
                  onChangeText={(text) => setNewComponent({...newComponent, scannedBy: text})}
                  placeholder="Enter scanner name"
                />
              </View>

              {/* Image Section */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Component Image</Text>
                <TouchableOpacity style={styles.imageButton} onPress={handleImagePicker}>
                  <Text style={styles.imageButtonText}>
                    {selectedImage ? "Change Image" : "Add Image"}
                  </Text>
                </TouchableOpacity>
                {selectedImage && (
                  <View style={styles.selectedImageContainer}>
                    <Image source={{ uri: selectedImage.uri }} style={styles.selectedImage} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => setSelectedImage(null)}
                    >
                      <Text style={styles.removeImageText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCreateModalClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, createLoading && styles.saveButtonDisabled]}
                onPress={saveNewComponent}
                disabled={createLoading}
              >
                <Text style={styles.saveButtonText}>
                  {createLoading ? "Creating..." : "Create Component"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
