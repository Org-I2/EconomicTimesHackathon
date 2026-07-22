/** Select — design-system dropdown primitive */
import React from 'react';
import { cn } from '@/utils';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  selectSize?: 'sm' | 'md';
}

/** Reusable select dropdown with label and error state */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, selectSize = 'md', id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full appearance-none rounded-md border bg-surface-primary text-text-primary',
              'text-sm',
              'transition-colors duration-fast',
              'focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              selectSize === 'sm' ? 'h-8 pl-3 pr-8 text-xs' : 'h-9 pl-3 pr-8',
              error
                ? 'border-danger focus:border-danger focus:ring-danger/30'
                : 'border-border-primary',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" className="text-text-tertiary">
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" />
        </div>
        {error && (
          <p className="text-xs text-danger" role="alert">{error}</p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';
