import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import api, { ApiError } from '@/services/api';
import type { Room } from '@/interfaces/room.interface';
import { DataTable } from '@/components/ui/DataTable';
import type { ColumnDef } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

// Asynchronous Coordination Hook to isolate API side effects
interface UseRoomsResult {
  rooms: Room[];
  isLoading: boolean;
  errorMsg: string | null;
  deleteRoom: (id: string) => Promise<void>;
  fetchRooms: () => Promise<void>;
}

function useRooms(search: string): UseRoomsResult {
  const [rooms, setRooms] = React.useState<Room[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const fetchRooms = React.useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const trimmed = search.trim();
      const res = await api.get<Room[]>('/rooms', {
        params: trimmed ? { search: trimmed } : undefined,
      });
      if (res.status === 200) {
        setRooms(res.data);
      } else {
        throw new Error('No se pudo obtener el listado de salas de cine.');
      }
    } catch (err: unknown) {
      console.error('Failed to load auditoriums:', err);
      if (err instanceof ApiError) {
        setErrorMsg(err.errors.join(', '));
      } else if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Error al conectar con la base de datos de salas.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  const deleteRoom = React.useCallback(async (id: string): Promise<void> => {
    try {
      const res = await api.delete(`/rooms/${id}`);
      if (res.status !== 200 && res.status !== 204) {
        throw new Error('La respuesta del servidor no fue satisfactoria.');
      }
      setRooms((prev) => prev.filter((r) => r.id !== id));
    } catch (err: unknown) {
      console.error('Failed to delete room:', err);
      if (err instanceof ApiError) {
        throw new Error(err.errors.join(', '), { cause: err });
      } else if (err instanceof Error) {
        throw err;
      } else {
        throw new Error('Error al intentar eliminar la sala.', { cause: err });
      }
    }
  }, []);

  React.useEffect(() => {
    let active = true;
    const init = async () => {
      await Promise.resolve();
      if (active) {
        fetchRooms();
      }
    };
    init();
    return () => {
      active = false;
    };
  }, [fetchRooms]);

  return {
    rooms,
    isLoading,
    errorMsg,
    deleteRoom,
    fetchRooms,
  };
}

export default function RoomManagement(): React.JSX.Element {
  const navigate = useNavigate();

  // Search term, debounced before it reaches the backend search endpoint.
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = React.useState<string>('');

  React.useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(searchQuery), 350);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  const { rooms, isLoading, errorMsg, deleteRoom } = useRooms(debouncedQuery);

  // Decommission workflow state
  const [roomTargetToDelete, setRoomTargetToDelete] = React.useState<Room | null>(null);
  const [isDeleting, setIsDeleting] = React.useState<boolean>(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const handleConfigureClick = (): void => {
    navigate('/admin/rooms/new');
  };

  const handleDeleteClick = (room: Room): void => {
    setDeleteError(null);
    setRoomTargetToDelete(room);
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!roomTargetToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteRoom(roomTargetToDelete.id);
      setRoomTargetToDelete(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setDeleteError(err.message);
      } else {
        setDeleteError('No se pudo eliminar la sala.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // High-fidelity table row skeletons during transit
  const dummySkeletonData = React.useMemo(() => {
    return [{ id: 's1' }, { id: 's2' }, { id: 's3' }] as Room[];
  }, []);

  const tableData = isLoading ? dummySkeletonData : rooms;

  // Table Column Definitions
  const columns = React.useMemo<ColumnDef<Room>[]>(() => {
    return [
      {
        header: 'DETALLES DE LA SALA',
        render: (room) => {
          if (isLoading) {
            return (
              <div className="flex flex-col text-left space-y-2 py-1 animate-pulse">
                <div className="h-5 bg-zinc-800 rounded w-44" />
                <div className="h-3 bg-zinc-800/60 rounded w-32" />
              </div>
            );
          }
          return (
            <div className="flex flex-col text-left py-1 font-sans">
              <span className="font-bold text-zinc-100 text-sm tracking-wide sm:text-base">
                {room.name}
              </span>
            </div>
          );
        },
      },
      {
        header: 'CAPACIDAD',
        render: (room) => {
          if (isLoading) {
            return (
              <div className="animate-pulse py-1">
                <div className="h-6 bg-zinc-800 rounded-full w-24" />
              </div>
            );
          }
          const totalSeats = room.seats ? room.seats.length : room.capacity;
          return (
            <div className="flex text-left py-1">
              <Badge
                variant="amber"
                className="flex items-center gap-1.5 !bg-amber-500/10 !text-amber-400 !border-amber-500/20 px-3 py-1 text-xs"
              >
                <span className="material-symbols-outlined text-[15px] leading-none">chair</span>
                <span>{totalSeats} Asientos</span>
              </Badge>
            </div>
          );
        },
      },
      {
        header: 'ACCIONES',
        render: (room) => {
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
                onClick={() => navigate(`/admin/rooms/edit/${room.id}`)}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 p-2 min-h-0 h-9 w-9 flex items-center justify-center cursor-pointer rounded-lg transition-colors"
                aria-label="Edit auditorium"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleDeleteClick(room)}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 p-2 min-h-0 h-9 w-9 flex items-center justify-center cursor-pointer rounded-lg transition-colors"
                aria-label="Decommission auditorium"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </Button>
            </div>
          );
        },
      },
    ];
  }, [isLoading, navigate]);

  const countText = rooms.length === 1 ? 'sala registrada' : 'salas registradas';
  const subtitleText = `Gestiona la configuración física de tus salas. (${rooms.length} ${countText})`;

  return (
    <div className="space-y-8 w-full flex flex-col min-h-full font-sans pb-12">
      {/* ── Control Header Bar Row ────────────────────────────── */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
        <div>
          <h1 className="text-3xl font-extrabold text-[#e2e2eb] tracking-tight font-display !m-0 leading-tight">
            Salas de Cine
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            {isLoading ? (
              <span className="inline-block h-3.5 bg-zinc-800 rounded w-28 animate-pulse" />
            ) : (
              subtitleText
            )}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          {/* Local Search Input */}
          <div className="w-full sm:w-64">
            <Input
              placeholder="Buscar salas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="gold-glow"
              leftIcon={<span className="material-symbols-outlined text-[20px] text-zinc-500">search</span>}
            />
          </div>

          <Button
            onClick={handleConfigureClick}
            className="!bg-amber-500 hover:!bg-amber-600 !text-zinc-950 font-bold px-4"
          >
            Agregar Sala
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
          emptyMessage="No se encontraron salas registradas."
          className="!bg-[#1d1f26] !border-none"
        />
      </div>

      {roomTargetToDelete && (
        <Modal
          isOpen={true}
          onClose={() => {
            if (!isDeleting) setRoomTargetToDelete(null);
          }}
          title="Confirmar Eliminación de Sala"
          size="sm"
          footer={
            <div className="flex gap-3 justify-end w-full font-sans">
              <Button
                variant="outline"
                onClick={() => setRoomTargetToDelete(null)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmDelete}
                isLoading={isDeleting}
                className="cursor-pointer font-bold"
              >
                Confirmar
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
              ¿Estás seguro de que deseas eliminar permanentemente la sala{' '}
              <strong className="text-zinc-100">{roomTargetToDelete.name}</strong>?
            </p>
            <p className="text-xs text-red-400 font-semibold leading-relaxed flex items-start gap-1">
              <span className="material-symbols-outlined text-[16px] shrink-0">warning</span>
              <span>Esta acción dará de baja la sala y podría interrumpir todas las funciones programadas vinculadas a ella.</span>
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
