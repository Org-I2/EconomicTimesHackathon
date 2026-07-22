/** CommandPalette — global Cmd/Ctrl+K quick navigation */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  Search, LayoutDashboard, Upload, FolderOpen, MessageSquare,
  Network, Wrench, AlertTriangle, Shield, BookOpen, Users,
  ClipboardList, Activity, Loader,
} from 'lucide-react';
import { cn } from '@/utils';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';

interface CommandItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  group: string;
  keywords: string[];
  adminOnly?: boolean;
}

const commands: CommandItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, path: '/', group: 'Navigate', keywords: ['home', 'overview'] },
  { id: 'upload', label: 'Upload Documents', icon: <Upload className="h-4 w-4" />, path: '/upload', group: 'Navigate', keywords: ['ingest', 'files'] },
  { id: 'processing', label: 'Processing Queue', icon: <Loader className="h-4 w-4" />, path: '/processing', group: 'Navigate', keywords: ['status', 'queue', 'ocr'] },
  { id: 'documents', label: 'Document Browser', icon: <FolderOpen className="h-4 w-4" />, path: '/documents', group: 'Navigate', keywords: ['browse', 'list', 'catalog'] },
  { id: 'search', label: 'Search Documents', icon: <Search className="h-4 w-4" />, path: '/search', group: 'Navigate', keywords: ['find', 'query'] },
  { id: 'chat', label: 'AI Chat Copilot', icon: <MessageSquare className="h-4 w-4" />, path: '/chat', group: 'Intelligence', keywords: ['ask', 'rag', 'question', 'copilot'] },
  { id: 'graph', label: 'Knowledge Graph', icon: <Network className="h-4 w-4" />, path: '/graph', group: 'Intelligence', keywords: ['network', 'relationships', 'entities'] },
  { id: 'maintenance', label: 'Maintenance Dashboard', icon: <Wrench className="h-4 w-4" />, path: '/maintenance', group: 'Operations', keywords: ['equipment', 'timeline'] },
  { id: 'rca', label: 'Root Cause Analysis', icon: <AlertTriangle className="h-4 w-4" />, path: '/rca', group: 'Operations', keywords: ['incident', 'investigation'] },
  { id: 'compliance', label: 'Compliance Dashboard', icon: <Shield className="h-4 w-4" />, path: '/compliance', group: 'Operations', keywords: ['regulatory', 'expiry'] },
  { id: 'lessons', label: 'Lessons Learned', icon: <BookOpen className="h-4 w-4" />, path: '/lessons-learned', group: 'Operations', keywords: ['knowledge', 'tacit'] },
  { id: 'admin', label: 'Admin Panel', icon: <Users className="h-4 w-4" />, path: '/admin', group: 'Admin', keywords: ['users', 'manage'], adminOnly: true },
  { id: 'audit', label: 'Audit Log', icon: <ClipboardList className="h-4 w-4" />, path: '/admin/audit-log', group: 'Admin', keywords: ['history', 'events'], adminOnly: true },
  { id: 'health', label: 'System Health', icon: <Activity className="h-4 w-4" />, path: '/admin/system-health', group: 'Admin', keywords: ['status', 'health'], adminOnly: true },
];

/** Global command palette for quick navigation (Cmd/Ctrl+K) */
export function CommandPalette() {
  const navigate = useNavigate();
  const isOpen = useUIStore((s) => s.commandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const isAdmin = useAuthStore((s) => s.isAdmin());
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCommands = useMemo(() => {
    const available = commands.filter((cmd) => !cmd.adminOnly || isAdmin);
    if (!query) return available;
    const lower = query.toLowerCase();
    return available.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(lower) ||
        cmd.keywords.some((kw) => kw.includes(lower))
    );
  }, [query, isAdmin]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        e.preventDefault();
        navigate(filteredCommands[selectedIndex].path);
        setOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, navigate, setOpen]);

  if (!isOpen) return null;

  // Group filtered commands
  const groups = new Map<string, CommandItem[]>();
  filteredCommands.forEach((cmd) => {
    const existing = groups.get(cmd.group) || [];
    existing.push(cmd);
    groups.set(cmd.group, existing);
  });

  let globalIndex = -1;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] glass-overlay animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div className="w-full max-w-lg bg-surface-primary border border-border-primary rounded-xl shadow-overlay animate-scale-in overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 border-b border-border-primary">
          <Search className="h-4 w-4 text-text-tertiary shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            placeholder="Type a command or search..."
            className="flex-1 h-12 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none"
            aria-label="Command palette search"
          />
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {filteredCommands.length === 0 ? (
            <p className="text-sm text-text-tertiary text-center py-8">No results found</p>
          ) : (
            Array.from(groups.entries()).map(([group, items]) => (
              <div key={group}>
                <p className="px-4 pt-2 pb-1 text-[10px] font-semibold text-text-tertiary uppercase tracking-widest">
                  {group}
                </p>
                {items.map((cmd) => {
                  globalIndex++;
                  const idx = globalIndex;
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => { navigate(cmd.path); setOpen(false); }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                        selectedIndex === idx
                          ? 'bg-accent-500/10 text-accent-500'
                          : 'text-text-secondary hover:bg-surface-hover'
                      )}
                    >
                      <span className="shrink-0">{cmd.icon}</span>
                      {cmd.label}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
