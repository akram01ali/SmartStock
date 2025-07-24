import { UseToastOptions } from '@chakra-ui/react';

/**
 * Utility functions for consistent toast messaging across the application
 */

export const TOAST_DURATION = {
  SHORT: 3000,
  MEDIUM: 5000,
  LONG: 7000,
} as const;

/**
 * Creates a standardized success toast configuration
 */
export const createSuccessToast = (
  title: string,
  description?: string,
  duration: number = TOAST_DURATION.MEDIUM
): UseToastOptions => ({
  title,
  description,
  status: 'success',
  duration,
  isClosable: true,
});

/**
 * Creates a standardized error toast configuration
 */
export const createErrorToast = (
  title: string,
  error: unknown,
  duration: number = TOAST_DURATION.MEDIUM
): UseToastOptions => ({
  title,
  description: error instanceof Error ? error.message : 'An unexpected error occurred',
  status: 'error',
  duration,
  isClosable: true,
});

/**
 * Creates a standardized warning toast configuration
 */
export const createWarningToast = (
  title: string,
  description?: string,
  duration: number = TOAST_DURATION.SHORT
): UseToastOptions => ({
  title,
  description,
  status: 'warning',
  duration,
  isClosable: true,
});

/**
 * Creates a standardized info toast configuration
 */
export const createInfoToast = (
  title: string,
  description?: string,
  duration: number = TOAST_DURATION.SHORT
): UseToastOptions => ({
  title,
  description,
  status: 'info',
  duration,
  isClosable: true,
}); 