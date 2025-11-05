import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '../types';
import { loginRequest, registerRequest, fetchCurrentUser } from '../services/auth';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USER_STORAGE_KEY = 'robot_manager_user';
const TOKEN_STORAGE_KEY = 'robot_manager_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await fetchCurrentUser();
      setUser(response);
    } catch (error) {
      setUser(null);
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [refreshUser]);

  const handleAuthSuccess = (authUser: User, token: string) => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authUser));
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    setUser(authUser);
  };

  const login = async (email: string, password: string) => {
    const { user: authUser, token } = await loginRequest(email, password);
    handleAuthSuccess(authUser, token);
  };

  const register = async (name: string, email: string, password: string) => {
    const { user: authUser, token } = await registerRequest(name, email, password);
    handleAuthSuccess(authUser, token);
  };

  const logout = () => {
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
