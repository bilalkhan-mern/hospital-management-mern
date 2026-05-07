import { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const AuthContext = createContext(null);

const getStoredUser = () => {
  try {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (_error) {
    localStorage.removeItem('user');
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLoggedInUser = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        setUser(response.data.data);
        localStorage.setItem('user', JSON.stringify(response.data.data));
      } catch (_error) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadLoggedInUser();
  }, []);

  const login = async (payload) => {
    const response = await api.post('/auth/login', payload);
    const { accessToken, user: currentUser } = response.data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('user', JSON.stringify(currentUser));
    setUser(currentUser);
    toast.success('Welcome back.');
    return currentUser;
  };

  const register = async (payload) => {
    await api.post('/auth/register', payload);
    toast.success('Registration successful. Please log in.');
  };

  const registerDoctor = async (payload) => {
    await api.post('/auth/register-doctor', payload);
    toast.success('Doctor application submitted. Wait for admin approval before logging in.');
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (_error) {
      // Ignore logout network issues and clear local session.
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      setUser(null);
      toast.success('You have been logged out.');
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    registerDoctor,
    logout,
    setUser,
    isAuthenticated: Boolean(user),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
