import React, { useState, useContext, useEffect, useMemo, useCallback } from "react";
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
import type { RootStackParamList } from "../types/navigation";

interface Component {
  componentName: string;
  amount: number;
  measure: string;
  supplier: string;
  cost: number;
  type: string;
  description?: string;
  image?: string;
  lastScanned: string;
  scannedBy: string;
  durationofDevelopment: number;
  triggerMinAmount: number;
}

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

export default function InventoryScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user, token } = useAuth();
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
  const [newComponent, setNewComponent] = useState<NewComponent>({
    componentName: '',
    amount: 0,
    measure: 'amount',
    supplier: '',
    cost: 0,
    type: 'component',
    description: '',
    scannedBy: user?.name || 'mobile-app',
    durationOfDevelopment: 0,
    triggerMinAmount: 0,
  });

  // Get the appropriate data source and counts
  const displayComponents = searchQuery ? searchResults : components;
  const displayTotalCount = searchQuery 
    ? (searchPagination?.total_count || 0) 
    : totalCount;

  // Debounce search to avoid too many API calls
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchComponents();
  }, []);

  // Handle search with debouncing
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (searchQuery.trim()) {
      const timeout = setTimeout(() => {
        performSearch(searchQuery, 1, true);
      }, 500); // 500ms delay for debouncing
      setSearchTimeout(timeout);
    } else {
      // Clear search results when query is empty
      setSearchResults([]);
      setSearchPagination(null);
      setSearchCurrentPage(1);
      setIsSearching(false);
    }

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchQuery]);

  const fetchComponents = async (page: number = 1, reset: boolean = true) => {
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
      Alert.alert(
        "Error",
        "Failed to load inventory. Please check your connection and try again.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const performSearch = async (query: string, page: number = 1, reset: boolean = true) => {
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
      Alert.alert(
        "Error",
        "Failed to search components. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setIsSearching(false);
    }
  };

  const handleLoadMore = () => {
    if (loadingMore) return;

    if (searchQuery.trim()) {
      // Load more search results
      if (searchPagination?.has_next && token) {
        performSearch(searchQuery, searchCurrentPage + 1, false);
      }
    } else {
      // Load more regular components
      if (hasMoreData && token) {
        fetchComponents(currentPage + 1, false);
      }
    }
  };

  const handleRefresh = () => {
    if (searchQuery.trim()) {
      // Refresh search results
      setSearchCurrentPage(1);
      performSearch(searchQuery, 1, true);
    } else {
      // Refresh regular components
      setCurrentPage(1);
      setHasMoreData(true);
      fetchComponents(1, true);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleComponentPress = (component: Component) => {
    // Navigate to ComponentScreen with the component data
    navigation.navigate('Components', { 
      component: component,
      editMode: false 
    });
  };

  const getStockStatus = (amount: number) => {
    if (amount > 0) return "positive";
    if (amount === 0) return "zero";
    return "negative";
  };

  const getStockColor = (amount: number) => {
    if (amount > 0) return styles.stockPositive;
    if (amount === 0) return styles.stockZero;
    return styles.stockNegative;
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSearchPagination(null);
    setSearchCurrentPage(1);
    setIsSearching(false);
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
  };

  const handleCreateComponent = () => {
    setCreateModalVisible(true);
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

  const resetCreateForm = () => {
    setNewComponent({
      componentName: '',
      amount: 0,
      measure: 'amount',
      supplier: '',
      cost: 0,
      type: 'component',
      description: '',
      scannedBy: user?.name || 'mobile-app',
      durationOfDevelopment: 0,
      triggerMinAmount: 0,
    });
    setSelectedImage(null);
  };

  const saveNewComponent = async () => {
    if (!token) return;
    
    // Basic validation
    if (!newComponent.componentName.trim()) {
      Alert.alert("Error", "Component name is required.");
      return;
    }

    try {
      setCreateLoading(true);
      
      // Create component data object matching ComponentCreate model
      const componentData: {
        componentName: string;
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
            "Could not process the selected image, but the component will be created without it.",
            [{ text: "OK" }]
          );
        }
      }
      
      const createdComponent = await ApiService.createComponent(componentData, "", token);
      
      // Refresh the components list
      handleRefresh();
      
      Alert.alert(
        "Success",
        "Component created successfully!",
        [
          {
            text: "OK",
            onPress: () => {
              setCreateModalVisible(false);
              resetCreateForm();
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error creating component:", error);
      Alert.alert(
        "Error",
        "Failed to create component. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setCreateLoading(false);
    }
  };

  const renderComponentCard = ({ item }: { item: Component }) => (
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
          <Text
            style={[styles.stockText, getStockColor(item.amount)]}
          >
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
            onChangeText={handleSearchChange}
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
        onRequestClose={() => {
          setCreateModalVisible(false);
          resetCreateForm();
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Component</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setCreateModalVisible(false);
                  resetCreateForm();
                }}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
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
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setCreateModalVisible(false);
                  resetCreateForm();
                }}
              >
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
