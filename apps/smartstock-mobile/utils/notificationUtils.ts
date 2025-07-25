import { Alert, Vibration } from 'react-native';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

const vibrate = (pattern: number[] = [100]) => {
  try {
    Vibration.vibrate(pattern);
  } catch (error) {
  }
};

export const notificationUtils = {
  success: (message: string, onPress?: () => void, title: string = 'Success') => {
    vibrate([50, 100, 50]);
    Alert.alert(
      title,
      message,
      [
        {
          text: 'OK',
          onPress: onPress || (() => {}),
          style: 'default',
        },
      ]
    );
  },

  error: (message: string, onPress?: () => void, title: string = 'Error') => {
    vibrate([200, 100, 200]);
    Alert.alert(
      title,
      message,
      [
        {
          text: 'OK',
          onPress: onPress || (() => {}),
          style: 'default',
        },
      ]
    );
  },

  warning: (message: string, onPress?: () => void, title: string = 'Warning') => {
    vibrate([100, 50, 100]);
    Alert.alert(
      title,
      message,
      [
        {
          text: 'OK',
          onPress: onPress || (() => {}),
          style: 'default',
        },
      ]
    );
  },

  confirm: (
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    title: string = 'Confirm',
    confirmText: string = 'Confirm',
    cancelText: string = 'Cancel'
  ) => {
    Alert.alert(
      title,
      message,
      [
        {
          text: cancelText,
          onPress: onCancel || (() => {}),
          style: 'cancel',
        },
        {
          text: confirmText,
          onPress: onConfirm,
          style: 'default',
        },
      ]
    );
  },

  info: (message: string, onPress?: () => void, title: string = 'Info') => {
    Alert.alert(title, message, [{ text: 'OK', onPress: onPress || (() => {}) }]);
  },
};

export const executeWithFeedback = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  onSuccess?: (result: T) => void,
  onError?: (error: Error) => void
): Promise<{ success: boolean; result?: T; error?: Error }> => {
  try {
    const result = await operation();
    onSuccess?.(result);
    return { success: true, result };
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    console.error(`${operationName} failed:`, error);
    onError?.(errorObj);
    notificationUtils.error(`Failed to ${operationName}. Please try again.`);
    return { success: false, error: errorObj };
  }
};

export const actionNotify = {
  created: (itemType: string, onContinue?: () => void) => {
    notificationUtils.success(`${itemType} created successfully!`, onContinue);
  },

  updated: (itemType: string, onContinue?: () => void) => {
    notificationUtils.success(`${itemType} updated successfully!`, onContinue);
  },

  deleted: (itemType: string, onContinue?: () => void) => {
    notificationUtils.success(`${itemType} deleted successfully!`, onContinue);
  },

  createFailed: (itemType: string) => {
    notificationUtils.error(`Failed to create ${itemType}. Please try again.`);
  },

  updateFailed: (itemType: string) => {
    notificationUtils.error(`Failed to update ${itemType}. Please try again.`);
  },

  deleteFailed: (itemType: string) => {
    notificationUtils.error(`Failed to delete ${itemType}. Please try again.`);
  },

  loadFailed: () => {
    notificationUtils.error('Failed to load data. Please check your connection and try again.');
  },
};

export const validateNotify = {
  required: (fieldName: string) => {
    notificationUtils.warning(`${fieldName} is required.`);
  },

  invalid: (fieldType: string) => {
    notificationUtils.warning(`Please enter a valid ${fieldType}.`);
  },

  tooShort: (fieldName: string, minLength: number) => {
    notificationUtils.warning(`${fieldName} must be at least ${minLength} characters.`);
  },

  tooLong: (fieldName: string, maxLength: number) => {
    notificationUtils.warning(`${fieldName} must be no more than ${maxLength} characters.`);
  },
};

export const networkNotify = {
  offline: () => {
    notificationUtils.error('You appear to be offline. Please check your connection.');
  },

  timeout: () => {
    notificationUtils.error('Request timed out. Please try again.');
  },

  serverError: () => {
    notificationUtils.error('Server error. Please try again later.');
  },
};

export const NotificationTemplates = {
  loginSuccess: () => notificationUtils.success('Welcome back!'),
  logoutSuccess: () => notificationUtils.success('Logged out successfully'),
  registrationSuccess: () => notificationUtils.success('Account created successfully!'),
  passwordChanged: () => notificationUtils.success('Password changed successfully'),
  profileUpdated: () => notificationUtils.success('Profile updated successfully'),
  settingsSaved: () => notificationUtils.success('Settings saved successfully'),

  componentCreated: (name: string, onRefresh?: () => void) => 
    notificationUtils.success(`Component "${name}" created successfully!`, onRefresh),
  componentUpdated: (name: string, onRefresh?: () => void) => 
    notificationUtils.success(`Component "${name}" updated successfully!`, onRefresh),
  componentDeleted: (name: string, onRefresh?: () => void) => 
    notificationUtils.success(`Component "${name}" deleted successfully!`, onRefresh),

  stockUpdated: (amount: number, unit: string, isAbsolute: boolean, onContinue?: () => void) =>
    notificationUtils.success(
      `Stock ${isAbsolute ? 'set to' : 'updated by'} ${amount} ${unit}`,
      onContinue
    ),

  scanSuccess: (componentName: string) => 
    notificationUtils.success(`Found component: ${componentName}`),
  scanFailed: () => 
    notificationUtils.error('No component found with that code. Try scanning again.'),

  dataLoaded: () => notificationUtils.info('Data refreshed successfully'),
  dataLoadFailed: () => actionNotify.loadFailed(),

  requiredFields: () => validateNotify.required('All required fields'),
  invalidFormat: (field: string) => validateNotify.invalid(field),
}; 