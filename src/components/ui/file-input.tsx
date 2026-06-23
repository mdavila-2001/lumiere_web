import * as React from 'react';

export interface FileInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  previewUrl?: string;
}

export const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
  ({ className = '', label, error, id, previewUrl, onChange, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const isError = Boolean(error);

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            {label}
          </span>
        )}
        
        <label
          htmlFor={inputId}
          className={`flex flex-col items-center justify-center min-h-[160px] p-4 bg-zinc-900 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:border-amber-500 ${
            isError
              ? 'border-red-500 hover:border-red-400'
              : 'border-zinc-700 hover:border-zinc-600'
          } ${className}`}
        >
          <input
            ref={ref}
            id={inputId}
            type="file"
            className="sr-only"
            onChange={onChange}
            {...props}
          />
          
          {previewUrl ? (
            <div className="relative w-full max-w-[120px] aspect-[2/3] rounded-md overflow-hidden border border-zinc-800 shadow-lg group">
              <img
                src={previewUrl}
                alt="Poster preview"
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                <span className="text-[10px] text-zinc-300 font-medium uppercase tracking-wider">
                  Change Poster
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center space-y-2">
              <svg
                className="w-8 h-8 text-zinc-500 group-hover:text-zinc-400 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-zinc-300">Upload Poster Image</p>
                <p className="text-xs text-zinc-500">PNG, JPG or WEBP up to 5MB</p>
              </div>
            </div>
          )}
        </label>

        {error && (
          <span className="text-xs text-red-500 font-medium mt-0.5" role="alert">
            {error}
          </span>
        )}
      </div>
    );
  }
);

FileInput.displayName = 'FileInput';
