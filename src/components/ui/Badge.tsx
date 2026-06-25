import * as React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'amber' | 'zinc';
}

export const Badge: React.FC<BadgeProps> = ({
  className = '',
  variant = 'zinc',
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border transition-colors';
  const variantStyles = {
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-sm shadow-amber-500/5',
    zinc: 'bg-zinc-800/50 text-zinc-300 border-zinc-700/50',
  };

  return (
    <span
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
