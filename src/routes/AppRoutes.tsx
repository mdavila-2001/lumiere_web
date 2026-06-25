import * as React from 'react';
import { Routes, Route } from 'react-router-dom';
import { UserRole } from '@/interfaces/user.interface';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { ROUTES } from '@/routes/paths';

import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import MovieDetails from '@/pages/MovieDetails';
import SeatMap from '@/pages/SeatMap';
import AdminDashboard from '@/pages/AdminDashboard';
import MovieManagement from '@/pages/MovieManagement';
import MovieForm from '@/pages/MovieForm';
import RoomManagement from '@/pages/RoomManagement';
import ShowtimeManagement from '@/pages/ShowtimeManagement';
import TestComponents from '@/TestComponents';
import AdminLayout from '@/layouts/AdminLayout';

/**
 * Declarative route table for the whole application.
 *
 * Public routes are open; the `ProtectedRoute` guard wraps the route groups
 * that require an authenticated session, enforcing the allowed roles per group.
 */
export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public */}
      <Route path={ROUTES.HOME} element={<Home />} />
      <Route path={ROUTES.MOVIE_DETAILS} element={<MovieDetails />} />
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route path={ROUTES.REGISTER} element={<Register />} />
      <Route path={ROUTES.PLAYGROUND} element={<TestComponents />} />

      {/* Authenticated: customers and admins */}
      <Route element={<ProtectedRoute allowedRoles={[UserRole.CUSTOMER, UserRole.ADMIN]} />}>
        <Route path={ROUTES.BOOKING} element={<SeatMap />} />
      </Route>

      {/* Admin panel: admins only */}
      <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} />}>
        <Route element={<AdminLayout />}>
          <Route path={ROUTES.ADMIN} element={<AdminDashboard />} />
          <Route path={ROUTES.ADMIN_MOVIES} element={<MovieManagement />} />
          <Route path={ROUTES.ADMIN_MOVIE_NEW} element={<MovieForm />} />
          <Route path={ROUTES.ADMIN_MOVIE_EDIT} element={<MovieForm />} />
          <Route path={ROUTES.ADMIN_ROOMS} element={<RoomManagement />} />
          <Route path={ROUTES.ADMIN_SHOWTIMES} element={<ShowtimeManagement />} />
        </Route>
      </Route>
    </Routes>
  );
};
