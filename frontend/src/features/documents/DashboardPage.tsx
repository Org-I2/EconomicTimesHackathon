/** Dashboard Page — system pulse and orientation hub (SRD 7.2) */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FileText, Upload, Search, MessageSquare, Network,
  Shield, AlertTriangle, CheckCircle, Clock, Loader, ArrowRight
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge, StatusPill } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { queryKeys } from '@/lib/queryClient';
import { documentsApi, complianceApi, auditApi } from '@/lib/api';
import { formatRelativeTime, cn } from '@/utils';

/** Dashboard — system pulse, not vanity metrics */
export default function DashboardPage() {
  const navigate = useNavigate();

  // Fetch document stats
  const { data: allDocs, isLoading: docsLoading, isError: docsError } = useQuery({
    queryKey: queryKeys.documents.list({ page_size: 1 }),
    queryFn: () => documentsApi.list({ page_size: 1 }),
    retry: false, // Don't retry endlessly for UI demo
  });

  const { data: indexedDocs } = useQuery({
    queryKey: queryKeys.documents.list({ status: 'INDEXED', page_size: 1 }),
    queryFn: () => documentsApi.list({ status: 'INDEXED', page_size: 1 }),
    retry: false,
  });

  const { data: pendingDocs } = useQuery({
    queryKey: queryKeys.documents.processing(),
    queryFn: () => documentsApi.list({ status: 'UPLOADED', page_size: 5 }),
    refetchInterval: 3000,
    retry: false,
  });

  // Compliance stats
  const { data: compliance, isLoading: complianceLoading } = useQuery({
    queryKey: queryKeys.compliance.dashboard(90),
    queryFn: () => complianceApi.dashboard(90),
    retry: false,
  });

  // Recent activity
  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: queryKeys.audit.history({ page_size: 8 }),
    queryFn: () => auditApi.history({ page_size: 8 }),
    retry: false,
  });

  const totalDocs = allDocs?.total ?? 0;
  const indexedCount = indexedDocs?.total ?? 0;
  const pendingCount = pendingDocs?.total ?? 0;
  const expiringCount = compliance ? compliance.expired.length + compliance.expiring_soon.length : 0;

  // Quick actions
  const quickActions = [
    { label: 'Upload Documents', icon: <Upload className="h-5 w-5" />, path: '/upload', color: 'text-accent-500 bg-accent-500/10' },
    { label: 'Search Knowledge', icon: <Search className="h-5 w-5" />, path: '/search', color: 'text-info bg-info/10' },
    { label: 'AI Chat Copilot', icon: <MessageSquare className="h-5 w-5" />, path: '/chat', color: 'text-success bg-success/10' },
    { label: 'Knowledge Graph', icon: <Network className="h-5 w-5" />, path: '/graph', color: 'text-purple-500 bg-purple-500/10' },
  ];

  if (totalDocs === 0 && !docsLoading && !docsError) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Welcome to the Unified Asset & Operations Brain" />
        <EmptyState
          icon={<FileText className="h-8 w-8" />}
          title="No documents yet"
          description="Start by uploading industrial documents to build your knowledge base. Upload PDFs, scanned images, spreadsheets, and manuals to get started."
          action={
            <Button onClick={() => navigate('/upload')} icon={<Upload className="h-4 w-4" />}>
              Upload Documents
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Dashboard" description="System overview and quick actions" />

      {/* Stat Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatTile
          label="Total Documents"
          value={totalDocs}
          icon={<FileText className="h-5 w-5 text-info" />}
          loading={docsLoading}
        />
        <StatTile
          label="Indexed"
          value={indexedCount}
          sublabel={totalDocs > 0 ? `${Math.round((indexedCount / totalDocs) * 100)}% complete` : undefined}
          icon={<CheckCircle className="h-5 w-5 text-success" />}
          loading={docsLoading}
        />
        <StatTile
          label="Processing"
          value={pendingCount}
          icon={<Loader className="h-5 w-5 text-warning" />}
          loading={docsLoading}
          pulse={pendingCount > 0}
        />
        <StatTile
          label="Compliance Alerts"
          value={expiringCount}
          icon={<Shield className="h-5 w-5 text-danger" />}
          loading={complianceLoading}
          variant={expiringCount > 0 ? 'warning' : 'default'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <CardTitle className="mb-3 text-base">Quick Actions</CardTitle>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Card
                key={action.path}
                hover
                onClick={() => navigate(action.path)}
                className="group"
              >
                <div className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', action.color)}>
                    {action.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary group-hover:text-accent-500 transition-colors">
                      {action.label}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-text-tertiary group-hover:text-accent-500 transition-all group-hover:translate-x-0.5" />
                </div>
              </Card>
            ))}
          </div>

          {/* Processing Queue Preview */}
          {pendingCount > 0 && pendingDocs?.items && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <CardTitle className="text-base">Processing Queue</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/processing')}>
                  View All <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
              <Card padding="none">
                <div className="divide-y divide-border-secondary">
                  {pendingDocs.items.slice(0, 3).map((doc) => (
                    <div key={doc.document_id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="h-4 w-4 text-text-tertiary shrink-0" />
                        <span className="text-sm text-text-primary truncate">{doc.filename}</span>
                      </div>
                      <StatusPill status={doc.status} />
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div>
          <CardTitle className="mb-3 text-base">Recent Activity</CardTitle>
          <Card padding="none">
            {activityLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12" variant="rectangular" />
                ))}
              </div>
            ) : recentActivity?.items?.length ? (
              <div className="divide-y divide-border-secondary max-h-96 overflow-y-auto">
                {recentActivity.items.map((entry) => (
                  <div key={entry.event_id} className="px-4 py-3 hover:bg-surface-hover transition-colors">
                    <div className="flex items-center gap-2 mb-0.5">
                      <ActivityIcon type={entry.event_type} />
                      <span className="text-sm font-medium text-text-primary">{entry.event_type}</span>
                    </div>
                    <p className="text-xs text-text-tertiary font-mono">
                      {formatRelativeTime(entry.timestamp)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-sm text-text-tertiary">No recent activity</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

// ======================== Sub-components ========================

interface StatTileProps {
  label: string;
  value: number;
  sublabel?: string;
  icon: React.ReactNode;
  loading?: boolean;
  pulse?: boolean;
  variant?: 'default' | 'warning';
}

function StatTile({ label, value, sublabel, icon, loading, pulse, variant = 'default' }: StatTileProps) {
  return (
    <Card className={cn(variant === 'warning' && value > 0 && 'border-warning/30')}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">{label}</span>
        <div className={cn(pulse && 'animate-pulse-dot')}>{icon}</div>
      </div>
      {loading ? (
        <Skeleton className="h-8 w-16" />
      ) : (
        <p className="text-3xl font-bold text-text-primary font-mono">{value}</p>
      )}
      {sublabel && (
        <p className="text-xs text-text-tertiary mt-1">{sublabel}</p>
      )}
    </Card>
  );
}

function ActivityIcon({ type }: { type: string }) {
  const iconMap: Record<string, React.ReactNode> = {
    UPLOAD: <Upload className="h-3.5 w-3.5 text-info" />,
    INDEX: <CheckCircle className="h-3.5 w-3.5 text-success" />,
    SEARCH: <Search className="h-3.5 w-3.5 text-accent-500" />,
    CHAT: <MessageSquare className="h-3.5 w-3.5 text-success" />,
    LOGIN: <Clock className="h-3.5 w-3.5 text-text-tertiary" />,
    DELETE: <AlertTriangle className="h-3.5 w-3.5 text-danger" />,
  };
  return <>{iconMap[type] || <Clock className="h-3.5 w-3.5 text-text-tertiary" />}</>;
}
