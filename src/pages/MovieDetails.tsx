import * as React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { ApiError } from '@/services/api';
import type { Movie } from '@/interfaces/movie.interface';
import type { Showtime } from '@/interfaces/showtime.interface';

const imageBaseUrl = import.meta.env.VITE_IMAGE_URL || 'http://localhost:3000';

function resolvePosterUrl(posterUrl: string | undefined): string | undefined {
  if (!posterUrl) return undefined;
  return posterUrl.startsWith('http') ? posterUrl : `${imageBaseUrl}${posterUrl}`;
}

// Runtime helper: raw integer minutes → compact "Xh Ym" notation (142 → "2h 22m").
function formatRuntime(totalMinutes: number): string {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return '—';
  const minutes = Math.round(totalMinutes);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

// Stable local-date key (YYYY-MM-DD) used to group/compare showtimes by day.
function toDateKey(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatWeekday(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('es-ES', { weekday: 'short' })
    .format(date)
    .replace('.', '')
    .toUpperCase();
}

function formatDayNumber(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit' }).format(date);
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '--:--';
  return new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

interface DateOption {
  key: string;
  iso: string;
}

export default function MovieDetails(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [movie, setMovie] = React.useState<Movie | null>(null);
  const [showtimes, setShowtimes] = React.useState<Showtime[]>([]);
  const [isPageLoading, setIsPageLoading] = React.useState<boolean>(true);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [selectedDate, setSelectedDate] = React.useState<string>('');

  // ── Dual network coordination: movie profile + its showtimes ────────────
  React.useEffect(() => {
    if (!id) return;
    let isMounted = true;

    const fetchData = async (): Promise<void> => {
      setIsPageLoading(true);
      setErrorMsg(null);
      try {
        const [movieRes, showtimesRes] = await Promise.all([
          api.get<Movie>(`/movies/${id}`),
          api.get<Showtime[]>('/showtimes', { params: { movieId: id } }),
        ]);

        if (!isMounted) return;
        setMovie(movieRes.data);
        setShowtimes(showtimesRes.data);
      } catch (err: unknown) {
        console.error('Failed to load movie details:', err);
        if (isMounted) {
          if (err instanceof ApiError) {
            setErrorMsg(err.errors.join(', '));
          } else if (err instanceof Error) {
            setErrorMsg(err.message);
          } else {
            setErrorMsg('No se pudo cargar la información de la película.');
          }
        }
      } finally {
        if (isMounted) setIsPageLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [id]);

  // Unique, chronologically-sorted dates extracted from the showtimes list.
  const dateOptions = React.useMemo<DateOption[]>(() => {
    const seen = new Map<string, string>();
    showtimes.forEach((st) => {
      const key = toDateKey(st.startTime);
      if (key && !seen.has(key)) {
        seen.set(key, st.startTime);
      }
    });
    return Array.from(seen.entries())
      .map(([key, iso]) => ({ key, iso }))
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [showtimes]);

  // Default the ribbon to the earliest available date once data arrives.
  React.useEffect(() => {
    if (dateOptions.length === 0) {
      setSelectedDate('');
      return;
    }
    setSelectedDate((current) => {
      const stillValid = dateOptions.some((option) => option.key === current);
      return stillValid ? current : dateOptions[0].key;
    });
  }, [dateOptions]);

  // Showtimes for the active date, ordered by start time.
  const showtimesForSelectedDate = React.useMemo<Showtime[]>(() => {
    return showtimes
      .filter((st) => toDateKey(st.startTime) === selectedDate)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [showtimes, selectedDate]);

  const posterUrl = resolvePosterUrl(movie?.posterUrl);

  // ── Loading skeleton ────────────────────────────────────────────────────
  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
        <div className="relative h-[60vh] min-h-[460px] bg-zinc-900 animate-pulse" />
        <div className="max-w-6xl mx-auto px-6 -mt-40 relative grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
          <div className="h-80 bg-zinc-800 rounded-2xl animate-pulse" />
          <div className="space-y-4 pt-4">
            <div className="h-10 bg-zinc-800 rounded w-2/3 animate-pulse" />
            <div className="h-4 bg-zinc-800/60 rounded w-1/3 animate-pulse" />
            <div className="h-24 bg-zinc-800/40 rounded w-full animate-pulse mt-6" />
          </div>
        </div>
      </div>
    );
  }

  // ── Not found / error fallback ──────────────────────────────────────────
  if (!movie) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 text-center gap-4">
        <span className="material-symbols-outlined text-[48px] text-zinc-600">movie_off</span>
        <div className="space-y-1">
          <h1 className="text-xl font-bold">No encontramos esta película</h1>
          <p className="text-sm text-zinc-400">{errorMsg ?? 'El recurso solicitado no está disponible.'}</p>
        </div>
        <Link
          to="/"
          className="bg-amber-500 text-zinc-950 font-bold px-5 py-2.5 rounded-lg hover:bg-amber-600 transition-colors"
        >
          Volver a la cartelera
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* ── Slim top bar ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 w-full bg-zinc-950/70 backdrop-blur-md border-b border-zinc-800/60 px-6 h-16 flex items-center justify-between">
        <Link to="/" className="text-amber-500 text-xl font-extrabold tracking-tight hover:text-amber-600 transition-colors">
          Lumiére
        </Link>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-amber-500 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Volver
        </button>
      </header>

      {/* ── Cinematic hero ────────────────────────────────────────────── */}
      <section className="relative">
        {/* Blurred backdrop mirror of the poster + black gradient veil */}
        <div className="absolute inset-0 overflow-hidden">
          {posterUrl && (
            <img
              src={posterUrl}
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover scale-110 blur-2xl opacity-40"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/85 to-zinc-950/50" />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/60 to-transparent" />
        </div>

        {/* Content grid */}
        <div className="relative max-w-6xl mx-auto px-6 pt-12 pb-16 grid grid-cols-1 lg:grid-cols-[260px_1fr_360px] gap-8 items-start">
          {/* Left: crisp poster card */}
          <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-2xl aspect-[2/3] w-full max-w-[260px]">
            {posterUrl ? (
              <img src={posterUrl} alt={movie.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600">
                <span className="material-symbols-outlined text-[48px]">movie</span>
              </div>
            )}
          </div>

          {/* Middle: metadata */}
          <div className="text-left pt-2 lg:pt-8">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-zinc-50 tracking-tight font-display leading-tight">
              {movie.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-4 text-sm text-zinc-300">
              <span className="font-semibold">{formatRuntime(movie.duration)}</span>
              <span className="text-zinc-600">•</span>
              <span>{movie.genre}</span>
              <span className="inline-flex items-center rounded-md border border-zinc-700 bg-zinc-900/70 px-2 py-0.5 font-mono text-xs font-bold text-amber-500 uppercase tracking-wider">
                {movie.rating}
              </span>
            </div>

            <p className="text-base text-zinc-300/90 leading-relaxed mt-6 max-w-2xl">
              {movie.synopsis}
            </p>
          </div>

          {/* Right: Showtimes panel */}
          <aside className="bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-2xl p-5 shadow-2xl w-full lg:mt-4">
            <h2 className="text-lg font-bold text-zinc-100 mb-4">Funciones Disponibles</h2>

            {dateOptions.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-10 px-2 gap-2">
                <span className="material-symbols-outlined text-[32px] text-zinc-600">event_busy</span>
                <p className="text-sm text-zinc-400">
                  No hay funciones programadas para esta película por ahora.
                </p>
              </div>
            ) : (
              <>
                {/* Date selection ribbon */}
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin scrollbar-thumb-zinc-800">
                  {dateOptions.map((option) => {
                    const isActive = option.key === selectedDate;
                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setSelectedDate(option.key)}
                        className={`shrink-0 w-16 rounded-xl py-2.5 flex flex-col items-center transition-all cursor-pointer border ${
                          isActive
                            ? 'bg-amber-500 text-zinc-950 border-amber-500 font-bold'
                            : 'bg-zinc-950/40 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
                        }`}
                      >
                        <span className="text-[11px] uppercase tracking-wider">
                          {formatWeekday(option.iso)}
                        </span>
                        <span className="text-lg font-bold leading-none mt-0.5">
                          {formatDayNumber(option.iso)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Showtime allocation cards */}
                <div className="mt-5 space-y-3">
                  {showtimesForSelectedDate.length === 0 ? (
                    <p className="text-sm text-zinc-500 text-center py-4">
                      No hay funciones para la fecha seleccionada.
                    </p>
                  ) : (
                    showtimesForSelectedDate.map((st) => (
                      <div
                        key={st.id}
                        className="flex items-center justify-between gap-3 bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 transition-colors hover:border-amber-500/40"
                      >
                        <div className="flex flex-col text-left">
                          <span className="text-base font-bold text-zinc-100 font-mono">
                            {formatTime(st.startTime)}
                          </span>
                          <span className="text-xs text-zinc-400 mt-0.5">
                            {st.room?.name ?? 'Sala por confirmar'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate(`/booking/${st.id}`)}
                          className="shrink-0 bg-amber-500 text-zinc-950 text-sm font-bold px-4 py-2 rounded-lg hover:bg-amber-600 active:scale-95 transition-all cursor-pointer"
                        >
                          Reservar
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}
