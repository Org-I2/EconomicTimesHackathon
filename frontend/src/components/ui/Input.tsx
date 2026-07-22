/** Input — design-system primitive with icon, error state, and monospace variant */
import React from 'react';
import { cn } from '@/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  mono?: boolean;
}

/** Reusable input field with label, error state, and optional icon/mono styling */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, mono, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-9 rounded-md border bg-surface-primary text-text-primary',
              'text-sm placeholder:text-text-tertiary',
              'transition-colors duration-fast',
              'focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              icon ? 'pl-10 pr-3' : 'px-3',
              mono && 'font-mono text-xs tracking-wide',
              error
                ? 'border-danger focus:border-danger focus:ring-danger/30'
                : 'border-border-primary',
              className
            )}
            {...props}
          />
        </div>
        {hint && !error && (
          <p className="text-xs text-text-tertiary">{hint}</p>
        )}
        {error && (
          <p className="text-xs text-danger" role="alert">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

/** Textarea variant */
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-md border bg-surface-primary text-text-primary',
            'text-sm placeholder:text-text-tertiary p-3 min-h-[100px] resize-y',
            'transition-colors duration-fast',
            'focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error
              ? 'border-danger focus:border-danger focus:ring-danger/30'
              : 'border-border-primary',
            className
          )}
          {...props}
        />
        {hint && !error && (
          <p className="text-xs text-text-tertiary">{hint}</p>
        )}
        {error && (
          <p className="text-xs text-danger" role="alert">{error}</p>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
