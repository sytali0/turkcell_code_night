import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authAPI } from '../api/axios';

const AuthContext = createContext(null);

function mapUser(userData) {
  if (!userData) return null;
  return {
    ...userData,
    name: userData.full_name,
    biography: userData.bio,
    userRole: userData.role,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('educell_user');
      return saved ? mapUser(JSON.parse(saved)) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('educell_token'));
  const [authLoading, setAuthLoading] = useState(Boolean(token));

  const updateUser = useCallback((userData) => {
    const mapped = mapUser(userData);
    if (mapped) {
      localStorage.setItem('educell_user', JSON.stringify(mapped));
    } else {
      localStorage.removeItem('educell_user');
    }
    setUser(mapped);
  }, []);

  const login = useCallback((tokenValue, userData) => {
    localStorage.setItem('educell_token', tokenValue);
    setToken(tokenValue);
    updateUser(userData);
  }, [updateUser]);

  const logout = useCallback(() => {
    localStorage.removeItem('educell_token');
    localStorage.removeItem('educell_user');
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!localStorage.getItem('educell_token')) return null;
    const res = await authAPI.me();
    updateUser(res.data);
    return mapUser(res.data);
  }, [updateUser]);

  useEffect(() => {
    if (!token) {
      setAuthLoading(false);
      return;
    }

    let active = true;
    setAuthLoading(true);
    refreshUser()
      .catch(() => {
        if (active) logout();
      })
      .finally(() => {
        if (active) setAuthLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token, refreshUser, logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        updateUser,
        refreshUser,
        authLoading,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
