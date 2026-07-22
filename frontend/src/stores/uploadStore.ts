/** Upload store — manages upload queue with per-file status and metadata (Zustand) */
import { create } from 'zustand';
import type { UploadMetadata, DocumentType } from '@/types/api';

export type UploadFileStatus = 'queued' | 'uploading' | 'uploaded' | 'failed';

export interface UploadFileEntry {
  id: string;
  file: File;
  status: UploadFileStatus;
  progress: number;
  error?: string;
  metadata: UploadMetadata;
  documentId?: string;
}

interface UploadState {
  files: UploadFileEntry[];
  bulkMetadata: UploadMetadata;

  /** Add files to the upload queue */
  addFiles: (files: File[]) => void;

  /** Remove a file from the queue */
  removeFile: (id: string) => void;

  /** Update file status */
  updateFileStatus: (id: string, status: UploadFileStatus, progress?: number, error?: string, documentId?: string) => void;

  /** Update per-file metadata */
  updateFileMetadata: (id: string, metadata: Partial<UploadMetadata>) => void;

  /** Set bulk metadata (applied to all files) */
  setBulkMetadata: (metadata: Partial<UploadMetadata>) => void;

  /** Apply bulk metadata to all queued files */
  applyBulkMetadata: () => void;

  /** Clear completed/failed uploads */
  clearCompleted: () => void;

  /** Clear all files */
  clearAll: () => void;
}

let fileCounter = 0;

export const useUploadStore = create<UploadState>((set, get) => ({
  files: [],
  bulkMetadata: {},

  addFiles: (newFiles) => {
    const entries: UploadFileEntry[] = newFiles.map((file) => ({
      id: `upload-${++fileCounter}`,
      file,
      status: 'queued' as const,
      progress: 0,
      metadata: { ...get().bulkMetadata },
    }));
    set((s) => ({ files: [...s.files, ...entries] }));
  },

  removeFile: (id) =>
    set((s) => ({ files: s.files.filter((f) => f.id !== id) })),

  updateFileStatus: (id, status, progress, error, documentId) =>
    set((s) => ({
      files: s.files.map((f) =>
        f.id === id
          ? { ...f, status, progress: progress ?? f.progress, error, documentId: documentId ?? f.documentId }
          : f
      ),
    })),

  updateFileMetadata: (id, metadata) =>
    set((s) => ({
      files: s.files.map((f) =>
        f.id === id ? { ...f, metadata: { ...f.metadata, ...metadata } } : f
      ),
    })),

  setBulkMetadata: (metadata) =>
    set((s) => ({ bulkMetadata: { ...s.bulkMetadata, ...metadata } })),

  applyBulkMetadata: () => {
    const { bulkMetadata } = get();
    set((s) => ({
      files: s.files.map((f) =>
        f.status === 'queued'
          ? { ...f, metadata: { ...f.metadata, ...bulkMetadata } }
          : f
      ),
    }));
  },

  clearCompleted: () =>
    set((s) => ({
      files: s.files.filter((f) => f.status !== 'uploaded' && f.status !== 'failed'),
    })),

  clearAll: () => set({ files: [], bulkMetadata: {} }),
}));
