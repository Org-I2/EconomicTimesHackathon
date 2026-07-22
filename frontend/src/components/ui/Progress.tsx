/** ProgressBar and Timeline — design-system components */
import React from 'react';
import { cn } from '@/utils';

// ======================== ProgressBar ========================

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md';
  variant?: 'accent' | 'success' | 'warning' | 'danger';
  className?: string;
  showLabel?: boolean;
}

const progressVariants = {
  accent: 'bg-accent-500',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
};

/** Animated progress bar with variant colors */
export function ProgressBar({ value, max = 100, size = 'sm', variant = 'accent', className, showLabel }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex-1 rounded-full bg-surface-secondary overflow-hidden', size === 'sm' ? 'h-1.5' : 'h-2.5')}>
        <div
          className={cn('h-full rounded-full transition-all duration-slow', progressVariants[variant])}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-mono text-text-tertiary whitespace-nowrap">
          {Math.round(pct)}%
        </span>
      )}
    </div>
  );
}

// ======================== Step Progress ========================

interface StepProgressProps {
  steps: string[];
  currentStep: number; // 0-indexed
  className?: string;
}

/** Multi-step progress indicator for document processing pipeline */
export function StepProgress({ steps, currentStep, className }: StepProgressProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {steps.map((step, i) => (
        <React.Fragment key={step}>
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                'transition-all duration-normal',
                i < currentStep
                  ? 'bg-success text-white'
                  : i === currentStep
                  ? 'bg-accent-500 text-text-on-accent animate-pulse-dot'
                  : 'bg-surface-secondary text-text-tertiary border border-border-primary'
              )}
            >
              {i < currentStep ? '✓' : i + 1}
            </div>
            <span className={cn(
              'text-xs hidden sm:inline',
              i <= currentStep ? 'text-text-primary font-medium' : 'text-text-tertiary'
            )}>
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={cn(
              'flex-1 h-px min-w-[16px] mx-1',
              i < currentStep ? 'bg-success' : 'bg-border-primary'
            )} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ======================== Timeline ========================

interface TimelineItem {
  id: string;
  date: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  onClick?: () => void;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

const timelineVariants = {
  default: 'bg-surface-secondary border-border-primary',
  success: 'bg-success-muted border-success',
  warning: 'bg-warning-muted border-warning',
  danger: 'bg-danger-muted border-danger',
  info: 'bg-info-muted border-info',
};

/** Vertical timeline with staggered fade-in animation */
export function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn('relative', className)}>
      {/* Vertical line */}
      <div className="absolute left-[11px] top-0 bottom-0 w-px bg-border-primary" />
      <div className="space-y-4">
        {items.map((item, i) => (
          <div
            key={item.id}
            className="relative pl-8 animate-slide-up"
            style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
          >
            {/* Dot */}
            <div className={cn(
              'absolute left-0 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center',
              timelineVariants[item.variant || 'default']
            )}>
              {item.icon && <span className="text-xs">{item.icon}</span>}
            </div>
            {/* Content */}
            <div
              className={cn(
                'bg-surface-primary border border-border-primary rounded-lg p-3',
                item.onClick && 'cursor-pointer hover:bg-surface-hover transition-colors'
              )}
              onClick={item.onClick}
            >
              <div className="flex items-center justify-between mb-0.5">
                <h4 className="text-sm font-medium text-text-primary">{item.title}</h4>
                <span className="text-xs font-mono text-text-tertiary">{item.date}</span>
              </div>
              {item.description && (
                <p className="text-xs text-text-secondary">{item.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
