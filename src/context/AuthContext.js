import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = apiService.getToken();
        if (token) {
          const response = await apiService.getCurrentUser();
          setUser(response.user);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Clear invalid token
        apiService.removeToken();
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (credentials) => {
    try {
      setError(null);
      const response = await apiService.login(credentials);
      
      // Store token and user data
      apiService.setToken(response.token);
      setUser(response.user);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      return { success: true };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const signup = async (userData) => {
    try {
      setError(null);
      const response = await apiService.register(userData);
      
      // Store token and user data
      apiService.setToken(response.token);
      setUser(response.user);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      return { success: true };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all auth data
      apiService.removeToken();
      setUser(null);
      localStorage.removeItem('user');
      setError(null);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    token: apiService.getToken(),
    login,
    logout,
    signup,
    loading,
    error,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 