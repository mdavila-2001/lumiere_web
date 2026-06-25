import * as React from 'react';
import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import type { UserRole } from '@/interfaces/user.interface';
import { ROUTES } from '@/routes/paths';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
}

export const ForbiddenPage: React.FC = () => {
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
      <div className="max-w-md p-8 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl space-y-6">
        <div className="w-16 h-16 bg-red-950/40 text-red-500 border border-red-500/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-zinc-100">403 - Access Denied</h2>
          <p className="text-sm text-zinc-400">
            You do not have the required permissions to view this administration panel or resource.
          </p>
        </div>
        <div>
          <Link
            to={ROUTES.HOME}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold bg-amber-500 text-zinc-950 hover:bg-amber-600 rounded-md transition-colors"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm text-zinc-400 font-medium">Verifying credentials...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <ForbiddenPage />;
  }

  return <Outlet />;
};
