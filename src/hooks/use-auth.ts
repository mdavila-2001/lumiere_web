import * as React from 'react';
import { AuthContext } from '@/context/auth-context';
import type { AuthContextType } from '@/context/auth-context';

export const useAuth = (): AuthContextType => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
