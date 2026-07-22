/** Upload Page — document ingestion (SRD FR-1, 7.3) */
import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Upload, X, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge, StatusPill } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/Progress';
import { documentsApi } from '@/lib/api';
import { useUploadStore, type UploadFileEntry } from '@/stores/uploadStore';
import { LoadingExperience } from '@/components/ui/LoadingExperience';
import { queryKeys } from '@/lib/queryClient';
import { useQueryClient } from '@tanstack/react-query';
import { cn, isAllowedExtension, isFileTooLarge, formatBytes, ALLOWED_EXTENSIONS, MAX_FILE_SIZE, MAX_FILES_PER_REQUEST } from '@/utils';
import toast from 'react-hot-toast';

const DOCUMENT_TYPE_OPTIONS = [
  { value: '', label: 'Select type...' },
  { value: 'SOP', label: 'SOP' },
  { value: 'P&ID', label: 'P&ID' },
  { value: 'Inspection Report', label: 'Inspection Report' },
  { value: 'Manual', label: 'Manual' },
  { value: 'Incident Report', label: 'Incident Report' },
  { value: 'Work Order', label: 'Work Order' },
  { value: 'Email', label: 'Email' },
  { value: 'Compliance', label: 'Compliance' },
];

/** Upload page with drag-and-drop, per-file metadata, and progress */
export default function UploadPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { files, addFiles, removeFile, updateFileStatus, updateFileMetadata, clearCompleted, clearAll } = useUploadStore();

  const [isDragging, setIsDragging] = React.useState(false);

  // Handle file selection
  const handleFiles = useCallback(
    (fileList: FileList | File[]) => {
      const newFiles = Array.from(fileList);
      const validFiles: File[] = [];
      const errors: string[] = [];

      newFiles.forEach((file) => {
        if (!isAllowedExtension(file.name)) {
          errors.push(`${file.name}: unsupported file type`);
        } else if (isFileTooLarge(file.size)) {
          errors.push(`${file.name}: exceeds ${formatBytes(MAX_FILE_SIZE)} limit`);
        } else {
          validFiles.push(file);
        }
      });

      if (errors.length > 0) {
        errors.forEach((err) => toast.error(err));
      }

      if (validFiles.length > MAX_FILES_PER_REQUEST) {
        toast.error(`Maximum ${MAX_FILES_PER_REQUEST} files per upload`);
        return;
      }

      if (validFiles.length > 0) {
        addFiles(validFiles);
      }
    },
    [addFiles]
  );

  // Drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      const queuedFiles = files.filter((f) => f.status === 'queued');
      if (queuedFiles.length === 0) return;

      for (const entry of queuedFiles) {
        updateFileStatus(entry.id, 'uploading', 10);
        try {
          const result = await documentsApi.upload(entry.file, (entry.metadata.document_type as string) || 'Manual');
          updateFileStatus(entry.id, 'uploaded', 100, undefined, result.document_id);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Upload failed';
          updateFileStatus(entry.id, 'failed', 0, message);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
      toast.success('Upload complete — documents queued for processing');
    },
  });

  const queuedCount = files.filter((f) => f.status === 'queued').length;
  const hasCompleted = files.some((f) => f.status === 'uploaded' || f.status === 'failed');

  return (
    <div className="relative min-h-[300px]">
      <LoadingExperience 
        isLoading={uploadMutation.isPending} 
        variant="upload"
        messages={[
          'Encrypting and transferring documents...',
          'Validating metadata schemas...',
          'Queuing for industrial OCR pipeline...'
        ]}
      />
      
      <PageHeader
        title="Upload Documents"
        description="Ingest documents into the knowledge base for OCR, indexing, and AI search"
      />

      {/* Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-normal cursor-pointer',
          'hover:border-accent-500/50 hover:bg-accent-500/5',
          isDragging
            ? 'border-accent-500 bg-accent-500/10 scale-[1.01]'
            : 'border-border-primary bg-surface-primary'
        )}
        onClick={() => document.getElementById('file-input')?.click()}
        role="button"
        tabIndex={0}
        aria-label="Drop files here or click to select"
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') document.getElementById('file-input')?.click(); }}
      >
        <input
          id="file-input"
          type="file"
          multiple
          accept={ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(',')}
          className="hidden"
          onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ''; }}
        />
        <div className="flex flex-col items-center gap-3">
          <div className={cn(
            'w-14 h-14 rounded-2xl flex items-center justify-center transition-colors',
            isDragging ? 'bg-accent-500 text-text-on-accent' : 'bg-surface-secondary text-text-tertiary'
          )}>
            <Upload className="h-6 w-6" />
          </div>
          <div>
            <p className="text-base font-medium text-text-primary">
              {isDragging ? 'Drop files here' : 'Drag & drop files or click to browse'}
            </p>
            <p className="text-sm text-text-tertiary mt-1">
              PDF, DOCX, XLSX, CSV, PNG, JPG, TXT — up to {formatBytes(MAX_FILE_SIZE)} per file
            </p>
          </div>
        </div>
      </div>

      {/* File Queue */}
      {files.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-text-primary">
              Files ({files.length})
            </h3>
            <div className="flex gap-2">
              {hasCompleted && (
                <Button variant="ghost" size="sm" onClick={clearCompleted}>
                  Clear Completed
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={clearAll}>
                Clear All
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {files.map((entry) => (
              <FileQueueItem
                key={entry.id}
                entry={entry}
                onRemove={() => removeFile(entry.id)}
                onUpdateMetadata={(metadata) => updateFileMetadata(entry.id, metadata)}
              />
            ))}
          </div>

          {/* Upload Button */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border-primary">
            <p className="text-sm text-text-secondary">
              {queuedCount} file{queuedCount !== 1 ? 's' : ''} ready to upload
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => navigate('/documents')}>
                View Documents
              </Button>
              <Button
                onClick={() => uploadMutation.mutate()}
                loading={uploadMutation.isPending}
                disabled={queuedCount === 0}
                icon={<Upload className="h-4 w-4" />}
              >
                Upload {queuedCount > 0 ? `(${queuedCount})` : ''}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ======================== File Queue Item ========================

interface FileQueueItemProps {
  entry: UploadFileEntry;
  onRemove: () => void;
  onUpdateMetadata: (metadata: Record<string, unknown>) => void;
}

function FileQueueItem({ entry, onRemove, onUpdateMetadata }: FileQueueItemProps) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        {/* File icon and info */}
        <div className="w-8 h-8 rounded-lg bg-surface-secondary flex items-center justify-center shrink-0">
          {entry.status === 'uploading' ? (
            <Loader2 className="h-4 w-4 text-accent-500 animate-spin" />
          ) : entry.status === 'uploaded' ? (
            <CheckCircle className="h-4 w-4 text-success" />
          ) : entry.status === 'failed' ? (
            <AlertCircle className="h-4 w-4 text-danger" />
          ) : (
            <FileText className="h-4 w-4 text-text-tertiary" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">{entry.file.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-text-tertiary font-mono">{formatBytes(entry.file.size)}</span>
            {entry.metadata.document_type && (
              <Badge variant="default" className="text-[10px]">{entry.metadata.document_type}</Badge>
            )}
            {entry.metadata.equipment_tag && (
              <Badge variant="accent" className="text-[10px] font-mono">{entry.metadata.equipment_tag}</Badge>
            )}
          </div>
        </div>

        {/* Status / Actions */}
        {entry.status === 'queued' && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
              Metadata
            </Button>
            <button
              onClick={onRemove}
              className="p-1.5 rounded-md text-text-tertiary hover:text-danger hover:bg-danger-muted transition-colors"
              aria-label={`Remove ${entry.file.name}`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {entry.status === 'uploading' && (
          <span className="text-xs text-accent-500 font-medium">Uploading...</span>
        )}

        {entry.status === 'uploaded' && (
          <Badge variant="success" dot>Uploaded</Badge>
        )}

        {entry.status === 'failed' && (
          <div className="flex items-center gap-2">
            <Badge variant="danger" dot>Failed</Badge>
            <button onClick={onRemove} className="p-1 text-text-tertiary hover:text-danger" aria-label="Remove">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {entry.status === 'uploading' && (
        <ProgressBar value={entry.progress} className="px-3 pb-2" />
      )}

      {/* Error message */}
      {entry.error && (
        <div className="px-3 pb-3">
          <p className="text-xs text-danger">{entry.error}</p>
        </div>
      )}

      {/* Metadata panel (expanded) */}
      {expanded && entry.status === 'queued' && (
        <div className="border-t border-border-secondary p-3 bg-surface-secondary/50 animate-slide-up">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Document Type"
              options={DOCUMENT_TYPE_OPTIONS.slice(1)}
              placeholder="Select type..."
              value={entry.metadata.document_type as string || ''}
              onChange={(e) => onUpdateMetadata({ document_type: e.target.value || null })}
              selectSize="sm"
            />
            <Input
              label="Equipment Tag"
              placeholder="e.g., P-204"
              mono
              hint="Pattern: A-Z followed by digits (e.g., P-204, V-101)"
              value={entry.metadata.equipment_tag || ''}
              onChange={(e) => onUpdateMetadata({ equipment_tag: e.target.value || undefined })}
            />
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={entry.metadata.is_compliance || false}
                  onChange={(e) => onUpdateMetadata({ is_compliance: e.target.checked })}
                  className="rounded border-border-primary text-accent-500 focus:ring-accent-500"
                />
                <span className="text-sm text-text-secondary">Compliance document</span>
              </label>
            </div>
            {entry.metadata.is_compliance && (
              <Input
                label="Expiry Date"
                type="date"
                value={entry.metadata.expiry_date || ''}
                onChange={(e) => onUpdateMetadata({ expiry_date: e.target.value || null })}
              />
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
