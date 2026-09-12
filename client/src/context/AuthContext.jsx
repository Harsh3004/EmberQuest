import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch, setAccessToken } from '../lib/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  // Check health and existing refresh token on initial load
  useEffect(() => {
    async function checkAuth() {
      try {
        // Check health
        const healthRes = await fetch('/api/health');
        if (healthRes.ok) {
          setIsBackendConnected(true);
          // Try refresh cookie with credentials
          try {
            const refreshRes = await fetch('/api/auth/refresh', {
              method: 'POST',
              credentials: 'include',
            });
            if (refreshRes.ok) {
              const data = await refreshRes.json();
              const token = data.accessToken || data.token;
              if (token) {
                setAccessToken(token);
                setUser(data.user);
              }
            }
          } catch {
            // No active session cookie, which is completely expected
          }
        }
      } catch {
        setIsBackendConnected(false);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  const login = async (identifier, password) => {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    const token = data.accessToken || data.token;
    if (token) setAccessToken(token);
    setUser(data.user);
    return data;
  };

  const signup = async (username, email, password, avatarUrl) => {
    const data = await apiFetch('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, avatarUrl }),
    });
    const token = data.accessToken || data.token;
    if (token) setAccessToken(token);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network failure on logout
    }
    setAccessToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        isBackendConnected,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
