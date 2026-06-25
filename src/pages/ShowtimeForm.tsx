import * as React from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api, { ApiError } from '@/services/api';
import type { Movie } from '@/interfaces/movie.interface';
import type { Room } from '@/interfaces/room.interface';
import type { Showtime } from '@/interfaces/showtime.interface';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

const imageBaseUrl = import.meta.env.VITE_IMAGE_URL || 'http://localhost:3000';

// Strict shape mirroring the backend CreateShowtimeDto contract.
interface ShowtimeFormState {
  movieId: string;
  roomId: string;
  startTime: string; // Bound to a <input type="datetime-local" /> (local wall time).
  price: number;
}

interface FieldErrors {
  movieId?: string;
  roomId?: string;
  startTime?: string;
  price?: string;
}

// Resolve a possibly-relative poster path against the asset host.
function resolvePosterUrl(posterUrl: string | undefined): string | null {
  if (!posterUrl) return null;
  return posterUrl.startsWith('http') ? posterUrl : `${imageBaseUrl}${posterUrl}`;
}

// Convert an ISO timestamp into the "YYYY-MM-DDTHH:mm" string the native
// datetime-local control expects, expressed in the user's local timezone.
function isoToLocalInput(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function formatLocalDateTime(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export default function ShowtimeForm(): React.JSX.Element {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  // Dependency resource pipelines
  const [movies, setMovies] = React.useState<Movie[]>([]);
  const [rooms, setRooms] = React.useState<Room[]>([]);
  const [isLoadingDeps, setIsLoadingDeps] = React.useState<boolean>(true);

  // Form model
  const [formState, setFormState] = React.useState<ShowtimeFormState>({
    movieId: '',
    roomId: '',
    startTime: '',
    price: 0,
  });

  // UI lifecycle flags & error contexts
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isConflict, setIsConflict] = React.useState<boolean>(false);

  // ── Dependency Orchestration: load movies + rooms in parallel ───────────
  React.useEffect(() => {
    let isMounted = true;

    const bootstrap = async (): Promise<void> => {
      setIsLoadingDeps(true);
      setSubmitError(null);
      try {
        const requests: [
          Promise<{ data: Movie[] }>,
          Promise<{ data: Room[] }>,
          Promise<{ data: Showtime }> | null,
        ] = [
          api.get<Movie[]>('/movies'),
          api.get<Room[]>('/rooms'),
          isEditMode && id ? api.get<Showtime>(`/showtimes/${id}`) : null,
        ];

        const [moviesRes, roomsRes] = await Promise.all([requests[0], requests[1]]);
        const showtimeRes = requests[2] ? await requests[2] : null;

        if (!isMounted) return;

        setMovies(moviesRes.data);
        setRooms(roomsRes.data);

        if (showtimeRes) {
          const showtime = showtimeRes.data;
          // Postgres `numeric` columns are serialised as strings by TypeORM;
          // parse explicitly to avoid broken Number.isFinite() validation.
          const parsedPrice = typeof showtime.price === 'string'
            ? parseFloat(showtime.price as unknown as string)
            : showtime.price;
          setFormState({
            movieId: showtime.movieId,
            roomId: showtime.roomId,
            startTime: isoToLocalInput(showtime.startTime),
            price: Number.isNaN(parsedPrice) ? 0 : parsedPrice,
          });
        }
      } catch (err: unknown) {
        console.error('Failed to bootstrap showtime form dependencies:', err);
        if (isMounted) {
          if (err instanceof ApiError) {
            setSubmitError(err.errors.join(', '));
          } else {
            setSubmitError('No se pudieron cargar las películas y salas disponibles.');
          }
        }
      } finally {
        if (isMounted) {
          setIsLoadingDeps(false);
        }
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, [isEditMode, id]);

  // ── Derived preview data (real values from the chosen resources) ─────────
  const selectedMovie = React.useMemo(
    () => movies.find((m) => m.id === formState.movieId) ?? null,
    [movies, formState.movieId]
  );
  const selectedRoom = React.useMemo(
    () => rooms.find((r) => r.id === formState.roomId) ?? null,
    [rooms, formState.roomId]
  );

  // Real bookable capacity = active seats persisted in the DB. The room's
  // `capacity` column is DB-generated as rows×columns (full grid), so it does
  // NOT reflect disabled seats; prefer the seats relation when present.
  const realSeatCount = React.useMemo<number | null>(() => {
    if (!selectedRoom) return null;
    return selectedRoom.seats?.length ?? selectedRoom.capacity;
  }, [selectedRoom]);

  const estimatedEnd = React.useMemo<Date | null>(() => {
    if (!selectedMovie || !formState.startTime) return null;
    const start = new Date(formState.startTime);
    if (Number.isNaN(start.getTime())) return null;
    return new Date(start.getTime() + selectedMovie.duration * 60_000);
  }, [selectedMovie, formState.startTime]);

  // ── Select option pipelines (loading-aware) ─────────────────────────────
  const movieOptions = React.useMemo(() => {
    if (isLoadingDeps) {
      return [{ value: '', label: 'Cargando catálogo de películas...' }];
    }
    return [
      { value: '', label: 'Elige una película...' },
      ...movies.map((movie) => ({ value: movie.id, label: movie.title })),
    ];
  }, [isLoadingDeps, movies]);

  const roomOptions = React.useMemo(() => {
    if (isLoadingDeps) {
      return [{ value: '', label: 'Cargando salas de cine...' }];
    }
    return [
      { value: '', label: 'Asigna una sala...' },
      ...rooms.map((room) => ({ value: room.id, label: room.name })),
    ];
  }, [isLoadingDeps, rooms]);

  // ── Client-side validation gate ─────────────────────────────────────────
  const validate = (): boolean => {
    const errors: FieldErrors = {};

    if (!formState.movieId.trim()) {
      errors.movieId = 'Selecciona una película válida.';
    }
    if (!formState.roomId.trim()) {
      errors.roomId = 'Asigna una sala válida.';
    }

    if (!formState.startTime) {
      errors.startTime = 'Indica la fecha y hora de inicio.';
    } else {
      const start = new Date(formState.startTime);
      if (Number.isNaN(start.getTime())) {
        errors.startTime = 'La fecha y hora no son válidas.';
      } else if (!isEditMode && start.getTime() <= Date.now()) {
        // Only enforce future-date when creating. In edit mode the admin may
        // save without touching the time (e.g. only updating the price).
        errors.startTime = 'La función debe programarse en una fecha futura.';
      }
    }

    if (!Number.isFinite(formState.price) || formState.price <= 0) {
      errors.price = 'El precio debe ser mayor que cero.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Submission interception ─────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSubmitError(null);
    setIsConflict(false);

    if (!validate()) return;

    // Normalise the local wall-time string into a strict UTC ISO record.
    const startIso = new Date(formState.startTime).toISOString();

    const payload = {
      movieId: formState.movieId,
      roomId: formState.roomId,
      startTime: startIso,
      price: formState.price,
    };

    setIsSubmitting(true);
    try {
      if (isEditMode && id) {
        await api.patch(`/showtimes/${id}`, payload);
      } else {
        await api.post('/showtimes', payload);
      }
      navigate('/admin/showtimes');
    } catch (err: unknown) {
      console.error('Failed to save showtime session:', err);
      if (err instanceof ApiError) {
        if (err.statusCode === 409) {
          setIsConflict(true);
          setSubmitError(
            err.errors.length > 0
              ? err.errors.join(', ')
              : 'Conflicto de programación: la sala ya está ocupada en ese horario.'
          );
        } else {
          setSubmitError(err.errors.join(', ') || 'No se pudo guardar la función.');
        }
      } else if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError('Ha ocurrido un error inesperado al guardar la función.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const posterPreview = resolvePosterUrl(selectedMovie?.posterUrl);

  return (
    <div className="max-w-6xl mx-auto w-full text-left font-sans pb-12 space-y-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ── Header & Primary Actions ──────────────────────────── */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <nav className="flex items-center gap-2 text-xs text-zinc-500 font-semibold mb-2">
              <Link to="/admin/showtimes" className="hover:text-zinc-300 transition-colors">
                Funciones
              </Link>
              <span className="material-symbols-outlined text-[12px]">chevron_right</span>
              <span className="text-zinc-400">{isEditMode ? 'Editar Función' : 'Nueva Función'}</span>
            </nav>
            <h1 className="text-3xl font-extrabold tracking-tight font-display text-zinc-100 !m-0 leading-tight">
              {isEditMode ? 'Editar Función' : 'Programar Nueva Función'}
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-xl">
              Planifica un nuevo evento cinematográfico. Asegúrate de contemplar la duración de la
              película y los tiempos de limpieza de la sala para evitar solapamientos.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/showtimes')}
              disabled={isSubmitting}
              className="border-gray-800 text-zinc-300 hover:bg-zinc-800/40 min-h-[44px] px-6 flex-1 sm:flex-none cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={isLoadingDeps}
              icon={<span className="material-symbols-outlined text-[18px]">save</span>}
              className="!bg-amber-500 hover:!bg-amber-600 !text-zinc-950 shadow-md shadow-amber-500/10 min-h-[44px] px-6 flex-1 sm:flex-none cursor-pointer font-bold"
            >
              Guardar Función
            </Button>
          </div>
        </header>

        {/* ── Exception Ribbon (409 conflict = amber warning) ───── */}
        {submitError && (
          <div
            className={`rounded-xl p-4 text-sm shadow-lg border ${
              isConflict
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : 'bg-[#93000a] text-[#ffb4ab] border-red-500/20'
            }`}
          >
            <p className="font-semibold flex items-center gap-2 m-0">
              <span className="material-symbols-outlined text-[18px]">
                {isConflict ? 'warning' : 'error'}
              </span>
              {submitError}
            </p>
          </div>
        )}

        {/* ── Two-column workspace ──────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left: form fields */}
          <div className="lg:col-span-2 space-y-8">
            {/* Primary Details */}
            <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-xl">
              <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2 border-b border-zinc-800 pb-3">
                <span className="material-symbols-outlined text-amber-500">movie</span>
                Detalles Principales
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Select
                  label="Película"
                  value={formState.movieId}
                  onChange={(e) => {
                    setFormState((prev) => ({ ...prev, movieId: e.target.value }));
                    setFieldErrors((prev) => ({ ...prev, movieId: undefined }));
                  }}
                  options={movieOptions}
                  disabled={isLoadingDeps || isSubmitting}
                  error={fieldErrors.movieId}
                  className="gold-glow"
                />

                <Select
                  label="Sala"
                  value={formState.roomId}
                  onChange={(e) => {
                    setFormState((prev) => ({ ...prev, roomId: e.target.value }));
                    setFieldErrors((prev) => ({ ...prev, roomId: undefined }));
                  }}
                  options={roomOptions}
                  disabled={isLoadingDeps || isSubmitting}
                  error={fieldErrors.roomId}
                  className="gold-glow"
                />
              </div>
            </section>

            {/* Schedule & Ticketing */}
            <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-xl">
              <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2 border-b border-zinc-800 pb-3">
                <span className="material-symbols-outlined text-amber-500">event</span>
                Horario y Precio
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input
                  type="datetime-local"
                  label="Fecha y Hora de Inicio"
                  value={formState.startTime}
                  onChange={(e) => {
                    setFormState((prev) => ({ ...prev, startTime: e.target.value }));
                    setFieldErrors((prev) => ({ ...prev, startTime: undefined }));
                  }}
                  disabled={isSubmitting}
                  error={fieldErrors.startTime}
                  className="gold-glow [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />

                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  label="Precio de Entrada"
                  placeholder="0.00"
                  value={formState.price > 0 ? formState.price : ''}
                  onChange={(e) => {
                    const parsed = parseFloat(e.target.value);
                    setFormState((prev) => ({
                      ...prev,
                      price: Number.isNaN(parsed) ? 0 : parsed,
                    }));
                    setFieldErrors((prev) => ({ ...prev, price: undefined }));
                  }}
                  disabled={isSubmitting}
                  error={fieldErrors.price}
                  leftIcon={<span className="text-zinc-500 font-semibold text-sm">$</span>}
                  className="gold-glow font-mono"
                />
              </div>
            </section>
          </div>

          {/* Right: Session Context preview (real data only) */}
          <aside className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6 lg:sticky lg:top-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500 text-[20px]">info</span>
                Contexto de la Sesión
              </h2>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 bg-zinc-800/60 px-2 py-1 rounded-md">
                Vista previa
              </span>
            </div>

            {/* Movie preview */}
            <div className="flex gap-4">
              <div className="h-28 w-20 shrink-0 rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700/50 flex items-center justify-center">
                {posterPreview ? (
                  <img
                    src={posterPreview}
                    alt={selectedMovie?.title ?? 'Póster'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="material-symbols-outlined text-[28px] text-zinc-600">movie</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                {selectedMovie ? (
                  <>
                    <h3 className="text-sm font-bold text-zinc-100 leading-snug">
                      {selectedMovie.title}
                    </h3>
                    <p className="text-xs text-amber-400 font-semibold mt-0.5">
                      {selectedMovie.genre} • {selectedMovie.duration} min
                    </p>
                    <p className="text-xs text-zinc-500 mt-2 line-clamp-3 leading-relaxed">
                      {selectedMovie.synopsis}
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-sm font-bold text-zinc-300">Selecciona una película</h3>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                      Los detalles, la duración y la sinopsis aparecerán aquí.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Auditorium specs (real room fields) */}
            <div>
              <h4 className="text-[11px] uppercase tracking-wider font-bold text-zinc-500 mb-3">
                Especificaciones de la Sala
              </h4>
              <div className="bg-zinc-950/40 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-[24px] text-amber-500">chair</span>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-zinc-100 font-mono leading-none">
                    {realSeatCount !== null ? `${realSeatCount} asientos` : '--'}
                  </span>
                  <span className="text-[11px] text-zinc-500 mt-1">Capacidad real disponible</span>
                </div>
              </div>
            </div>

            {/* Estimated timeline (start → estimated end via real runtime) */}
            <div className="border-t border-zinc-800 pt-4">
              <h4 className="text-[11px] uppercase tracking-wider font-bold text-zinc-500 mb-3">
                Línea de Tiempo Estimada
              </h4>
              <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500 ${
                    estimatedEnd ? 'w-full' : 'w-0'
                  }`}
                />
              </div>
              <div className="flex justify-between mt-2 text-[11px]">
                <span className="text-zinc-400 font-medium">
                  {formState.startTime && !Number.isNaN(new Date(formState.startTime).getTime())
                    ? formatLocalDateTime(new Date(formState.startTime))
                    : 'Inicio'}
                </span>
                <span className="text-zinc-400 font-medium">
                  {estimatedEnd ? `Fin ~ ${formatLocalDateTime(estimatedEnd)}` : 'Fin estimado'}
                </span>
              </div>
            </div>
          </aside>
        </div>
      </form>
    </div>
  );
}
