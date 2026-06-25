import * as React from 'react';
import type { Movie } from '@/interfaces/movie.interface';

export interface MovieListItemProps {
  movie: Movie;
  status: 'active' | 'archived';
  premiereDate: string | null;
  totalShowsCount?: number;
  roomsNames?: string[];
  actions: React.ReactNode;
}

const statusIndicatorStyles = {
  active: 'bg-primary-container',
  archived: 'bg-outline-variant',
} as const;

const statusBadgeStyles = {
  active:
    'bg-surface-container-highest text-primary-container border-outline-variant/50',
  archived:
    'bg-surface-container-low text-on-surface-variant border-outline-variant/50',
} as const;

const statusLabels = {
  active: 'En Cartelera',
  archived: 'Muy Pronto',
} as const;

const containerStatusStyles = {
  active: 'glow-hover hover:border-outline-variant',
  archived: 'opacity-75 grayscale-[20%]',
} as const;

const imageBaseUrl = import.meta.env.VITE_IMAGE_URL;

function formatReleaseDate(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

export const MovieListItem: React.FC<MovieListItemProps> = ({
  movie,
  status,
  premiereDate,
  totalShowsCount,
  roomsNames,
  actions,
}) => {
  const fullPosterUrl = movie.posterUrl.startsWith('http')
    ? movie.posterUrl
    : `${imageBaseUrl}${movie.posterUrl}`;

  return (
    <article
      className={`group bg-[#1d1f26] rounded-xl border border-outline-variant/30 flex flex-col sm:flex-row overflow-hidden transition-colors duration-200 relative ${containerStatusStyles[status]}`}
    >
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${statusIndicatorStyles[status]}`}
      />

      <div className="w-full sm:w-48 h-48 sm:h-auto shrink-0 relative bg-zinc-950">
        <img
          src={fullPosterUrl}
          alt={`${movie.title} poster`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      <div className="flex-1 p-4 flex flex-col justify-between text-left">
        <div>
          <div className="flex justify-between items-start mb-1">
            <div>
              <h2 className="text-xl font-bold text-on-surface group-hover:text-primary-container transition-colors !m-0 leading-tight">
                {movie.title}
              </h2>
              <p className="text-sm text-on-surface-variant mt-1">
                {movie.genre} • {movie.duration} min • {movie.rating}
              </p>
            </div>
            <span
              className={`shrink-0 ml-3 text-xs font-semibold px-2 py-1 rounded border ${statusBadgeStyles[status]}`}
            >
              {statusLabels[status]}
            </span>
          </div>

          <p className="line-clamp-2 text-on-surface-variant/80 text-sm mt-2">
            {movie.synopsis}
          </p>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4 mt-4 pt-4 border-t border-outline-variant/30">
          <div className="flex gap-4">
            <div className="flex flex-col">
              <span className="text-on-surface-variant/60 uppercase tracking-wider text-[10px] font-medium font-sans">
                Estreno
              </span>
              <span className="text-sm text-on-surface font-sans">
                {premiereDate ? formatReleaseDate(premiereDate) : 'Muy pronto'}
              </span>
            </div>

            {totalShowsCount !== undefined && totalShowsCount > 0 && (
              <div className="flex flex-col">
                <span className="text-on-surface-variant/60 uppercase tracking-wider text-[10px] font-medium font-sans">
                  Funciones
                </span>
                <span className="text-sm text-on-surface font-sans">
                  {totalShowsCount}
                </span>
              </div>
            )}

            {roomsNames && roomsNames.length > 0 && (
              <div className="flex-col hidden sm:flex">
                <span className="text-on-surface-variant/60 uppercase tracking-wider text-[10px] font-medium font-sans">
                  Salas
                </span>
                <span className="text-sm text-on-surface font-sans">
                  {roomsNames.join(', ')}
                </span>
              </div>
            )}
          </div>

          <div className="w-full sm:w-auto flex gap-2">{actions}</div>
        </div>
      </div>
    </article>
  );
};

