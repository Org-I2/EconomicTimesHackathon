/** Document Browser Page — paginated, filterable catalog (SRD FR-12, 7.5) */
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Trash2, FolderOpen, LayoutGrid, List } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge, StatusPill } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/Modal';
import { Table, TableHead, TableBody, TableRow, TableCell, SortableHeader, TableHeader, Pagination } from '@/components/ui/Table';
import { CardSkeleton, TableSkeleton } from '@/components/ui/Skeleton';
import { documentsApi } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { cn, formatDate, getDocTypeEdgeClass, getDocTypeColor, formatBytes } from '@/utils';
import toast from 'react-hot-toast';
import { ErrorState } from '@/components/ui/ErrorState';

const DOC_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'SOP', label: 'SOP' },
  { value: 'P&ID', label: 'P&ID' },
  { value: 'Inspection Report', label: 'Inspection Report' },
  { value: 'Manual', label: 'Manual' },
  { value: 'Incident Report', label: 'Incident Report' },
  { value: 'Work Order', label: 'Work Order' },
  { value: 'Email', label: 'Email' },
  { value: 'Compliance', label: 'Compliance' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'UPLOADED', label: 'Uploaded' },
  { value: 'EXTRACTED', label: 'Extracted' },
  { value: 'EXTRACTION_FAILED', label: 'Failed' },
  { value: 'INDEXED', label: 'Indexed' },
];

/** Document Browser with filters, sorting, and pagination */
export default function DocumentBrowserPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = React.useState<'table' | 'card'>('table');
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name: string } | null>(null);

  // Read filters from URL
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = 20;
  const sortBy = (searchParams.get('sort_by') || 'created_at') as 'created_at' | 'filename';
  const sortOrder = (searchParams.get('sort_order') || 'desc') as 'asc' | 'desc';
  const docType = searchParams.get('document_type') || '';
  const status = searchParams.get('status') || '';
  const equipTag = searchParams.get('equipment_tag') || '';

  const queryParams = {
    page,
    page_size: pageSize,
    sort_by: sortBy,
    sort_order: sortOrder,
    ...(docType && { document_type: docType }),
    ...(status && { status }),
    ...(equipTag && { equipment_tag: equipTag }),
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.documents.list(queryParams),
    queryFn: () => documentsApi.list(queryParams),
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
      toast.success('Document deleted');
      setDeleteTarget(null);
    },
    onError: () => toast.error('Failed to delete document'),
  });

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== 'page') params.set('page', '1');
    setSearchParams(params);
  };

  const handleSort = (key: string, order: 'asc' | 'desc') => {
    const params = new URLSearchParams(searchParams);
    params.set('sort_by', key);
    params.set('sort_order', order);
    setSearchParams(params);
  };

  return (
    <div>
      <PageHeader
        title="Document Browser"
        description="Browse, filter, and manage all ingested documents"
        actions={
          <div className="flex items-center gap-1.5 bg-surface-secondary rounded-md p-0.5 border border-border-primary">
            <button
              onClick={() => setViewMode('table')}
              className={cn('p-1.5 rounded', viewMode === 'table' ? 'bg-surface-primary shadow-sm' : 'text-text-tertiary')}
              aria-label="Table view"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={cn('p-1.5 rounded', viewMode === 'card' ? 'bg-surface-primary shadow-sm' : 'text-text-tertiary')}
              aria-label="Card view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <Select
          options={DOC_TYPE_OPTIONS.slice(1)}
          placeholder="All Types"
          value={docType}
          onChange={(e) => updateParam('document_type', e.target.value)}
          selectSize="sm"
        />
        <Select
          options={STATUS_OPTIONS.slice(1)}
          placeholder="All Statuses"
          value={status}
          onChange={(e) => updateParam('status', e.target.value)}
          selectSize="sm"
        />
        <Input
          placeholder="Equipment tag..."
          mono
          value={equipTag}
          onChange={(e) => updateParam('equipment_tag', e.target.value)}
          className="w-36 !h-8 !text-xs"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        viewMode === 'table' ? (
          <Card padding="none"><TableSkeleton rows={8} cols={5} /></Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        )
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data?.items?.length ? (
        <EmptyState
          icon={<FolderOpen className="h-8 w-8" />}
          title="No documents found"
          description="No documents match your current filters. Try adjusting your search criteria or upload new documents."
          action={<Button onClick={() => navigate('/upload')}>Upload Documents</Button>}
        />
      ) : viewMode === 'table' ? (
        <Card padding="none">
          <Table>
            <TableHead>
              <TableRow>
                <SortableHeader sortKey="filename" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort}>
                  Document
                </SortableHeader>
                <TableHeader>Type</TableHeader>
                <TableHeader>Equipment</TableHeader>
                <TableHeader>Status</TableHeader>
                <SortableHeader sortKey="created_at" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort}>
                  Date
                </SortableHeader>
                {isAdmin && <TableHeader className="w-12">Actions</TableHeader>}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.items.map((doc) => (
                <TableRow key={doc.document_id} onClick={() => navigate(`/documents/${doc.document_id}`)}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={cn('w-0.5 h-8 rounded-full', getDocTypeEdgeClass(doc.document_type)?.replace('border-left: 3px solid ', '').includes('sop') ? 'bg-green-500' : 'bg-accent-500')} />
                      <FileText className="h-4 w-4 text-text-tertiary shrink-0" />
                      <span className="font-medium truncate max-w-xs">{doc.filename}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {doc.document_type ? (
                      <Badge className={getDocTypeColor(doc.document_type)}>{doc.document_type}</Badge>
                    ) : (
                      <span className="text-text-tertiary">—</span>
                    )}
                  </TableCell>
                  <TableCell mono>{doc.equipment_tag || '—'}</TableCell>
                  <TableCell><StatusPill status={doc.status} /></TableCell>
                  <TableCell>
                    <span className="text-text-secondary text-xs">{formatDate(doc.created_at)}</span>
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: doc.document_id, name: doc.filename }); }}
                        className="p-1.5 rounded-md text-text-tertiary hover:text-danger hover:bg-danger-muted transition-colors"
                        aria-label={`Delete ${doc.filename}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {data.total_pages > 1 && (
            <Pagination
              page={data.page}
              totalPages={data.total_pages}
              total={data.total}
              pageSize={data.page_size}
              onPageChange={(p) => updateParam('page', String(p))}
            />
          )}
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.items.map((doc) => (
              <Card
                key={doc.document_id}
                hover
                onClick={() => navigate(`/documents/${doc.document_id}`)}
                className={cn('relative', getDocTypeEdgeClass(doc.document_type))}
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-medium text-text-primary truncate pr-2">{doc.filename}</p>
                  <StatusPill status={doc.status} />
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {doc.document_type && <Badge className={getDocTypeColor(doc.document_type)}>{doc.document_type}</Badge>}
                  {doc.equipment_tag && <Badge variant="accent" className="font-mono">{doc.equipment_tag}</Badge>}
                </div>
                <p className="text-xs text-text-tertiary">{formatDate(doc.created_at)}</p>
              </Card>
            ))}
          </div>
          {data.total_pages > 1 && (
            <div className="mt-4">
              <Pagination
                page={data.page}
                totalPages={data.total_pages}
                total={data.total}
                pageSize={data.page_size}
                onPageChange={(p) => updateParam('page', String(p))}
              />
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Delete Document"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will remove all extracted text, chunks, and vector entries. This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
