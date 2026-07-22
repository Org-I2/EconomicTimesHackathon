import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/utils';

// Helper to format path segments into readable text
function formatSegment(segment: string) {
  // Common acronyms
  if (segment === 'rca') return 'Root Cause Analysis';
  
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // If on home/dashboard, don't show full breadcrumb trail
  if (pathnames.length === 0) {
    return (
      <div className="flex items-center text-sm text-text-tertiary">
        <Home className="h-3.5 w-3.5 mr-2" />
        <span>Dashboard</span>
      </div>
    );
  }

  return (
    <nav className="flex items-center space-x-1 text-sm text-text-tertiary" aria-label="Breadcrumb">
      <Link
        to="/"
        className="flex items-center hover:text-text-primary transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>

      {pathnames.map((segment, index) => {
        const isLast = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        
        // Truncate long IDs (e.g. document IDs)
        let label = formatSegment(segment);
        if (segment.length > 20 && !segment.includes(' ')) {
          label = `${segment.slice(0, 6)}...${segment.slice(-4)}`;
        }

        return (
          <div key={to} className="flex items-center">
            <ChevronRight className="h-3.5 w-3.5 mx-1 opacity-50" />
            {isLast ? (
              <span className="text-text-primary font-medium truncate max-w-[200px]" aria-current="page">
                {label}
              </span>
            ) : (
              <Link
                to={to}
                className="hover:text-text-primary transition-colors truncate max-w-[150px]"
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
