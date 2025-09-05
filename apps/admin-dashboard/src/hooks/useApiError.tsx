import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook for handling API errors in components
 * Provides fallback error handling for cases where the global handler doesn't catch errors
 */
export const useApiError = () => {
  const { handleAuthError } = useAuth();

  const handleError = useCallback((error: any, fallbackMessage?: string) => {
    // If it's a 401 error, let the auth context handle it
    if (error?.status === 401 || error?.message?.includes('Authentication required')) {
      handleAuthError(error);
      return;
    }

    // For other errors, use the auth context's general error handler
    const errorToHandle = {
      ...error,
      message: error?.message || fallbackMessage || 'An unexpected error occurred'
    };
    
    handleAuthError(errorToHandle);
  }, [handleAuthError]);

  return { handleError };
};
