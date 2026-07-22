import React from 'react';
import { useRouteTransition } from '@/contexts/RouteTransitionContext';
import { LoadingExperience } from '@/components/ui/LoadingExperience';

export function GlobalRouteLoader() {
  const { isTransitioning, messages, variant } = useRouteTransition();

  if (!isTransitioning) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      <LoadingExperience 
        isLoading={isTransitioning}
        messages={messages}
        variant={variant}
        overlay={true}
        className="backdrop-blur-md bg-bg-primary/80 !rounded-none" // Override some styles for full screen
      />
    </div>
  );
}
