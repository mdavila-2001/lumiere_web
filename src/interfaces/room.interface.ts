import type { Seat } from './seat.interface';

export interface Room {
  id: string;
  name: string;
  rowsCount: number;
  columnsCount: number;
  capacity: number;
  createdAt: string;
  seats?: Seat[];
}

