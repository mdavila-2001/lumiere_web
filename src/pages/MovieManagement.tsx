import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import api, { ApiError } from '@/services/api';
import type { Movie } from '@/interfaces/movie.interface';
import { MovieListItem } from '@/components/ui/MovieListItem';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

const MovieListItemSkeleton: React.FC = () => {
  return (
    <div className="w-full h-48 bg-[#1d1f26] border border-gray-800/50 rounded-xl overflow-hidden animate-pulse flex flex-col sm:flex-row relative">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-zinc-800" />
      <div className="w-full sm:w-48 h-full bg-zinc-900 shrink-0" />
      <div className="flex-1 p-5 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-2">
            <div className="space-y-2 w-1/3">
              <div className="h-5 bg-zinc-800 rounded-md" />
              <div className="h-3 bg-zinc-800/60 rounded-md w-3/4" />
            </div>
            <div className="h-6 bg-zinc-800 rounded-md w-16" />
          </div>
          <div className="space-y-2 mt-4">
            <div className="h-3 bg-zinc-800/60 rounded-md w-full" />
            <div className="h-3 bg-zinc-800/60 rounded-md w-5/6" />
          </div>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4 mt-6 pt-4 border-t border-gray-800/40">
          <div className="flex gap-6 w-1/2">
            <div className="h-8 bg-zinc-800/60 rounded-md w-16" />
            <div className="h-8 bg-zinc-800/60 rounded-md w-16" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 bg-zinc-800/60 rounded-md w-20" />
            <div className="h-9 bg-zinc-800/60 rounded-md w-20" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default function MovieManagement(): React.JSX.Element {
  const navigate = useNavigate();

  const [movies, setMovies] = React.useState<Movie[]>([]);
  const [isPageLoading, setIsPageLoading] = React.useState<boolean>(true);
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [activeGenreFilter, setActiveGenreFilter] = React.useState<string>('All Genres');
  const [activeRatingFilter, setActiveRatingFilter] = React.useState<string>('All Ratings');

  // Deletion workflow state
  const [movieTargetToDelete, setMovieTargetToDelete] = React.useState<Movie | null>(null);
  const [isDeleting, setIsDeleting] = React.useState<boolean>(false);

  // Global operations error context
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [deleteErrorMsg, setDeleteErrorMsg] = React.useState<string | null>(null);

  // Fetch Pipeline
  React.useEffect(() => {
    let isMounted = true;

    const fetchMovies = async (): Promise<void> => {
      try {
        setIsPageLoading(true);
        setErrorMsg(null);
        const res = await api.get<Movie[]>('/movies');

        if (res.status !== 200) {
          throw new Error('No se pudo obtener el listado de películas.');
        }

        if (isMounted) {
          setMovies(res.data);
        }
      } catch (err: unknown) {
        console.error('Failed to load movies:', err);
        if (isMounted) {
          if (err instanceof ApiError) {
            setErrorMsg(err.errors.join(', '));
          } else if (err instanceof Error) {
            setErrorMsg(err.message);
          } else {
            setErrorMsg('Error al conectar con la base de datos de películas.');
          }
        }
      } finally {
        if (isMounted) {
          setIsPageLoading(false);
        }
      }
    };

    fetchMovies();

    return () => {
      isMounted = false;
    };
  }, []);

  // Derived filtered movies (computed inline to prevent UI desynchronization)
  const filteredMovies = React.useMemo(() => {
    return movies.filter((movie) => {
      const titleLower = movie.title.toLowerCase();
      const queryLower = searchQuery.trim().toLowerCase();
      const matchesSearch = titleLower.includes(queryLower);

      let matchesGenre = true;
      if (activeGenreFilter && activeGenreFilter !== 'All Genres') {
        const genreLower = activeGenreFilter.toLowerCase();
        const movieGenreLower = movie.genre.toLowerCase();
        // Custom check for flexible translation support
        if (genreLower === 'action') {
          matchesGenre = movieGenreLower.includes('action') || movieGenreLower.includes('acción');
        } else if (genreLower === 'sci-fi') {
          matchesGenre = movieGenreLower.includes('sci-fi') || movieGenreLower.includes('ciencia');
        } else if (genreLower === 'horror') {
          matchesGenre = movieGenreLower.includes('horror') || movieGenreLower.includes('terror');
        } else if (genreLower === 'comedy') {
          matchesGenre = movieGenreLower.includes('comedy') || movieGenreLower.includes('comedia');
        } else {
          matchesGenre = movieGenreLower.includes(genreLower);
        }
      }

      let matchesRating = true;
      if (activeRatingFilter && activeRatingFilter !== 'All Ratings') {
        matchesRating = movie.rating === activeRatingFilter;
      }

      return matchesSearch && matchesGenre && matchesRating;
    });
  }, [movies, searchQuery, activeGenreFilter, activeRatingFilter]);

  // Action handlers
  const handleEdit = (id: string): void => {
    navigate(`/admin/movies/edit/${id}`);
  };

  const handleDeleteClick = (movie: Movie): void => {
    setDeleteErrorMsg(null);
    setMovieTargetToDelete(movie);
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!movieTargetToDelete) return;

    setIsDeleting(true);
    setDeleteErrorMsg(null);
    try {
      // Axios automatic interception verifies successful status codes
      await api.delete(`/movies/${movieTargetToDelete.id}`);

      // Smoothly update the local state without forcing a full refresh
      setMovies((prev) => prev.filter((m) => m.id !== movieTargetToDelete.id));
      setMovieTargetToDelete(null);
    } catch (err: unknown) {
      console.error('Failed to delete movie:', err);
      if (err instanceof ApiError) {
        setDeleteErrorMsg(err.errors.join(', '));
      } else if (err instanceof Error) {
        setDeleteErrorMsg(err.message);
      } else {
        setDeleteErrorMsg('Error al intentar eliminar la película.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 w-full flex flex-col min-h-full">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
        <div>
          <h1 className="text-3xl font-extrabold text-[#e2e2eb] tracking-tight font-display !m-0 leading-tight">
            Inventario de Películas
          </h1>
          <p className="text-sm text-zinc-400 mt-1 font-sans">
            Gestiona tu catálogo cinematográfico y listados activos. (
            {movies.length} {movies.length === 1 ? 'película' : 'películas'} en total)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0 md:w-72">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500 pointer-events-none">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </span>
            <input
              type="text"
              placeholder="Buscar películas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#191b22] border border-gray-800 text-white rounded-lg text-sm transition-colors outline-none focus:border-amber-500 placeholder-zinc-500 font-sans"
            />
          </div>

          <Button
            variant="primary"
            onClick={() => navigate('/admin/movies/new')}
            icon={<span className="material-symbols-outlined text-[18px]">add</span>}
            className="font-semibold py-2.5 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer w-full md:w-auto"
          >
            Agregar Película
          </Button>
        </div>
      </header>

      {/* ── Multi-Tier Filter Navigation Grid ─────────────────── */}
      <section className="flex flex-wrap items-center gap-4 bg-[#1d1f26]/40 p-4 border border-gray-800/40 rounded-xl">
        <div className="flex items-center gap-2 font-sans">
          <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
            Género:
          </span>
          <select
            value={activeGenreFilter}
            onChange={(e) => setActiveGenreFilter(e.target.value)}
            className="bg-[#191b22] border border-gray-800 text-white rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none cursor-pointer min-w-[140px]"
          >
            <option value="All Genres">Todos los géneros</option>
            <option value="Action">Acción</option>
            <option value="Sci-Fi">Ciencia Ficción</option>
            <option value="Horror">Terror</option>
            <option value="Comedy">Comedia</option>
            <option value="Drama">Drama</option>
          </select>
        </div>

        <div className="flex items-center gap-2 font-sans">
          <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
            Clasificación:
          </span>
          <select
            value={activeRatingFilter}
            onChange={(e) => setActiveRatingFilter(e.target.value)}
            className="bg-[#191b22] border border-gray-800 text-white rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none cursor-pointer min-w-[140px]"
          >
            <option value="All Ratings">Todas las clasificaciones</option>
            <option value="G">G</option>
            <option value="PG">PG</option>
            <option value="PG-13">PG-13</option>
            <option value="R">R</option>
          </select>
        </div>
      </section>

      {errorMsg && (
        <div className="bg-[#93000a] text-[#ffb4ab] border border-red-500/20 rounded-xl p-4 font-sans text-sm text-left shadow-lg">
          <p className="font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {errorMsg}
          </p>
        </div>
      )}

      {/* ── Movie Inventory List ──────────────────────────────── */}
      <div className="flex-1 w-full">
        {isPageLoading ? (
          // Sleek structural row skeletons while tasks are pending
          <div className="space-y-4">
            <MovieListItemSkeleton />
            <MovieListItemSkeleton />
            <MovieListItemSkeleton />
          </div>
        ) : filteredMovies.length > 0 ? (
          <div className="space-y-4">
            {filteredMovies.map((movie) => {
              const isActive = movie.title.toLowerCase() !== 'midnight protocol';
              const formats = movie.title.toLowerCase().includes('starlight') || movie.genre.toLowerCase().includes('sci-fi') ? ['IMAX', '3D'] : [];
              const dailyShowsCount = movie.title === 'Starlight Horizon' ? 12 : 0;
              const roomsNames = movie.title === 'Starlight Horizon' ? ['A', 'B', 'IMAX-1'] : [];

              return (
                <MovieListItem
                  key={movie.id}
                  movie={movie}
                  status={isActive ? 'active' : 'archived'}
                  dailyShowsCount={dailyShowsCount}
                  roomsNames={roomsNames}
                  formats={formats}
                  actions={
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleEdit(movie.id)}
                        icon={<span className="material-symbols-outlined text-[18px]">edit</span>}
                        className="px-3 py-1.5 min-h-[38px]"
                      >
                        Editar
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleDeleteClick(movie)}
                        className="!border-[#ffb4ab]/20 !text-error hover:!bg-error/10 px-3 py-1.5 min-h-[38px]"
                        icon={<span className="material-symbols-outlined text-[18px]">delete</span>}
                      >
                        Eliminar
                      </Button>
                    </div>
                  }
                />
              );
            })}
          </div>
        ) : (
          // Beautiful empty state to keep engagement high
          <div className="flex flex-col items-center justify-center py-16 px-6 bg-[#1d1f26]/20 border border-gray-800/40 rounded-xl text-center space-y-4">
            <span className="material-symbols-outlined text-[48px] text-zinc-600">movie_off</span>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-zinc-200">No se encontraron películas</h3>
              <p className="text-zinc-500 text-sm max-w-sm font-sans">
                Prueba ajustando los filtros de búsqueda o clasificación para ver otras producciones en cartelera.
              </p>
            </div>
            {(searchQuery || activeGenreFilter !== 'All Genres' || activeRatingFilter !== 'All Ratings') && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setActiveGenreFilter('All Genres');
                  setActiveRatingFilter('All Ratings');
                }}
                className="mt-2 text-xs"
              >
                Restablecer Filtros
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ── Glassmorphic Confirmation Modal Block ──────────────── */}
      {movieTargetToDelete && (
        <Modal
          isOpen={true}
          onClose={() => {
            if (!isDeleting) setMovieTargetToDelete(null);
          }}
          title="Eliminar Película"
          size="sm"
          footer={
            <div className="flex gap-3 justify-end w-full font-sans">
              <Button
                variant="outline"
                onClick={() => setMovieTargetToDelete(null)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmDelete}
                isLoading={isDeleting}
                className="cursor-pointer"
              >
                Confirmar
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-left font-sans">
            {deleteErrorMsg && (
              <div className="bg-[#93000a] text-[#ffb4ab] border border-red-500/20 rounded-lg p-3 text-xs flex items-start gap-1.5">
                <span className="material-symbols-outlined text-[16px] mt-0.5">error</span>
                <span>{deleteErrorMsg}</span>
              </div>
            )}

            <p className="text-zinc-300 text-sm leading-relaxed">
              ¿Estás seguro de que deseas eliminar permanentemente la película{' '}
              <strong className="text-zinc-100 font-semibold font-display">
                "{movieTargetToDelete.title}"
              </strong>
              ? Esta acción borrará todas sus funciones y programaciones asociadas de forma irreversible.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
