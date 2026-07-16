/** Processing Queue Page — live pipeline status (SRD 7.4) */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader, CheckCircle, FileText } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { StatusPill } from '@/components/ui/Badge';
import { StepProgress } from '@/components/ui/Progress';
import { EmptyState } from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { LoadingExperience } from '@/components/ui/LoadingExperience';
import { documentsApi } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { ErrorState } from '@/components/ui/ErrorState';

const PROCESSING_STEPS = ['Uploaded', 'Extracting', 'Indexing'];

function getStepIndex(status: string): number {
  switch (status) {
    case 'UPLOADED': return 0;
    case 'EXTRACTED': return 1;
    case 'EXTRACTION_FAILED': return -1;
    case 'INDEXED': return 3;
    default: return 0;
  }
}

/** Processing Queue — live-updating pipeline view */
export default function ProcessingQueuePage() {
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.documents.processing(),
    queryFn: () => documentsApi.list({ status: 'UPLOADED', page_size: 50 }),
    refetchInterval: 2500, // Poll every 2.5s per SRD spec
    retry: false,
  });

  const { data: extractedData } = useQuery({
    queryKey: queryKeys.documents.list({ status: 'EXTRACTED' }),
    queryFn: () => documentsApi.list({ status: 'EXTRACTED', page_size: 50 }),
    refetchInterval: 2500,
    retry: false,
  });

  const allProcessing = [
    ...(data?.items || []),
    ...(extractedData?.items || []),
  ];

  return (
    <div>
      <PageHeader
        title="Processing Queue"
        description="Document ingestion pipeline: Upload → OCR/Extract → Index"
      />

      <div className="relative min-h-[300px]">
        <LoadingExperience 
          isLoading={isLoading} 
          variant="ocr"
          messages={[
            'Extracting text using OCR...',
            'Analyzing document structure...',
            'Identifying industrial entities...',
            'Indexing semantic search...'
          ]}
        />
        {isLoading ? (
          <Card padding="none"><TableSkeleton rows={5} cols={3} /></Card>
        ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : allProcessing.length === 0 ? (
        <EmptyState
          icon={<CheckCircle className="h-8 w-8 text-success" />}
          title="All documents indexed"
          description="No documents are currently being processed. All ingested documents have completed OCR, extraction, and indexing."
        />
      ) : (
        <Card padding="none">
          <div className="divide-y divide-border-secondary">
            {allProcessing.map((doc, i) => (
              <div
                key={doc.document_id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 hover:bg-surface-hover cursor-pointer transition-colors animate-slide-up"
                style={{ animationDelay: `${i * 30}ms` }}
                onClick={() => navigate(`/documents/${doc.document_id}`)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-surface-secondary flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-text-tertiary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{doc.filename}</p>
                    <p className="text-xs text-text-tertiary font-mono">{doc.document_id.slice(0, 8)}...</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 sm:w-72">
                  <StepProgress
                    steps={PROCESSING_STEPS}
                    currentStep={getStepIndex(doc.status)}
                    className="flex-1"
                  />
                  <StatusPill status={doc.status} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      </div>
    </div>
  );
}
