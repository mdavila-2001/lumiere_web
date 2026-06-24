import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { UserRole } from '@/interfaces/user.interface';

/**
 * Resolves the landing route for an authenticated user based on its role.
 * Admins are sent to their dashboard; everyone else lands on the billboard.
 */
export const resolveLandingRoute = (role: UserRole): string =>
  role === UserRole.ADMIN ? '/admin' : '/';

/**
 * Reactively redirects an authenticated user to its role-based landing route.
 *
 * Intended for auth screens (login/register): once the global auth state holds
 * a user, this navigates Admins to `/admin` and Customers back to the billboard
 * `/`. The JWT is already persisted by the auth flow, so the session survives.
 */
export const useAuthRedirect = (): void => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    navigate(resolveLandingRoute(user.role), { replace: true });
  }, [isAuthenticated, user, navigate]);
};
