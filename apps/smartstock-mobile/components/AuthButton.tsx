import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface AuthButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  styles: any;
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  styles,
}) => {
  const buttonStyle = variant === 'primary' ? styles.loginButton : styles.registerButton;
  const buttonTextStyle = variant === 'primary' ? styles.loginButtonText : styles.registerButtonText;
  const disabledStyle = variant === 'primary' ? styles.loginButtonDisabled : styles.registerButtonDisabled;

  return (
    <TouchableOpacity
      style={[buttonStyle, (loading || disabled) && disabledStyle]}
      onPress={onPress}
      disabled={loading || disabled}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <Text style={buttonTextStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}; 