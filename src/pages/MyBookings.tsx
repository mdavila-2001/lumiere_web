import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import api, { ApiError } from '@/services/api';
import type { Booking } from '@/interfaces/booking.interface';
import { useAuth } from '@/hooks/use-auth';
import { ROUTES } from '@/routes/paths';

const imageBaseUrl = import.meta.env.VITE_IMAGE_URL;

function resolvePosterUrl(posterUrl: string | undefined): string | undefined {
  if (!posterUrl) return undefined;
  return posterUrl.startsWith('http') ? posterUrl : `${imageBaseUrl}${posterUrl}`;
}

const getRowLabel = (rowNum: number): string => {
  let charCode = 64 + rowNum;
  if (charCode >= 73) {
    charCode += 1;
  }
  return String.fromCodePoint(charCode);
};

export default function MyBookings(): React.JSX.Element {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<'upcoming' | 'past'>('upcoming');

  const loadBookings = React.useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const endpoint = user?.role === 'ADMIN' ? '/bookings' : '/bookings/me';
      const response = await api.get<Booking[]>(endpoint);
      
      if (response.status === 200) {
        setBookings(response.data);
      } else {
        throw new Error('Respuesta inválida del servidor al cargar las reservas.');
      }
    } catch (err: unknown) {
      console.error('Failed to load bookings:', err);
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Ocurrió un error inesperado al consultar tus reservas.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    Promise.resolve().then(() => {
      loadBookings();
    });
  }, [loadBookings]);

  const formatDateTime = (isoString?: string): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const optionsDate: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    };
    const optionsTime: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    };
    
    const formattedDate = new Intl.DateTimeFormat('es-ES', optionsDate).format(date);
    const formattedTime = new Intl.DateTimeFormat('es-ES', optionsTime).format(date);
    
    const parts = formattedDate.split(' ');
    if (parts[0]) {
      parts[0] = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }
    const capDate = parts.join(' ');
    
    return `${capDate} • ${formattedTime}`;
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const upcomingBookings = React.useMemo(() => {
    const now = new Date();
    return bookings
      .filter((b) => {
        if (!b.showtime?.startTime) return false;
        return new Date(b.showtime.startTime) >= now;
      })
      .sort((a, b) => {
        const timeA = a.showtime?.startTime ? new Date(a.showtime.startTime).getTime() : 0;
        const timeB = b.showtime?.startTime ? new Date(b.showtime.startTime).getTime() : 0;
        return timeA - timeB;
      });
  }, [bookings]);

  const pastBookings = React.useMemo(() => {
    const now = new Date();
    return bookings
      .filter((b) => {
        if (!b.showtime?.startTime) return false;
        return new Date(b.showtime.startTime) < now;
      })
      .sort((a, b) => {
        const timeA = a.showtime?.startTime ? new Date(a.showtime.startTime).getTime() : 0;
        const timeB = b.showtime?.startTime ? new Date(b.showtime.startTime).getTime() : 0;
        return timeB - timeA;
      });
  }, [bookings]);

  const activeBookingsList = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  const renderContent = (): React.JSX.Element => {
    if (isLoading) {
      return (
        <div className="flex flex-col gap-5">
          <div key="skeleton-1" className="bg-zinc-900 border border-zinc-800/60 rounded-2xl h-44 w-full animate-pulse flex overflow-hidden">
            <div className="w-28 bg-zinc-855 shrink-0" />
            <div className="flex-1 p-6 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="h-5 bg-zinc-850 rounded w-1/2" />
                <div className="h-3.5 bg-zinc-850 rounded w-1/3" />
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-zinc-850 rounded w-2/3" />
                <div className="h-3 bg-zinc-850 rounded w-1/4" />
              </div>
            </div>
          </div>
          <div key="skeleton-2" className="bg-zinc-900 border border-zinc-800/60 rounded-2xl h-44 w-full animate-pulse flex overflow-hidden">
            <div className="w-28 bg-zinc-855 shrink-0" />
            <div className="flex-1 p-6 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="h-5 bg-zinc-850 rounded w-1/2" />
                <div className="h-3.5 bg-zinc-850 rounded w-1/3" />
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-zinc-850 rounded w-2/3" />
                <div className="h-3 bg-zinc-850 rounded w-1/4" />
              </div>
            </div>
          </div>
          <div key="skeleton-3" className="bg-zinc-900 border border-zinc-800/60 rounded-2xl h-44 w-full animate-pulse flex overflow-hidden">
            <div className="w-28 bg-zinc-855 shrink-0" />
            <div className="flex-1 p-6 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="h-5 bg-zinc-850 rounded w-1/2" />
                <div className="h-3.5 bg-zinc-850 rounded w-1/3" />
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-zinc-850 rounded w-2/3" />
                <div className="h-3 bg-zinc-850 rounded w-1/4" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeBookingsList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center text-center py-20 px-6 bg-zinc-900/30 border border-zinc-900 rounded-2xl max-w-md mx-auto mt-6">
          <div className="h-16 w-16 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-[32px]">calendar_today</span>
          </div>
          <h3 className="text-base font-bold text-zinc-200 mb-1">No posees reservas</h3>
          <p className="text-xs text-zinc-500 max-w-xs mb-6">
            {activeTab === 'upcoming'
              ? 'No tienes funciones programadas para los próximos días.'
              : 'No posees reservas registradas en tu historial pasado.'}
          </p>
          <button
            type="button"
            onClick={() => navigate(ROUTES.HOME)}
            className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold px-6 py-2.5 rounded-lg text-xs transition-all cursor-pointer active:scale-95 shadow-[0_4px_14px_rgba(245,158,11,0.15)]"
          >
            Explorar Cartelera
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-6">
        {activeBookingsList.map((booking) => {
          const seats = booking.reservedSeats || [];
          const ticketCount = seats.length;
          const pricePerTicket = booking.showtime?.price || 0;
          const totalPrice = ticketCount * pricePerTicket;

          return (
            <div
              key={booking.id}
              className="bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden flex flex-col md:flex-row transition-all duration-300 hover:border-zinc-700/80 hover:shadow-lg relative"
            >
              <div className="w-full md:w-32 h-44 md:h-auto bg-zinc-950 shrink-0 relative overflow-hidden flex items-center justify-center">
                {booking.showtime?.movie?.posterUrl ? (
                  <img
                    src={resolvePosterUrl(booking.showtime.movie.posterUrl)}
                    alt={booking.showtime.movie.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="material-symbols-outlined text-[36px] text-zinc-700">movie</span>
                )}
              </div>

              <div className="flex-1 p-5 md:p-6 text-left flex flex-col justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-base font-bold text-zinc-100 leading-snug">
                    {booking.showtime?.movie?.title}
                  </h2>
                  <p className="text-xs text-zinc-400 font-medium">
                    {booking.showtime?.movie?.genre} • {booking.showtime?.movie?.rating}
                  </p>
                </div>

                <div className="space-y-1.5 border-t border-zinc-800/50 pt-3">
                  <div className="flex items-center gap-2 text-xs text-zinc-300">
                    <span className="material-symbols-outlined text-[16px] text-zinc-500">meeting_room</span>
                    <span>{booking.showtime?.room?.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-300 font-semibold text-amber-500/90">
                    <span className="material-symbols-outlined text-[16px] text-amber-500/70">schedule</span>
                    <span>{formatDateTime(booking.showtime?.startTime)}</span>
                  </div>
                </div>
              </div>

              <div className="p-5 md:p-6 bg-zinc-950/40 border-t md:border-t-0 md:border-l border-zinc-800/60 text-left flex flex-row justify-between md:flex-col md:justify-between items-center md:items-start w-full md:w-56 shrink-0 relative">
                <div className="space-y-3 flex-1 md:flex-initial">
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Asientos</p>
                    <p className="text-xs font-mono font-bold text-zinc-200 mt-0.5">
                      {seats
                        .map((s) => `${getRowLabel(s.rowNumber)}${s.columnNumber}`)
                        .join(', ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Total Pagado</p>
                    <p className="text-sm font-bold text-zinc-100 font-mono mt-0.5">
                      {formatPrice(totalPrice)}
                    </p>
                  </div>
                </div>

                <div className="flex md:absolute md:right-0 md:top-0 h-16 md:h-full flex-row gap-[2px] items-stretch pl-4 pr-1 shrink-0 select-none py-1 opacity-25">
                  <div className="w-[3px] bg-zinc-400" />
                  <div className="w-[1px] bg-zinc-400" />
                  <div className="w-[2px] bg-zinc-400" />
                  <div className="w-[1px] bg-zinc-400" />
                  <div className="w-[3px] bg-zinc-400" />
                  <div className="w-[1px] bg-zinc-400" />
                  <div className="w-[2px] bg-zinc-400" />
                  <div className="w-[1px] bg-zinc-400" />
                  <div className="w-[3px] bg-zinc-400" />
                  <div className="w-[1px] bg-zinc-400" />
                  <div className="w-[1px] bg-zinc-400" />
                  <div className="w-[2px] bg-zinc-400" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans pb-16">
      <header className="w-full bg-zinc-900 border-b border-zinc-800 px-6 h-16 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(ROUTES.HOME)}
            className="h-9 w-9 rounded-full border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 hover:border-zinc-700 hover:text-amber-500 flex items-center justify-center transition-all cursor-pointer"
            title="Volver a la cartelera"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>
          <h1 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">Mis Reservas</h1>
        </div>

        <button
          onClick={() => navigate(ROUTES.HOME)}
          className="text-amber-500 text-xl font-extrabold tracking-tight hover:text-amber-600 transition-colors cursor-pointer bg-transparent border-none p-0"
        >
          Lumiére
        </button>
      </header>

      <div className="flex-1 w-full px-6 md:px-10 py-8">
        <div className="flex border-b border-zinc-800 mb-8">
          <button
            type="button"
            onClick={() => setActiveTab('upcoming')}
            className={`py-3 px-6 text-sm font-semibold transition-all duration-200 relative cursor-pointer ${
              activeTab === 'upcoming'
                ? 'text-amber-500'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Próximas Funciones
            {activeTab === 'upcoming' && (
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-amber-500" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('past')}
            className={`py-3 px-6 text-sm font-semibold transition-all duration-200 relative cursor-pointer ${
              activeTab === 'past'
                ? 'text-amber-500'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Historial Pasado
            {activeTab === 'past' && (
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-amber-500" />
            )}
          </button>
        </div>

        {errorMsg && (
          <div className="bg-red-950/40 border border-red-500/20 text-red-400 text-xs rounded-xl p-4 mb-6 text-center max-w-lg mx-auto">
            {errorMsg}
          </div>
        )}

        {renderContent()}
      </div>
    </main>
  );
}
