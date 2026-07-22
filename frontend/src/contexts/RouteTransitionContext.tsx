import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import type { LoadingVariant } from '@/components/ui/LoadingExperience';

interface RouteTransitionContextType {
  isTransitioning: boolean;
  messages: string[];
  variant: LoadingVariant;
}

const RouteTransitionContext = createContext<RouteTransitionContextType>({
  isTransitioning: false,
  messages: ['Preparing Workspace...'],
  variant: 'default',
});

export const useRouteTransition = () => useContext(RouteTransitionContext);

interface RouteTransitionProviderProps {
  children: React.ReactNode;
}

export function RouteTransitionProvider({ children }: RouteTransitionProviderProps) {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [messages, setMessages] = useState<string[]>(['Preparing Workspace...']);
  const [variant, setVariant] = useState<LoadingVariant>('default');
  
  const prevPathname = useRef(location.pathname);

  useEffect(() => {
    if (location.pathname !== prevPathname.current) {
      
      const path = location.pathname;
      let newVariant: LoadingVariant = 'default';
      let newMessages: string[] = ['Preparing Workspace...'];

      if (path.includes('/dashboard')) {
        newVariant = 'graph';
        newMessages = ['Initializing AI Workspace...', 'Connecting Industrial Brain...'];
      } else if (path.includes('/upload') || path.includes('/processing') || path.includes('/documents')) {
        newVariant = 'ocr';
        newMessages = ['Preparing Document Intelligence...', 'Loading Knowledge Base...'];
      } else if (path.includes('/search')) {
        newVariant = 'search';
        newMessages = ['Preparing Search Index...', 'Connecting Semantic Engine...'];
      } else if (path.includes('/chat')) {
        newVariant = 'graph';
        newMessages = ['Starting AI Assistant...', 'Building Context...'];
      } else if (path.includes('/graph')) {
        newVariant = 'graph';
        newMessages = ['Loading Knowledge Graph...', 'Rendering Entity Relationships...'];
      } else if (path.includes('/maintenance')) {
        newVariant = 'graph';
        newMessages = ['Loading Maintenance Intelligence...', 'Synthesizing Data...'];
      } else if (path.includes('/compliance')) {
        newVariant = 'ocr';
        newMessages = ['Synchronizing Compliance Engine...'];
      } else if (path.includes('/rca') || path.includes('/lessons')) {
        newVariant = 'search';
        newMessages = ['Preparing Operations Intelligence...'];
      }

      setVariant(newVariant);
      setMessages(newMessages);
      setIsTransitioning(true);

      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 700);

      prevPathname.current = location.pathname;

      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  return (
    <RouteTransitionContext.Provider value={{ isTransitioning, messages, variant }}>
      {children}
    </RouteTransitionContext.Provider>
  );
}
