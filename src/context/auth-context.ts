import * as React from 'react';
import type { User } from '@/interfaces/user.interface';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
}

export interface AuthContextProps {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void | Promise<void>;
}

export const AuthContext = React.createContext<AuthContextProps | undefined>(undefined);
