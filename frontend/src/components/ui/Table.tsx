/** Table — design-system data table with sort headers */
import React from 'react';
import { cn } from '@/utils';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

// ======================== Table Components ========================

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full text-sm', className)}>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <thead className={cn('border-b border-border-primary', className)}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <tbody className={cn('divide-y divide-border-secondary', className)}>{children}</tbody>;
}

export function TableRow({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <tr
      className={cn(
        'transition-colors duration-fast',
        onClick && 'cursor-pointer hover:bg-surface-hover',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function TableCell({ children, className, mono }: { children: React.ReactNode; className?: string; mono?: boolean }) {
  return (
    <td className={cn('px-4 py-3 text-text-primary', mono && 'font-mono text-xs', className)}>
      {children}
    </td>
  );
}

interface SortableHeaderProps {
  children: React.ReactNode;
  sortKey: string;
  currentSort?: string;
  currentOrder?: 'asc' | 'desc';
  onSort?: (key: string, order: 'asc' | 'desc') => void;
  className?: string;
}

export function SortableHeader({ children, sortKey, currentSort, currentOrder, onSort, className }: SortableHeaderProps) {
  const isActive = currentSort === sortKey;
  const handleClick = () => {
    if (!onSort) return;
    const nextOrder = isActive && currentOrder === 'asc' ? 'desc' : 'asc';
    onSort(sortKey, nextOrder);
  };

  return (
    <th
      className={cn(
        'px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider',
        onSort && 'cursor-pointer select-none hover:text-text-secondary',
        className
      )}
      onClick={handleClick}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {onSort && (
          <span className="text-text-tertiary">
            {!isActive && <ChevronsUpDown className="h-3.5 w-3.5" />}
            {isActive && currentOrder === 'asc' && <ChevronUp className="h-3.5 w-3.5 text-accent-500" />}
            {isActive && currentOrder === 'desc' && <ChevronDown className="h-3.5 w-3.5 text-accent-500" />}
          </span>
        )}
      </span>
    </th>
  );
}

export function TableHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={cn('px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider', className)}>
      {children}
    </th>
  );
}

// ======================== Pagination ========================

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, pageSize, onPageChange }: PaginationProps) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border-primary">
      <p className="text-xs text-text-tertiary">
        Showing <span className="font-medium text-text-secondary">{start}</span> to{' '}
        <span className="font-medium text-text-secondary">{end}</span> of{' '}
        <span className="font-medium text-text-secondary">{total}</span> results
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 text-xs font-medium rounded-md border border-border-primary text-text-secondary hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        {/* ASSUMPTION: Show max 5 page numbers centered on current page */}
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum: number;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (page <= 3) {
            pageNum = i + 1;
          } else if (page >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = page - 2 + i;
          }
          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={cn(
                'w-8 h-8 text-xs font-medium rounded-md transition-colors',
                page === pageNum
                  ? 'bg-accent-500 text-text-on-accent'
                  : 'text-text-secondary hover:bg-surface-hover'
              )}
            >
              {pageNum}
            </button>
          );
        })}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 text-xs font-medium rounded-md border border-border-primary text-text-secondary hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
