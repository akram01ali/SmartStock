import { Alert, Vibration } from 'react-native';

export const notify = {
  success: (message: string, onPress?: () => void) => {
    Alert.alert('Success', message, [{ text: 'OK', onPress }]);
  },

  error: (message: string, onPress?: () => void) => {
    Vibration.vibrate(200);
    Alert.alert('Error', message, [{ text: 'OK', onPress }]);
  },

  confirm: (
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    title: string = 'Confirm'
  ) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: onCancel },
      { text: 'OK', onPress: onConfirm },
    ]);
  },

  info: (message: string, onPress?: () => void) => {
    Alert.alert('Info', message, [{ text: 'OK', onPress }]);
  },
};

export const actionNotify = {
  created: (itemType: string, onContinue?: () => void) => {
    notify.success(`${itemType} created successfully!`, onContinue);
  },

  updated: (itemType: string, onContinue?: () => void) => {
    notify.success(`${itemType} updated successfully!`, onContinue);
  },

  deleted: (itemType: string, onContinue?: () => void) => {
    notify.success(`${itemType} deleted successfully!`, onContinue);
  },

  createFailed: (itemType: string) => {
    notify.error(`Failed to create ${itemType}. Please try again.`);
  },

  updateFailed: (itemType: string) => {
    notify.error(`Failed to update ${itemType}. Please try again.`);
  },

  loadFailed: () => {
    notify.error('Failed to load data. Please check your connection and try again.');
  },
};

export const validateNotify = {
  required: (fieldName: string) => {
    notify.error(`${fieldName} is required.`);
  },

  invalid: (fieldType: string) => {
    notify.error(`Please enter a valid ${fieldType}.`);
  },
}; 