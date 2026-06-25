import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { ApiError } from '@/services/api';
import type { Showtime } from '@/interfaces/showtime.interface';
import { ROUTES } from '@/routes/paths';

interface SeatCoordinate {
  rowNumber: number;
  columnNumber: number;
}

const getRowLabel = (rowNum: number): string => {
  let charCode = 64 + rowNum;
  if (charCode >= 73) { 
    charCode += 1;
  }
  return String.fromCharCode(charCode);
};

export default function SeatMap(): React.JSX.Element {
  const { showtimeId } = useParams<{ showtimeId: string }>();
  const navigate = useNavigate();

  
  const [showtime, setShowtime] = React.useState<Showtime | null>(null);
  const [occupiedSeats, setOccupiedSeats] = React.useState<SeatCoordinate[]>([]);
  const [selectedSeats, setSelectedSeats] = React.useState<SeatCoordinate[]>([]);
  const [ticketQuantity, setTicketQuantity] = React.useState<number>(1);
  const [showLimitWarning, setShowLimitWarning] = React.useState<boolean>(false);

  
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [successBookingId, setSuccessBookingId] = React.useState<string | null>(null);

  
  const loadData = React.useCallback(async (stId: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [showtimeRes, occupiedRes] = await Promise.all([
        api.get<Showtime>(`/showtimes/${stId}`),
        api.get<SeatCoordinate[]>(`/showtimes/${stId}/seats`),
      ]);

      if (showtimeRes.status === 200) {
        setShowtime(showtimeRes.data);
      } else {
        throw new Error('No se pudo cargar la información de la función.');
      }

      if (occupiedRes.status === 200) {
        setOccupiedSeats(occupiedRes.data);
      }
    } catch (err: unknown) {
      console.error('Error fetching seat map data:', err);
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Ocurrió un error al cargar la distribución de asientos.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (showtimeId) {
      loadData(showtimeId);
    } else {
      setErrorMsg('Identificador de función no especificado.');
      setIsLoading(false);
    }
  }, [showtimeId, loadData]);

  
  const activeSeatsSet = React.useMemo(() => {
    const set = new Set<string>();
    if (showtime?.room?.seats) {
      showtime.room.seats.forEach((seat) => {
        set.add(`${seat.rowNumber}-${seat.columnNumber}`);
      });
    }
    return set;
  }, [showtime]);

  
  const handleSeatClick = (rowNumber: number, columnNumber: number) => {
    const isAlreadySelected = selectedSeats.some(
      (s) => s.rowNumber === rowNumber && s.columnNumber === columnNumber
    );

    if (isAlreadySelected) {
      
      setSelectedSeats((prev) =>
        prev.filter((s) => !(s.rowNumber === rowNumber && s.columnNumber === columnNumber))
      );
      setShowLimitWarning(false);
    } else {
      
      if (selectedSeats.length < ticketQuantity) {
        setSelectedSeats((prev) => [...prev, { rowNumber, columnNumber }]);
        setShowLimitWarning(false);
      } else {
        
        setShowLimitWarning(true);
      }
    }
  };

  
  const handleIncrementTickets = () => {
    setTicketQuantity((prev) => {
      const nextVal = Math.min(10, prev + 1);
      setShowLimitWarning(false);
      return nextVal;
    });
  };

  const handleDecrementTickets = () => {
    setTicketQuantity((prev) => {
      const nextVal = Math.max(1, prev - 1);
      
      setSelectedSeats((prevSeats) => {
        if (prevSeats.length > nextVal) {
          return prevSeats.slice(0, nextVal);
        }
        return prevSeats;
      });
      setShowLimitWarning(false);
      return nextVal;
    });
  };

  
  const handleConfirmBooking = async () => {
    if (!showtimeId || selectedSeats.length !== ticketQuantity) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const response = await api.post<{ bookingId: string }>('/bookings', {
        showtimeId,
        seats: selectedSeats,
      });

      if (response.status === 201 || response.status === 200) {
        setSuccessBookingId(response.data.bookingId);
      } else {
        throw new Error('Respuesta inválida al procesar la reserva.');
      }
    } catch (err: unknown) {
      console.error('Checkout error:', err);
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Ocurrió un error inesperado al procesar la compra.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  
  const formatHeaderDateTime = (isoString?: string): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const optionsDate: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    };
    const optionsTime: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    };
    
    const formattedDate = new Intl.DateTimeFormat('es-ES', optionsDate).format(date);
    const formattedTime = new Intl.DateTimeFormat('es-ES', optionsTime).format(date);
    
    const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
    return `${capitalizedDate} • ${formattedTime}`;
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  
  if (successBookingId) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl text-center flex flex-col gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)]" />
          
          <div className="flex items-center justify-center mx-auto h-16 w-16 rounded-full bg-amber-500/10 text-amber-500">
            <span className="material-symbols-outlined text-[36px] animate-pulse">check_circle</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-zinc-100 mb-2">¡Compra Confirmada!</h1>
            <p className="text-zinc-400 text-xs uppercase tracking-wider">Tu reserva ha sido procesada con éxito</p>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 text-left flex flex-col gap-3.5">
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Película</p>
              <p className="text-sm font-bold text-zinc-100">{showtime?.movie?.title}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Sala</p>
                <p className="text-xs font-semibold text-zinc-200">{showtime?.room?.name}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Boletos</p>
                <p className="text-xs font-semibold text-zinc-200">{ticketQuantity}x Entrada Gral.</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Asientos Reservados</p>
              <p className="text-xs font-mono font-bold text-amber-500">
                {selectedSeats.map((s) => `${getRowLabel(s.rowNumber)}${s.columnNumber}`).join(', ')}
              </p>
            </div>

            <div className="border-t border-zinc-800/80 pt-3 flex justify-between items-center">
              <span className="text-xs text-zinc-400">Total pagado</span>
              <span className="text-sm font-bold text-zinc-100">{formatPrice(ticketQuantity * (showtime?.price || 0))}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate(ROUTES.HOME)}
            className="w-full bg-amber-500 text-zinc-950 font-bold py-3 rounded-xl hover:bg-amber-600 transition-all shadow-[0_4px_14px_rgba(245,158,11,0.2)] active:scale-98 cursor-pointer text-sm"
          >
            Volver a la cartelera
          </button>
        </div>
      </main>
    );
  }

  
  if (isLoading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6 font-sans">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-4 border-amber-500/10 border-t-amber-500 animate-spin" />
          </div>
          <p className="text-sm text-zinc-400 font-medium">Cargando distribución de sala...</p>
        </div>
      </main>
    );
  }

  
  if (errorMsg && !showtime) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl text-center flex flex-col gap-5">
          <span className="material-symbols-outlined text-[48px] text-red-400">error</span>
          <div>
            <h2 className="text-lg font-bold text-zinc-100 mb-2">Error al cargar la función</h2>
            <p className="text-xs text-zinc-400">{errorMsg}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full bg-zinc-800 text-zinc-200 py-2.5 rounded-lg hover:bg-zinc-700 transition-all font-semibold text-xs cursor-pointer"
          >
            Regresar
          </button>
        </div>
      </main>
    );
  }

  const rowsCount = showtime?.room?.rowsCount || 0;
  const columnsCount = showtime?.room?.columnsCount || 0;

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col relative pb-32 font-sans animate-fade-in">
      
      <header className="fixed top-0 left-0 w-full bg-zinc-950/85 backdrop-blur-md border-b border-zinc-800/60 p-4 px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="h-9 w-9 rounded-full border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-700 hover:text-amber-500 flex items-center justify-center transition-all cursor-pointer"
            title="Regresar"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>
          <div className="text-left">
            <h1 className="text-base font-bold text-zinc-100 leading-tight">
              {showtime?.movie?.title || 'Selección de Asientos'}
            </h1>
            <p className="text-xs text-zinc-400 font-medium">
              {formatHeaderDateTime(showtime?.startTime)} • {showtime?.room?.name}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Seleccionado:</span>
          <span className="text-xs font-bold font-mono text-amber-500">
            {selectedSeats.length} / {ticketQuantity}
          </span>
        </div>
      </header>

      
      <div className="flex-1 max-w-5xl w-full mx-auto px-6 pt-24 pb-8 flex flex-col justify-center items-center">
        {errorMsg && (
          <div className="w-full max-w-md bg-red-950/40 border border-red-500/20 text-red-400 text-xs rounded-lg p-3.5 mb-6 text-center">
            {errorMsg}
          </div>
        )}

        <div className="w-full flex flex-col items-center mb-16 mt-4 shrink-0">
          <div className="w-3/4 max-w-xl h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-b-[100px] shadow-[0_8px_30px_rgba(6,182,212,0.8),0_4px_15px_rgba(6,182,212,0.3)] border-b border-cyan-500" />
          <span className="text-[10px] tracking-[0.4em] font-semibold text-cyan-500/80 uppercase mt-4">PANTALLA / SCREEN</span>
        </div>

        <div className="w-full overflow-x-auto py-6 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-zinc-950 flex justify-center">
          <div className="flex flex-col space-y-2.5 min-w-max px-6">
            {Array.from({ length: rowsCount }).map((_, rIdx) => {
              const rowNum = rIdx + 1;
              const rowLabel = getRowLabel(rowNum);

              return (
                <div key={`row-${rowNum}`} className="flex items-center justify-center space-x-3">
                  
                  <span className="w-5 font-mono text-xs font-bold text-zinc-600 text-center shrink-0 uppercase">
                    {rowLabel}
                  </span>

                  
                  <div
                    className="grid gap-2"
                    style={{
                      gridTemplateColumns: `repeat(${columnsCount}, minmax(0, 1fr))`,
                    }}
                  >
                    {Array.from({ length: columnsCount }).map((_, cIdx) => {
                      const colNum = cIdx + 1;
                      const seatKey = `${rowNum}-${colNum}`;
                      const isSeatActive = activeSeatsSet.has(seatKey);

                      
                      if (!isSeatActive) {
                        return (
                          <div
                            key={`aisle-${seatKey}`}
                            className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 bg-transparent"
                          />
                        );
                      }

                      const isOccupied = occupiedSeats.some(
                        (s) => s.rowNumber === rowNum && s.columnNumber === colNum
                      );
                      const isSelected = selectedSeats.some(
                        (s) => s.rowNumber === rowNum && s.columnNumber === colNum
                      );

                      let seatClass = 'bg-zinc-700 hover:bg-zinc-600 cursor-pointer text-transparent hover:scale-105';
                      let clickHandler = () => handleSeatClick(rowNum, colNum);

                      if (isOccupied) {
                        seatClass = 'bg-zinc-800 text-zinc-650 cursor-not-allowed opacity-40';
                        clickHandler = () => {};
                      } else if (isSelected) {
                        seatClass = 'bg-amber-500 text-zinc-950 font-bold shadow-[0_0_12px_rgba(245,158,11,0.55)] scale-105';
                      }

                      return (
                        <button
                          key={`seat-${seatKey}`}
                          type="button"
                          onClick={clickHandler}
                          disabled={isOccupied || isSubmitting}
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md text-[10px] flex items-center justify-center transition-all duration-200 outline-none focus:ring-1 focus:ring-amber-500/50 shrink-0 ${seatClass}`}
                          title={`Asiento ${rowLabel}-${colNum} (${isOccupied ? 'Ocupado' : isSelected ? 'Seleccionado' : 'Disponible'})`}
                        />
                      );
                    })}
                  </div>

                  
                  <span className="w-5 font-mono text-xs font-bold text-zinc-600 text-center shrink-0 uppercase">
                    {rowLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        
        <div className="flex items-center justify-center gap-6 mt-8 py-3 px-6 bg-zinc-900/40 border border-zinc-900 rounded-xl text-[11px] font-medium tracking-wide">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded bg-zinc-700 shrink-0" />
            <span className="text-zinc-400">Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded bg-amber-500 shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
            <span className="text-zinc-400">Seleccionado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded bg-zinc-800 opacity-40 shrink-0" />
            <span className="text-zinc-400">Ocupado</span>
          </div>
        </div>

        
        <div className="h-10 mt-6 flex items-center justify-center">
          {showLimitWarning && (
            <div className="bg-amber-950/20 border border-amber-500/20 text-amber-400 text-xs rounded-lg px-4 py-2 text-center max-w-md animate-pulse">
              Por favor aumenta la cantidad de boletos para elegir más asientos.
            </div>
          )}
        </div>

        
        <div className="flex flex-col items-center gap-3 bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 max-w-sm w-full shadow-lg mt-2 shrink-0">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
            Cantidad de Boletos / Ticket Quantity
          </span>
          <div className="flex items-center gap-6 mt-1">
            <button
              type="button"
              onClick={handleDecrementTickets}
              disabled={ticketQuantity <= 1 || isSubmitting}
              className="h-9 w-9 rounded-full bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center font-bold text-lg text-zinc-200 transition-all cursor-pointer active:scale-90"
            >
              —
            </button>
            <span className="text-xl font-bold font-mono text-zinc-100 min-w-[24px] text-center">
              {ticketQuantity}
            </span>
            <button
              type="button"
              onClick={handleIncrementTickets}
              disabled={ticketQuantity >= 10 || isSubmitting}
              className="h-9 w-9 rounded-full bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center font-bold text-lg text-zinc-200 transition-all cursor-pointer active:scale-90"
            >
              +
            </button>
          </div>
          <span className="text-[10px] text-zinc-500 font-medium">Máximo 10 entradas por transacción</span>
        </div>
      </div>

      
      <footer className="fixed bottom-0 left-0 w-full bg-zinc-900 border-t border-zinc-800/80 p-5 px-6 sm:px-8 flex flex-col sm:flex-row gap-4 items-center justify-between z-20 shadow-2xl">
        <div className="text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1 text-xs text-zinc-400">
            <span>Asientos:</span>
            {selectedSeats.length > 0 ? (
              <span className="font-bold text-amber-500 font-mono tracking-wider">
                {selectedSeats.map((s) => `${getRowLabel(s.rowNumber)}${s.columnNumber}`).join(', ')}
              </span>
            ) : (
              <span className="text-zinc-500 font-medium">Ninguno seleccionado</span>
            )}
          </div>
          <div className="flex items-baseline justify-center sm:justify-start gap-2 mt-1">
            <span className="text-xs text-zinc-500">Monto total:</span>
            <span className="text-lg font-bold text-zinc-100 font-mono">
              {formatPrice(ticketQuantity * (showtime?.price || 0))}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleConfirmBooking}
          disabled={selectedSeats.length !== ticketQuantity || isSubmitting}
          className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-zinc-950 font-bold px-8 py-3.5 rounded-xl transition-all shadow-[0_4px_14px_rgba(245,158,11,0.15)] active:scale-98 flex items-center justify-center gap-2 cursor-pointer text-sm"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              Confirmar Compra
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </>
          )}
        </button>
      </footer>
    </main>
  );
}
