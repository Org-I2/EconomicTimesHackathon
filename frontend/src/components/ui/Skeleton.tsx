/** Skeleton — shimmer loading placeholder */
import React from 'react';
import { cn } from '@/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

/** Skeleton shimmer loader for content placeholders */
export function Skeleton({ className, variant = 'text', width, height, lines }: SkeletonProps) {
  if (lines && lines > 1) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'skeleton-shimmer rounded-md',
              i === lines - 1 ? 'w-3/4' : 'w-full',
              'h-4',
              className
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'skeleton-shimmer',
        variant === 'text' && 'h-4 rounded-md',
        variant === 'circular' && 'rounded-full',
        variant === 'rectangular' && 'rounded-lg',
        className
      )}
      style={{ width, height }}
    />
  );
}

/** Card skeleton — for document cards, stat tiles, etc. */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-surface-primary border border-border-primary rounded-lg p-4', className)}>
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="w-3/4 h-5" />
        <Skeleton className="w-16 h-5" variant="rectangular" />
      </div>
      <Skeleton lines={2} className="mb-3" />
      <div className="flex gap-2">
        <Skeleton className="w-20 h-6" variant="rectangular" />
        <Skeleton className="w-16 h-6" variant="rectangular" />
      </div>
    </div>
  );
}

/** Table skeleton */
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex gap-4 px-4 py-3 border-b border-border-primary">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
