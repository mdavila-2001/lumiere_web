import * as React from 'react';
import api from '@/services/api';
import type { User, AuthResponse } from '@/interfaces/user.interface';
import { userFromToken } from '@/utils/jwt';
import { AuthContext } from './auth-context';
import type { LoginCredentials, RegisterData, AuthContextProps } from './auth-context';

const TOKEN_STORAGE_KEY = 'lumiere_token';

/**
 * Rehydrates the session straight from the persisted JWT (the backend exposes
 * no `/auth/profile` endpoint). Returns `null` when there is no token or it is
 * malformed/expired. Pure read — clearing a stale token is handled in an effect.
 */
function readPersistedUser(): User | null {
  try {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    return token ? userFromToken(token) : null;
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<User | null>(readPersistedUser);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  const logout = React.useCallback(async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Failed to log out from backend:', error);
    } finally {
      try {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      } catch (error) {
        console.error('Failed to remove token from localStorage:', error);
      }
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const login = React.useCallback(async (credentials: LoginCredentials): Promise<void> => {
    setIsLoading(true);
    try {
      const { data } = await api.post<AuthResponse>('/auth/login', credentials);
      const authenticatedUser = userFromToken(data.accessToken);
      if (!authenticatedUser) {
        throw new Error('El token de acceso recibido no es válido.');
      }

      localStorage.setItem(TOKEN_STORAGE_KEY, data.accessToken);
      setUser(authenticatedUser);
    } catch (error) {
      logout();
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  const register = React.useCallback(async (data: RegisterData): Promise<void> => {
    setIsLoading(true);
    try {
      await api.post<void>('/auth/register', data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    // The session is rehydrated synchronously from the JWT in `readPersistedUser`
    // (no `/auth/profile` endpoint exists). This effect only purges a stale or
    // corrupt token from storage so it is never sent on subsequent requests.
    try {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (token && !userFromToken(token)) {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Failed to purge stale token from localStorage:', error);
    }
  }, []);

  const isAuthenticated = !!user;

  const contextValue = React.useMemo<AuthContextProps>(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      login,
      register,
      logout,
    }),
    [user, isAuthenticated, isLoading, login, register, logout]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
