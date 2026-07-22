import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, FileText, Link2, Play, Sparkles, Cpu, Database, Activity, Settings2, ShieldCheck, Thermometer, Box } from 'lucide-react';
import { HeroDecorations } from './HeroDecorations';
import { HeroIllustration } from './HeroIllustration';

/* ─── Glass Feature Chip ─── */
function GlassFeatureChip({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <div
      className={`absolute hidden lg:flex items-center justify-center px-5 py-2.5 rounded-full bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] shadow-[0_0_20px_rgba(0,0,0,0.5),inset_0_0_10px_rgba(255,255,255,0.02)] ${className} overflow-hidden group hover:bg-white/[0.04] transition-colors`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-all duration-1000 -skew-x-12 translate-x-[-150%] group-hover:translate-x-[150%]" />
      <span className="relative z-10 text-[11px] text-zinc-400 font-mono tracking-widest uppercase group-hover:text-zinc-200 transition-colors shadow-[0_0_10px_rgba(255,255,255,0)] group-hover:shadow-[0_0_10px_rgba(255,255,255,0.2)]">
        {text}
      </span>
    </div>
  );
}

/* ─── Animated Search Bar ─── */
const searchSuggestions = [
  'Find pump P-301 maintenance history...',
  'What caused the Q3 compressor failure?',
  'Show me all SOPs for turbine assembly...',
  'List overdue compliance inspections...',
  'Vibration analysis for Motor M-12...',
];

function AnimatedSearchBar() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const target = searchSuggestions[currentIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting && displayText.length < target.length) {
      timeout = setTimeout(() => {
        setDisplayText(target.slice(0, displayText.length + 1));
      }, 40 + Math.random() * 30);
    } else if (!isDeleting && displayText.length === target.length) {
      timeout = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && displayText.length > 0) {
      timeout = setTimeout(() => {
        setDisplayText(displayText.slice(0, -1));
      }, 20);
    } else if (isDeleting && displayText.length === 0) {
      setIsDeleting(false);
      setCurrentIndex((prev) => (prev + 1) % searchSuggestions.length);
    }

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentIndex]);

  return (
    <div className="w-full max-w-2xl mx-auto mt-12 relative group z-50">
      {/* Background Search Pulse & Glow */}
      <div className="absolute inset-[-4px] bg-gradient-to-r from-accent-500/30 via-blue-500/30 to-accent-500/30 rounded-2xl blur-xl opacity-40 group-hover:opacity-80 transition-opacity duration-700 pointer-events-none" />
      <div className="absolute inset-0 rounded-2xl bg-white/[0.03] animate-[pulse-dot_2s_infinite] pointer-events-none" />
      <div className="absolute inset-0 border border-accent-500/20 rounded-2xl animate-[pulse-dot_3s_infinite] pointer-events-none" />

      <div className="relative flex items-center gap-4 px-6 py-4 rounded-2xl bg-black/60 border border-white/[0.1] backdrop-blur-2xl shadow-[0_0_50px_-10px_rgba(0,0,0,0.8)] transition-all duration-300 group-hover:border-white/[0.2]">
        <div className="relative">
          <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-accent-400 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
          <svg className="w-6 h-6 text-accent-500/80 shrink-0 group-hover:text-accent-400 transition-colors animate-[spin_4s_linear_infinite]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeDasharray="4 4">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <span className="text-base text-zinc-200 font-medium tracking-wide">
          {displayText}
          <span className="inline-block w-[3px] h-6 bg-accent-500 ml-1 align-middle animate-[pulse_0.8s_steps(2,start)_infinite] shadow-[0_0_12px_rgba(245,158,11,1)]" />
        </span>
      </div>
    </div>
  );
}

/* ─── Mouse-Reactive Glow ─── */
function useMouseGlow() {
  const ref = useRef<HTMLElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!ref.current || !glowRef.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    glowRef.current.style.setProperty('--mouse-x', `${x}px`);
    glowRef.current.style.setProperty('--mouse-y', `${y}px`);
    
    glowRef.current.style.background = `
      radial-gradient(800px circle at ${x}px ${y}px, rgba(245,158,11,0.08), transparent 50%),
      radial-gradient(400px circle at ${x}px ${y}px, rgba(59,130,246,0.04), transparent 50%)
    `;
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener('mousemove', handleMouseMove);
    return () => el.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  return { sectionRef: ref, glowRef };
}

/* ─── Hero Section ─── */
export function HeroSection() {
  const navigate = useNavigate();
  const { sectionRef, glowRef } = useMouseGlow();

  return (
    <section
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="relative pt-28 pb-16 lg:pt-40 lg:pb-32 overflow-hidden min-h-screen flex flex-col items-center"
    >
      {/* Background and Cinematic Decorations */}
      <HeroDecorations />

      {/* Mouse-reactive glow */}
      <div ref={glowRef} className="absolute inset-0 pointer-events-none z-0 transition-all duration-300 mix-blend-screen opacity-50" />

      {/* HUD Annotations */}
      <div className="absolute top-[12%] left-6 xl:left-10 hidden xl:flex flex-col gap-1 text-[10px] text-zinc-600 font-mono tracking-widest opacity-60">
        <span>[SYS.CORE.01] ONLINE</span>
        <span className="text-zinc-700">OPT_193.42</span>
      </div>
      <div className="absolute top-[12%] right-6 xl:right-10 hidden xl:flex flex-col items-end gap-1 text-[10px] text-zinc-600 font-mono tracking-widest opacity-60">
        <span>VECTOR_DB_SYNC</span>
        <span className="text-emerald-500/50">STABLE</span>
      </div>
      <div className="absolute bottom-[10%] left-6 xl:left-10 hidden xl:flex flex-col gap-1 text-[10px] text-zinc-600 font-mono tracking-widest opacity-60">
        <span>LAT_41.8_LON_71.3</span>
        <span className="text-zinc-700">GRID_ALIGN</span>
      </div>
      <div className="absolute bottom-[10%] right-6 xl:right-10 hidden xl:flex flex-col items-end gap-1 text-[10px] text-zinc-600 font-mono tracking-widest opacity-60">
        <span>NET_OK</span>
        <span className="text-blue-500/50 animate-pulse">0MS</span>
      </div>

      {/* Feature Chips around the absolute edges */}
      {/* LEFT SIDE CARDS */}
      <GlassFeatureChip
        text="Knowledge Graph"
        className="top-[18%] left-4 xl:left-14 animate-float-gentle z-40 origin-left"
      />
      <GlassFeatureChip
        text="Semantic Search"
        className="top-[35%] left-10 xl:left-24 animate-float-gentle-delayed z-40 origin-left scale-90"
      />
      <GlassFeatureChip
        text="AI Copilot"
        className="top-[52%] left-2 xl:left-10 animate-float-gentle z-40 origin-left"
      />
      <GlassFeatureChip
        text="Document Intelligence"
        className="top-[68%] left-8 xl:left-20 animate-float-gentle-delayed z-40 origin-left scale-90"
      />
      <GlassFeatureChip
        text="Local AI"
        className="top-[85%] left-4 xl:left-14 animate-float-gentle z-40 origin-left"
      />

      {/* RIGHT SIDE CARDS */}
      <GlassFeatureChip
        text="OCR Pipeline"
        className="top-[20%] right-8 xl:right-20 animate-float-gentle-delayed z-40 origin-right scale-90"
      />
      <GlassFeatureChip
        text="Maintenance AI"
        className="top-[38%] right-2 xl:right-12 animate-float-gentle z-40 origin-right"
      />
      <GlassFeatureChip
        text="Compliance Engine"
        className="top-[55%] right-10 xl:right-28 animate-float-gentle-delayed z-40 origin-right scale-90"
      />
      <GlassFeatureChip
        text="Predictive Analytics"
        className="top-[72%] right-4 xl:right-14 animate-float-gentle z-40 origin-right"
      />
      <GlassFeatureChip
        text="Vector Search"
        className="top-[88%] right-8 xl:right-20 animate-float-gentle-delayed z-40 origin-right scale-90"
      />

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center flex flex-col items-center">
        {/* Announcement pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-xs font-medium mb-8 hover:bg-white/10 transition-colors cursor-pointer group shadow-[0_0_20px_rgba(255,255,255,0.05)]">
          <span className="flex h-2 w-2 rounded-full bg-accent-500 animate-pulse shadow-[0_0_8px_#f59e0b]" />
          UAO Brain Enterprise 2.0 is now available
          <ArrowRight className="w-3 h-3 text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
        </div>

        {/* Headline */}
        <h1 className="text-6xl md:text-8xl lg:text-[7rem] font-medium tracking-tight text-zinc-300 mb-6 leading-[1.05] drop-shadow-xl">
          Industrial intelligence,{' '}
          <br className="hidden sm:block" />
          <span className="font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-[#C8FFE0] via-[#7BE495] to-[#2ECC71] drop-shadow-[0_0_20px_rgba(46,204,113,0.15)]">
            unified.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-2xl text-zinc-300 max-w-3xl mx-auto mb-10 leading-relaxed font-light drop-shadow-lg">
          The OS for heavy industry. Transform scattered manuals, messy maintenance logs, and siloed compliance data into a cohesive, actionable knowledge engine — powered by local AI.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full sm:w-auto mt-6 relative z-50">
          {/* Ambient light behind primary button */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[80px] bg-accent-500/30 blur-[50px] rounded-full pointer-events-none" />
          
          <button
            onClick={() => navigate('/signup')}
            className="group relative w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 rounded-2xl bg-white text-black hover:bg-zinc-100 transition-all font-bold text-base active:scale-95 shadow-[0_0_40px_-5px_rgba(255,255,255,0.6)] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-40 transform -skew-x-12 translate-x-[-150%] group-hover:translate-x-[150%] transition-all duration-700 ease-in-out" />
            Start Building Free <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => navigate('/login')}
            className="group w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 rounded-2xl bg-black/40 border border-white/20 hover:bg-white/10 hover:border-white/30 transition-all font-medium text-base text-zinc-200 backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.5)]"
          >
            <Play className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" /> Watch 2-min Demo
          </button>
        </div>

        {/* Animated Search Bar */}
        <AnimatedSearchBar />
      </div>

      {/* Visual Centerpiece (Digital Twin Pipeline) */}
      <HeroIllustration />
    </section>
  );
}
