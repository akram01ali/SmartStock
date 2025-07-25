import React, { createContext, useContext, useState, useEffect } from "react";
import ApiService, { AppUser, AuthResponse } from "../services/api";

interface AuthContextType {
  isAuthenticated: boolean;
  user: { name: string; surname: string; initials: string } | null;
  token: string | null;
  login: (credentials: AppUser) => Promise<void>;
  register: (
    name: string,
    surname: string,
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
  const [user, setUser] = useState<{ name: string; surname: string; initials: string } | null>(
    null
  );
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const checkAuthState = async () => {
    try {
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

      setToken(response.access_token);
      setUser({ 
        name: credentials.name, 
        surname: credentials.surname,
        initials: `${credentials.name[0].toUpperCase()}${credentials.surname[0].toUpperCase()}`
      });
      setIsAuthenticated(true);
    } catch (error) {
      console.error("AuthContext: Login failed:", error);
      throw error;
    }
  };

  const register = async (name: string, surname: string, password: string) => {
    try {
      await ApiService.register({ name, surname, password });

      await login({ name, surname, password });
    } catch (error) {
      console.error("AuthContext: Registration failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
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
