/** Home Dashboard — AI-Powered Industrial Knowledge Intelligence Command Center */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FileText, Upload, Search, MessageSquare, Network,
  Shield, AlertTriangle, CheckCircle, Clock, Loader, ArrowRight,
  Wrench, BookOpen, Activity, Cpu, Zap, Database,
  TrendingUp, BarChart3, ArrowUpRight, Sparkles, 
  ChevronRight, Eye, Command, Brain, Globe, Server,
  HardDrive, Bot, Layers, CircleDot
} from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge, StatusPill } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { queryKeys } from '@/lib/queryClient';
import { documentsApi, complianceApi, auditApi, healthApi } from '@/lib/api';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { formatRelativeTime, cn } from '@/utils';
import { HeroSection } from './HeroSection';
import { LoadingExperience } from '@/components/ui/LoadingExperience';

// ======================== Animated Counter ========================

function AnimatedCounter({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const start = prevValue.current;
    const end = value;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * eased);
      setDisplayValue(current);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
    prevValue.current = value;
  }, [value, duration]);

  return <>{displayValue}</>;
}

// ======================== Service Status Dot ========================

function ServiceDot({ status }: { status: string }) {
  const isOk = status === 'ok' || status === 'OK' || status === 'healthy';
  return (
    <span className={cn(
      "relative flex h-2 w-2",
    )}>
      {isOk && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
      )}
      <span className={cn(
        "relative inline-flex rounded-full h-2 w-2",
        isOk ? "bg-success" : status === 'degraded' ? "bg-warning" : "bg-danger"
      )} />
    </span>
  );
}

// ======================== Main Home Page ========================

export default function HomePage() {
  const navigate = useNavigate();
  const username = useAuthStore((s) => s.username);
  const { setCommandPaletteOpen } = useUIStore();

  // Data queries
  const { data: allDocs, isLoading: docsLoading } = useQuery({
    queryKey: queryKeys.documents.list({ page_size: 1 }),
    queryFn: () => documentsApi.list({ page_size: 1 }),
    retry: false,
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

  const { data: recentDocs } = useQuery({
    queryKey: queryKeys.documents.list({ page_size: 5, sort: 'created_at', order: 'desc' }),
    queryFn: () => documentsApi.list({ page_size: 5 }),
    retry: false,
  });

  const { data: compliance } = useQuery({
    queryKey: queryKeys.compliance.dashboard(90),
    queryFn: () => complianceApi.dashboard(90),
    retry: false,
  });

  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: queryKeys.audit.history({ page_size: 10 }),
    queryFn: () => auditApi.history({ page_size: 10 }),
    retry: false,
  });

  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: queryKeys.health.all,
    queryFn: () => healthApi.check(),
    retry: false,
    refetchInterval: 15000,
  });

  const totalDocs = allDocs?.total ?? 0;
  const indexedCount = indexedDocs?.total ?? 0;
  const pendingCount = pendingDocs?.total ?? 0;
  const expiringCount = compliance ? compliance.expired.length + compliance.expiring_soon.length : 0;
  const indexedPercent = totalDocs > 0 ? Math.round((indexedCount / totalDocs) * 100) : 0;

  // Greeting based on time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Quick actions data
  const quickActions = [
    { label: 'Upload Documents', desc: 'Ingest PDFs, manuals & reports', icon: <Upload className="h-5 w-5" />, path: '/upload', gradient: 'from-amber-500/20 to-orange-500/20', iconColor: 'text-amber-500', border: 'hover:border-amber-500/30' },
    { label: 'Search Knowledge', desc: 'Semantic search across all docs', icon: <Search className="h-5 w-5" />, path: '/search', gradient: 'from-blue-500/20 to-cyan-500/20', iconColor: 'text-blue-500', border: 'hover:border-blue-500/30' },
    { label: 'AI Chat Copilot', desc: 'Ask questions about your data', icon: <MessageSquare className="h-5 w-5" />, path: '/chat', gradient: 'from-emerald-500/20 to-green-500/20', iconColor: 'text-emerald-500', border: 'hover:border-emerald-500/30' },
    { label: 'Knowledge Graph', desc: 'Explore entity relationships', icon: <Network className="h-5 w-5" />, path: '/graph', gradient: 'from-purple-500/20 to-violet-500/20', iconColor: 'text-purple-500', border: 'hover:border-purple-500/30' },
    { label: 'Maintenance Intel', desc: 'Equipment timelines & alerts', icon: <Wrench className="h-5 w-5" />, path: '/maintenance', gradient: 'from-teal-500/20 to-cyan-500/20', iconColor: 'text-teal-500', border: 'hover:border-teal-500/30' },
    { label: 'Compliance', desc: 'Track regulatory deadlines', icon: <Shield className="h-5 w-5" />, path: '/compliance', gradient: 'from-rose-500/20 to-pink-500/20', iconColor: 'text-rose-500', border: 'hover:border-rose-500/30' },
    { label: 'Root Cause Analysis', desc: 'AI-powered incident analysis', icon: <AlertTriangle className="h-5 w-5" />, path: '/rca', gradient: 'from-orange-500/20 to-red-500/20', iconColor: 'text-orange-500', border: 'hover:border-orange-500/30' },
    { label: 'Lessons Learned', desc: 'Capture & share knowledge', icon: <BookOpen className="h-5 w-5" />, path: '/lessons-learned', gradient: 'from-indigo-500/20 to-blue-500/20', iconColor: 'text-indigo-500', border: 'hover:border-indigo-500/30' },
  ];

  // System health services
  const services = [
    { name: 'Backend API', key: 'status', icon: <Server className="h-4 w-4" /> },
    { name: 'Ollama LLM', key: 'ollama', icon: <Brain className="h-4 w-4" /> },
    { name: 'Vector Index', key: 'vector_index', icon: <Layers className="h-4 w-4" /> },
    { name: 'Database', key: 'db', icon: <Database className="h-4 w-4" /> },
  ];

  // AI suggestions (contextual)
  const suggestions = [];
  if (totalDocs === 0) {
    suggestions.push({ text: 'Upload your first industrial document to get started', action: '/upload', icon: <Upload className="h-4 w-4" /> });
  }
  if (pendingCount > 0) {
    suggestions.push({ text: `${pendingCount} document${pendingCount > 1 ? 's' : ''} pending processing`, action: '/processing', icon: <Loader className="h-4 w-4" /> });
  }
  if (expiringCount > 0) {
    suggestions.push({ text: `${expiringCount} compliance alert${expiringCount > 1 ? 's' : ''} need attention`, action: '/compliance', icon: <Shield className="h-4 w-4" /> });
  }
  if (totalDocs > 0 && indexedPercent < 100) {
    suggestions.push({ text: `${100 - indexedPercent}% of documents still need indexing`, action: '/processing', icon: <BarChart3 className="h-4 w-4" /> });
  }
  if (totalDocs > 0) {
    suggestions.push({ text: 'Explore your knowledge graph for hidden relationships', action: '/graph', icon: <Network className="h-4 w-4" /> });
  }
  if (suggestions.length === 0) {
    suggestions.push({ text: 'Everything looks good! Start exploring your knowledge base.', action: '/search', icon: <Sparkles className="h-4 w-4" /> });
  }

  return (
    <div className="space-y-6 animate-fade-in relative min-h-[500px]">
      <LoadingExperience 
        isLoading={docsLoading} 
        variant="default"
        messages={['Booting Industrial Brain...', 'Connecting to knowledge graph...', 'Loading real-time metrics...']}
      />
      
      {/* ============ HERO SECTION ============ */}
      <HeroSection
        totalDocs={totalDocs}
        indexedCount={indexedCount}
        pendingCount={pendingCount}
        expiringCount={expiringCount}
        docsLoading={docsLoading}
      />

      {/* ============ MAIN GRID ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ---------- LEFT: Quick Actions + Processing ---------- */}
        <div className="lg:col-span-8 space-y-6">

          {/* Quick Actions Grid */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-accent-500" />
                <h2 className="text-base font-semibold text-text-primary">Quick Actions</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {quickActions.map((action) => (
                <button
                  key={action.path}
                  onClick={() => navigate(action.path)}
                  className={cn(
                    'group relative flex flex-col items-start p-4 rounded-lg',
                    'bg-surface-primary border border-border-primary',
                    'hover:bg-surface-hover transition-all duration-normal',
                    action.border,
                    'text-left'
                  )}
                >
                  <div className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center mb-3',
                    'bg-gradient-to-br', action.gradient,
                    'transition-transform duration-normal group-hover:scale-110'
                  )}>
                    <span className={action.iconColor}>{action.icon}</span>
                  </div>
                  <p className="text-sm font-medium text-text-primary group-hover:text-accent-500 transition-colors">
                    {action.label}
                  </p>
                  <p className="text-[11px] text-text-tertiary mt-0.5 leading-snug">
                    {action.desc}
                  </p>
                  <ArrowUpRight className="absolute top-3 right-3 h-3.5 w-3.5 text-text-tertiary opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              ))}
            </div>
          </section>

          {/* AI Insights & Suggestions */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-accent-500" />
              <h2 className="text-base font-semibold text-text-primary">AI Insights</h2>
            </div>
            <Card padding="none" className="overflow-hidden">
              <div className="divide-y divide-border-secondary">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => navigate(s.action)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-hover transition-colors text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-accent-500/10 flex items-center justify-center text-accent-500 shrink-0">
                      {s.icon}
                    </div>
                    <span className="text-sm text-text-secondary group-hover:text-text-primary flex-1 transition-colors">
                      {s.text}
                    </span>
                    <ChevronRight className="h-4 w-4 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </Card>
          </section>

          {/* Recent Documents */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-accent-500" />
                <h2 className="text-base font-semibold text-text-primary">Recent Documents</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/documents')}>
                View All <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
            <Card padding="none">
              {recentDocs?.items?.length ? (
                <div className="divide-y divide-border-secondary">
                  {recentDocs.items.slice(0, 5).map((doc) => (
                    <button
                      key={doc.document_id}
                      onClick={() => navigate(`/documents/${doc.document_id}`)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-hover transition-colors text-left group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-surface-secondary flex items-center justify-center shrink-0">
                          <FileText className="h-4 w-4 text-text-tertiary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-text-primary truncate group-hover:text-accent-500 transition-colors">
                            {doc.filename}
                          </p>
                          <p className="text-[11px] text-text-tertiary mt-0.5">
                            {doc.document_type && <span className="mr-2">{doc.document_type}</span>}
                            {formatRelativeTime(doc.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <StatusPill status={doc.status} />
                        <Eye className="h-3.5 w-3.5 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center">
                  <FileText className="h-8 w-8 text-text-tertiary mx-auto mb-2 opacity-30" />
                  <p className="text-sm text-text-tertiary">No documents uploaded yet</p>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/upload')} className="mt-2">
                    Upload First Document
                  </Button>
                </div>
              )}
            </Card>
          </section>

          {/* Processing Queue Preview */}
          {pendingCount > 0 && pendingDocs?.items && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Loader className="h-4 w-4 text-amber-500 animate-spin" />
                  <h2 className="text-base font-semibold text-text-primary">Processing Queue</h2>
                  <Badge variant="warning" className="text-[10px]">{pendingCount}</Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/processing')}>
                  View All <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
              <Card padding="none">
                <div className="divide-y divide-border-secondary">
                  {pendingDocs.items.slice(0, 3).map((doc) => (
                    <div key={doc.document_id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-sm text-text-primary truncate">{doc.filename}</span>
                      </div>
                      <StatusPill status={doc.status} />
                    </div>
                  ))}
                </div>
              </Card>
            </section>
          )}
        </div>

        {/* ---------- RIGHT SIDEBAR ---------- */}
        <div className="lg:col-span-4 space-y-6">

          {/* System Health */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-accent-500" />
              <h2 className="text-base font-semibold text-text-primary">System Health</h2>
            </div>
            <Card padding="none">
              {healthLoading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10" variant="rectangular" />
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-border-secondary">
                  {services.map((svc) => {
                    const status = healthData ? (healthData as any)[svc.key] ?? 'unknown' : 'unknown';
                    return (
                      <button
                        key={svc.key}
                        onClick={() => navigate('/admin/system-health')}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-hover transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-text-tertiary group-hover:text-text-secondary transition-colors">
                            {svc.icon}
                          </span>
                          <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                            {svc.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[11px] font-medium capitalize",
                            status === 'ok' || status === 'OK' || status === 'healthy' 
                              ? 'text-emerald-500' 
                              : status === 'degraded' ? 'text-amber-500' : 'text-rose-500'
                          )}>
                            {status === 'ok' || status === 'OK' || status === 'healthy' ? 'Operational' : status}
                          </span>
                          <ServiceDot status={status} />
                        </div>
                      </button>
                    );
                  })}
                  {healthData?.model && (
                    <div className="px-4 py-3 flex items-center gap-3">
                      <Bot className="h-4 w-4 text-text-tertiary" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-text-tertiary">Active LLM</p>
                        <p className="text-xs text-text-secondary font-mono truncate">{healthData.model}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </section>

          {/* Recent Activity */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-accent-500" />
                <h2 className="text-base font-semibold text-text-primary">Activity Feed</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin/audit-log')}>
                All <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
            <Card padding="none">
              {activityLoading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12" variant="rectangular" />
                  ))}
                </div>
              ) : recentActivity?.items?.length ? (
                <div className="divide-y divide-border-secondary max-h-[400px] overflow-y-auto">
                  {recentActivity.items.map((entry) => (
                    <div key={entry.event_id} className="px-4 py-3 hover:bg-surface-hover transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-md bg-surface-secondary flex items-center justify-center shrink-0">
                          <ActivityIcon type={entry.event_type} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-text-primary truncate">
                            {formatEventLabel(entry.event_type)}
                          </p>
                          <p className="text-[11px] text-text-tertiary font-mono">
                            {formatRelativeTime(entry.timestamp)}
                            {entry.user_id && <span className="ml-1">· {entry.user_id}</span>}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Clock className="h-6 w-6 text-text-tertiary mx-auto mb-2 opacity-30" />
                  <p className="text-sm text-text-tertiary">No recent activity</p>
                </div>
              )}
            </Card>
          </section>

          {/* Compliance Summary */}
          {compliance && (compliance.expired.length > 0 || compliance.expiring_soon.length > 0) && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-4 w-4 text-rose-500" />
                <h2 className="text-base font-semibold text-text-primary">Compliance Alerts</h2>
              </div>
              <Card padding="none">
                <div className="divide-y divide-border-secondary">
                  {compliance.expired.slice(0, 3).map((item) => (
                    <button
                      key={item.document_id}
                      onClick={() => navigate(`/documents/${item.document_id}`)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-hover transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <CircleDot className="h-4 w-4 text-rose-500 shrink-0" />
                        <span className="text-sm text-text-primary truncate">{item.filename}</span>
                      </div>
                      <Badge variant="danger" className="text-[10px] shrink-0">Expired</Badge>
                    </button>
                  ))}
                  {compliance.expiring_soon.slice(0, 3).map((item) => (
                    <button
                      key={item.document_id}
                      onClick={() => navigate(`/documents/${item.document_id}`)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-hover transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <CircleDot className="h-4 w-4 text-amber-500 shrink-0" />
                        <span className="text-sm text-text-primary truncate">{item.filename}</span>
                      </div>
                      <Badge variant="warning" className="text-[10px] shrink-0">Expiring</Badge>
                    </button>
                  ))}
                </div>
                <div className="px-4 py-2 border-t border-border-secondary">
                  <Button variant="ghost" size="sm" onClick={() => navigate('/compliance')} className="w-full">
                    View Compliance Dashboard <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              </Card>
            </section>
          )}

          {/* Platform Capabilities */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-4 w-4 text-accent-500" />
              <h2 className="text-base font-semibold text-text-primary">Platform</h2>
            </div>
            <Card className="bg-gradient-to-br from-surface-primary to-accent-500/5">
              <div className="space-y-3">
                {[
                  { icon: <Brain className="h-3.5 w-3.5" />, label: 'RAG-Powered AI Chat' },
                  { icon: <Network className="h-3.5 w-3.5" />, label: 'Knowledge Graph Extraction' },
                  { icon: <Eye className="h-3.5 w-3.5" />, label: 'OCR & Document Intelligence' },
                  { icon: <TrendingUp className="h-3.5 w-3.5" />, label: 'Predictive Maintenance' },
                  { icon: <Shield className="h-3.5 w-3.5" />, label: 'Compliance Monitoring' },
                ].map((cap, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-md bg-accent-500/10 flex items-center justify-center text-accent-500">
                      {cap.icon}
                    </div>
                    <span className="text-xs text-text-secondary">{cap.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}

// ======================== Sub-components ========================

interface KPICardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  loading?: boolean;
  onClick?: () => void;
  pulse?: boolean;
  variant?: 'default' | 'warning';
  trend?: string;
  trendColor?: string;
}

function KPICard({ label, value, icon, iconColor, iconBg, loading, onClick, pulse, variant = 'default', trend, trendColor = 'text-text-tertiary' }: KPICardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative flex flex-col p-4 rounded-lg text-left',
        'bg-surface-primary border border-border-primary',
        'hover:bg-surface-hover hover:border-border-secondary transition-all duration-normal',
        variant === 'warning' && value > 0 && 'border-rose-500/20 hover:border-rose-500/40',
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">{label}</span>
        <div className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-normal group-hover:scale-110',
          iconBg, iconColor,
          pulse && 'animate-pulse'
        )}>
          {icon}
        </div>
      </div>
      {loading ? (
        <Skeleton className="h-8 w-16" />
      ) : (
        <p className="text-3xl font-bold text-text-primary font-mono">
          <AnimatedCounter value={value} />
        </p>
      )}
      {trend && (
        <p className={cn("text-[11px] mt-1.5 font-medium", trendColor)}>
          {trend}
        </p>
      )}
      <ArrowUpRight className="absolute top-3 right-3 h-3 w-3 text-text-tertiary opacity-0 group-hover:opacity-50 transition-opacity" />
    </button>
  );
}

function ActivityIcon({ type }: { type: string }) {
  const iconMap: Record<string, React.ReactNode> = {
    UPLOAD: <Upload className="h-3.5 w-3.5 text-blue-500" />,
    INDEX: <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />,
    SEARCH: <Search className="h-3.5 w-3.5 text-cyan-500" />,
    CHAT: <MessageSquare className="h-3.5 w-3.5 text-green-500" />,
    LOGIN: <Cpu className="h-3.5 w-3.5 text-text-tertiary" />,
    DELETE: <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />,
  };
  return <>{iconMap[type] || <Clock className="h-3.5 w-3.5 text-text-tertiary" />}</>;
}

function formatEventLabel(type: string): string {
  const labelMap: Record<string, string> = {
    UPLOAD: 'Document uploaded',
    INDEX: 'Document indexed',
    SEARCH: 'Knowledge search performed',
    CHAT: 'AI conversation',
    LOGIN: 'User session started',
    DELETE: 'Document removed',
  };
  return labelMap[type] || type.replace(/_/g, ' ').toLowerCase().replace(/^./, s => s.toUpperCase());
}
