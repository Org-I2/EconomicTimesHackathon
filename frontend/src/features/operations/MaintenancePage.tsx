/** Maintenance Page — equipment timeline and predictive insight (SRD FR-7) */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Wrench, Search, Clock, FileText, AlertTriangle, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { LoadingExperience } from '@/components/ui/LoadingExperience';
import { Timeline } from '@/components/ui/Progress';
import { maintenanceApi } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { formatDate } from '@/utils';
import type { MaintenanceRecommendation } from '@/types/api';
import { ErrorState } from '@/components/ui/ErrorState';

export default function MaintenancePage() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [activeTag, setActiveTag] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.maintenance.recommendations(activeTag),
    queryFn: () => maintenanceApi.getRecommendations(activeTag),
    enabled: !!activeTag,
    retry: false,
  });

  const handleSearch = () => {
    if (searchInput.trim()) {
      setActiveTag(searchInput.trim().toUpperCase());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div>
      <PageHeader
        title="Maintenance Intelligence"
        description="Synthesize past work orders and manuals to estimate next maintenance dates"
      />

      <div className="max-w-4xl mx-auto">
        <Card className="mb-6 bg-surface-secondary/50 border-border-primary/50">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter equipment tag (e.g., P-204, V-101)..."
                className="w-full h-10 pl-10 pr-4 rounded-md border border-border-primary bg-surface-primary text-sm font-mono text-text-primary placeholder:text-text-tertiary placeholder:font-sans focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30 outline-none transition-all"
              />
            </div>
            <Button onClick={handleSearch} className="w-full sm:w-auto">
              Analyze Equipment
            </Button>
          </div>
        </Card>

        {!activeTag ? (
          <EmptyState
            icon={<Wrench className="h-8 w-8" />}
            title="Search for equipment"
            description="Enter an equipment tag to generate a maintenance timeline and AI-powered recommendations based on historical data."
          />
        ) : isLoading ? (
          <div className="relative space-y-6 min-h-[400px]">
            <LoadingExperience 
              isLoading={isLoading} 
              variant="graph"
              messages={['Loading maintenance intelligence...', 'Synthesizing past work orders...', 'Correlating historical breakdowns...']}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-40" variant="rectangular" />
              <Skeleton className="h-40" variant="rectangular" />
            </div>
            <Skeleton className="h-96" variant="rectangular" />
          </div>
        ) : error ? (
          <ErrorState onRetry={() => {}} />
        ) : !data ? (
          <EmptyState
            icon={<AlertTriangle className="h-8 w-8 text-warning" />}
            title="No data found"
            description={`No maintenance records or manuals found for equipment tag "${activeTag}".`}
          />
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-accent-500/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Clock className="h-16 w-16" />
                </div>
                <CardTitle className="text-sm text-text-secondary mb-1">Estimated Next Maintenance</CardTitle>
                <p className="text-2xl font-bold text-text-primary font-mono mb-2">
                  {formatDate(data.estimated_next_maintenance)}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="accent">Confidence: {(data.confidence_score * 100).toFixed(0)}%</Badge>
                </div>
              </Card>

              <Card>
                <CardTitle className="text-sm text-text-secondary mb-2">Reasoning</CardTitle>
                <p className="text-sm text-text-primary leading-relaxed">
                  {data.reasoning}
                </p>
              </Card>
            </div>

            {/* Timeline */}
            <Card>
              <CardTitle className="mb-6 flex items-center gap-2">
                <FileText className="h-5 w-5 text-text-tertiary" />
                Historical Evidence
              </CardTitle>
              <Timeline
                items={data.supporting_documents.map((doc, i) => ({
                  id: `${doc.document_id}-${i}`,
                  title: doc.filename,
                  date: formatDate(doc.date),
                  description: doc.snippet,
                  variant: 'default',
                  icon: <FileText className="h-3 w-3" />,
                  onClick: () => navigate(`/documents/${doc.document_id}`),
                }))}
              />
              {data.supporting_documents.length === 0 && (
                <p className="text-sm text-text-tertiary text-center py-4">No historical records found.</p>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
