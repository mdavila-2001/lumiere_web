import { UserRole } from '@/interfaces/user.interface';

export const ROUTES = {
  
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  MOVIE_DETAILS: '/movie/:id',

  
  BOOKING: '/booking/:showtimeId',
  MY_BOOKINGS: '/my-bookings',

  
  ADMIN: '/admin',
  ADMIN_MOVIES: '/admin/movies',
  ADMIN_MOVIE_NEW: '/admin/movies/new',
  ADMIN_MOVIE_EDIT: '/admin/movies/edit/:id',
  ADMIN_ROOMS: '/admin/rooms',
  ADMIN_ROOMS_NEW: '/admin/rooms/new',
  ADMIN_ROOMS_EDIT: '/admin/rooms/edit/:id',
  ADMIN_SHOWTIMES: '/admin/showtimes',
  ADMIN_SHOWTIMES_NEW: '/admin/showtimes/new',
  ADMIN_SHOWTIMES_EDIT: '/admin/showtimes/edit/:id',
} as const;

export const resolveLandingRoute = (role: UserRole): string =>
  role === UserRole.ADMIN ? ROUTES.ADMIN : ROUTES.HOME;
