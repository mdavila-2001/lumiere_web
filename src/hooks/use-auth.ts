import * as React from 'react';
import { AuthContext } from '@/context/auth-context';
import type { AuthContextProps } from '@/context/auth-context';

export const useAuth = (): AuthContextProps => {
    const context = React.useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export type { AuthContextProps as AuthContextType };
