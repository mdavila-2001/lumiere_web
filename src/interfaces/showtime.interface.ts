import type { Movie } from './movie.interface';
import type { Room } from './room.interface';

export interface Showtime {
  id: string;
  movieId: string;
  roomId: string;
  startTime: string;
  endTime: string;
  price: number;
  createdAt: string;
  movie?: Movie;
  room?: Room;
}

export interface OccupiedSeat {
  rowNumber: number;
  columnNumber: number;
}
