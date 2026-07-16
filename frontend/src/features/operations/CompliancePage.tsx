/** Compliance Dashboard Page (SRD FR-10) */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Shield, AlertTriangle, CheckCircle, FileText, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardTitle } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHead, TableBody, TableRow, TableCell, TableHeader } from '@/components/ui/Table';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { LoadingExperience } from '@/components/ui/LoadingExperience';
import { complianceApi } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { formatDate } from '@/utils';
import { ErrorState } from '@/components/ui/ErrorState';

export default function CompliancePage() {
  const navigate = useNavigate();
  const [windowDays, setWindowDays] = useState(90);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.compliance.dashboard(windowDays),
    queryFn: () => complianceApi.dashboard(windowDays),
    retry: false,
  });

  return (
    <div>
      <PageHeader
        title="Compliance & Regulatory"
        description="Monitor expiring documents, certifications, and compliance reports"
        actions={
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">Warning Window:</span>
            <Select
              options={[
                { value: '30', label: '30 Days' },
                { value: '60', label: '60 Days' },
                { value: '90', label: '90 Days' },
                { value: '180', label: '6 Months' },
              ]}
              value={String(windowDays)}
              onChange={(e) => setWindowDays(Number(e.target.value))}
              selectSize="sm"
              className="w-32"
            />
          </div>
        }
      />

      {isLoading ? (
        <div className="relative space-y-6 min-h-[400px]">
          <LoadingExperience 
            isLoading={isLoading} 
            variant="ocr"
            messages={['Checking compliance records...', 'Scanning regulatory deadlines...', 'Verifying documentation status...']}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="h-28" />
            <Card className="h-28" />
            <Card className="h-28" />
          </div>
          <Card padding="none"><TableSkeleton rows={5} cols={4} /></Card>
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data ? (
        <div className="space-y-6 animate-fade-in">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-success/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-text-secondary">Valid Documents</span>
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <p className="text-3xl font-bold text-text-primary font-mono">{data.valid.length}</p>
            </Card>

            <Card className={data.expiring_soon.length > 0 ? 'border-warning/30' : ''}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-text-secondary">Expiring Soon ({windowDays}d)</span>
                <AlertTriangle className={data.expiring_soon.length > 0 ? 'h-5 w-5 text-warning' : 'h-5 w-5 text-text-tertiary'} />
              </div>
              <p className="text-3xl font-bold text-text-primary font-mono">{data.expiring_soon.length}</p>
            </Card>

            <Card className={data.expired.length > 0 ? 'border-danger/30' : ''}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-text-secondary">Expired Documents</span>
                <Shield className={data.expired.length > 0 ? 'h-5 w-5 text-danger' : 'h-5 w-5 text-text-tertiary'} />
              </div>
              <p className="text-3xl font-bold text-text-primary font-mono">{data.expired.length}</p>
            </Card>
          </div>

          {/* Action Required Table (Expired + Expiring Soon) */}
          <Card padding="none" className="overflow-hidden">
            <div className="p-4 border-b border-border-primary">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Attention Required
              </CardTitle>
            </div>
            
            {data.expired.length === 0 && data.expiring_soon.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle className="h-8 w-8 text-success mx-auto mb-3" />
                <p className="text-sm font-medium text-text-primary">All compliance documents are up to date</p>
                <p className="text-xs text-text-secondary mt-1">No documents expiring within the next {windowDays} days.</p>
              </div>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Document</TableHeader>
                    <TableHeader>Equipment</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Expiry Date</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* Expired First */}
                  {data.expired.map((doc) => (
                    <TableRow key={doc.document_id} onClick={() => navigate(`/documents/${doc.document_id}`)}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-text-tertiary shrink-0" />
                          <span className="font-medium text-text-primary truncate">{doc.filename}</span>
                        </div>
                      </TableCell>
                      <TableCell mono>{doc.equipment_tag || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="danger" dot>Expired</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-danger font-mono text-sm">{formatDate(doc.expiry_date!)}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* Expiring Soon */}
                  {data.expiring_soon.map((doc) => (
                    <TableRow key={doc.document_id} onClick={() => navigate(`/documents/${doc.document_id}`)}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-text-tertiary shrink-0" />
                          <span className="font-medium text-text-primary truncate">{doc.filename}</span>
                        </div>
                      </TableCell>
                      <TableCell mono>{doc.equipment_tag || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="warning" dot>Expiring Soon</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-warning font-mono text-sm">{formatDate(doc.expiry_date!)}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>
      ) : null}
    </div>
  );
}
