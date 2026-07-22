import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Shield, AlertTriangle, CheckCircle, FileText, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHead, TableBody, TableRow, TableCell, TableHeader } from '@/components/ui/Table';
import { Skeleton } from '@/components/ui/Skeleton';
import { LoadingExperience } from '@/components/ui/LoadingExperience';
import { agentsApi } from '@/lib/api/agentsApi';
import type { ComplianceResponse } from '@/lib/api/agentsApi';
import { ErrorState } from '@/components/ui/ErrorState';

export default function CompliancePage() {
  const [regulation, setRegulation] = useState('');
  const [results, setResults] = useState<ComplianceResponse | null>(null);

  const mutation = useMutation({
    mutationFn: () => agentsApi.checkCompliance(regulation),
    onSuccess: (data) => setResults(data),
  });

  const handleCheck = () => {
    if (regulation.trim()) {
      mutation.mutate();
    }
  };

  return (
    <div>
      <PageHeader
        title="Compliance & Regulatory"
        description="Verify plant compliance against regulatory standards (e.g., Factory Act, OISD)"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Input */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardTitle className="text-base mb-2">Regulation Standard</CardTitle>
            <CardDescription className="mb-4">
              Enter the name of the regulation to map against indexed SOPs and inspection records.
            </CardDescription>
            <Input
              value={regulation}
              onChange={(e) => setRegulation(e.target.value)}
              placeholder="e.g., Factory Act"
              className="mb-4"
            />
            <Button
              className="w-full"
              onClick={handleCheck}
              loading={mutation.isPending}
              disabled={!regulation.trim()}
              icon={<Shield className="h-4 w-4" />}
            >
              Check Compliance
            </Button>
          </Card>
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-2 relative">
          <LoadingExperience 
            isLoading={mutation.isPending} 
            variant="search"
            messages={['Mapping regulation standards...', 'Searching SOPs and logs...', 'Analyzing compliance gaps...']}
          />
          {mutation.isPending ? (
            <div className="space-y-4 min-h-[300px]">
              <Skeleton className="h-24" variant="rectangular" />
              <Skeleton className="h-64" variant="rectangular" />
            </div>
          ) : mutation.isError ? (
            <ErrorState 
              title="Check Failed" 
              message="Could not evaluate compliance due to a server error."
              onRetry={handleCheck} 
            />
          ) : results ? (
            <div className="space-y-4 animate-slide-up">
              <Card className={results.status === 'COMPLIANT' ? 'border-success/30' : results.status === 'DEGRADED' ? 'border-warning/30' : 'border-danger/30'}>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base mb-1">Overall Status</CardTitle>
                    <p className="text-sm text-text-secondary">Assessed against {results.regulation}</p>
                  </div>
                  {results.status === 'COMPLIANT' && <CheckCircle className="h-8 w-8 text-success" />}
                  {results.status === 'DEGRADED' && <AlertTriangle className="h-8 w-8 text-warning" />}
                  {results.status === 'NON_COMPLIANT' && <AlertTriangle className="h-8 w-8 text-danger" />}
                </div>
                <div className="mt-4">
                  <Badge variant={results.status === 'COMPLIANT' ? 'success' : results.status === 'DEGRADED' ? 'warning' : 'danger'}>
                    {results.status.replace('_', ' ')}
                  </Badge>
                </div>
              </Card>

              {results.gaps.length > 0 && (
                <Card padding="none" className="overflow-hidden">
                  <div className="p-4 border-b border-border-primary">
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      Identified Gaps
                    </CardTitle>
                  </div>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeader>Section</TableHeader>
                        <TableHeader>Description</TableHeader>
                        <TableHeader>Severity</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {results.gaps.map((gap, i) => (
                        <TableRow key={i}>
                          <TableCell mono>{gap.section || '—'}</TableCell>
                          <TableCell className="text-sm">{gap.description}</TableCell>
                          <TableCell>
                            <Badge variant={gap.severity.toLowerCase() === 'high' ? 'danger' : gap.severity.toLowerCase() === 'medium' ? 'warning' : 'default'} dot>
                              {gap.severity}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border-secondary rounded-xl bg-surface-secondary/20">
              <Shield className="h-8 w-8 text-text-tertiary mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">Awaiting Input</h3>
              <p className="text-sm text-text-secondary max-w-sm">Enter a regulation standard on the left to begin the compliance check.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
