import type { Showtime } from './showtime.interface';

export interface ReservedSeatDetail {
  id: string;
  bookingId: string;
  showtimeId: string;
  rowNumber: number;
  columnNumber: number;
}

export interface Booking {
  id: string;
  userId: string;
  showtimeId: string;
  createdAt: string;
  showtime?: Showtime;
  reservedSeats?: ReservedSeatDetail[];
}
