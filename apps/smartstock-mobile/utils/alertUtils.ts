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