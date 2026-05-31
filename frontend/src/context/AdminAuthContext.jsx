import { createContext, useState, useContext } from 'react';
import adminApi from '../utils/adminApi';

const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(false);

  const refreshAdmin = async () => {
    try {
      const response = await adminApi.get('/admin/current');
      setAdmin(response.data || null);
      return response.data || null;
    } catch {
      setAdmin(null);
      return null;
    }
  };

  const adminLogin = async (email, password) => {
    setLoading(true);
    try {
      const response = await adminApi.post('/admin/login', { email, password });
      if (response.success) {
        setAdmin(response.admin);
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: error.message || 'Admin login failed' };
    } finally {
      setLoading(false);
    }
  };

  const adminLogout = async () => {
    setAdmin(null);
    try {
      await adminApi.post('/admin/logout');
    } catch {
      // ignore
    }
  };

  const value = {
    admin,
    loading,
    adminLogin,
    adminLogout,
    refreshAdmin,
    isAdminAuthenticated: !!admin
  };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
};
