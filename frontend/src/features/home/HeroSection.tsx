/** HeroSection — Premium AI Industrial Knowledge Intelligence command center visual */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Upload, MessageSquare, Network, Command,
  FileText, CheckCircle, Shield, Cpu, Sparkles,
  ArrowRight, Brain, Layers, Wrench, BarChart3
} from 'lucide-react';
import { cn } from '@/utils';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';

// ======================== Animated Network Visualization ========================

interface NetworkNode {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  type: 'document' | 'equipment' | 'ai' | 'knowledge' | 'incident' | 'sop';
  pulsePhase: number;
}

const NODE_COLORS: Record<string, string> = {
  document: 'rgba(59, 130, 246, 0.7)',    // blue
  equipment: 'rgba(245, 158, 11, 0.8)',   // amber (accent)
  ai: 'rgba(168, 85, 247, 0.7)',          // purple
  knowledge: 'rgba(34, 197, 94, 0.7)',    // green
  incident: 'rgba(239, 68, 68, 0.6)',     // red
  sop: 'rgba(20, 184, 166, 0.7)',         // teal
};

const NODE_GLOW: Record<string, string> = {
  document: 'rgba(59, 130, 246, 0.15)',
  equipment: 'rgba(245, 158, 11, 0.2)',
  ai: 'rgba(168, 85, 247, 0.15)',
  knowledge: 'rgba(34, 197, 94, 0.15)',
  incident: 'rgba(239, 68, 68, 0.12)',
  sop: 'rgba(20, 184, 166, 0.15)',
};

function NetworkCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<NetworkNode[]>([]);
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  const initNodes = useCallback((width: number, height: number) => {
    const types: NetworkNode['type'][] = ['document', 'equipment', 'ai', 'knowledge', 'incident', 'sop'];
    const nodes: NetworkNode[] = [];
    const count = Math.min(Math.floor((width * height) / 18000), 28);
    
    for (let i = 0; i < count; i++) {
      nodes.push({
        id: i,
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: 2 + Math.random() * 3,
        type: types[i % types.length],
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }
    nodesRef.current = nodes;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(dpr, dpr);
      initNodes(rect.width, rect.height);
    };

    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);
      ctx.clearRect(0, 0, w, h);
      
      timeRef.current += 0.008;
      const t = timeRef.current;
      const nodes = nodesRef.current;

      // Update positions with smooth drift
      for (const node of nodes) {
        node.x += node.vx + Math.sin(t + node.pulsePhase) * 0.1;
        node.y += node.vy + Math.cos(t * 0.7 + node.pulsePhase) * 0.08;
        
        // Bounce off edges with padding
        if (node.x < 20 || node.x > w - 20) node.vx *= -1;
        if (node.y < 20 || node.y > h - 20) node.vy *= -1;
        node.x = Math.max(10, Math.min(w - 10, node.x));
        node.y = Math.max(10, Math.min(h - 10, node.y));
      }

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 150;
          
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.12;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(245, 158, 11, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      for (const node of nodes) {
        const pulse = 1 + Math.sin(t * 2 + node.pulsePhase) * 0.2;
        const r = node.radius * pulse;
        
        // Glow
        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r * 6);
        gradient.addColorStop(0, NODE_GLOW[node.type]);
        gradient.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(node.x, node.y, r * 6, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fillStyle = NODE_COLORS[node.type];
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [initNodes]);

  return (
    <canvas
      ref={canvasRef}
      className={cn('absolute inset-0 pointer-events-none', className)}
      aria-hidden="true"
    />
  );
}

// ======================== Animated Counter ========================

function MiniCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      // Delay start for stagger effect
      const timeout = setTimeout(() => {
        const start = performance.now();
        const duration = 1600;
        const animate = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 4);
          setDisplay(Math.round(value * eased));
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }, 300 + Math.random() * 400);
      return () => clearTimeout(timeout);
    } else {
      setDisplay(value);
    }
  }, [value]);

  return <>{display}{suffix}</>;
}

// ======================== Search Bar ========================

function HeroSearchBar() {
  const navigate = useNavigate();
  const { setCommandPaletteOpen } = useUIStore();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    } else {
      setCommandPaletteOpen(true);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className={cn(
        'relative flex items-center h-12 lg:h-14 rounded-xl overflow-hidden',
        'bg-surface-primary/80 backdrop-blur-md',
        'border border-border-primary',
        'shadow-lg shadow-black/10',
        'hover:border-accent-500/40 focus-within:border-accent-500/60',
        'transition-all duration-normal',
        'focus-within:shadow-accent-500/10 focus-within:shadow-xl',
        'group'
      )}>
        <div className="flex items-center justify-center w-12 lg:w-14 shrink-0">
          <Sparkles className="h-4 w-4 lg:h-5 lg:w-5 text-accent-500 group-focus-within:animate-pulse" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask anything about your industrial knowledge base..."
          className={cn(
            'flex-1 h-full bg-transparent border-none outline-none',
            'text-sm lg:text-base text-text-primary placeholder:text-text-tertiary',
            'pr-4'
          )}
        />
        <div className="flex items-center gap-2 pr-3 shrink-0">
          <kbd className="hidden lg:inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono bg-surface-secondary rounded-md border border-border-secondary text-text-tertiary">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
          <button
            type="submit"
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-lg',
              'bg-accent-500 text-text-on-accent',
              'hover:bg-accent-600 transition-colors',
              'shadow-md shadow-accent-500/20'
            )}
          >
            <Search className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </form>
  );
}

// ======================== Quick Action Pill ========================

interface QuickActionPillProps {
  icon: React.ReactNode;
  label: string;
  path: string;
  color: string;
}

function QuickActionPill({ icon, label, path, color }: QuickActionPillProps) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(path)}
      className={cn(
        'group flex items-center gap-2 px-4 py-2.5 rounded-lg',
        'bg-surface-primary/60 backdrop-blur-sm',
        'border border-border-primary/80',
        'hover:bg-surface-hover hover:border-border-secondary',
        'transition-all duration-normal',
        'hover:scale-[1.02] active:scale-[0.98]',
        'hover:shadow-md'
      )}
    >
      <span className={cn('transition-transform duration-normal group-hover:scale-110', color)}>
        {icon}
      </span>
      <span className="text-sm font-medium text-text-secondary group-hover:text-text-primary transition-colors">
        {label}
      </span>
      <ArrowRight className="h-3 w-3 text-text-tertiary opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
    </button>
  );
}

// ======================== Live Stat Card ========================

interface LiveStatProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  color: string;
  bgColor: string;
  delay?: number;
}

function LiveStat({ icon, label, value, suffix, color, bgColor }: LiveStatProps) {
  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 rounded-lg',
      'bg-surface-primary/50 backdrop-blur-sm',
      'border border-border-primary/60',
      'transition-all duration-normal hover:bg-surface-primary/80',
    )}>
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', bgColor, color)}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-text-primary font-mono leading-none">
          <MiniCounter value={value} suffix={suffix} />
        </p>
        <p className="text-[11px] text-text-tertiary mt-0.5 font-medium uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}

// ======================== Main Hero Export ========================

interface HeroSectionProps {
  totalDocs: number;
  indexedCount: number;
  pendingCount: number;
  expiringCount: number;
  docsLoading: boolean;
}

export function HeroSection({ totalDocs, indexedCount, pendingCount, expiringCount, docsLoading }: HeroSectionProps) {
  const username = useAuthStore((s) => s.username);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border-primary">
      {/* ---- Background layers ---- */}
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-bg-secondary via-bg-secondary to-accent-500/[0.04]" />
      
      {/* Radial accent glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] -translate-y-1/3 translate-x-1/4 rounded-full bg-accent-500/[0.04] blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] translate-y-1/3 -translate-x-1/4 rounded-full bg-blue-500/[0.03] blur-3xl" />
      
      {/* Network canvas */}
      <NetworkCanvas />
      
      {/* Dot grid overlay */}
      <div className="absolute inset-0 opacity-[0.025]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 0.5px, transparent 0)',
        backgroundSize: '20px 20px',
      }} />

      {/* ---- Content ---- */}
      <div className="relative z-10 px-6 py-10 lg:px-10 lg:py-14">
        {/* Top row: greeting + platform badge */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-500 flex items-center justify-center shadow-lg shadow-accent-500/25">
              <Cpu className="h-5 w-5 text-text-on-accent" />
            </div>
            <div>
              <p className="text-sm text-text-tertiary leading-none mb-0.5">
                {greeting}, <span className="text-text-secondary font-medium">{username ?? 'Engineer'}</span>
              </p>
              <p className="text-xs text-text-tertiary/70 font-mono uppercase tracking-widest">Industrial Intelligence</p>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
            </span>
            <span className="text-xs font-medium text-success">System Online</span>
          </div>
        </div>

        {/* Headline */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <h1 className="text-3xl lg:text-5xl font-bold text-text-primary tracking-tight leading-[1.15] mb-4">
            Your Industrial
            <span className="relative mx-2">
              <span className="relative z-10 bg-gradient-to-b from-[#C8FFE0] via-[#7BE495] to-[#2ECC71] bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(46,204,113,0.15)]">
                Knowledge Brain
              </span>
              <span className="absolute -bottom-1 left-0 right-0 h-[3px] bg-gradient-to-r from-[#7BE495]/60 to-[#2ECC71]/30 rounded-full" />
            </span>
          </h1>
          <p className="text-base lg:text-lg text-text-secondary leading-relaxed max-w-xl mx-auto">
            Unify documents, maintenance records, compliance data, and operational knowledge — 
            powered by AI to surface actionable insights in seconds.
          </p>
        </div>

        {/* AI Search Bar */}
        <div className="mb-8">
          <HeroSearchBar />
        </div>

        {/* Quick Action Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-10">
          <QuickActionPill icon={<Upload className="h-4 w-4" />} label="Upload Docs" path="/upload" color="text-amber-500" />
          <QuickActionPill icon={<MessageSquare className="h-4 w-4" />} label="AI Chat" path="/chat" color="text-emerald-500" />
          <QuickActionPill icon={<Search className="h-4 w-4" />} label="Search" path="/search" color="text-blue-500" />
          <QuickActionPill icon={<Network className="h-4 w-4" />} label="Knowledge Graph" path="/graph" color="text-purple-500" />
          <QuickActionPill icon={<Wrench className="h-4 w-4" />} label="Maintenance" path="/maintenance" color="text-teal-500" />
          <QuickActionPill icon={<Shield className="h-4 w-4" />} label="Compliance" path="/compliance" color="text-rose-500" />
        </div>

        {/* Live KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-3xl mx-auto">
          <LiveStat
            icon={<FileText className="h-4 w-4" />}
            label="Documents"
            value={totalDocs}
            color="text-blue-500"
            bgColor="bg-blue-500/10"
          />
          <LiveStat
            icon={<CheckCircle className="h-4 w-4" />}
            label="Indexed"
            value={indexedCount}
            color="text-emerald-500"
            bgColor="bg-emerald-500/10"
          />
          <LiveStat
            icon={<Brain className="h-4 w-4" />}
            label="Processing"
            value={pendingCount}
            color="text-amber-500"
            bgColor="bg-amber-500/10"
          />
          <LiveStat
            icon={<Shield className="h-4 w-4" />}
            label="Alerts"
            value={expiringCount}
            color={expiringCount > 0 ? "text-rose-500" : "text-emerald-500"}
            bgColor={expiringCount > 0 ? "bg-rose-500/10" : "bg-emerald-500/10"}
          />
        </div>
      </div>
    </section>
  );
}
