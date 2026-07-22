import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function ForbiddenPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-danger/10 flex items-center justify-center mb-6">
        <ShieldAlert className="h-8 w-8 text-danger" />
      </div>
      <h1 className="text-2xl font-bold text-text-primary mb-2">Access Denied</h1>
      <p className="text-text-secondary max-w-md mb-8">
        You do not have the required permissions to view this page. This area requires Administrator privileges.
      </p>
      <Button onClick={() => navigate('/')} icon={<ArrowLeft className="h-4 w-4" />}>
        Return to Dashboard
      </Button>
    </div>
  );
}
