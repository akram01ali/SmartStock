import { Alert } from 'react-native';

export const showConfirmationAlert = (
  title: string,
  message: string,
  onConfirm: () => void,
  confirmText: string = "OK",
  cancelText: string = "Cancel"
) => {
  Alert.alert(title, message, [
    { text: cancelText, style: "cancel" },
    { text: confirmText, style: "destructive", onPress: onConfirm },
  ]);
};

export const showErrorAlert = (message: string, title: string = "Error") => {
  Alert.alert(title, message, [{ text: "OK" }]);
};

export const showSuccessAlert = (
  message: string, 
  title: string = "Success",
  onPress?: () => void
) => {
  Alert.alert(title, message, [
    { text: "OK", onPress }
  ]);
};

export const showValidationError = (field: string) => {
  showErrorAlert(`Please enter a valid ${field}`);
};

export const validateComponentForm = (component: any): string | null => {
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

export const resetComponentForm = (defaultScannedBy: string = 'mobile-app') => ({
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

import { useEffect, useState, useCallback } from 'react';

export const useDebounce = <T>(value: T, delay: number): T => {
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

export const useDebouncedSearch = (
  searchFunction: (query: string) => void,
  delay: number = 500
) => {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, delay);

  useEffect(() => {
    if (debouncedQuery.trim()) {
      searchFunction(debouncedQuery);
    }
  }, [debouncedQuery, searchFunction]);

  return { searchQuery, setSearchQuery };
}; 