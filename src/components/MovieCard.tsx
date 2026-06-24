import * as React from 'react';
import { Link } from 'react-router-dom';
import type { Movie } from '@/interfaces/movie.interface';

export interface MovieCardProps {
  movie: Movie;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie }) => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  const fullPosterUrl = movie.posterUrl.startsWith('http')
    ? movie.posterUrl
    : `${apiBaseUrl}${movie.posterUrl}`;

  return (
    <article className="movie-card group flex flex-col bg-zinc-900 rounded-[12px] border border-zinc-800/80 overflow-hidden relative transition-all duration-300 hover:border-amber-500/30 gold-glow">
      {/* Poster Frame */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-950">
        <img
          alt={movie.title}
          src={fullPosterUrl}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        
        {/* Floating Classification Badge */}
        <div className="absolute top-3 right-3 bg-zinc-950/80 backdrop-blur-sm border border-zinc-700/80 px-2 py-0.5 rounded z-10">
          <span className="font-mono text-[10px] text-amber-500 font-bold uppercase tracking-wider">
            {movie.rating}
          </span>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-3 transition-opacity duration-300 z-20">
          <Link
            to={`/movie/${movie.id}`}
            className="bg-amber-500 text-zinc-950 font-bold py-2.5 px-6 rounded-lg hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/10 text-sm cursor-pointer"
          >
            Ver Horarios
          </Link>
        </div>
      </div>
      
      {/* Information Row */}
      <div className="p-5 flex flex-col flex-1 text-left">
        <h2 className="text-base font-bold text-zinc-100 line-clamp-1 mb-1 group-hover:text-amber-500 transition-colors">
          {movie.title}
        </h2>
        <p className="text-xs text-zinc-400 font-medium line-clamp-1">
          {movie.genre} • {movie.duration} min
        </p>
      </div>
    </article>
  );
};
