/** Admin Dashboard Page (SRD 7.10) */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ClipboardList, Activity, ArrowRight, ShieldAlert } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardTitle, CardDescription } from '@/components/ui/Card';

export default function AdminPage() {
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader
        title="Administration"
        description="Manage system settings, monitor health, and review audit logs"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card hover onClick={() => navigate('/admin/audit-log')} className="group border-accent-500/20">
          <div className="w-12 h-12 rounded-xl bg-accent-500/10 flex items-center justify-center mb-4">
            <ClipboardList className="h-6 w-6 text-accent-500" />
          </div>
          <CardTitle className="mb-2">Audit Log</CardTitle>
          <CardDescription className="mb-4">
            Review immutable system event history including uploads, queries, and deletions.
          </CardDescription>
          <div className="flex items-center text-sm font-medium text-accent-500">
            View Logs <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </Card>

        <Card hover onClick={() => navigate('/admin/system-health')} className="group border-info/20">
          <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center mb-4">
            <Activity className="h-6 w-6 text-info" />
          </div>
          <CardTitle className="mb-2">System Health</CardTitle>
          <CardDescription className="mb-4">
            Monitor real-time status of the API, database, vector store, and LLM services.
          </CardDescription>
          <div className="flex items-center text-sm font-medium text-info">
            Check Status <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <Card className="bg-surface-secondary/50">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
              <ShieldAlert className="h-5 w-5 text-warning" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-text-primary">Administrator Privileges Active</h3>
              <p className="text-sm text-text-secondary mt-1">
                You are currently logged in with the <strong>admin</strong> role. This grants you access to system logs, health monitoring, and document deletion capabilities. All administrative actions are recorded in the immutable audit log.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
