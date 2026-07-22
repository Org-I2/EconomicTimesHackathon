/** System Health Page (SRD 7.10) */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, CheckCircle, AlertTriangle, XCircle, Database, Server, Cpu } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { healthApi } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { cn } from '@/utils';
import { ErrorState } from '@/components/ui/ErrorState';

export default function SystemHealthPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.health.all,
    queryFn: () => healthApi.check(),
    refetchInterval: 10000, // poll every 10s
  });

  const getStatusIcon = (status?: string) => {
    if (status === 'ok') return <CheckCircle className="h-5 w-5 text-success" />;
    if (status === 'degraded') return <AlertTriangle className="h-5 w-5 text-warning" />;
    return <XCircle className="h-5 w-5 text-danger" />;
  };

  const getStatusColor = (status?: string) => {
    if (status === 'ok') return 'border-success/30';
    if (status === 'degraded') return 'border-warning/30';
    return 'border-danger/30';
  };

  return (
    <div>
      <PageHeader
        title="System Health"
        description="Real-time monitoring of backend services and infrastructure"
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="h-24 animate-pulse"><></></Card>
          ))}
        </div>
      ) : isError || !data ? (
        <ErrorState 
          title="API Unreachable"
          message="Cannot connect to the FastAPI backend at localhost:8000."
          onRetry={() => {}}
        />
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Overall Status */}
          <Card className={cn('flex items-center gap-4', getStatusColor(data.status))}>
            {getStatusIcon(data.status)}
            <div>
              <h3 className="text-lg font-bold text-text-primary capitalize">System Status: {data.status}</h3>
              <p className="text-sm text-text-secondary">Uptime: {Math.floor(data.uptime_seconds / 3600)}h {Math.floor((data.uptime_seconds % 3600) / 60)}m</p>
            </div>
            <div className="ml-auto text-right">
              <Badge variant="default" className="font-mono text-[10px]">v{data.version}</Badge>
            </div>
          </Card>

          {/* Subsystems */}
          <h3 className="text-base font-semibold text-text-primary pt-2">Subsystem Diagnostics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Database */}
            <Card className={cn(getStatusColor(data.services?.db?.status))}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-text-tertiary" />
                  <CardTitle className="text-sm">SQLite Database</CardTitle>
                </div>
                {getStatusIcon(data.services?.db?.status)}
              </div>
              <p className="text-xs text-text-secondary">Relational storage for metadata and auth</p>
            </Card>

            {/* Vector Store */}
            <Card className={cn(getStatusColor(data.services?.vector_index?.status))}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-text-tertiary" />
                  <CardTitle className="text-sm">ChromaDB</CardTitle>
                </div>
                {getStatusIcon(data.services?.vector_index?.status)}
              </div>
              <p className="text-xs text-text-secondary">Vector embeddings and semantic search</p>
            </Card>

            {/* LLM */}
            <Card className={cn(getStatusColor(data.services?.ollama?.status))}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-text-tertiary" />
                  <CardTitle className="text-sm">Ollama LLM</CardTitle>
                </div>
                {getStatusIcon(data.services?.ollama?.status)}
              </div>
              <p className="text-xs text-text-secondary">Local language model for RAG & chat</p>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
