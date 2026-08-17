import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import api from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isImpersonating: boolean;
  impersonateUser: (targetUserId: string) => Promise<void>;
  stopImpersonating: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('dlm_token'));
  const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem('dlm_refresh_token'));
  const [isImpersonating, setIsImpersonating] = useState<boolean>(
    Boolean(localStorage.getItem('dlm_admin_backup_token'))
  );
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      if (token) {
        try {
          const res: any = await api.get('/protected/users/me');
          if (res.success && res.data) {
            setUser(res.data);
          } else {
            logout();
          }
        } catch {
          logout();
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    }
    initAuth();
  }, [token]);

  const login = async (email: string, password: string) => {
    const res: any = await api.post('/public/auth/login', { email, password });
    if (res.success && res.data) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('dlm_token', res.data.token);
      if (res.data.refreshToken) {
        setRefreshToken(res.data.refreshToken);
        localStorage.setItem('dlm_refresh_token', res.data.refreshToken);
      }
      localStorage.removeItem('dlm_admin_backup_token');
      setIsImpersonating(false);
    } else {
      throw new Error(res.message || 'Authentication failed');
    }
  };

  const register = async (fullName: string, email: string, password: string, role: UserRole) => {
    const res: any = await api.post('/public/auth/register', {
      email,
      password,
      full_name: fullName,
      role,
    });
    if (res.success && res.data) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('dlm_token', res.data.token);
      if (res.data.refreshToken) {
        setRefreshToken(res.data.refreshToken);
        localStorage.setItem('dlm_refresh_token', res.data.refreshToken);
      }
      localStorage.removeItem('dlm_admin_backup_token');
      setIsImpersonating(false);
    } else {
      throw new Error(res.message || 'Registration failed');
    }
  };

  const impersonateUser = async (targetUserId: string) => {
    if (!token) throw new Error('Not authenticated');
    // Save original Admin token before switching
    const currentAdminToken = localStorage.getItem('dlm_admin_backup_token') || token;
    localStorage.setItem('dlm_admin_backup_token', currentAdminToken);

    const res: any = await api.post(`/protected/users/impersonate/${targetUserId}`);
    if (res.success && res.data) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('dlm_token', res.data.token);
      if (res.data.refreshToken) {
        setRefreshToken(res.data.refreshToken);
        localStorage.setItem('dlm_refresh_token', res.data.refreshToken);
      }
      setIsImpersonating(true);
    } else {
      throw new Error(res.message || 'Failed to access target user account');
    }
  };

  const stopImpersonating = async () => {
    const adminToken = localStorage.getItem('dlm_admin_backup_token');
    if (adminToken) {
      localStorage.setItem('dlm_token', adminToken);
      localStorage.removeItem('dlm_admin_backup_token');
      setToken(adminToken);
      setIsImpersonating(false);
      try {
        const res: any = await api.get('/protected/users/me');
        if (res.success && res.data) {
          setUser(res.data);
        }
      } catch (e) {}
    }
  };

  const logout = () => {
    const curRefreshToken = localStorage.getItem('dlm_refresh_token');
    if (curRefreshToken) {
      api.post('/public/auth/logout', { refreshToken: curRefreshToken }).catch(() => {});
    }
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    setIsImpersonating(false);
    localStorage.removeItem('dlm_token');
    localStorage.removeItem('dlm_refresh_token');
    localStorage.removeItem('dlm_admin_backup_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        refreshToken,
        login,
        register,
        logout,
        loading,
        isImpersonating,
        impersonateUser,
        stopImpersonating,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
