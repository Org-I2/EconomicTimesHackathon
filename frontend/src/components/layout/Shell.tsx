/** Shell — root layout component wrapping Sidebar + Topbar + Content area */
import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { CommandPalette } from './CommandPalette';
import { Skeleton } from '@/components/ui/Skeleton';

/** Page-level loading fallback */
function PageFallback() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="w-48 h-8" />
      <Skeleton className="w-80 h-5" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <Skeleton className="h-32" variant="rectangular" />
        <Skeleton className="h-32" variant="rectangular" />
        <Skeleton className="h-32" variant="rectangular" />
      </div>
    </div>
  );
}

/** Application shell — sidebar + topbar + main content area */
export function Shell() {
  return (
    <div className="flex h-screen bg-bg-primary bg-blueprint">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto" role="main">
          <div className="max-w-7xl mx-auto p-4 lg:p-6">
            <Suspense fallback={<PageFallback />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
