import { createContext, useState, useContext, useEffect } from 'react';
import apiClient from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  const login = async (emailOrPhone, password) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/users/login', { emailOrPhone, password });

      if (response.success) {
        localStorage.setItem('token', response.token);
        setToken(response.token);
        setUser(response.user);
        return { success: true };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      return { success: false, message: error.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (firstName, lastName, email, phone, password) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/users/register', {
        firstName,
        lastName,
        email,
        phone,
        password
      });

      if (response.success) {
        localStorage.setItem('token', response.token);
        setToken(response.token);
        setUser(response.user);
        return { success: true };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      return { success: false, message: error.message || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!token
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
