import React, { useState, useEffect } from 'react';
import { Cpu, FileText, Network, UploadCloud, Search } from 'lucide-react';
import { cn } from '@/utils';

export type LoadingVariant = 'default' | 'ocr' | 'graph' | 'upload' | 'search';

interface LoadingExperienceProps {
  isLoading: boolean;
  messages: string[];
  variant?: LoadingVariant;
  className?: string;
  overlay?: boolean; // If true, positions absolute inset-0 over relative parent
}

export function LoadingExperience({
  isLoading,
  messages,
  variant = 'default',
  className,
  overlay = true,
}: LoadingExperienceProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  // Rotate messages
  useEffect(() => {
    if (!isLoading || messages.length <= 1) return;
    
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2000); // 2 seconds per message
    
    return () => clearInterval(interval);
  }, [isLoading, messages]);

  // Reset index when loading stops
  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => setMessageIndex(0), 300); // Wait for fade out
    }
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div
      className={cn(
        'z-40 flex flex-col items-center justify-center animate-fade-in',
        overlay ? 'absolute inset-0 bg-bg-primary/60 backdrop-blur-[2px] rounded-xl' : 'w-full h-full min-h-[300px]',
        className
      )}
    >
      <div className="bg-surface-primary border border-border-primary rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center min-w-[280px]">
        
        {/* Animated Visual */}
        <div className="relative mb-6 w-16 h-16 flex items-center justify-center">
          {variant === 'default' && <DefaultVisual />}
          {variant === 'ocr' && <OcrVisual />}
          {variant === 'graph' && <GraphVisual />}
          {variant === 'upload' && <UploadVisual />}
          {variant === 'search' && <SearchVisual />}
        </div>

        {/* Message Carousel */}
        <div className="h-6 relative w-full overflow-hidden flex justify-center">
          {messages.map((msg, idx) => (
            <p
              key={idx}
              className={cn(
                'absolute text-sm font-medium text-text-primary text-center transition-all duration-500 ease-in-out w-full',
                idx === messageIndex
                  ? 'opacity-100 transform translate-y-0'
                  : idx < messageIndex || (messageIndex === 0 && idx === messages.length - 1)
                  ? 'opacity-0 transform -translate-y-4'
                  : 'opacity-0 transform translate-y-4'
              )}
            >
              {msg}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------- Visual Variants ----------------

function DefaultVisual() {
  return (
    <div className="relative flex items-center justify-center w-full h-full">
      <div className="absolute inset-0 bg-accent-500/20 rounded-full animate-ping opacity-75" />
      <div className="relative w-12 h-12 bg-surface-secondary border border-border-primary rounded-xl flex items-center justify-center shadow-lg shadow-accent-500/10">
        <Cpu className="w-6 h-6 text-accent-500 animate-pulse" />
      </div>
    </div>
  );
}

function OcrVisual() {
  return (
    <div className="relative flex items-center justify-center w-full h-full">
      <div className="relative w-12 h-14 bg-surface-secondary border border-border-primary rounded-lg flex items-center justify-center overflow-hidden">
        <FileText className="w-6 h-6 text-text-secondary" />
        
        {/* Scanning Laser */}
        <div className="absolute inset-x-0 h-0.5 bg-blue-500 shadow-[0_0_8px_2px_rgba(59,130,246,0.5)] animate-[scan_2s_ease-in-out_infinite]" />
      </div>
    </div>
  );
}

function GraphVisual() {
  return (
    <div className="relative flex items-center justify-center w-full h-full">
      {/* Central Node */}
      <div className="absolute w-4 h-4 bg-purple-500 rounded-full shadow-[0_0_12px_rgba(168,85,247,0.8)] z-10" />
      
      {/* Satellite Nodes */}
      <div className="absolute w-2 h-2 bg-emerald-500 rounded-full top-1 left-2 animate-[pulse_1.5s_infinite]" />
      <div className="absolute w-2 h-2 bg-blue-500 rounded-full top-2 right-1 animate-[pulse_2s_infinite]" />
      <div className="absolute w-2.5 h-2.5 bg-amber-500 rounded-full bottom-1 right-2 animate-[pulse_1.8s_infinite]" />
      <div className="absolute w-1.5 h-1.5 bg-rose-500 rounded-full bottom-2 left-1 animate-[pulse_2.2s_infinite]" />

      {/* Connecting Lines (SVG) */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 64 64">
        <line x1="32" y1="32" x2="16" y2="12" stroke="rgba(168,85,247,0.4)" strokeWidth="1.5" strokeDasharray="4" className="animate-[dash_3s_linear_infinite]" />
        <line x1="32" y1="32" x2="52" y2="16" stroke="rgba(168,85,247,0.4)" strokeWidth="1.5" />
        <line x1="32" y1="32" x2="48" y2="56" stroke="rgba(168,85,247,0.4)" strokeWidth="1.5" strokeDasharray="4" className="animate-[dash_3s_linear_infinite]" />
        <line x1="32" y1="32" x2="12" y2="48" stroke="rgba(168,85,247,0.4)" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

function UploadVisual() {
  return (
    <div className="relative flex items-center justify-center w-full h-full">
      <div className="relative w-12 h-12 bg-surface-secondary border border-border-primary rounded-xl flex items-center justify-center">
        <UploadCloud className="w-6 h-6 text-text-secondary" />
        {/* Floating packets */}
        <div className="absolute bottom-1 w-1.5 h-1.5 bg-accent-500 rounded-full animate-[float-up_1.5s_ease-in_infinite]" />
        <div className="absolute bottom-0 left-3 w-1 h-1 bg-accent-400 rounded-full animate-[float-up_1.2s_ease-in_infinite_0.4s]" />
        <div className="absolute bottom-2 right-3 w-2 h-2 bg-accent-600 rounded-full animate-[float-up_1.8s_ease-in_infinite_0.2s]" />
      </div>
    </div>
  );
}

function SearchVisual() {
  return (
    <div className="relative flex items-center justify-center w-full h-full">
      <div className="absolute inset-0 bg-blue-500/10 rounded-full animate-ping opacity-50" />
      <div className="relative w-12 h-12 bg-surface-secondary border border-border-primary rounded-xl flex items-center justify-center overflow-hidden">
        <Search className="w-5 h-5 text-blue-500 absolute animate-[search-pan_3s_ease-in-out_infinite]" />
        <div className="w-full h-full opacity-10 flex flex-wrap gap-1 p-1">
          {Array.from({ length: 9 }).map((_, i) => (
             <div key={i} className="w-2 h-0.5 bg-text-primary rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
