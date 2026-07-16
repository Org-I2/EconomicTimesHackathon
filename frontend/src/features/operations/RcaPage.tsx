/** Root Cause Analysis Page (SRD FR-8) */
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AlertTriangle, Sparkles, Activity, FileText } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardTitle, CardDescription } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { LoadingExperience } from '@/components/ui/LoadingExperience';
import { ErrorState } from '@/components/ui/ErrorState';
import { rcaApi } from '@/lib/api';
import type { RcaAnalyzeResponse } from '@/types/api';

export default function RcaPage() {
  const [description, setDescription] = useState('');
  const [results, setResults] = useState<RcaAnalyzeResponse | null>(null);

  const mutation = useMutation({
    mutationFn: () => rcaApi.analyze({ incident_description: description }),
    onSuccess: (data) => setResults(data),
  });

  const handleAnalyze = () => {
    if (description.trim()) {
      mutation.mutate();
    }
  };

  return (
    <div>
      <PageHeader
        title="Root Cause Analysis"
        description="AI-assisted incident investigation comparing symptoms against historical failures"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Input */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardTitle className="text-base mb-2">Incident Description</CardTitle>
            <CardDescription className="mb-4">
              Describe the incident, symptoms, and any immediate observations. The AI will cross-reference this with past incidents.
            </CardDescription>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Pump P-204 experienced high vibration followed by a seal leak during startup sequence..."
              className="h-40 mb-4"
            />
            <Button
              className="w-full"
              onClick={handleAnalyze}
              loading={mutation.isPending}
              disabled={!description.trim()}
              icon={<Sparkles className="h-4 w-4" />}
            >
              Analyze Incident
            </Button>
          </Card>

          <Card className="bg-surface-secondary/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-text-tertiary mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-text-primary">How it works</h4>
                <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                  The RCA engine converts your description into a semantic embedding and searches the knowledge graph for similar historical incidents, manuals, and SOPs.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-2 relative">
          <LoadingExperience 
            isLoading={mutation.isPending} 
            variant="search"
            messages={['Cross-referencing historical incidents...', 'Correlating symptoms...', 'Generating root cause analysis...']}
          />
          {mutation.isPending ? (
            <div className="space-y-4 min-h-[300px]">
              <Skeleton className="h-24" variant="rectangular" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-48" variant="rectangular" />
                <Skeleton className="h-48" variant="rectangular" />
              </div>
            </div>
          ) : mutation.isError ? (
            <ErrorState 
              title="Analysis Failed" 
              message="The RCA engine could not be reached or an error occurred during analysis."
              onRetry={handleAnalyze} 
            />
          ) : results ? (
            <div className="space-y-4 animate-slide-up">
              <Card className="border-accent-500/30">
                <CardTitle className="text-base mb-3 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-accent-500" />
                  Primary Root Cause Analysis
                </CardTitle>
                <div className="prose prose-sm prose-zinc dark:prose-invert max-w-none">
                  {results.analysis.split('\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardTitle className="text-sm mb-3">Recommended Actions</CardTitle>
                  <ul className="space-y-2">
                    {results.recommended_actions.map((action, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-500 mt-1.5 shrink-0" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                <Card>
                  <CardTitle className="text-sm mb-3 flex items-center justify-between">
                    <span>Similar Historical Incidents</span>
                    <Badge variant="default" className="font-mono">{results.similar_incidents.length}</Badge>
                  </CardTitle>
                  {results.similar_incidents.length > 0 ? (
                    <ul className="space-y-3">
                      {results.similar_incidents.map((inc) => (
                        <li key={inc.document_id} className="text-sm">
                          <div className="flex items-center gap-2 font-medium text-text-primary mb-0.5">
                            <FileText className="h-3.5 w-3.5 text-text-tertiary" />
                            {inc.filename}
                          </div>
                          <p className="text-xs text-text-tertiary line-clamp-2">{inc.snippet}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-text-tertiary text-center py-4">No highly similar incidents found.</p>
                  )}
                </Card>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<AlertTriangle className="h-8 w-8" />}
              title="Awaiting Input"
              description="Enter an incident description on the left to begin the root cause analysis."
            />
          )}
        </div>
      </div>
    </div>
  );
}
