import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-surface-secondary flex items-center justify-center mb-6">
        <FileQuestion className="h-8 w-8 text-text-tertiary" />
      </div>
      <h1 className="text-2xl font-bold text-text-primary mb-2">Page Not Found</h1>
      <p className="text-text-secondary max-w-md mb-8">
        We couldn't find the page you were looking for. It might have been moved or doesn't exist.
      </p>
      <Button onClick={() => navigate('/')} icon={<ArrowLeft className="h-4 w-4" />}>
        Return to Dashboard
      </Button>
    </div>
  );
}
