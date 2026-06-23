import * as React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import MovieDetails from '@/pages/MovieDetails';
import SeatMap from '@/pages/SeatMap';
import AdminDashboard from '@/pages/AdminDashboard';
import MovieManagement from '@/pages/MovieManagement';
import RoomManagement from '@/pages/RoomManagement';
import ShowtimeManagement from '@/pages/ShowtimeManagement';

export default function App(): React.JSX.Element {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/movie/:id" element={<MovieDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Customer & Admin Secure Routes */}
          <Route element={<ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']} />}>
            <Route path="/booking/:showtimeId" element={<SeatMap />} />
          </Route>

          {/* Admin Exclusive Routes */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/movies" element={<MovieManagement />} />
            <Route path="/admin/rooms" element={<RoomManagement />} />
            <Route path="/admin/showtimes" element={<ShowtimeManagement />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
