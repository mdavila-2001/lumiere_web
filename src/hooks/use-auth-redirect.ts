import * as React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Location } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { resolveLandingRoute } from '@/routes/paths';

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
