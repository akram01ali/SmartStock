import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Alert,
  TextInput,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../contexts/AuthContext";
import ApiService from "../services/api";
import { inventoryScreenStyles as styles } from "../styles/InventoryScreenStyles";

interface Component {
  componentName: string;
  amount: number;
  measure: string;
  supplier: string;
  cost: number;
  type: string;
  description?: string;
  image?: string;
}

export default function InventoryScreen() {
  const navigation = useNavigation();
  const { user, token } = useAuth();
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter components based on search query
  const filteredComponents = useMemo(() => {
    if (!searchQuery.trim()) {
      return components;
    }
    
    return components.filter(component =>
      component.componentName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [components, searchQuery]);

  useEffect(() => {
    fetchComponents();
  }, []);

  const fetchComponents = async () => {
    try {
      setLoading(true);
      if (token) {
        const response = await ApiService.getAllComponents(token);
        setComponents(response);
      }
    } catch (error) {
      console.error('Error fetching components:', error);
      Alert.alert(
        'Error',
        'Failed to load inventory. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleComponentPress = (component: Component) => {
    Alert.alert(
      component.componentName,
      `Current Stock: ${component.amount} ${component.measure}\nType: ${component.type}\nSupplier: ${component.supplier}\nCost: $${component.cost}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Update Stock', 
          onPress: () => {
            // TODO: Navigate to stock update screen or show update modal
            Alert.alert('Coming Soon', 'Stock update functionality will be added here.');
          }
        }
      ]
    );
  };

  const getStockStatus = (amount: number) => {
    if (amount > 0) return 'positive';
    if (amount === 0) return 'zero';
    return 'negative';
  };

  const getStockColor = (amount: number) => {
    if (amount > 0) return styles.stockPositive;
    if (amount === 0) return styles.stockZero;
    return styles.stockNegative;
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
  };

  if (loading) {
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
      
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#4318FF" />
          </TouchableOpacity>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Inventory</Text>
            <Text style={styles.userText}>
              {searchQuery ? 
                `${filteredComponents.length} of ${components.length} components` :
                `${components.length} component${components.length !== 1 ? 's' : ''} available`
              }
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <View style={[styles.searchInput, { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12 }]}>
              <Ionicons name="search" size={20} color="#4318FF" style={{ marginRight: 10 }} />
              <TextInput
                placeholder="Search components..."
                onChangeText={handleSearchChange}
                value={searchQuery}
                style={{ flex: 1, fontSize: 16, color: '#1A1A1A' }}
                placeholderTextColor="#999999"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={clearSearch} style={{ marginLeft: 10 }}>
                  <Ionicons name="close-circle" size={20} color="#666666" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {components.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>📦 No Components Found</Text>
              <Text style={styles.emptyDescription}>
                No components are currently in the inventory. Add some components to get started.
              </Text>
            </View>
          ) : filteredComponents.length === 0 && searchQuery ? (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsTitle}>🔍 No Results Found</Text>
              <Text style={styles.noResultsDescription}>
                No components match "{searchQuery}". Try adjusting your search terms.
              </Text>
            </View>
          ) : (
            filteredComponents.map((item, index) => (
              <TouchableOpacity
                key={`${item.componentName}-${index}`}
                style={styles.componentCard}
                onPress={() => handleComponentPress(item)}
                activeOpacity={0.7}
              >
                {/* Card Header with Component Name and Stock */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleContainer}>
                    <Text style={styles.cardTitle} numberOfLines={2} ellipsizeMode="tail">
                      {item.componentName}
                    </Text>
                  </View>
                  <View style={styles.stockContainer}>
                    <Text style={[styles.stockText, getStockColor(item.amount)]}>
                      {item.amount} {item.measure}
                    </Text>
                  </View>
                </View>

                {/* Card Details */}
                <View style={styles.cardDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Type:</Text>
                    <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="tail">
                      {item.type}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Supplier:</Text>
                    <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="tail">
                      {item.supplier}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Cost:</Text>
                    <Text style={styles.costValue}>
                      ${item.cost.toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Click Indicator */}
                <View style={styles.clickIndicator}>
                  <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
