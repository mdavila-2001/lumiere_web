import * as React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, id, type = 'text', ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    const baseInputStyles = 'w-full px-3 py-2 text-sm bg-zinc-900 border rounded-md shadow-sm transition-colors duration-200 outline-none placeholder-zinc-500 disabled:opacity-50 disabled:bg-zinc-950/50';
    const borderStyles = error
      ? 'border-red-500 text-red-100 focus:border-red-500 focus:ring-1 focus:ring-red-500'
      : 'border-zinc-700 text-zinc-100 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary';

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={`${baseInputStyles} ${borderStyles} ${className}`}
          {...props}
        />
        {error && (
          <span className="text-xs text-red-500 font-medium mt-0.5" role="alert">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
