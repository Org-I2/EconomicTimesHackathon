/** Topbar — global header with command palette trigger, theme toggle, and user menu */
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sun, Moon, LogOut, User, Command } from 'lucide-react';
import { cn } from '@/utils';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { useUIStore } from '@/stores/uiStore';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumbs } from './Breadcrumbs';

/** Global top bar with search, theme toggle, and user menu */
export function Topbar() {
  const navigate = useNavigate();
  const { username, role, logout } = useAuthStore();
  const { resolvedTheme, toggleTheme } = useThemeStore();
  const { setCommandPaletteOpen } = useUIStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cmd/Ctrl+K shortcut for command palette
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setCommandPaletteOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-14 border-b border-border-primary bg-bg-secondary/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="flex items-center justify-between h-full px-4 lg:px-6 gap-4">
        
        {/* Left Side: Breadcrumbs & Command Palette */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="hidden md:flex items-center shrink-0">
            <Breadcrumbs />
          </div>
          
          {/* Command Palette Trigger */}
          <button
          onClick={() => setCommandPaletteOpen(true)}
          className={cn(
            'flex items-center gap-2 h-8 px-3 rounded-md',
            'bg-surface-primary border border-border-primary',
            'text-text-tertiary hover:text-text-secondary',
            'transition-colors duration-fast',
            'text-sm w-64 lg:w-80'
          )}
          aria-label="Open command palette (Ctrl+K)"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 text-left truncate">Search or jump to...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-surface-secondary rounded border border-border-secondary text-text-tertiary">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md text-text-tertiary hover:text-text-secondary hover:bg-surface-hover transition-colors"
            aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className={cn(
                'flex items-center gap-2 h-8 px-2.5 rounded-md',
                'hover:bg-surface-hover transition-colors',
                userMenuOpen && 'bg-surface-hover'
              )}
              aria-label="User menu"
              aria-expanded={userMenuOpen}
            >
              <div className="w-6 h-6 rounded-full bg-accent-500/20 flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-accent-500" />
              </div>
              <span className="hidden sm:inline text-sm text-text-secondary">{username}</span>
              <Badge variant={role === 'admin' ? 'accent' : 'default'} className="hidden sm:inline-flex text-[10px]">
                {role}
              </Badge>
            </button>

            {/* Dropdown */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-48 bg-surface-primary border border-border-primary rounded-lg shadow-lg py-1 animate-scale-in z-50">
                <div className="px-3 py-2 border-b border-border-secondary">
                  <p className="text-sm font-medium text-text-primary">{username}</p>
                  <p className="text-xs text-text-tertiary capitalize">{role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface-hover hover:text-danger transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
