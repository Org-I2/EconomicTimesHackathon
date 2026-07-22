/** Audit Log Page (SRD FR-13) */
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Filter } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Table, TableHead, TableBody, TableRow, TableCell, TableHeader, Pagination } from '@/components/ui/Table';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { auditApi } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { formatDateTime } from '@/utils';
import { ErrorState } from '@/components/ui/ErrorState';

const EVENT_TYPE_OPTIONS = [
  { value: '', label: 'All Events' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'UPLOAD', label: 'Upload' },
  { value: 'INDEX', label: 'Index' },
  { value: 'SEARCH', label: 'Search' },
  { value: 'CHAT', label: 'Chat' },
  { value: 'DELETE', label: 'Delete' },
];

export default function AuditLogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = 50;
  const eventType = searchParams.get('event_type') || '';
  const userId = searchParams.get('user_id') || '';

  const queryParams = {
    page,
    page_size: pageSize,
    ...(eventType && { event_type: eventType }),
    ...(userId && { user_id: userId }),
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.audit.history(queryParams),
    queryFn: () => auditApi.history(queryParams),
    retry: false,
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

  return (
    <div>
      <PageHeader
        title="Audit Log"
        description="Immutable record of system events per SRD compliance requirements"
      />

      <div className="flex flex-wrap gap-3 mb-4">
        <Select
          options={EVENT_TYPE_OPTIONS.slice(1)}
          placeholder="All Events"
          value={eventType}
          onChange={(e) => updateParam('event_type', e.target.value)}
          selectSize="sm"
        />
        <Input
          placeholder="Filter by user..."
          value={userId}
          onChange={(e) => updateParam('user_id', e.target.value)}
          className="w-48 !h-8 !text-xs"
        />
      </div>

      <Card padding="none">
        {isLoading ? (
          <TableSkeleton rows={15} cols={5} />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : data?.items?.length ? (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Timestamp</TableHeader>
                  <TableHeader>Event Type</TableHeader>
                  <TableHeader>User</TableHeader>
                  <TableHeader>Resource ID</TableHeader>
                  <TableHeader>Details</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.items.map((entry) => (
                  <TableRow key={entry.event_id}>
                    <TableCell mono className="text-text-secondary">
                      {formatDateTime(entry.timestamp)}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-text-primary">{entry.event_type}</span>
                    </TableCell>
                    <TableCell>{entry.user_id}</TableCell>
                    <TableCell mono>{entry.resource_id || '—'}</TableCell>
                    <TableCell>
                      <pre className="text-[10px] font-mono text-text-tertiary bg-surface-secondary p-1.5 rounded max-w-sm overflow-x-auto">
                        {JSON.stringify(entry.details)}
                      </pre>
                    </TableCell>
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
          </>
        ) : (
          <div className="p-8 text-center text-text-tertiary">
            <ClipboardList className="h-8 w-8 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No audit logs found matching criteria.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
