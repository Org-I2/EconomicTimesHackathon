import React, { useRef, useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Upload, FolderOpen, Search, MessageSquare,
  Network, Wrench, AlertTriangle, Shield, BookOpen,
  Users, ClipboardList, Activity, ChevronLeft, ChevronRight,
  Cpu, FileText, Loader
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { Tooltip } from '@/components/ui';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Ingest',
    items: [
      { to: '/upload', label: 'Upload', icon: <Upload className="h-4 w-4" /> },
      { to: '/processing', label: 'Processing Queue', icon: <Loader className="h-4 w-4" /> },
      { to: '/documents', label: 'Document Browser', icon: <FolderOpen className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { to: '/search', label: 'Search', icon: <Search className="h-4 w-4" /> },
      { to: '/chat', label: 'AI Chat', icon: <MessageSquare className="h-4 w-4" /> },
      { to: '/graph', label: 'Knowledge Graph', icon: <Network className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Operations',
    items: [
      { to: '/maintenance', label: 'Maintenance', icon: <Wrench className="h-4 w-4" /> },
      { to: '/rca', label: 'Root Cause Analysis', icon: <AlertTriangle className="h-4 w-4" /> },
      { to: '/compliance', label: 'Compliance', icon: <Shield className="h-4 w-4" /> },
      { to: '/lessons-learned', label: 'Lessons Learned', icon: <BookOpen className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Administration',
    items: [
      { to: '/admin', label: 'Admin', icon: <Users className="h-4 w-4" />, adminOnly: true },
      { to: '/admin/audit-log', label: 'Audit Log', icon: <ClipboardList className="h-4 w-4" />, adminOnly: true },
      { to: '/admin/system-health', label: 'System Health', icon: <Activity className="h-4 w-4" />, adminOnly: true },
    ],
  },
];

/** Main sidebar navigation */
export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = useAuthStore((s) => s.isAdmin());

  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const setCollapsed = useUIStore((s) => s.setSidebarCollapsed);
  const storedWidth = useUIStore((s) => s.sidebarWidth);
  const setSidebarWidth = useUIStore((s) => s.setSidebarWidth);

  const [isResizing, setIsResizing] = useState(false);
  const [currentWidth, setCurrentWidth] = useState(storedWidth);
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isResizing) {
      setCurrentWidth(storedWidth);
    }
  }, [storedWidth, isResizing]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      let newWidth = e.clientX;
      if (newWidth < 200) newWidth = 200;
      if (newWidth > 400) newWidth = 400;

      setCurrentWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        setSidebarWidth(currentWidth);
      }
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, currentWidth, setSidebarWidth]);

  return (
    <aside
      ref={sidebarRef}
      className={cn(
        'h-screen sticky top-0 flex flex-col relative z-20',
        'bg-bg-secondary border-r border-border-primary',
        !isResizing && 'transition-[width] duration-normal ease-out'
      )}
      style={{ width: collapsed ? 64 : currentWidth }}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo / Brand */}
      <a 
        href="/"
        className={cn(
          'flex items-center h-14 border-b border-border-primary px-4 hover:bg-surface-hover transition-colors cursor-pointer w-full text-left',
          collapsed ? 'justify-center' : 'gap-3'
        )}
      >
        <div className="w-8 h-8 rounded-lg bg-accent-500 flex items-center justify-center shrink-0">
          <Cpu className="h-4.5 w-4.5 text-text-on-accent" />
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-text-primary truncate">UAO Brain</span>
            <span className="text-[10px] text-text-tertiary tracking-wide uppercase">Industrial Intelligence</span>
          </div>
        )}
      </a>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
        {navGroups.map((group) => {
          // Filter out admin-only items for non-admin users
          const visibleItems = group.items.filter((item) => !item.adminOnly || isAdmin);
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title}>
              {!collapsed && (
                <h3 className="px-3 mb-1.5 text-[10px] font-semibold text-text-tertiary uppercase tracking-widest">
                  {group.title}
                </h3>
              )}
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);

                  const linkContent = (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/'}
                      className={cn(
                        'flex items-center gap-3 rounded-md transition-all duration-fast w-full',
                        collapsed ? 'justify-center p-2.5' : 'px-3 py-2',
                        isActive
                          ? 'bg-accent-500/10 text-accent-500 font-medium'
                          : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                      )}
                      aria-label={collapsed ? item.label : undefined}
                    >
                      <span className="shrink-0">{item.icon}</span>
                      {!collapsed && (
                        <span className="text-sm truncate">{item.label}</span>
                      )}
                    </NavLink>
                  );

                  return collapsed ? (
                    <Tooltip key={item.to} content={item.label} position="right" delay={100}>
                      {linkContent}
                    </Tooltip>
                  ) : (
                    <React.Fragment key={item.to}>{linkContent}</React.Fragment>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t border-border-primary p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'w-full flex items-center justify-center p-2 rounded-md',
            'text-text-tertiary hover:text-text-secondary hover:bg-surface-hover',
            'transition-colors duration-fast'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Resize Handle */}
      {!collapsed && (
        <div
          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-accent-500/50 transition-colors z-30 group"
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizing(true);
          }}
        >
          <div className={cn(
            "absolute top-0 right-0 w-[1px] h-full transition-colors",
            isResizing ? "bg-accent-500" : "bg-transparent group-hover:bg-accent-500"
          )} />
        </div>
      )}
    </aside>
  );
}
