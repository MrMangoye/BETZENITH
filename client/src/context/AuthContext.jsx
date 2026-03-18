// src/context/AuthContext.jsx
import { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { login as apiLogin, register as apiRegister, getProfile, verifyEmail as apiVerifyEmail } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme !== 'light';
  });

  // Initialize theme
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Load user on token change
  useEffect(() => {
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const loadUser = async () => {
    try {
      const userData = await getProfile();
      // Ensure balance is a number
      userData.balance = parseFloat(userData.balance) || 0;
      setUser(userData);
    } catch (error) {
      console.error('Failed to load user:', error);
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const data = await apiLogin(email, password);
      
      // Check if email is verified
      if (!data.emailVerified) {
        toast.warning('Please verify your email before logging in');
        localStorage.setItem('verificationEmail', email);
        throw new Error('Email not verified');
      }

      // Ensure balance is a number
      data.balance = parseFloat(data.balance) || 0;

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data);
      toast.success(`Welcome back, ${data.username}!`);
      return data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      throw error;
    }
  };

  const register = async (username, email, password) => {
    try {
      const data = await apiRegister(username, email, password);
      
      // New users start with 0 balance
      data.balance = 0;
      
      // Store email for verification
      localStorage.setItem('verificationEmail', email);
      toast.success('Registration successful! Please check your email to verify your account.');
      return data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
      throw error;
    }
  };

  const verifyEmail = async (token) => {
    try {
      const data = await apiVerifyEmail(token);
      toast.success('Email verified successfully!');
      return data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateBalance = (newBalance) => {
    setUser(prev => ({ 
      ...prev, 
      balance: parseFloat(newBalance) || 0 
    }));
  };

  // Update balance after bet placement
  const deductBalance = (amount) => {
    if (user) {
      const newBalance = (user.balance || 0) - amount;
      setUser(prev => ({ ...prev, balance: newBalance }));
      return newBalance;
    }
    return 0;
  };

  // Add winnings to balance
  const addWinnings = (amount) => {
    if (user) {
      const newBalance = (user.balance || 0) + amount;
      setUser(prev => ({ ...prev, balance: newBalance }));
      return newBalance;
    }
    return 0;
  };

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  // Use useMemo to create a stable object reference
  const value = useMemo(() => ({
    user,
    loading,
    login,
    register,
    logout,
    updateBalance,
    deductBalance,
    addWinnings,
    verifyEmail,
    toggleTheme,
    isDarkMode,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin'
  }), [user, loading, isDarkMode]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};