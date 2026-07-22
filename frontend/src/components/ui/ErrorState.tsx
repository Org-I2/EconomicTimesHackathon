import React from 'react';
import { AlertTriangle, ServerCrash, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ 
  title = "Unable to load data", 
  message = "Cannot connect to the backend server. Make sure the API is running.", 
  onRetry,
  className = ""
}: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center min-h-[300px] border border-border-primary bg-surface-primary rounded-xl ${className}`}>
      <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mb-4">
        <ServerCrash className="h-8 w-8 text-danger" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">
        {title}
      </h3>
      <p className="text-sm text-text-secondary max-w-md mb-6">
        {message}
      </p>
      {onRetry && (
        <Button 
          variant="outline" 
          onClick={onRetry} 
          icon={<RefreshCw className="h-4 w-4" />}
        >
          Try Again
        </Button>
      )}
    </div>
  );
}
