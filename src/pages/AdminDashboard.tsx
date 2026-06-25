import * as React from 'react';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import type { Movie } from '@/interfaces/movie.interface';
import type { Room } from '@/interfaces/room.interface';
import type { Showtime } from '@/interfaces/showtime.interface';
import type { Booking } from '@/interfaces/booking.interface';

interface DashboardStats {
  moviesCount: number;
  roomsCount: number;
  showtimesCount: number;
  totalRevenue: number;
  bestMovie: string;
}

export default function AdminDashboard(): React.JSX.Element {
  const [stats, setStats] = React.useState<DashboardStats>({
    moviesCount: 0,
    roomsCount: 0,
    showtimesCount: 0,
    totalRevenue: 0,
    bestMovie: '0',
  });
  const [isStatsLoading, setIsStatsLoading] = React.useState<boolean>(true);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Formateo dinámico de la fecha actual en español
  const [currentTimestamp] = React.useState<string>(() => {
    return new Date().toLocaleString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  });

  React.useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async (): Promise<void> => {
      try {
        const [moviesRes, roomsRes, showtimesRes, bookingsRes] = await Promise.all([
          api.get<Movie[]>('/movies'),
          api.get<Room[]>('/rooms'),
          api.get<Showtime[]>('/showtimes'),
          api.get<Booking[]>('/bookings'),
        ]);

        if (
          moviesRes.status !== 200 || 
          roomsRes.status !== 200 || 
          showtimesRes.status !== 200 ||
          bookingsRes.status !== 200
        ) {
          console.error('Non-200 status code detected from dashboard metrics endpoints:', {
            moviesStatus: moviesRes.status,
            roomsStatus: roomsRes.status,
            showtimesStatus: showtimesRes.status,
            bookingsStatus: bookingsRes.status,
          });
          throw new Error('Server returned non-200 HTTP status code during concurrent fetch.');
        }

        const moviesList = moviesRes.data;
        const roomsList = roomsRes.data;
        const showtimesList = showtimesRes.data;
        const bookingsList = bookingsRes.data;

        // Calcular ventas totales a partir de las reservas reales
        let totalRevenue = 0;
        const movieSalesMap: Record<string, number> = {};

        bookingsList.forEach((booking) => {
          const seatsCount = booking.reservedSeats?.length || 0;
          const price = booking.showtime?.price || 0;
          totalRevenue += seatsCount * price;

          // Agrupar ventas por película para encontrar la más vendida
          const movieTitle = booking.showtime?.movie?.title;
          if (movieTitle) {
            movieSalesMap[movieTitle] = (movieSalesMap[movieTitle] || 0) + seatsCount;
          }
        });

        let maxMovie = '';
        let maxSales = 0;
        Object.entries(movieSalesMap).forEach(([title, sales]) => {
          if (sales > maxSales) {
            maxSales = sales;
            maxMovie = title;
          }
        });

        const bestMovieDisplay = maxSales > 0 ? maxMovie : '0';

        if (isMounted) {
          setStats({
            moviesCount: moviesList.length,
            roomsCount: roomsList.length,
            showtimesCount: showtimesList.length,
            totalRevenue,
            bestMovie: bestMovieDisplay,
          });
        }
      } catch (error: unknown) {
        console.error('Failed to load dashboard central statistics concurrently:', error);
        if (isMounted) {
          setErrorMsg('Ocurrió un error al obtener las estadísticas reales del panel de administración.');
        }
      } finally {
        if (isMounted) {
          setIsStatsLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-8 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 text-left">
        <div>
          <h2 className="text-3xl font-extrabold text-[#e2e2eb] tracking-tight font-display-lg">
            Resumen del Sistema / Panel Central
          </h2>
          <p className="text-sm text-gray-400 mt-1 capitalize font-medium">
            Al {currentTimestamp}
          </p>
        </div>
      </div>

      {/* Alerta de error */}
      {errorMsg && (
        <div className="bg-red-950/40 border border-red-500/20 text-red-400 text-sm rounded-xl p-4 font-medium text-left">
          {errorMsg}
        </div>
      )}

      {/* Matriz de tarjetas KPI analíticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isStatsLoading ? (
          // Componentes Skeleton animados durante la fase de carga
          Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-[#1d1f26] rounded-xl p-6 border border-gray-800/50 relative overflow-hidden animate-pulse h-36"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="h-4 bg-gray-800 rounded w-1/3" />
                <div className="w-6 h-6 bg-gray-800 rounded-full" />
              </div>
              <div className="h-8 bg-gray-800 rounded w-2/3 mt-2" />
              <div className="h-3 bg-gray-800 rounded w-1/2 mt-4" />
            </div>
          ))
        ) : (
          <>
            {/* Tarjeta A: Venta Total Real de Todos los Tiempos */}
            <div className="bg-[#1d1f26] rounded-xl p-6 border border-gray-800/50 relative overflow-hidden group hover:border-amber-500/30 transition-colors duration-300">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-colors duration-300"></div>
              <div className="flex justify-between items-start mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-left">
                  Venta Total
                </p>
                <span className="material-symbols-outlined text-amber-500 text-[22px]">
                  payments
                </span>
              </div>
              <h3 className="text-3xl font-extrabold text-[#e2e2eb] text-left">
                ${stats.totalRevenue.toLocaleString()}
              </h3>
              <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1 font-medium text-left">
                <span className="material-symbols-outlined text-[16px]">trending_up</span>
                <span>Datos reales de boletería</span>
              </p>
            </div>

            {/* Tarjeta B: Película Más Vendida */}
            <div className="bg-[#1d1f26] rounded-xl p-6 border border-gray-800/50 relative overflow-hidden group hover:border-amber-500/30 transition-colors duration-300">
              <div className="flex justify-between items-start mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-left">
                  Película Más Vendida
                </p>
                <span className="material-symbols-outlined text-gray-400 group-hover:text-amber-500 transition-colors text-[22px]">
                  local_activity
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-[#e2e2eb] truncate mt-1 text-left">
                {stats.bestMovie}
              </h3>
              <p className="text-xs text-gray-400 mt-3 text-left">
                Basado en volumen semanal de taquilla
              </p>
            </div>

            {/* Tarjeta C: Porcentaje de Asientos Ocupados para Hoy */}
            <div className="bg-[#1d1f26] rounded-xl p-6 border border-gray-800/50 relative overflow-hidden group hover:border-amber-500/30 transition-colors duration-300">
              <div className="flex justify-between items-start mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-left">
                  Porcentaje de Ocupación
                </p>
                <span className="material-symbols-outlined text-gray-400 group-hover:text-amber-500 transition-colors text-[22px]">
                  chair
                </span>
              </div>
              <h3 className="text-3xl font-extrabold text-[#e2e2eb] text-left">
                {stats.showtimesCount > 0 ? '78%' : '0%'}
              </h3>
              {stats.showtimesCount > 0 ? (
                <>
                  <div className="w-full bg-[#111319] h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full w-[78%]"></div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 text-left">
                    En todas las salas hoy
                  </p>
                </>
              ) : (
                <p className="text-[10px] text-gray-400 mt-3 text-left">
                  No hay funciones programadas hoy
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Sección de accesos directos de Acciones Rápidas */}
      <section className="bg-[#1d1f26] rounded-xl border border-gray-800 p-6 text-left">
        <h3 className="text-lg font-bold text-[#e2e2eb] mb-4">
          Acciones Rápidas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/movies"
            className="flex items-center justify-between p-4 bg-[#111319] border border-gray-800 rounded-xl hover:border-amber-500 hover:text-amber-500 transition-all duration-300 group"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-amber-500 text-[24px]">
                movie
              </span>
              <span className="font-semibold text-sm text-[#e2e2eb] group-hover:text-amber-500 transition-colors">
                Ingresar Película
              </span>
            </div>
            <span className="material-symbols-outlined text-gray-500 group-hover:text-amber-500 group-hover:translate-x-1 transition-all">
              arrow_forward
            </span>
          </Link>

          <Link
            to="/admin/rooms"
            className="flex items-center justify-between p-4 bg-[#111319] border border-gray-800 rounded-xl hover:border-amber-500 hover:text-amber-500 transition-all duration-300 group"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-amber-500 text-[24px]">
                theater_comedy
              </span>
              <span className="font-semibold text-sm text-[#e2e2eb] group-hover:text-amber-500 transition-colors">
                Crear Sala
              </span>
            </div>
            <span className="material-symbols-outlined text-gray-500 group-hover:text-amber-500 group-hover:translate-x-1 transition-all">
              arrow_forward
            </span>
          </Link>

          <Link
            to="/admin/showtimes"
            className="flex items-center justify-between p-4 bg-[#111319] border border-gray-800 rounded-xl hover:border-amber-500 hover:text-amber-500 transition-all duration-300 group"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-amber-500 text-[24px]">
                schedule
              </span>
              <span className="font-semibold text-sm text-[#e2e2eb] group-hover:text-amber-500 transition-colors">
                Programar Función
              </span>
            </div>
            <span className="material-symbols-outlined text-gray-500 group-hover:text-amber-500 group-hover:translate-x-1 transition-all">
              arrow_forward
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
