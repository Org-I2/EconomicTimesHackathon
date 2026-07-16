/** Main Application Router Configuration */
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Core
import { queryClient } from '@/lib/queryClient';
import { Shell } from '@/components/layout';
import { RequireAuth } from "./app/RequireAuth";
import { RequireRole } from "./app/RequireRole";
import { RouteTransitionProvider } from '@/contexts/RouteTransitionContext';
import { GlobalRouteLoader } from '@/components/ui/GlobalRouteLoader';

// Pages
import LandingPage from '@/features/landing/LandingPage';
import LoginPage from '@/features/auth/LoginPage';
import SignupPage from '@/features/auth/SignupPage';
import HomePage from '@/features/home/HomePage';
import UploadPage from '@/features/documents/UploadPage';
import ProcessingQueuePage from '@/features/documents/ProcessingQueuePage';
import DocumentBrowserPage from '@/features/documents/DocumentBrowserPage';
import DocumentViewerPage from '@/features/documents/DocumentViewerPage';
import SearchPage from '@/features/search/SearchPage';
import ChatPage from '@/features/chat/ChatPage';
import GraphPage from '@/features/graph/GraphPage';
import MaintenancePage from '@/features/operations/MaintenancePage';
import RcaPage from '@/features/operations/RcaPage';
import CompliancePage from '@/features/operations/CompliancePage';
import LessonsPage from '@/features/operations/LessonsPage';

// Admin
import AdminPage from '@/features/admin/AdminPage';
import AuditLogPage from '@/features/admin/AuditLogPage';
import SystemHealthPage from '@/features/admin/SystemHealthPage';

// Errors
import ForbiddenPage from './app/ForbiddenPage';
import NotFoundPage from './app/NotFoundPage';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <RouteTransitionProvider>
          <GlobalRouteLoader />
          <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          {/* Protected Routes inside Shell */}
          <Route element={<RequireAuth><Shell /></RequireAuth>}>
            {/* Overview & Ingest */}
            <Route path="/dashboard" element={<HomePage />} />
            <Route path="upload" element={<UploadPage />} />
            <Route path="processing" element={<ProcessingQueuePage />} />
            <Route path="documents" element={<DocumentBrowserPage />} />
            <Route path="documents/:id" element={<DocumentViewerPage />} />
            
            {/* Intelligence */}
            <Route path="search" element={<SearchPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="graph" element={<GraphPage />} />
            
            {/* Operations */}
            <Route path="maintenance" element={<MaintenancePage />} />
            <Route path="rca" element={<RcaPage />} />
            <Route path="compliance" element={<CompliancePage />} />
            <Route path="lessons-learned" element={<LessonsPage />} />
            
            {/* Administration (Admin Only) */}
            <Route path="admin">
              <Route index element={<RequireRole role="admin"><AdminPage /></RequireRole>} />
              <Route path="audit-log" element={<RequireRole role="admin"><AuditLogPage /></RequireRole>} />
              <Route path="system-health" element={<RequireRole role="admin"><SystemHealthPage /></RequireRole>} />
            </Route>

            {/* Error States */}
            <Route path="forbidden" element={<ForbiddenPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
          </Routes>
        </RouteTransitionProvider>
      </BrowserRouter>
      
      {/* Toast Notifications */}
      <Toaster 
        position="bottom-right"
        toastOptions={{
          className: 'bg-surface-primary text-text-primary border border-border-primary',
          style: {
            background: 'var(--color-surface-primary)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border-primary)',
          },
          success: {
            iconTheme: {
              primary: 'var(--color-success)',
              secondary: 'white',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--color-danger)',
              secondary: 'white',
            },
          },
        }}
      />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
