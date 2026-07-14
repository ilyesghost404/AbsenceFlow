import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Inline clear helper (avoids TDZ issues with logout reference in initializeAuth)
  const clearSession = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  }, []);

  // Initialize session from storage
  const initializeAuth = useCallback(async () => {
    const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        // Fetch fresh user data to verify token and status
        const response = await api.get('/users/me', {
          headers: { Authorization: `Bearer ${storedToken}` }
        });

        if (response.data.success) {
          const freshUser = response.data.data;
          setUser(freshUser);
          if (localStorage.getItem('token')) {
            localStorage.setItem('user', JSON.stringify(freshUser));
          } else {
            sessionStorage.setItem('user', JSON.stringify(freshUser));
          }
        } else {
          clearSession();
        }
      } catch {
        console.error('Session validation failed — clearing session.');
        clearSession();
      }
    }
    setLoading(false);
  }, [clearSession]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const login = async (username, password, rememberMe) => {
    try {
      const response = await api.post('/users/login', { username, password });

      if (response.data.success) {
        const { token: receivedToken, user: receivedUser } = response.data.data;

        setToken(receivedToken);
        setUser(receivedUser);

        if (rememberMe) {
          localStorage.setItem('token', receivedToken);
          localStorage.setItem('user', JSON.stringify(receivedUser));
        } else {
          sessionStorage.setItem('token', receivedToken);
          sessionStorage.setItem('user', JSON.stringify(receivedUser));
        }

        toast.success(`Welcome back, ${receivedUser.username}!`);
        return receivedUser;
      }
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  const logout = useCallback(() => {
    clearSession();
    toast.success('Logged out successfully.');
  }, [clearSession]);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager',
    isEmployee: user?.role === 'employee',
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
