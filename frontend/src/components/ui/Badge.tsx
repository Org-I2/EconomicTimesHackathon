/** Badge, StatusPill, and Tag — design-system indicator primitives */
import React from 'react';
import { cn } from '@/utils';

// ======================== Badge ========================

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
  style?: React.CSSProperties;
}

const badgeVariants: Record<BadgeVariant, string> = {
  default: 'bg-surface-secondary text-text-secondary border-border-primary',
  success: 'bg-success-muted text-success border-success/20',
  warning: 'bg-warning-muted text-warning border-warning/20',
  danger: 'bg-danger-muted text-danger border-danger/20',
  info: 'bg-info-muted text-info border-info/20',
  accent: 'bg-accent-500/10 text-accent-500 border-accent-500/20',
};

/** Small badge for labels, counts, and categories */
export function Badge({ children, variant = 'default', className, dot, style }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full border',
        'transition-colors duration-fast',
        badgeVariants[variant],
        className
      )}
      style={style}
    >
      {dot && (
        <span className={cn(
          'w-1.5 h-1.5 rounded-full',
          variant === 'success' && 'bg-success',
          variant === 'warning' && 'bg-warning',
          variant === 'danger' && 'bg-danger',
          variant === 'info' && 'bg-info',
          variant === 'accent' && 'bg-accent-500',
          variant === 'default' && 'bg-text-tertiary',
        )} />
      )}
      {children}
    </span>
  );
}

// ======================== StatusPill ========================

interface StatusPillProps {
  status: string;
  className?: string;
}

const statusVariantMap: Record<string, BadgeVariant> = {
  UPLOADED: 'info',
  EXTRACTED: 'warning',
  EXTRACTION_FAILED: 'danger',
  INDEXED: 'success',
  ok: 'success',
  degraded: 'warning',
  down: 'danger',
  expired: 'danger',
  expiring_soon: 'warning',
  OK: 'success',
};

/** Status pill indicator for document processing status */
export function StatusPill({ status, className }: StatusPillProps) {
  const variant = statusVariantMap[status] || 'default';
  return (
    <Badge variant={variant} dot className={className}>
      {status.replace(/_/g, ' ')}
    </Badge>
  );
}

// ======================== Tag ========================

interface TagProps {
  children: React.ReactNode;
  onRemove?: () => void;
  className?: string;
}

/** Removable tag chip for labels and filters */
export function Tag({ children, onRemove, className }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md',
        'bg-surface-secondary text-text-secondary border border-border-primary',
        className
      )}
    >
      {children}
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="ml-0.5 hover:text-text-primary transition-colors"
          aria-label={`Remove ${children}`}
        >
          ×
        </button>
      )}
    </span>
  );
}
