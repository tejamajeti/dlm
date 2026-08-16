import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import api from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
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
  const [isImpersonating, setIsImpersonating] = useState<boolean>(
    Boolean(localStorage.getItem('dlm_admin_backup_token'))
  );
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      // Check if URL has ?token=... query parameter from copied access link
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get('token');

      let activeToken = token;

      if (tokenFromUrl) {
        activeToken = tokenFromUrl;
        localStorage.setItem('dlm_token', tokenFromUrl);
        setToken(tokenFromUrl);
        // Clean ?token= query parameter from browser address bar
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      if (activeToken) {
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
    setUser(null);
    setToken(null);
    setIsImpersonating(false);
    localStorage.removeItem('dlm_token');
    localStorage.removeItem('dlm_admin_backup_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
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
