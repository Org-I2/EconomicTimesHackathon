/** Document Viewer Page — split-view document display (SRD 7.6) */
import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileText, AlertTriangle, ExternalLink, Tag } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge, StatusPill } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { documentsApi } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { formatDate, formatDateTime, getDocTypeColor, cn } from '@/utils';

/** Document Viewer — split view with metadata panel and citation-jump support */
export default function DocumentViewerPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const targetPage = searchParams.get('page');
  const targetChunk = searchParams.get('chunk');

  const { data: doc, isLoading, error } = useQuery({
    queryKey: queryKeys.documents.detail(id!),
    queryFn: () => documentsApi.getById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2" variant="rectangular" />
          <Skeleton className="h-64" variant="rectangular" />
        </div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <EmptyState
        icon={<FileText className="h-8 w-8" />}
        title="Document not found"
        description="The requested document could not be found. It may have been deleted."
      />
    );
  }

  return (
    <div>
      <PageHeader
        title={doc.filename}
        description={`Document ID: ${doc.document_id}`}
        actions={<StatusPill status={doc.status} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Document Render Area */}
        <div className="lg:col-span-2">
          <Card className="min-h-[500px]">
            <div className="flex items-center justify-center h-full min-h-[400px]">
              {/* ASSUMPTION: Document preview renders extracted text as fallback since we don't
                  have a PDF rendering library — the SRD specifies "PDF page image / extracted text
                  fallback for non-PDF". For the hackathon frontend, we show a placeholder. */}
              <div className="text-center space-y-4">
                <div className="w-20 h-20 rounded-2xl bg-surface-secondary border border-border-primary flex items-center justify-center mx-auto">
                  <FileText className="h-10 w-10 text-text-tertiary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">{doc.filename}</h3>
                  <p className="text-sm text-text-secondary mt-1">
                    {doc.page_count ? `${doc.page_count} pages` : 'Document preview'}
                  </p>
                  {targetPage && (
                    <Badge variant="accent" className="mt-2">
                      Jump to page {targetPage}
                      {targetChunk && ` • chunk ${targetChunk.slice(0, 8)}...`}
                    </Badge>
                  )}
                </div>
                {doc.status === 'EXTRACTION_FAILED' && (
                  <div className="flex items-center gap-2 text-warning justify-center">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">Text extraction failed for this document</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Metadata Panel */}
        <div className="space-y-4">
          {/* Document Info */}
          <Card>
            <CardTitle className="text-base mb-4">Document Metadata</CardTitle>
            <dl className="space-y-3">
              <MetadataRow label="Filename" value={doc.filename} />
              <MetadataRow label="Document ID" value={doc.document_id} mono />
              <MetadataRow label="Type">
                {doc.document_type ? (
                  <Badge className={getDocTypeColor(doc.document_type)}>{doc.document_type}</Badge>
                ) : (
                  <span className="text-text-tertiary">Not specified</span>
                )}
              </MetadataRow>
              <MetadataRow label="Status">
                <StatusPill status={doc.status} />
              </MetadataRow>
              <MetadataRow label="Equipment Tag">
                {doc.equipment_tag ? (
                  <span className="font-mono text-accent-500 font-medium">{doc.equipment_tag}</span>
                ) : (
                  <span className="text-text-tertiary">—</span>
                )}
              </MetadataRow>
              <MetadataRow label="Pages" value={doc.page_count?.toString() || '—'} />
              <MetadataRow label="Chunks" value={doc.chunk_count?.toString() || '—'} mono />
              <MetadataRow label="Uploaded" value={formatDateTime(doc.created_at)} />
              <MetadataRow label="Updated" value={formatDateTime(doc.updated_at)} />
            </dl>
          </Card>

          {/* Compliance Info */}
          <Card>
            <CardTitle className="text-base mb-4">Compliance Status</CardTitle>
            <dl className="space-y-3">
              <MetadataRow label="Compliance Document">
                <Badge variant={doc.is_compliance ? 'warning' : 'default'} dot>
                  {doc.is_compliance ? 'Yes' : 'No'}
                </Badge>
              </MetadataRow>
              {doc.is_compliance && (
                <MetadataRow label="Expiry Date">
                  {doc.expiry_date ? (
                    <span className={cn(
                      'font-mono text-sm',
                      new Date(doc.expiry_date) < new Date() ? 'text-danger' : 'text-text-primary'
                    )}>
                      {formatDate(doc.expiry_date)}
                      {new Date(doc.expiry_date) < new Date() && (
                        <Badge variant="danger" className="ml-2">Expired</Badge>
                      )}
                    </span>
                  ) : (
                    <span className="text-text-tertiary">Not set</span>
                  )}
                </MetadataRow>
              )}
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetadataRow({ label, value, mono, children }: { label: string; value?: string; mono?: boolean; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1">
      <dt className="text-xs font-medium text-text-tertiary uppercase tracking-wider w-28 shrink-0 pt-0.5">{label}</dt>
      <dd className={cn('text-sm text-text-primary break-all', mono && 'font-mono text-xs')}>
        {children || value || '—'}
      </dd>
    </div>
  );
}
