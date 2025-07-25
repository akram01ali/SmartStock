import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getStockStatus, getStockStatusColor } from '../utils/stockUtils';

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

interface ComponentCardProps {
  item: Component;
  onPress: (component: Component) => void;
  styles: any;
}

export const ComponentCard: React.FC<ComponentCardProps> = ({ 
  item, 
  onPress, 
  styles 
}) => {
  const stockStatus = getStockStatus(item.amount, item.triggerMinAmount);
  const stockColor = getStockStatusColor(stockStatus);

  return (
    <TouchableOpacity
      style={styles.componentCard}
      onPress={() => onPress(item)}
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
        <DetailRow label="Type" value={item.type} styles={styles} />
        <DetailRow label="Supplier" value={item.supplier} styles={styles} />
        <DetailRow 
          label="Cost" 
          value={`€${item.cost.toFixed(2)}`} 
          styles={styles}
          valueStyle={styles.costValue}
        />
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
};

interface DetailRowProps {
  label: string;
  value: string;
  styles: any;
  valueStyle?: any;
}

const DetailRow: React.FC<DetailRowProps> = ({ 
  label, 
  value, 
  styles, 
  valueStyle 
}) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}:</Text>
    <Text
      style={[styles.detailValue, valueStyle]}
      numberOfLines={1}
      ellipsizeMode="tail"
    >
      {value}
    </Text>
  </View>
); 