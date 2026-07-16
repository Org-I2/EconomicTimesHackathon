/** Tabs — design-system tab navigation */
import React, { useState } from 'react';
import { cn } from '@/utils';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
}

/** Horizontal tab navigation with underline indicator */
export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  const [internalActive, setInternalActive] = useState(tabs[0]?.id);
  const active = activeTab ?? internalActive;

  const handleChange = (id: string) => {
    setInternalActive(id);
    onChange?.(id);
  };

  return (
    <div className={cn('border-b border-border-primary', className)} role="tablist">
      <div className="flex gap-1 -mb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => handleChange(tab.id)}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium',
              'border-b-2 transition-all duration-fast',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2',
              active === tab.id
                ? 'border-accent-500 text-text-primary'
                : 'border-transparent text-text-tertiary hover:text-text-secondary hover:border-border-secondary'
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded-full',
                active === tab.id
                  ? 'bg-accent-500/10 text-accent-500'
                  : 'bg-surface-secondary text-text-tertiary'
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
