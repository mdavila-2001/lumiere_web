import * as React from 'react';
import type { User } from '@/interfaces/user.interface';
import { AuthContext } from './auth-context';
import type { AuthContextType } from './auth-context';

const STORAGE_KEY = 'lumiere_token';
const USER_KEY = 'lumiere_user';

export interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = React.useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to read token from localStorage:', error);
      return null;
    }
  });

  const [user, setUser] = React.useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem(USER_KEY);
      if (storedUser) {
        return JSON.parse(storedUser) as User;
      }
      // If we have a token but no stored user, rehydrate with temporary profile structure
      if (localStorage.getItem(STORAGE_KEY)) {
        return {
          id: 'temp-rehydrated-id',
          email: 'loading@lumiere.com',
          role: 'CUSTOMER',
          createdAt: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error('Failed to parse user from localStorage:', error);
    }
    return null;
  });

  // Since we rehydrate states synchronously above on initialization, isLoading is false immediately
  const [isLoading] = React.useState<boolean>(false);

  const login = React.useCallback((newToken: string, newUser: User) => {
    try {
      localStorage.setItem(STORAGE_KEY, newToken);
      localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    } catch (error) {
      console.error('Failed to save session storage:', error);
    }
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = React.useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (error) {
      console.error('Failed to clear session storage:', error);
    }
    setToken(null);
    setUser(null);
  }, []);

  const isAuthenticated = Boolean(token && user);

  const contextValue = React.useMemo<AuthContextType>(
    () => ({
      user,
      token,
      isAuthenticated,
      isLoading,
      login,
      logout,
    }),
    [user, token, isAuthenticated, isLoading, login, logout]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
