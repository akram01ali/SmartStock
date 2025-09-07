import { useState, useCallback } from 'react';
import { validateNotify } from '../utils/notifications';

interface AuthFormData {
  name: string;
  surname: string;
}

export const useAuthForm = () => {
  const [formData, setFormData] = useState<AuthFormData>({
    name: '',
    surname: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const updateField = useCallback((field: keyof AuthFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrorMessage(''); // Clear error when user types
  }, []);

  const clearError = useCallback(() => {
    setErrorMessage('');
  }, []);

  const validateForm = useCallback((): boolean => {
    if (!formData.name.trim()) {
      validateNotify.required('First name');
      return false;
    }
    if (!formData.surname.trim()) {
      validateNotify.required('Last name');
      return false;
    }
    return true;
  }, [formData]);

  const resetForm = useCallback(() => {
    setFormData({ name: '', surname: '' });
    setErrorMessage('');
    setRememberMe(false);
    setLoading(false);
  }, []);

  return {
    formData,
    loading,
    errorMessage,
    rememberMe,
    setLoading,
    setErrorMessage,
    setRememberMe,
    updateField,
    clearError,
    validateForm,
    resetForm,
  };
}; 