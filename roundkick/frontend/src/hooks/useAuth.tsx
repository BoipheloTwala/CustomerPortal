//CODE ATTRIBUTION
//01
//React Context API
//Adapted from: Meta Platforms. (2025). Context. [online] React Documentation.
//Available at: https://react.dev/reference/react/createContext
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//02
//React Hooks - useState, useEffect, useContext
//Adapted from: Meta Platforms. (2025). Hooks API Reference. [online] React Documentation.
//Available at: https://react.dev/reference/react
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//03
//TypeScript React Hooks Typing
//Adapted from: React TypeScript Cheatsheets. (2025). Hooks. [online] GitHub.
//Available at: https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/hooks
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//04
//JWT Token Storage Best Practices
//Adapted from: OWASP. (2025). HTML5 Security Cheat Sheet. [online] OWASP Cheat Sheet Series.
//Available at: https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html#local-storage
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//05
//Authentication State Management
//Adapted from: OWASP. (2025). Session Management Cheat Sheet. [online] OWASP Cheat Sheet Series.
//Available at: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
//Date Accessed: 10 October 2025

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: string;
  isActive: boolean;
  lastLogin?: string;
  emailVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profileData: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is logged in on app start
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('authToken');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          // Verify token is still valid by fetching profile
          const response = await authAPI.getProfile();
          setUser(response.data.user);
        } catch (error) {
          // Token is invalid, clear local storage
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password });
      const { token, user: userData } = response.data;

      // Store token and user data
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error: any) {
      // Provide more detailed error messages
      if (error.response) {
        // Server responded with error
        throw new Error(error.response.data?.error || `Login failed: ${error.response.status} ${error.response.statusText}`);
      } else if (error.request) {
        // Request was made but no response received (network error)
        throw new Error('Cannot connect to server. Please ensure the backend is running on http://localhost:5000');
      } else {
        // Something else happened
        throw new Error(error.message || 'Login failed. Please try again.');
      }
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
  }) => {
    try {
      const response = await authAPI.register(userData);
      const { token, user: newUser } = response.data;

      // Store token and user data
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Even if logout request fails, clear local data
      console.error('Logout error:', error);
    } finally {
      // Clear local storage and state
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const updateProfile = async (profileData: Partial<User>) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      const updatedUser = response.data.user;

      // Update local storage and state
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Profile update failed');
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authAPI.getProfile();
      const userData = response.data.user;

      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to refresh user data');
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
