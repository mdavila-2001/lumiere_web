import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { ApiError } from '@/services/api';
import type { Room } from '@/interfaces/room.interface';
import type { Seat } from '@/interfaces/seat.interface';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

// Helper to translate row index to A-Z labels (A=1, B=2, ...)
const getRowLabel = (rowNum: number): string => {
  return String.fromCharCode(64 + rowNum);
};

type SeatStatus = 'seat' | 'empty';

export default function RoomForm(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  // Form State variables
  const [name, setName] = React.useState<string>('');
  const [rowsCount, setRowsCount] = React.useState<number>(10);
  const [columnsCount, setColumnsCount] = React.useState<number>(10);
  const [layout, setLayout] = React.useState<Record<string, SeatStatus>>({});

  // Loading & Submission state flags
  const [isLoadingDetails, setIsLoadingDetails] = React.useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  
  // Validation and API errors state
  const [nameError, setNameError] = React.useState<string | null>(null);
  const [rowsError, setRowsError] = React.useState<string | null>(null);
  const [colsError, setColsError] = React.useState<string | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  // Reference list of seats returned from the DB in Edit Mode to calculate differences
  const [initialDbSeats, setInitialDbSeats] = React.useState<Seat[]>([]);

  // Fetch Room details & layout configuration in Edit Mode
  const loadRoomDetails = React.useCallback(async (roomId: string): Promise<void> => {
    setIsLoadingDetails(true);
    setSubmitError(null);
    try {
      // 1. Fetch room metadata
      const roomRes = await api.get<Room>(`/rooms/${roomId}`);
      if (roomRes.status === 200) {
        setName(roomRes.data.name);
        setRowsCount(roomRes.data.rowsCount);
        setColumnsCount(roomRes.data.columnsCount);
      }

      // 2. Fetch active seats in database
      const seatsRes = await api.get<Seat[]>(`/rooms/${roomId}/seats`);
      if (seatsRes.status === 200) {
        const dbSeats = seatsRes.data;
        setInitialDbSeats(dbSeats);

        // Prepopulate layout state based on presence in DB
        const dbSeatKeys = new Set(dbSeats.map(s => `${s.rowNumber}-${s.columnNumber}`));
        const loadedLayout: Record<string, SeatStatus> = {};
        
        const totalRows = roomRes.data.rowsCount;
        const totalCols = roomRes.data.columnsCount;

        for (let r = 1; r <= totalRows; r++) {
          for (let c = 1; c <= totalCols; c++) {
            const key = `${r}-${c}`;
            loadedLayout[key] = dbSeatKeys.has(key) ? 'seat' : 'empty';
          }
        }
        setLayout(loadedLayout);
      }
    } catch (err: unknown) {
      console.error('Failed to load room details:', err);
      if (err instanceof ApiError) {
        setSubmitError(`No se pudo cargar la sala: ${err.errors.join(', ')}`);
      } else {
        setSubmitError('No se pudo establecer comunicación con el servidor.');
      }
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

  React.useEffect(() => {
    if (isEditMode && id) {
      loadRoomDetails(id);
    }
  }, [isEditMode, id, loadRoomDetails]);

  // Handle live resizing & synchronization of the grid layout map state
  React.useEffect(() => {
    if (isLoadingDetails) return;

    setLayout((prev) => {
      const next: Record<string, SeatStatus> = {};
      for (let r = 1; r <= rowsCount; r++) {
        for (let c = 1; c <= columnsCount; c++) {
          const key = `${r}-${c}`;
          if (prev[key]) {
            next[key] = prev[key];
          } else {
            // New seats default to active seat
            next[key] = 'seat';
          }
        }
      }
      return next;
    });
  }, [rowsCount, columnsCount, isLoadingDetails]);

  // Validate fields
  const validateForm = (): boolean => {
    let isValid = true;

    if (!name.trim()) {
      setNameError('El nombre de la sala es obligatorio.');
      isValid = false;
    } else {
      setNameError(null);
    }

    if (rowsCount <= 0 || isNaN(rowsCount)) {
      setRowsError('Las filas deben ser mayores que cero.');
      isValid = false;
    } else if (rowsCount > 20) {
      setRowsError('Límite de seguridad: máximo de 20 filas.');
      isValid = false;
    } else {
      setRowsError(null);
    }

    if (columnsCount <= 0 || isNaN(columnsCount)) {
      setColsError('Las columnas deben ser mayores que cero.');
      isValid = false;
    } else if (columnsCount > 20) {
      setColsError('Límite de seguridad: máximo de 20 columnas.');
      isValid = false;
    } else {
      setColsError(null);
    }

    return isValid;
  };

  // Toggle seat state: seat <-> empty
  const handleSeatClick = (row: number, col: number): void => {
    const key = `${row}-${col}`;
    setLayout((prev) => {
      const current = prev[key] || 'seat';
      const nextStatus: SeatStatus = current === 'seat' ? 'empty' : 'seat';
      return {
        ...prev,
        [key]: nextStatus,
      };
    });
  };

  // Capacity calculations
  const activeSeatsCount = React.useMemo(() => {
    let count = 0;
    for (let r = 1; r <= rowsCount; r++) {
      for (let c = 1; c <= columnsCount; c++) {
        if (layout[`${r}-${c}`] === 'seat') {
          count++;
        }
      }
    }
    return count;
  }, [layout, rowsCount, columnsCount]);

  // Adjusters handlers
  const handleRowsChange = (val: number): void => {
    const safeVal = isNaN(val) ? 0 : val;
    setRowsCount(safeVal);
    if (safeVal > 0 && safeVal <= 20) setRowsError(null);
  };

  const handleColsChange = (val: number): void => {
    const safeVal = isNaN(val) ? 0 : val;
    setColumnsCount(safeVal);
    if (safeVal > 0 && safeVal <= 20) setColsError(null);
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (isEditMode && id) {
        // --- EDIT MODE FLOW ---
        // 1. Update room meta dimensions and name
        const updatePayload = {
          name: name.trim(),
          rowsCount,
          columnsCount,
        };
        await api.patch(`/rooms/${id}`, updatePayload);

        // 2. Identify seat mutations by comparing local layout state with initial database records
        const dbSeatKeys = new Set(initialDbSeats.map(s => `${s.rowNumber}-${s.columnNumber}`));
        const seatsToAdd: { r: number; c: number }[] = [];
        const seatsToDelete: { r: number; c: number }[] = [];

        // Check cells within current boundaries
        for (let r = 1; r <= rowsCount; r++) {
          for (let c = 1; c <= columnsCount; c++) {
            const key = `${r}-${c}`;
            const isCurrentlyEnabled = layout[key] === 'seat';
            const wasInDb = dbSeatKeys.has(key);

            if (isCurrentlyEnabled && !wasInDb) {
              seatsToAdd.push({ r, c });
            } else if (!isCurrentlyEnabled && wasInDb) {
              seatsToDelete.push({ r, c });
            }
          }
        }

        // Identify database seats that are now out of bounds due to shrinking size
        initialDbSeats.forEach((s) => {
          if (s.rowNumber > rowsCount || s.columnNumber > columnsCount) {
            seatsToDelete.push({ r: s.rowNumber, c: s.columnNumber });
          }
        });

        // 3. Parallelize seat updates
        await Promise.all([
          ...seatsToAdd.map(({ r, c }) =>
            api.post(`/rooms/${id}/seats/${r}/${c}`).catch((err) => {
              console.error(`Error adding seat at (${r}, ${c}):`, err);
            })
          ),
          ...seatsToDelete.map(({ r, c }) =>
            api.delete(`/rooms/${id}/seats/${r}/${c}`).catch((err) => {
              console.error(`Error deleting seat at (${r}, ${c}):`, err);
            })
          ),
        ]);

        navigate('/admin/rooms');
      } else {
        // --- CREATE MODE FLOW ---
        // 1. Send create payload (initializes full grid of seats in database)
        const createPayload = {
          name: name.trim(),
          rowsCount,
          columnsCount,
        };
        const createRes = await api.post<Room>('/rooms', createPayload);
        const newRoom = createRes.data;

        // 2. Determine disabled seats to delete from DB
        const disabledSeatsToPrune: { r: number; c: number }[] = [];
        for (let r = 1; r <= rowsCount; r++) {
          for (let c = 1; c <= columnsCount; c++) {
            if (layout[`${r}-${c}`] === 'empty') {
              disabledSeatsToPrune.push({ r, c });
            }
          }
        }

        // 3. Parallelize pruning of disabled seat coordinates
        if (disabledSeatsToPrune.length > 0) {
          await Promise.all(
            disabledSeatsToPrune.map(({ r, c }) =>
              api.delete(`/rooms/${newRoom.id}/seats/${r}/${c}`).catch((err) => {
                console.error(`Error pruning seat at (${r}, ${c}) during creation:`, err);
              })
            )
          );
        }

        navigate('/admin/rooms');
      }
    } catch (err: unknown) {
      console.error('Failed to submit room configuration:', err);
      if (err instanceof ApiError) {
        setSubmitError(err.errors.join(', '));
      } else if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError('Ha ocurrido un error inesperado al guardar la sala.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Skeleton while details are loading
  if (isEditMode && isLoadingDetails) {
    return (
      <div className="space-y-8 w-full flex flex-col min-h-full pb-12 font-sans animate-pulse">
        <div className="flex flex-col items-start gap-1">
          <div className="h-8 bg-zinc-800 rounded w-48" />
          <div className="h-4 bg-zinc-800/60 rounded w-72 mt-2" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
          <div className="bg-[#1d1f26] border border-gray-800/40 rounded-2xl p-6 h-96" />
          <div className="bg-[#1d1f26] border border-gray-800/40 rounded-2xl p-6 h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full flex flex-col min-h-full pb-12 font-sans text-left">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#e2e2eb] tracking-tight font-display !m-0 leading-tight">
            {isEditMode ? 'Editar Sala' : 'Crear Sala'}
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            {isEditMode
              ? 'Modifica las especificaciones y la distribución física de los asientos.'
              : 'Configura las especificaciones físicas y la distribución de una nueva sala.'}
          </p>
        </div>
      </header>

      {submitError && (
        <div className="bg-[#93000a] text-[#ffb4ab] border border-red-500/20 rounded-xl p-4 text-sm shadow-lg">
          <p className="font-semibold flex items-center gap-2 m-0">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {submitError}
          </p>
        </div>
      )}

      {/* Main Grid Viewport */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Side: Controls Column */}
        <section className="bg-[#1d1f26] border border-gray-800/40 rounded-2xl p-6 space-y-6 shadow-xl relative overflow-hidden">
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2 border-b border-zinc-800 pb-3">
            <span className="material-symbols-outlined text-amber-500">settings</span>
            Parámetros de Configuración
          </h2>

          {/* Room Name Floating Input */}
          <div className="space-y-1">
            <Input
              variant="floating"
              label="Nombre de la Sala"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (e.target.value.trim()) setNameError(null);
              }}
              error={nameError || undefined}
              disabled={isSubmitting}
              className="gold-glow"
            />
          </div>

          {/* Grid Size Inputs */}
          <div className="grid grid-cols-2 gap-4">
            {/* Rows Count Control */}
            <div className="space-y-2 text-left">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">
                Filas
              </label>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => handleRowsChange(Math.max(1, rowsCount - 1))}
                  disabled={isSubmitting || rowsCount <= 1}
                  className="h-11 w-11 bg-zinc-800 border border-zinc-700 hover:border-amber-500 rounded-lg flex items-center justify-center hover:bg-zinc-700 active:scale-95 transition-all text-zinc-300 font-bold disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">remove</span>
                </button>
                <div className="flex-1">
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={rowsCount || ''}
                    onChange={(e) => handleRowsChange(parseInt(e.target.value, 10))}
                    disabled={isSubmitting}
                    className="text-center font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none gold-glow"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRowsChange(Math.min(20, rowsCount + 1))}
                  disabled={isSubmitting || rowsCount >= 20}
                  className="h-11 w-11 bg-zinc-800 border border-zinc-700 hover:border-amber-500 rounded-lg flex items-center justify-center hover:bg-zinc-700 active:scale-95 transition-all text-zinc-300 font-bold disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">add</span>
                </button>
              </div>
              {rowsError && <p className="text-xs text-red-500 font-medium mt-1" role="alert">{rowsError}</p>}
            </div>

            {/* Columns Count Control */}
            <div className="space-y-2 text-left">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">
                Columnas
              </label>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => handleColsChange(Math.max(1, columnsCount - 1))}
                  disabled={isSubmitting || columnsCount <= 1}
                  className="h-11 w-11 bg-zinc-800 border border-zinc-700 hover:border-amber-500 rounded-lg flex items-center justify-center hover:bg-zinc-700 active:scale-95 transition-all text-zinc-300 font-bold disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">remove</span>
                </button>
                <div className="flex-1">
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={columnsCount || ''}
                    onChange={(e) => handleColsChange(parseInt(e.target.value, 10))}
                    disabled={isSubmitting}
                    className="text-center font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none gold-glow"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleColsChange(Math.min(20, columnsCount + 1))}
                  disabled={isSubmitting || columnsCount >= 20}
                  className="h-11 w-11 bg-zinc-800 border border-zinc-700 hover:border-amber-500 rounded-lg flex items-center justify-center hover:bg-zinc-700 active:scale-95 transition-all text-zinc-300 font-bold disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">add</span>
                </button>
              </div>
              {colsError && <p className="text-xs text-red-500 font-medium mt-1" role="alert">{colsError}</p>}
            </div>
          </div>

          {/* Live Capacity Info panel */}
          <div className="bg-[#111319]/60 border border-zinc-800/40 rounded-xl p-4 flex items-center justify-between transition-all duration-300">
            <div>
              <span className="text-xs text-zinc-400 uppercase tracking-wider block font-semibold">
                Capacidad Actual
              </span>
              <span className="text-[11px] text-zinc-500 mt-0.5 block leading-normal">
                Excluye pasillos y vacíos. Modificable clicando en los asientos de la derecha.
              </span>
            </div>
            <div className="text-right">
              <span className="text-3xl font-mono font-extrabold text-amber-500 tracking-tight transition-all duration-300">
                {activeSeatsCount}
              </span>
              <span className="text-zinc-500 font-medium text-sm ml-1.5">
                / {rowsCount * columnsCount}
              </span>
            </div>
          </div>

          {/* DB Contract Disclaimer Notice */}
          <div className="border border-zinc-800/50 bg-zinc-900/40 rounded-xl p-4 text-xs text-zinc-400 flex items-start gap-2.5 leading-relaxed">
            <span className="material-symbols-outlined text-amber-500 shrink-0 text-[18px]">info</span>
            <div>
              <p className="font-semibold text-zinc-300 mb-1">Información de Sincronización</p>
              La base de datos almacena únicamente la presencia física del asiento. Los asientos marcados como <strong className="text-zinc-300">Inactivos</strong> representan pasillos o espacios vacíos y se eliminarán de la base de datos.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t border-zinc-800/60 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/rooms')}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="px-6 font-bold cursor-pointer"
            >
              Guardar Sala
            </Button>
          </div>
        </section>

        {/* Right Side: Seating Matrix Preview */}
        <section className="bg-[#1d1f26] border border-gray-800/40 rounded-2xl p-6 shadow-xl flex flex-col h-full min-h-[500px]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-zinc-800 pb-3 mb-6">
            <div>
              <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500">grid_on</span>
                Distribución de Asientos
              </h2>
              <p className="text-xs text-zinc-400 mt-1">Haz clic en un asiento para habilitar/deshabilitar.</p>
            </div>

            {/* Visual Legend */}
            <div className="flex flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded bg-[#3d4252] border border-transparent shrink-0" />
                <span className="text-zinc-400 text-[11px]">Asiento</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded border border-dashed border-zinc-700/60 bg-zinc-950/20 shrink-0" />
                <span className="text-zinc-400 text-[11px]">Vacío (Pasillo)</span>
              </div>
            </div>
          </div>

          {/* Dark Seating Viewport Pane */}
          <div className="flex-1 bg-[#111319] border border-zinc-800/50 rounded-xl p-6 flex flex-col justify-center items-center overflow-hidden">
            
            {/* Screen Glow Curved Header */}
            <div className="w-full flex flex-col items-center mb-8 shrink-0">
              <div className="w-3/4 h-1.5 bg-amber-500/20 rounded-t-[100px] border-t border-amber-500 shadow-[0_-5px_15px_rgba(0,241,255,0.4)]" />
              <span className="text-[10px] tracking-[0.3em] font-semibold text-amber-500/70 uppercase mt-2">PANTALLA</span>
            </div>

            {/* Matrix Viewport scroll container */}
            <div className="w-full overflow-x-auto py-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-zinc-950">
              <div className="flex flex-col space-y-2 min-w-max px-6 mx-auto w-fit">
                {Array.from({ length: rowsCount }).map((_, rIdx) => {
                  const rowNum = rIdx + 1;
                  const rowLabel = getRowLabel(rowNum);

                  return (
                    <div key={`row-${rowNum}`} className="flex items-center space-x-3">
                      {/* Row Label */}
                      <span className="w-5 font-mono text-xs font-bold text-zinc-500 text-center shrink-0 uppercase">
                        {rowLabel}
                      </span>

                      {/* Grid Row */}
                      <div
                        className="grid gap-1.5"
                        style={{
                          gridTemplateColumns: `repeat(${columnsCount}, minmax(0, 1fr))`,
                        }}
                      >
                        {Array.from({ length: columnsCount }).map((_, cIdx) => {
                          const colNum = cIdx + 1;
                          const seatKey = `${rowNum}-${colNum}`;
                          const status = layout[seatKey] || 'seat';

                          let colorClass = 'bg-[#3d4252] hover:bg-[#4b5266] text-transparent border-transparent';
                          if (status === 'empty') {
                            colorClass = 'border border-dashed border-zinc-800 bg-zinc-950/20 opacity-25 hover:opacity-50 text-transparent';
                          }

                          return (
                            <button
                              key={`seat-${seatKey}`}
                              type="button"
                              onClick={() => handleSeatClick(rowNum, colNum)}
                              disabled={isSubmitting}
                              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md text-[10px] flex items-center justify-center transition-all duration-200 cursor-pointer select-none outline-none focus:ring-1 focus:ring-amber-500 ${colorClass}`}
                              title={`Asiento ${rowLabel}-${colNum} (${status === 'seat' ? 'Habilitado' : 'Vacío'})`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </form>
    </div>
  );
}
