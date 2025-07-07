import React, { createContext, useContext, useState, useEffect } from "react";
// import * as SecureStore from 'expo-secure-store';
import ApiService, { AppUser, AuthResponse } from "../services/api";

interface AuthContextType {
  isAuthenticated: boolean;
  user: { name: string; surname: string; initials: string } | null;
  token: string | null;
  login: (credentials: AppUser) => Promise<void>;
  register: (
    name: string,
    surname: string,
    email: string,
    password: string
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
  const [user, setUser] = useState<{ name: string; surname: string } | null>(
    null
  );
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // Changed to false for testing

  // Temporarily remove SecureStore functionality
  const checkAuthState = async () => {
    try {
      // For now, just set loading to false without checking stored data
      console.log("AuthContext: Checking auth state...");
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
      console.log("AuthContext: Starting login process...");
      const response: AuthResponse = await ApiService.login(credentials);
      console.log("AuthContext: Login API call successful");

      // Skip SecureStore for now and just update state
      console.log("AuthContext: Updating state directly...");
      setToken(response.access_token);
      // Store user data with correct field mapping
      setUser({ name: credentials.name, surname: credentials.surname });
      setIsAuthenticated(true);
      console.log(
        "AuthContext: Login completed successfully, isAuthenticated should be true"
      );
    } catch (error) {
      console.error("AuthContext: Login failed:", error);
      throw error; // Re-throw to be handled by the login screen
    }
  };

  const register = async (
    name: string,
    surname: string,
    email: string,
    password: string
  ) => {
    try {
      console.log("AuthContext: Starting registration process...");
      // Note: The server doesn't expect email field for mobile app registration
      const credentials: AppUser = {
        name,
        surname,
        password,
      };

      const response = await ApiService.register(credentials);
      console.log("AuthContext: Registration API call successful");

      // Registration successful - don't auto-login, let user login manually
      console.log("AuthContext: Registration completed successfully");
    } catch (error) {
      console.error("AuthContext: Registration failed:", error);
      throw error; // Re-throw to be handled by the registration screen
    }
  };

  const logout = async () => {
    try {
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      console.log("AuthContext: Logout completed");
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
