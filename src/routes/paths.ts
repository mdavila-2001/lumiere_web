import { UserRole } from '@/interfaces/user.interface';

/**
 * Centralised route paths — the single source of truth for every navigation
 * target in the app. Prefer these constants over hard-coded path strings so a
 * URL only ever needs to change in one place.
 */
export const ROUTES = {
  // Public
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  MOVIE_DETAILS: '/movie/:id',
  PLAYGROUND: '/test',

  // Authenticated (customer or admin)
  BOOKING: '/booking/:showtimeId',

  // Admin panel
  ADMIN: '/admin',
  ADMIN_MOVIES: '/admin/movies',
  ADMIN_MOVIE_NEW: '/admin/movies/new',
  ADMIN_MOVIE_EDIT: '/admin/movies/edit/:id',
  ADMIN_ROOMS: '/admin/rooms',
  ADMIN_SHOWTIMES: '/admin/showtimes',
} as const;

/**
 * Resolves the landing route for a freshly authenticated user based on its role.
 * Admins land on the dashboard; everyone else on the public billboard.
 */
export const resolveLandingRoute = (role: UserRole): string =>
  role === UserRole.ADMIN ? ROUTES.ADMIN : ROUTES.HOME;
