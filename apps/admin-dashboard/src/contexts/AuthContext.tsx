import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useToast } from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';

interface User {
  username: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  handleAuthError: (error: any) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for stored token on app startup
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('authUser');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const API_URL = (process.env as any).REACT_APP_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const { access_token } = data;
        
        // Store token and user info
        localStorage.setItem('authToken', access_token);
        localStorage.setItem('authUser', JSON.stringify({ username }));
        
        setToken(access_token);
        setUser({ username });
        
        return true;
      } else {
        // Try to get error details from response
        try {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Login failed');
        } catch {
          throw new Error(`Login failed: ${response.status} ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      // Re-throw to let the calling component handle it
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback((showMessage: boolean = true) => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setToken(null);
    setUser(null);
    
    if (showMessage) {
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    }
    
    // Only navigate if not already on auth pages
    if (!location.pathname.startsWith('/auth')) {
      navigate('/auth/sign-in');
    }
  }, [toast, navigate, location.pathname]);

  const handleAuthError = useCallback((error: any) => {
    // Check if the error is a 401 (unauthorized) or token expiration
    if (error?.message?.includes('Authentication required') || 
        error?.message?.includes('401') ||
        error?.status === 401) {
      
      toast({
        title: "Session Expired",
        description: "Your session has expired. Please log in again.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      
      // Clear auth state and redirect to login
      logout(false); // Don't show the regular logout message
    } else {
      // Handle other types of errors
      toast({
        title: "Error",
        description: error?.message || "An unexpected error occurred.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }, [toast, logout]);

  // Register auth error handler with API services
  useEffect(() => {
    // Dynamically import and register with API services
    import('../services/service.js').then((module) => {
      module.ApiService.setAuthErrorHandler(handleAuthError);
    });
    
    import('../services/forecastingService.js').then((module) => {
      module.ForecastingService.setAuthErrorHandler(handleAuthError);
    });
  }, [handleAuthError]);

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    handleAuthError,
    isAuthenticated: !!user && !!token,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 