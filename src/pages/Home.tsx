import * as React from 'react';
import api, { ApiError } from '@/services/api';
import type { Movie } from '@/interfaces/movie.interface';
import { MovieCard } from '@/components/MovieCard';

export default function Home(): React.JSX.Element {
  const [movies, setMovies] = React.useState<Movie[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await api.get<Movie[]>('/movies');
        setMovies(response.data);
      } catch (error: unknown) {
        if (error instanceof ApiError) {
          setErrorMsg(error.message);
        } else {
          setErrorMsg('No se pudieron cargar las películas de la cartelera.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovies();
  }, []);

  return (
    <main className="w-full min-h-screen bg-zinc-950 text-zinc-100 py-12 px-6">
      <div className="max-w-6xl mx-auto space-y-10 text-left">
        {/* Page Header */}
        <header className="border-b border-zinc-800 pb-6">
          <h1 className="text-3xl font-extrabold text-zinc-100 mt-1 mb-2 tracking-tight font-sans">
            En Cartelera
          </h1>
          <p className="text-sm text-zinc-400 max-w-xl">
            Disfruta de nuestra selección curada de funciones premium y estrenos cinematográficos.
          </p>
        </header>

        {/* Error Feedback */}
        {errorMsg && (
          <div className="bg-red-950/40 border border-red-500/20 text-red-400 text-sm rounded-lg p-4 font-medium text-left">
            {errorMsg}
          </div>
        )}

        {/* Loading Skeletons State */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="flex flex-col bg-zinc-900 rounded-[12px] border border-zinc-800/80 overflow-hidden animate-pulse"
              >
                <div className="aspect-[2/3] w-full bg-zinc-950" />
                <div className="p-5 space-y-2">
                  <div className="h-4 bg-zinc-800 rounded w-3/4" />
                  <div className="h-3 bg-zinc-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : movies.length === 0 ? (
          /* Empty Billboard State */
          <div className="flex flex-col items-center justify-center text-center py-16 px-6 bg-zinc-900/30 border border-zinc-800 rounded-xl max-w-lg mx-auto space-y-4">
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
              <span className="material-symbols-outlined text-[24px]">movie</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-zinc-200">Cartelera Vacía</h3>
              <p className="text-sm text-zinc-500">
                No hay películas programadas actualmente en cartelera.
              </p>
            </div>
          </div>
        ) : (
          /* Movies Catalog Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
