/** Button — design-system primitive with variants, sizes, and loading state */
import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-accent-500 text-text-on-accent hover:bg-accent-600 active:bg-accent-700 border border-accent-600',
  secondary:
    'bg-surface-secondary text-text-primary hover:bg-surface-hover active:bg-surface-active border border-border-primary',
  ghost:
    'bg-transparent text-text-secondary hover:bg-surface-hover hover:text-text-primary active:bg-surface-active border border-transparent',
  danger:
    'bg-danger text-white hover:bg-red-600 active:bg-red-700 border border-red-600',
  outline:
    'bg-transparent text-text-primary hover:bg-surface-hover active:bg-surface-active border border-border-primary',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-6 text-base gap-2.5',
  icon: 'h-9 w-9 p-0 justify-center',
};

/** Reusable button with variant, size, loading, and icon support */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, icon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-md',
          'transition-all duration-fast ease-out',
          'disabled:opacity-50 disabled:pointer-events-none',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : icon ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
