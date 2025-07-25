import React from 'react';
import { View, Text } from 'react-native';

interface ComponentDetailCardProps {
  title: string;
  children: React.ReactNode;
  styles: any;
}

export const ComponentDetailCard: React.FC<ComponentDetailCardProps> = ({
  title,
  children,
  styles,
}) => (
  <View style={styles.detailsCard}>
    <Text style={styles.cardTitle}>{title}</Text>
    {children}
  </View>
);

interface DetailRowProps {
  label: string;
  value: string | number;
  isLast?: boolean;
  valueStyle?: any;
  styles: any;
}

export const DetailRow: React.FC<DetailRowProps> = ({
  label,
  value,
  isLast = false,
  valueStyle,
  styles,
}) => (
  <View style={[styles.detailRow, isLast && styles.lastDetailRow]}>
    <Text style={styles.detailLabel}>{label}:</Text>
    <Text style={[styles.detailValue, valueStyle]}>{value}</Text>
  </View>
); 