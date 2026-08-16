import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import api from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchRoleDemo: (role: UserRole) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('dlm_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      if (token) {
        try {
          const res: any = await api.get('/protected/users/me');
          if (res.success && res.data) {
            setUser(res.data);
          }
        } catch {
          // Token invalid or expired, default demo login
          await autoDemoLogin('admin@dlm.logistics');
        }
      } else {
        await autoDemoLogin('admin@dlm.logistics');
      }
      setLoading(false);
    }
    initAuth();
  }, [token]);

  const autoDemoLogin = async (email: string) => {
    try {
      const res: any = await api.post('/public/auth/login', {
        email,
        password: 'password123',
      });
      if (res.success && res.data) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('dlm_token', res.data.token);
      }
    } catch (e) {
      console.error('Demo login error:', e);
    }
  };

  const login = async (email: string, password: string) => {
    const res: any = await api.post('/public/auth/login', { email, password });
    if (res.success && res.data) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('dlm_token', res.data.token);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('dlm_token');
  };

  const switchRoleDemo = async (role: UserRole) => {
    const roleEmailMap: Record<UserRole, string> = {
      'Admin': 'admin@dlm.logistics',
      'Warehouse Manager': 'manager.nyc@dlm.logistics',
      'Driver': 'driver.john@dlm.logistics',
      'Customer': 'customer@acmecorp.com',
      'Operator': 'admin@dlm.logistics',
    };
    await autoDemoLogin(roleEmailMap[role] || 'admin@dlm.logistics');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, switchRoleDemo, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
