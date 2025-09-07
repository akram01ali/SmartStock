import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from 'expo-secure-store';
import ApiService, { AppUser, AuthResponse } from "../services/api";

// Storage keys
const TOKEN_KEY = 'smartstock_auth_token';
const USER_KEY = 'smartstock_user_data';

interface AuthContextType {
  isAuthenticated: boolean;
  user: { name: string; surname: string; initials: string } | null;
  token: string | null;
  login: (credentials: AppUser) => Promise<void>;
  register: (
    name: string,
    surname: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ name: string; surname: string; initials: string } | null>(
    null
  );
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // Start with loading true to check stored auth

  const checkAuthState = async () => {
    try {
      setLoading(true);
      
      // Try to get stored token and user data
      let storedToken = null;
      let storedUserData = null;
      
      try {
        storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        storedUserData = await SecureStore.getItemAsync(USER_KEY);
      } catch (error) {
        console.error("Error accessing SecureStore:", error);
        // Continue with null values
      }
      
      if (storedToken && storedUserData) {
        try {
          const userData = JSON.parse(storedUserData);
          
          // Set the authentication state
          setToken(storedToken);
          setUser(userData);
          setIsAuthenticated(true);
          
          console.log("AuthContext: Restored authentication state from storage");
        } catch (parseError) {
          console.error("Error parsing stored user data:", parseError);
          // Clear invalid stored data
          await SecureStore.deleteItemAsync(TOKEN_KEY);
          await SecureStore.deleteItemAsync(USER_KEY);
        }
      } else {
        console.log("AuthContext: No stored authentication found");
      }
    } catch (error) {
      console.error("Error checking auth state:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthState();
  }, []);

  const login = async (credentials: AppUser) => {
    try {
      const response: AuthResponse = await ApiService.login(credentials);

      const userData = { 
        name: credentials.name, 
        surname: credentials.surname,
        initials: `${credentials.name[0].toUpperCase()}${credentials.surname[0].toUpperCase()}`
      };

      // Store token and user data securely
      try {
        await SecureStore.setItemAsync(TOKEN_KEY, response.access_token);
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userData));
      } catch (error) {
        console.error("Error storing credentials:", error);
        // Continue without storing - user will need to login again next time
      }

      // Update state
      setToken(response.access_token);
      setUser(userData);
      setIsAuthenticated(true);

      console.log("AuthContext: Login successful, credentials stored");
    } catch (error) {
      console.error("AuthContext: Login failed:", error);
      throw error;
    }
  };

  const register = async (name: string, surname: string) => {
    try {
      await ApiService.register({ name, surname });

      await login({ name, surname });
    } catch (error) {
      console.error("AuthContext: Registration failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Clear stored credentials
      try {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(USER_KEY);
      } catch (error) {
        console.error("Error clearing stored credentials:", error);
      }
      
      // Clear state
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    user,
    token,
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
