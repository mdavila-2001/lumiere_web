import * as React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Location } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { resolveLandingRoute } from '@/routes/paths';

/**
 * Reads the path the user was originally trying to reach, stashed by
 * `ProtectedRoute` as `state.from` when it bounced an unauthenticated visitor
 * to the login screen. Returns `null` when there is no such intended location.
 */
function readIntendedPath(state: unknown): string | null {
  if (typeof state !== 'object' || state === null) {
    return null;
  }
  const from = (state as { from?: unknown }).from;
  if (typeof from !== 'object' || from === null) {
    return null;
  }
  const { pathname, search, hash } = from as Partial<Location>;
  return pathname ? `${pathname}${search ?? ''}${hash ?? ''}` : null;
}

/**
 * Reactively redirects an authenticated user away from auth screens.
 *
 * Intended for login/register: once the global auth state holds a user, this
 * sends them to the page they were originally trying to reach (saved by
 * `ProtectedRoute`), falling back to their role-based landing route. The JWT is
 * already persisted by the auth flow, so the session survives the navigation.
 */
export const useAuthRedirect = (): void => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    const intended = readIntendedPath(location.state);
    navigate(intended ?? resolveLandingRoute(user.role), { replace: true });
  }, [isAuthenticated, user, navigate, location.state]);
};
