import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import api, { ApiError } from '@/services/api';
import type { Showtime } from '@/interfaces/showtime.interface';
import { DataTable } from '@/components/ui/DataTable';
import type { ColumnDef } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

const imageBaseUrl = import.meta.env.VITE_IMAGE_URL || 'http://localhost:3000';

// Resolve a possibly-relative poster path (e.g. "/uploads/...") against the
// asset host so the <img> loads from the backend, not the Vite dev origin.
function resolvePosterUrl(posterUrl: string | undefined): string | undefined {
  if (!posterUrl) return undefined;
  return posterUrl.startsWith('http') ? posterUrl : `${imageBaseUrl}${posterUrl}`;
}

function formatFullDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible';
  const datePart = new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
  const timePart = new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
  return `${datePart} • ${timePart}`;
}

function formatTimeOnly(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

// Postgres `numeric` columns are serialised as strings by TypeORM, so coerce
// before formatting to avoid a broken Number.isFinite() check on "45.00".
function formatPrice(price: number | string): string {
  const numeric = typeof price === 'string' ? Number.parseFloat(price) : price;
  if (!Number.isFinite(numeric)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(numeric);
}

// ── Poster thumbnail with graceful fallback when the asset is missing ───────
const PosterThumb: React.FC<{ src?: string; alt: string }> = ({ src, alt }) => {
  const [hasError, setHasError] = React.useState<boolean>(false);

  if (!src || hasError) {
    return (
      <div className="h-14 w-10 shrink-0 rounded-md bg-zinc-800 border border-gray-800/60 flex items-center justify-center">
        <span className="material-symbols-outlined text-[18px] text-zinc-600">movie</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className="h-14 w-10 shrink-0 rounded-md object-cover border border-gray-800/60 bg-zinc-900"
    />
  );
};

// ── Asynchronous Coordination Hook to isolate API side effects ──────────────
interface UseShowtimesResult {
  showtimes: Showtime[];
  isLoading: boolean;
  errorMsg: string | null;
  cancelShowtime: (id: string) => Promise<void>;
  fetchShowtimes: () => Promise<void>;
}

function useShowtimes(search: string): UseShowtimesResult {
  const [showtimes, setShowtimes] = React.useState<Showtime[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const fetchShowtimes = React.useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const trimmed = search.trim();
      const res = await api.get<Showtime[]>('/showtimes', {
        params: trimmed ? { search: trimmed } : undefined,
      });
      if (res.status === 200) {
        setShowtimes(res.data);
      } else {
        throw new Error('No se pudo obtener la programación de funciones.');
      }
    } catch (err: unknown) {
      console.error('Failed to load showtimes:', err);
      if (err instanceof ApiError) {
        setErrorMsg(err.errors.join(', '));
      } else if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Error al conectar con la base de datos de funciones.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  const cancelShowtime = React.useCallback(async (id: string): Promise<void> => {
    try {
      const res = await api.delete(`/showtimes/${id}`);
      if (res.status !== 200 && res.status !== 204) {
        throw new Error('La respuesta del servidor no fue satisfactoria.');
      }
      setShowtimes((prev) => prev.filter((s) => s.id !== id));
    } catch (err: unknown) {
      console.error('Failed to cancel showtime:', err);
      if (err instanceof ApiError) {
        throw new Error(err.errors.join(', '), { cause: err });
      } else if (err instanceof Error) {
        throw err;
      } else {
        throw new Error('Error al intentar cancelar la función.', { cause: err });
      }
    }
  }, []);

  React.useEffect(() => {
    let active = true;
    const init = async (): Promise<void> => {
      await Promise.resolve();
      if (active) {
        fetchShowtimes();
      }
    };
    init();
    return () => {
      active = false;
    };
  }, [fetchShowtimes]);

  return {
    showtimes,
    isLoading,
    errorMsg,
    cancelShowtime,
    fetchShowtimes,
  };
}

export default function ShowtimeManagement(): React.JSX.Element {
  const navigate = useNavigate();

  // Search term, debounced before it reaches the backend search endpoint.
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = React.useState<string>('');

  React.useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(searchQuery), 350);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  const { showtimes, isLoading, errorMsg, cancelShowtime } = useShowtimes(debouncedQuery);

  // Cancellation workflow state
  const [showtimeTargetToDelete, setShowtimeTargetToDelete] = React.useState<Showtime | null>(null);
  const [isDeleting, setIsDeleting] = React.useState<boolean>(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const handleScheduleClick = (): void => {
    navigate('/admin/showtimes/new');
  };

  const handleCancelClick = (showtime: Showtime): void => {
    setDeleteError(null);
    setShowtimeTargetToDelete(showtime);
  };

  const handleConfirmCancel = async (): Promise<void> => {
    if (!showtimeTargetToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await cancelShowtime(showtimeTargetToDelete.id);
      setShowtimeTargetToDelete(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setDeleteError(err.message);
      } else {
        setDeleteError('No se pudo cancelar la función.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // High-fidelity table row skeletons during transit
  const dummySkeletonData = React.useMemo(() => {
    return [{ id: 's1' }, { id: 's2' }, { id: 's3' }] as Showtime[];
  }, []);

  const tableData = isLoading ? dummySkeletonData : showtimes;

  // Table Column Definitions
  const columns = React.useMemo<ColumnDef<Showtime>[]>(() => {
    return [
      {
        header: 'PELÍCULA',
        render: (showtime) => {
          if (isLoading) {
            return (
              <div className="flex items-center gap-3 py-1 animate-pulse">
                <div className="h-14 w-10 bg-zinc-800 rounded-md shrink-0" />
                <div className="flex flex-col gap-2">
                  <div className="h-4 bg-zinc-800 rounded w-40" />
                  <div className="h-3 bg-zinc-800/60 rounded w-24" />
                </div>
              </div>
            );
          }
          const movie = showtime.movie;
          const title = movie?.title ?? 'Película no disponible';
          const meta =
            movie !== undefined ? `${movie.genre} • ${movie.duration} min` : 'Sin metadatos';
          return (
            <div className="flex items-center gap-3 py-1 text-left font-sans">
              <PosterThumb src={resolvePosterUrl(movie?.posterUrl)} alt={title} />
              <div className="flex flex-col">
                <span className="font-bold text-zinc-100 text-sm tracking-wide sm:text-base">
                  {title}
                </span>
                <span className="text-xs text-zinc-400 mt-0.5">{meta}</span>
              </div>
            </div>
          );
        },
      },
      {
        header: 'SALA',
        render: (showtime) => {
          if (isLoading) {
            return (
              <div className="animate-pulse py-1">
                <div className="h-5 bg-zinc-800 rounded w-28" />
              </div>
            );
          }
          const room = showtime.room;
          return (
            <div className="flex flex-col text-left py-1 font-sans">
              <span className="flex items-center gap-1.5 text-zinc-200 font-semibold text-sm">
                <span className="material-symbols-outlined text-[16px] text-zinc-500 leading-none">
                  meeting_room
                </span>
                {room?.name ?? '—'}
              </span>
              {room !== undefined && (
                <span className="text-xs text-zinc-500 mt-0.5">
                  {room.seats?.length ?? room.capacity} asientos
                </span>
              )}
            </div>
          );
        },
      },
      {
        header: 'HORARIO (INICIO – FIN)',
        render: (showtime) => {
          if (isLoading) {
            return (
              <div className="flex flex-col text-left space-y-2 py-1 animate-pulse">
                <div className="h-4 bg-zinc-800 rounded w-44" />
                <div className="h-3 bg-zinc-800/60 rounded w-24" />
              </div>
            );
          }
          return (
            <div className="flex flex-col text-left py-1 font-sans">
              <span className="text-zinc-200 font-semibold text-sm">
                {formatFullDateTime(showtime.startTime)}
              </span>
              <span className="flex items-center gap-1 text-xs text-zinc-500 mt-0.5">
                <span className="material-symbols-outlined text-[14px] leading-none">schedule</span>
                Termina ~ {formatTimeOnly(showtime.endTime)}
              </span>
            </div>
          );
        },
      },
      {
        header: 'PRECIO',
        render: (showtime) => {
          if (isLoading) {
            return (
              <div className="animate-pulse py-1">
                <div className="h-6 bg-zinc-800 rounded-full w-20" />
              </div>
            );
          }
          return (
            <div className="flex text-left py-1">
              <Badge
                variant="amber"
                className="!bg-amber-500/10 !text-amber-400 !border-amber-500/20 px-3 py-1 text-xs font-semibold"
              >
                {formatPrice(showtime.price)}
              </Badge>
            </div>
          );
        },
      },
      {
        header: 'ACCIONES',
        render: (showtime) => {
          if (isLoading) {
            return (
              <div className="flex justify-end gap-2 pr-4 py-1 animate-pulse">
                <div className="h-9 w-9 bg-zinc-800 rounded-lg" />
                <div className="h-9 w-9 bg-zinc-800 rounded-lg" />
              </div>
            );
          }
          return (
            <div className="flex items-center justify-end gap-2 pr-4 py-1">
              <Button
                variant="outline"
                onClick={() => navigate(`/admin/showtimes/edit/${showtime.id}`)}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 p-2 min-h-0 h-9 w-9 flex items-center justify-center cursor-pointer rounded-lg transition-colors"
                aria-label="Editar función"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleCancelClick(showtime)}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 p-2 min-h-0 h-9 w-9 flex items-center justify-center cursor-pointer rounded-lg transition-colors"
                aria-label="Cancelar función"
              >
                <span className="material-symbols-outlined text-[18px]">cancel</span>
              </Button>
            </div>
          );
        },
      },
    ];
  }, [isLoading, navigate]);

  const countText = showtimes.length === 1 ? 'función programada' : 'funciones programadas';
  const subtitleText = `Gestiona las proyecciones, asigna salas y ajusta precios. (${showtimes.length} ${countText})`;

  return (
    <div className="space-y-8 w-full flex flex-col min-h-full font-sans pb-12">
      {/* ── Control Header Bar Row ────────────────────────────── */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
        <div>
          <h1 className="text-3xl font-extrabold text-[#e2e2eb] tracking-tight font-display !m-0 leading-tight">
            Programación de Funciones
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            {isLoading ? (
              <span className="inline-block h-3.5 bg-zinc-800 rounded w-48 animate-pulse" />
            ) : (
              subtitleText
            )}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="w-full sm:w-72 bg-zinc-900/50 rounded-lg">
            <Input
              placeholder="Buscar funciones por película..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="gold-glow"
              leftIcon={<span className="material-symbols-outlined text-[20px] text-zinc-500">search</span>}
            />
          </div>

          <Button
            onClick={handleScheduleClick}
            icon={<span className="material-symbols-outlined text-[18px]">add</span>}
            className="!bg-amber-500 hover:!bg-amber-600 !text-zinc-950 font-bold px-4"
          >
            Programar Función
          </Button>
        </div>
      </header>

      {errorMsg && (
        <div className="bg-[#93000a] text-[#ffb4ab] border border-red-500/20 rounded-xl p-4 text-sm shadow-lg text-left">
          <p className="font-semibold flex items-center gap-2 m-0">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {errorMsg}
          </p>
        </div>
      )}

      <div className="bg-[#1d1f26] border border-gray-800/40 rounded-2xl p-4 shadow-xl">
        <DataTable
          columns={columns}
          data={tableData}
          emptyMessage="No se encontraron funciones programadas."
          className="!bg-[#1d1f26] !border-none"
        />
      </div>

      {showtimeTargetToDelete && (
        <Modal
          isOpen={true}
          onClose={() => {
            if (!isDeleting) setShowtimeTargetToDelete(null);
          }}
          title="Cancelar Función Programada"
          size="sm"
          footer={
            <div className="flex gap-3 justify-end w-full font-sans">
              <Button
                variant="outline"
                onClick={() => setShowtimeTargetToDelete(null)}
                disabled={isDeleting}
              >
                Volver
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmCancel}
                isLoading={isDeleting}
                className="cursor-pointer font-bold"
              >
                Cancelar Función
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-left font-sans">
            {deleteError && (
              <div className="bg-[#93000a] text-[#ffb4ab] border border-red-500/20 rounded-lg p-3 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                {deleteError}
              </div>
            )}
            <p className="text-zinc-300 text-sm leading-relaxed">
              ¿Estás seguro de que deseas cancelar la función de{' '}
              <strong className="text-zinc-100">
                {showtimeTargetToDelete.movie?.title ?? 'esta película'}
              </strong>{' '}
              en{' '}
              <strong className="text-zinc-100">
                {showtimeTargetToDelete.room?.name ?? 'la sala asignada'}
              </strong>
              ?
            </p>
            <p className="text-xs text-red-400 font-semibold leading-relaxed flex items-start gap-1">
              <span className="material-symbols-outlined text-[16px] shrink-0">warning</span>
              <span>Esta acción revocará todas las transacciones activas vinculadas a esta función.</span>
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
