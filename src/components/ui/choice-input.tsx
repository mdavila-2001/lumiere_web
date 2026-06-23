import * as React from 'react';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = '', label, error, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const isError = Boolean(error);

    return (
      <div className="flex flex-col text-left">
        <label
          htmlFor={inputId}
          className="flex items-center gap-3 cursor-pointer select-none text-sm font-medium text-zinc-300 hover:text-zinc-100 transition-colors"
        >
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            className={`w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 accent-amber-500 focus:ring-1 focus:ring-amber-500/20 focus:ring-offset-zinc-950 ${
              isError ? 'border-red-500' : 'border-zinc-700'
            } ${className}`}
            {...props}
          />
          <span>{label}</span>
        </label>
        {error && (
          <span className="text-xs text-red-500 font-medium mt-1 ml-7" role="alert">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className = '', label, error, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const isError = Boolean(error);

    return (
      <div className="flex flex-col text-left">
        <label
          htmlFor={inputId}
          className="flex items-center gap-3 cursor-pointer select-none text-sm font-medium text-zinc-300 hover:text-zinc-100 transition-colors"
        >
          <input
            ref={ref}
            id={inputId}
            type="radio"
            className={`w-4 h-4 rounded-full border-zinc-700 bg-zinc-900 text-amber-500 accent-amber-500 focus:ring-1 focus:ring-amber-500/20 focus:ring-offset-zinc-950 ${
              isError ? 'border-red-500' : 'border-zinc-700'
            } ${className}`}
            {...props}
          />
          <span>{label}</span>
        </label>
        {error && (
          <span className="text-xs text-red-500 font-medium mt-1 ml-7" role="alert">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';
