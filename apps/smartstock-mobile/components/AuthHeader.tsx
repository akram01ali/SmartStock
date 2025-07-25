import React from 'react';
import { View, Text, Image } from 'react-native';

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  styles: any;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({
  title,
  subtitle,
  styles,
}) => (
  <View>
    <View style={styles.logoContainer}>
      <Image 
        source={require('../assets/iacs.png')} 
        style={styles.iacsLogo}
        resizeMode="contain"
      />
    </View>
    
    <Text style={styles.title}>{title}</Text>
    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
  </View>
); 