import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authApi from '../services/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Sync user state with backend /me on initial load
  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const profile = await authApi.getMe();
          if (profile) {
            setUser(profile);
            localStorage.setItem('user', JSON.stringify(profile));
          }
        } catch (err) {
          // If token expired, clear state
          console.warn('Initial session check failed:', err.message);
        }
      }
      setLoading(false);
    }

    loadUser();

    const handleAuthExpired = () => {
      setUser(null);
    };
    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, []);

  const login = useCallback(async (identifier, password) => {
    const data = await authApi.login({
      email: identifier.includes('@') ? identifier : undefined,
      username: !identifier.includes('@') ? identifier : undefined,
      password,
    });

    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data.user;
  }, []);

  const register = useCallback(async (email, username, password) => {
    const data = await authApi.register({ email, username, password });
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const updateUserProfile = useCallback(async (data) => {
    const updated = await authApi.updateProfile(data);
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
    return updated;
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
