import * as React from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api, { ApiError } from '@/services/api';
import type { Movie } from '@/interfaces/movie.interface';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { FileInput } from '@/components/ui/FileInput';
import { formatMinutesAsHours } from '@/utils/duration';

interface MovieFormProps {
  initialData?: Movie;
}

interface MovieFormState {
  title: string;
  synopsis: string;
  genre: string;
  duration: number;
  rating: string;
  posterFile: File | null;
}

const imageBaseUrl = import.meta.env.VITE_IMAGE_URL || 'http://localhost:3000';

const genreOptions = [
  { value: '', label: 'Seleccionar género' },
  { value: 'Action', label: 'Acción' },
  { value: 'Sci-Fi', label: 'Ciencia Ficción' },
  { value: 'Horror', label: 'Terror' },
  { value: 'Comedy', label: 'Comedia' },
  { value: 'Drama', label: 'Drama' },
];

const ratingOptions = [
  { value: '', label: 'Seleccionar clasificación' },
  { value: 'G', label: 'G (Todo público)' },
  { value: 'PG', label: 'PG (Sugerido menores)' },
  { value: 'PG-13', label: 'PG-13 (Mayores de 13 años)' },
  { value: 'R', label: 'R (Restringido)' },
];

export default function MovieForm({ initialData }: MovieFormProps): React.JSX.Element {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id || initialData);

  // Form State
  const [formState, setFormState] = React.useState<MovieFormState>(() => ({
    title: initialData?.title ?? '',
    synopsis: initialData?.synopsis ?? '',
    genre: initialData?.genre ?? '',
    duration: initialData?.duration ?? 120,
    rating: initialData?.rating ?? '',
    posterFile: null,
  }));

  // UI States
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [dragActive, setDragActive] = React.useState<boolean>(false);
  const [fetchedMovie, setFetchedMovie] = React.useState<Movie | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isActiveListing, setIsActiveListing] = React.useState<boolean>(() =>
    initialData ? initialData.title.toLowerCase() !== 'midnight protocol' : true
  );

  // Fetch movie data if in edit mode and initialData not provided
  React.useEffect(() => {
    let isMounted = true;

    if (id && !initialData) {
      const fetchMovieDetails = async (): Promise<void> => {
        try {
          setIsLoading(true);
          setErrorMsg(null);
          const res = await api.get<Movie>(`/movies/${id}`);
          
          if (res.status !== 200) {
            throw new Error('No se pudieron obtener los detalles de la película.');
          }

          if (isMounted) {
            setFetchedMovie(res.data);
            setFormState({
              title: res.data.title,
              synopsis: res.data.synopsis,
              genre: res.data.genre,
              duration: res.data.duration,
              rating: res.data.rating,
              posterFile: null,
            });
            // Assume it's active based on title constraint
            setIsActiveListing(res.data.title.toLowerCase() !== 'midnight protocol');
          }
        } catch (err: unknown) {
          console.error('Failed to load movie for editing:', err);
          if (isMounted) {
            if (err instanceof ApiError) {
              setErrorMsg(err.errors.join(', '));
            } else if (err instanceof Error) {
              setErrorMsg(err.message);
            } else {
              setErrorMsg('Error al conectar con la base de datos.');
            }
          }
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      };
      fetchMovieDetails();
    }

    return () => {
      isMounted = false;
    };
  }, [id, initialData]);

  // Derive the local preview URL from the selected file (no state/effect needed)
  const previewUrl = React.useMemo(
    () => (formState.posterFile ? URL.createObjectURL(formState.posterFile) : null),
    [formState.posterFile]
  );

  // Memory Safety Rule: revoke the object URL when it changes or on unmount
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Drag & Drop handlers
  const handleDrag = (e: React.DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.type.startsWith('image/')) {
        alert('Solo se permiten archivos de imagen.');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        alert('La imagen no debe exceder los 2MB.');
        return;
      }
      setFormState((prev) => ({ ...prev, posterFile: file }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        alert('La imagen no debe exceder los 2MB.');
        return;
      }
      setFormState((prev) => ({ ...prev, posterFile: file }));
    }
  };

  // Submit operations
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    // Validation guard checks
    if (!formState.title.trim()) {
      setErrorMsg('El título de la película es requerido.');
      setIsSubmitting(false);
      return;
    }
    if (formState.duration <= 0) {
      setErrorMsg('La duración de la película debe ser mayor a 0 minutos.');
      setIsSubmitting(false);
      return;
    }
    if (!formState.genre) {
      setErrorMsg('Selecciona un género cinematográfico válido.');
      setIsSubmitting(false);
      return;
    }
    if (!formState.rating) {
      setErrorMsg('Selecciona una clasificación de edad.');
      setIsSubmitting(false);
      return;
    }
    if (!isEditMode && !formState.posterFile) {
      setErrorMsg('El póster promocional de la película es requerido.');
      setIsSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', formState.title.trim());
      formData.append('synopsis', formState.synopsis.trim());
      formData.append('genre', formState.genre);
      formData.append('duration', String(formState.duration));
      formData.append('rating', formState.rating);
      if (formState.posterFile) {
        formData.append('poster', formState.posterFile);
      }

      if (isEditMode) {
        const activeId = id || initialData?.id;
        if (!activeId) throw new Error('No se pudo identificar la película para actualizar.');
        
        await api.patch(`/movies/${activeId}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        await api.post('/movies', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      // Navigate back to listing page on success
      navigate('/admin/movies');
    } catch (err: unknown) {
      console.error('Failed to submit movie asset:', err);
      if (err instanceof ApiError) {
        setErrorMsg(err.errors.join(', '));
      } else if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Error de red al intentar registrar los metadatos.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine existing image preview if editing and no local file selected
  const activeMovieObj = initialData || fetchedMovie;
  const existingPosterUrl = activeMovieObj?.posterUrl
    ? (activeMovieObj.posterUrl.startsWith('http')
        ? activeMovieObj.posterUrl
        : `${imageBaseUrl}${activeMovieObj.posterUrl}`)
    : null;

  const currentPreview = previewUrl || existingPosterUrl;

  if (isLoading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-[#ffd700]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm text-zinc-400 font-medium">Cargando información...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto w-full text-left font-sans pb-12 space-y-8">
      {/* ── Breadcrumbs & Discard Row ──────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <nav className="flex items-center gap-2 text-xs text-zinc-500 font-semibold mb-2">
            <Link to="/admin/movies" className="hover:text-zinc-300 transition-colors">Películas</Link>
            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
            <span className="text-zinc-400">{isEditMode ? 'Editar Película' : 'Nueva Película'}</span>
          </nav>
          
          <h1 className="text-3xl font-extrabold tracking-tight font-display text-zinc-100 !m-0 leading-tight">
            {isEditMode ? 'Editar Película' : 'Nueva Película'}
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            {isEditMode
              ? 'Actualiza los metadatos y los activos promocionales para esta cinta.'
              : 'Añade una nueva producción al catálogo cinematográfico de Lumiére.'}
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => navigate('/admin/movies')}
          className="border-gray-800 text-zinc-300 hover:bg-zinc-800/40 w-full sm:w-auto min-h-[40px]"
        >
          Descartar
        </Button>
      </div>

      {/* ── Global Exception Errors Banner ──────────────────────── */}
      {errorMsg && (
        <div className="bg-[#93000a] text-[#ffb4ab] border border-red-500/20 rounded-xl p-4 text-sm shadow-lg">
          <p className="font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {errorMsg}
          </p>
        </div>
      )}

      {/* ── Centered Premium Glassmorphic Container Panel ────────── */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden bg-[#1d1f26]/80">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Left Column: Basic Info & Synopsis */}
          <div className="space-y-6">
            
            {/* Card 1: Basic Info */}
            <div className="bg-[#15171c]/50 border border-gray-800/30 rounded-2xl p-6 space-y-6 shadow-md">
              <h3 className="text-base font-bold text-zinc-200 border-b border-gray-800/40 pb-3 font-display">
                Información Básica
              </h3>

              {/* Title input using custom Input component */}
              <Input
                id="title"
                variant="floating"
                label="Título de la Película"
                value={formState.title}
                onChange={(e) => setFormState((prev) => ({ ...prev, title: e.target.value }))}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Duration input using custom Input component */}
                <div className="sm:col-span-1">
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    label="Duración"
                    placeholder="120 min"
                    leftIcon={<span className="material-symbols-outlined text-[18px]">schedule</span>}
                    value={formState.duration || ''}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        duration: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="font-sans"
                    required
                  />
                  {formState.duration > 0 && (
                    <p className="mt-1.5 text-[11px] font-mono text-amber-500">
                      {formatMinutesAsHours(formState.duration)}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-1">
                  <Select
                    label="Género"
                    value={formState.genre}
                    onChange={(e) => setFormState((prev) => ({ ...prev, genre: e.target.value }))}
                    options={genreOptions}
                    className="font-sans"
                    required
                  />
                </div>
                <div className="sm:col-span-1">
                  <Select
                    label="Clasificación"
                    value={formState.rating}
                    onChange={(e) => setFormState((prev) => ({ ...prev, rating: e.target.value }))}
                    options={ratingOptions}
                    className="font-sans"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Synopsis and Listing status */}
            <div className="bg-[#15171c]/50 border border-gray-800/30 rounded-2xl p-6 space-y-6 shadow-md">
              <h3 className="text-base font-bold text-zinc-200 border-b border-gray-800/40 pb-3 font-display">
                Detalles Adicionales
              </h3>

              {/* Synopsis Textarea */}
              <div className="flex flex-col gap-1.5 text-left">
                <label htmlFor="synopsis" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Sinopsis de la Película
                </label>
                <textarea
                  id="synopsis"
                  rows={4}
                  maxLength={1000}
                  placeholder="Escribe un breve resumen de la trama..."
                  value={formState.synopsis}
                  onChange={(e) => setFormState((prev) => ({ ...prev, synopsis: e.target.value }))}
                  className="input-base focus:border-amber-500 gold-glow resize-none font-sans"
                  required
                />
                <div className="flex justify-between items-center text-xs text-zinc-500 mt-1">
                  <span>Resumen del argumento principal.</span>
                  <span>{formState.synopsis.length} / 1000</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#191b22]/40 rounded-xl border border-gray-800/40">
                <div className="space-y-0.5 text-left">
                  <span className="text-sm font-bold text-zinc-200">Listado Activo</span>
                  <p className="text-xs text-zinc-500 max-w-[280px]">
                    Habilita esta película para que se muestre en cartelera y programación de funciones.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActiveListing((prev) => !prev)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                    isActiveListing ? 'bg-amber-500' : 'bg-zinc-800'
                  }`}
                  role="switch"
                  aria-checked={isActiveListing}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-zinc-950 shadow-lg ring-0 transition duration-200 ease-in-out ${
                      isActiveListing ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

          </div>

          {/* Right Column: Poster Upload Block (uses shared FileInput component) */}
          <div className="bg-[#15171c]/50 border border-gray-800/30 rounded-2xl p-6 shadow-md flex flex-col h-full min-h-[460px]">
            <div className="flex items-center justify-between border-b border-gray-800/40 pb-3 mb-6">
              <h3 className="text-base font-bold text-zinc-200 font-display">
                Póster de la Película
              </h3>
              {formState.posterFile && (
                <span className="text-xs text-amber-500 font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  Nuevo archivo
                </span>
              )}
            </div>

            {/* Drag & drop wrapper around the shared FileInput */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`flex-grow flex rounded-lg transition-all ${
                dragActive ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-[#15171c]' : ''
              }`}
            >
              <FileInput
                id="poster"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFileChange}
                previewUrl={currentPreview || undefined}
                className="!min-h-[300px]"
              />
            </div>

            {/* Contextual metadata under the uploader */}
            <div className="mt-4 text-center">
              {formState.posterFile ? (
                <p className="font-mono text-[11px] text-zinc-500 truncate">
                  <span className="text-zinc-300">{formState.posterFile.name}</span>
                  {' · '}
                  {Math.round((formState.posterFile.size / 1024 / 1024) * 10) / 10} MB
                </p>
              ) : isEditMode && currentPreview ? (
                <p className="text-[11px] text-zinc-500 flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-amber-500">info</span>
                  Póster actual en base de datos.
                </p>
              ) : (
                <p className="text-[11px] text-zinc-500">
                  Arrastra o haz clic para subir. PNG, JPG o WebP, máx. 2MB.
                </p>
              )}
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 flex justify-end gap-3.5 mt-4 pt-6 border-t border-gray-800/40">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/movies')}
              disabled={isSubmitting}
              className="border-gray-800 text-zinc-300 hover:bg-zinc-800/40 min-h-[44px] px-6 cursor-pointer"
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              isLoading={isSubmitting}
              className="!bg-amber-500 hover:!bg-amber-600 !text-zinc-950 focus-visible:!ring-amber-500 shadow-md shadow-amber-500/10 min-h-[44px] px-6 cursor-pointer font-bold"
            >
              {isSubmitting ? null : (isEditMode ? 'Guardar Cambios' : 'Registrar Película')}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}
