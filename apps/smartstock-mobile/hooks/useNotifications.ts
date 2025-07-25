import { useState, useCallback } from 'react';
import { 
  showSuccessNotification, 
  showErrorNotification, 
  showWarningNotification,
  showConfirmationDialog,
  withErrorHandling,
  NotificationTemplates
} from '../utils/notificationUtils';

export const useNotifications = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  // Execute operation with loading state and error handling
  const executeWithFeedback = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string,
    onSuccess?: (result: T) => void,
    customSuccessMessage?: string
  ): Promise<T | null> => {
    setIsProcessing(true);
    
    const result = await withErrorHandling(
      operation,
      operationName,
      (result) => {
        if (customSuccessMessage) {
          showSuccessNotification(customSuccessMessage);
        }
        if (onSuccess) {
          onSuccess(result);
        }
      }
    );
    
    setIsProcessing(false);
    return result;
  }, []);

  // Quick access to common notifications
  const notify = {
    success: showSuccessNotification,
    error: showErrorNotification,
    warning: showWarningNotification,
    confirm: showConfirmationDialog,
    templates: NotificationTemplates,
  };

  return {
    isProcessing,
    executeWithFeedback,
    notify,
  };
}; 