import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import api, { ApiError } from '@/services/api';
import type { Movie } from '@/interfaces/movie.interface';
import { MovieCard } from '@/components/MovieCard';
import { useAuth } from '@/hooks/use-auth';
import { UserRole } from '@/interfaces/user.interface';

function getInitials(email: string | undefined): string {
  if (!email) return '?';
  const localPart = email.split('@')[0];
  const segments = localPart.split(/[._-]+/).filter(Boolean);
  if (segments.length >= 2) {
    return (segments[0].charAt(0) + segments[1].charAt(0)).toUpperCase();
  }
  return localPart.slice(0, 2).toUpperCase() || '?';
}

export default function Home(): React.JSX.Element {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  
  const [movies, setMovies] = React.useState<Movie[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  
  const [isMenuOpen, setIsMenuOpen] = React.useState<boolean>(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const fetchMovies = async (): Promise<void> => {
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

  
  React.useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (event: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const handleLogout = async (): Promise<void> => {
    setIsMenuOpen(false);
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen w-full bg-zinc-950 flex flex-col text-zinc-100">
      
      <header className="w-full bg-zinc-900 border-b border-zinc-800 px-6 h-16 flex items-center justify-between">
        
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-amber-500 text-xl font-extrabold tracking-tight hover:text-amber-600 transition-colors cursor-pointer bg-transparent border-none p-0"
        >
          Lumiére
        </button>

        {isAuthenticated ? (
          <div className="flex flex-row items-center gap-6">
            <button
              type="button"
              onClick={() => navigate('/my-bookings')}
              className="text-sm font-medium text-zinc-400 hover:text-amber-500 transition-colors duration-200 cursor-pointer bg-transparent border-none"
            >
              Mis Reservas
            </button>

            
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={isMenuOpen}
                title={user?.email ?? 'Perfil'}
                className="h-9 w-9 rounded-full bg-zinc-800 border border-zinc-800 flex items-center justify-center text-amber-500 text-xs font-bold hover:border-amber-500/50 transition-colors cursor-pointer overflow-hidden"
              >
                {user?.email ? (
                  getInitials(user.email)
                ) : (
                  <span className="material-symbols-outlined text-[20px] text-zinc-400">person</span>
                )}
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-2 z-50 text-left">
                  <div className="px-4 py-2 border-b border-zinc-800">
                    <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">
                      Sesión iniciada
                    </p>
                    <p className="text-sm text-zinc-200 font-medium truncate">
                      {user?.email ?? 'Invitado'}
                    </p>
                  </div>

                  {user?.role === UserRole.ADMIN && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        navigate('/admin');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-amber-500 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">dashboard</span>
                        Panel de Administración
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-red-400 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-row items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="text-sm font-semibold text-zinc-300 hover:text-amber-500 transition-colors duration-200 cursor-pointer bg-transparent border-none px-2"
            >
              Registrarse
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="bg-amber-500 text-zinc-950 font-bold px-4 py-2 rounded-lg hover:bg-amber-600 active:scale-95 transition-all cursor-pointer"
            >
              Iniciar Sesión
            </button>
          </div>
        )}
      </header>

      <main className="bg-zinc-950 flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-10 text-left">
          <section className="border-b border-zinc-800 pb-6">
            <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight font-sans !m-0">
              Cartelera Principal
            </h1>
            <p className="text-sm text-zinc-400 max-w-xl mt-2">
              Disfruta de nuestra selección curada de funciones premium y estrenos cinematográficos.
            </p>
          </section>

          
          {errorMsg && (
            <div className="bg-red-950/40 border border-red-500/20 text-red-400 text-sm rounded-lg p-4 font-medium">
              {errorMsg}
            </div>
          )}

          
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
