import * as React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  variant?: 'default' | 'search' | 'floating';
  onSearch?: (value: string) => void;
  searchButtonLabel?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = '',
      label,
      error,
      id,
      type = 'text',
      variant = 'default',
      onSearch,
      searchButtonLabel = 'Buscar',
      leftIcon,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const isError = Boolean(error);
    const innerRef = React.useRef<HTMLInputElement | null>(null);

    const handleRef = React.useCallback(
      (node: HTMLInputElement | null) => {
        innerRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
        }
      },
      [ref]
    );

    const handleSearchClick = (): void => {
      if (onSearch && innerRef.current) {
        onSearch(innerRef.current.value);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (variant === 'search' && e.key === 'Enter' && onSearch && innerRef.current) {
        e.preventDefault();
        onSearch(innerRef.current.value);
      }
      props.onKeyDown?.(e);
    };

    if (variant === 'search') {
      return (
        <div className="w-full flex flex-col gap-1.5 text-left">
          {label && (
            <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {label}
            </label>
          )}
          <div className="flex items-stretch group">
            <span className="flex items-center justify-center px-3 bg-zinc-900 border border-r-0 border-zinc-700 rounded-l-md text-zinc-500 group-focus-within:text-amber-500 group-focus-within:border-amber-500 transition-colors">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </span>
            <input
              ref={handleRef}
              id={inputId}
              type="text"
              className={`input-base ${isError ? 'input-error' : 'input-normal'} !rounded-none border-x-0 ${className}`}
              onKeyDown={handleKeyDown}
              {...props}
            />
            
            <button
              type="button"
              onClick={handleSearchClick}
              className="shrink-0 px-4 py-2.5 bg-amber-500 text-zinc-950 text-sm font-semibold rounded-r-md hover:bg-amber-600 active:scale-[0.98] transition-all duration-200 cursor-pointer border border-amber-500 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
              {searchButtonLabel}
            </button>
          </div>
          {error && (
            <span className="text-xs text-red-500 font-medium mt-0.5" role="alert">
              {error}
            </span>
          )}
        </div>
      );
    }

    if (variant === 'floating') {
      return (
        <div className="relative w-full text-left">
          <input
            ref={handleRef}
            id={inputId}
            type={type}
            placeholder=" "
            className={`floating-input input-base peer ${isError ? 'input-error' : 'input-normal'} ${className}`}
            onKeyDown={handleKeyDown}
            {...props}
          />
          {label && (
            <label
              htmlFor={inputId}
              className="floating-label absolute left-3 top-2.5 text-zinc-500 transition-all duration-200 pointer-events-none px-1 bg-[#1d1f26] peer-placeholder-shown:bg-transparent peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:bg-[#1d1f26] peer-focus:-translate-y-5 peer-focus:scale-85 peer-focus:text-amber-500"
            >
              {label}
            </label>
          )}
          {error && (
            <span className="text-xs text-red-500 font-medium mt-1 block" role="alert">
              {error}
            </span>
          )}
        </div>
      );
    }

    const inputElement = (
      <input
        ref={handleRef}
        id={inputId}
        type={type}
        className={`input-base ${isError ? 'input-error' : 'input-normal'} ${leftIcon ? 'input-icon-pad' : ''} ${className}`}
        onKeyDown={handleKeyDown}
        {...props}
      />
    );

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            {label}
          </label>
        )}
        {leftIcon ? (
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500 pointer-events-none">
              {leftIcon}
            </span>
            {inputElement}
          </div>
        ) : (
          inputElement
        )}
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

