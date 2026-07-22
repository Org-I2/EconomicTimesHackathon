import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
  delay?: number;
  disabled?: boolean;
}

export function Tooltip({ children, content, position = 'right', className, delay = 200, disabled = false }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const show = () => {
    if (disabled) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        let x = 0;
        let y = 0;
        const offset = 8;
        
        switch (position) {
          case 'right':
            x = rect.right + offset;
            y = rect.top + rect.height / 2;
            break;
          case 'left':
            x = rect.left - offset;
            y = rect.top + rect.height / 2;
            break;
          case 'top':
            x = rect.left + rect.width / 2;
            y = rect.top - offset;
            break;
          case 'bottom':
            x = rect.left + rect.width / 2;
            y = rect.bottom + offset;
            break;
        }
        setCoords({ x, y });
      }
      setIsVisible(true);
    }, delay);
  };

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  useEffect(() => {
    if (disabled) hide();
  }, [disabled]);

  return (
    <>
      <div 
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className="inline-flex w-full"
      >
        {children}
      </div>
      {isVisible && !disabled && createPortal(
        <div 
          className={cn(
            "fixed z-[9999] px-2.5 py-1.5 text-[11px] font-medium text-white bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 rounded shadow-lg pointer-events-none animate-fade-in whitespace-nowrap border border-zinc-700 dark:border-zinc-300",
            position === 'right' && "translate-y-[-50%]",
            position === 'left' && "translate-x-[-100%] translate-y-[-50%]",
            position === 'top' && "translate-x-[-50%] translate-y-[-100%]",
            position === 'bottom' && "translate-x-[-50%]",
            className
          )}
          style={{ left: coords.x, top: coords.y }}
        >
          {content}
          <div className={cn(
            "absolute w-2 h-2 bg-zinc-800 dark:bg-zinc-100 rotate-45 border-zinc-700 dark:border-zinc-300",
            position === 'right' && "left-[-4px] top-1/2 -translate-y-1/2 border-b border-l",
            position === 'left' && "right-[-4px] top-1/2 -translate-y-1/2 border-t border-r",
            position === 'top' && "bottom-[-4px] left-1/2 -translate-x-1/2 border-b border-r",
            position === 'bottom' && "top-[-4px] left-1/2 -translate-x-1/2 border-t border-l"
          )} />
        </div>,
        document.body
      )}
    </>
  );
}
