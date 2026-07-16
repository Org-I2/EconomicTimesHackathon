/** Utility functions shared across the application */

/** Combine CSS class names, filtering out falsy values */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/** Format a date string to a human-readable format */
export function formatDate(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options,
    });
  } catch {
    return dateStr;
  }
}

/** Format a date string to include time */
export function formatDateTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

/** Format a relative time (e.g., "2 hours ago") */
export function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateStr);
  } catch {
    return dateStr;
  }
}

/** Format bytes to human-readable size */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

/** Convert OCR confidence to a label */
export function confidenceToLabel(confidence: number): { label: string; color: 'success' | 'warning' | 'danger' } {
  if (confidence >= 0.8) return { label: 'High', color: 'success' };
  if (confidence >= 0.5) return { label: 'Medium', color: 'warning' };
  return { label: 'Low', color: 'danger' };
}

/** Highlight equipment tags in text using regex pattern from SRD */
export function highlightEquipmentTags(text: string): string {
  // ASSUMPTION: Equipment tag regex from SRD Section 10.4 — matches P-204, V-101, TK-3050 etc.
  return text.replace(
    /\b([A-Z]{1,4}-\d{2,5})\b/g,
    '<span class="font-mono text-accent-500 font-medium">$1</span>'
  );
}

/** Get the document type edge CSS class */
export function getDocTypeEdgeClass(docType: string | null): string {
  const typeMap: Record<string, string> = {
    'SOP': 'doc-edge-sop',
    'P&ID': 'doc-edge-pid',
    'Inspection Report': 'doc-edge-inspection',
    'Manual': 'doc-edge-manual',
    'Incident Report': 'doc-edge-incident',
    'Work Order': 'doc-edge-workorder',
    'Email': 'doc-edge-email',
    'Compliance': 'doc-edge-compliance',
  };
  return typeMap[docType ?? ''] || 'doc-edge-default';
}

/** Get the document type color for badges/indicators */
export function getDocTypeColor(docType: string | null): string {
  const colorMap: Record<string, string> = {
    'SOP': 'text-green-500 bg-green-500/10',
    'P&ID': 'text-cyan-500 bg-cyan-500/10',
    'Inspection Report': 'text-blue-500 bg-blue-500/10',
    'Manual': 'text-purple-500 bg-purple-500/10',
    'Incident Report': 'text-red-500 bg-red-500/10',
    'Work Order': 'text-teal-500 bg-teal-500/10',
    'Email': 'text-zinc-400 bg-zinc-400/10',
    'Compliance': 'text-amber-500 bg-amber-500/10',
  };
  return colorMap[docType ?? ''] || 'text-zinc-400 bg-zinc-400/10';
}

/** Get status color for document processing status */
export function getStatusColor(status: string): string {
  const statusMap: Record<string, string> = {
    'UPLOADED': 'text-info bg-info-muted',
    'EXTRACTED': 'text-warning bg-warning-muted',
    'EXTRACTION_FAILED': 'text-danger bg-danger-muted',
    'INDEXED': 'text-success bg-success-muted',
  };
  return statusMap[status] || 'text-text-tertiary bg-surface-secondary';
}

/** Generate a unique ID */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/** Debounce a value */
export function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}

/** Truncate text with ellipsis */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/** Get file extension from filename */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? '';
}

/** Check if file extension is allowed per SRD */
export const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'xlsx', 'csv', 'png', 'jpg', 'jpeg', 'txt'];
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB per SRD
export const MAX_FILES_PER_REQUEST = 20; // SRD Section 8.2

export function isAllowedExtension(filename: string): boolean {
  return ALLOWED_EXTENSIONS.includes(getFileExtension(filename));
}

export function isFileTooLarge(size: number): boolean {
  return size > MAX_FILE_SIZE;
}
