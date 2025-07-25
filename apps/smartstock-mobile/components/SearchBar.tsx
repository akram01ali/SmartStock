import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onClearSearch: () => void;
  isSearching?: boolean;
  placeholder?: string;
  styles: any;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  onClearSearch,
  isSearching = false,
  placeholder = "Search by component name...",
  styles,
}) => (
  <View style={styles.searchSection}>
    <Text style={styles.searchLabel}>Search Components:</Text>
    <View style={styles.searchInputContainer}>
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        value={searchQuery}
        onChangeText={onSearchChange}
        autoCorrect={false}
        autoCapitalize="none"
      />
      {searchQuery ? (
        <TouchableOpacity onPress={onClearSearch} style={styles.clearSearchButton}>
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
); 