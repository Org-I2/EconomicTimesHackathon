import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Cpu, BookOpen, Zap, CreditCard, Clock, Rocket } from 'lucide-react';

export function CTASection() {
  const navigate = useNavigate();

  return (
    <footer className="relative overflow-hidden">
      {/* CTA Block */}
      <section className="py-28 relative">
        {/* Ambient glows */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[400px] bg-accent-500/[0.06] blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[300px] bg-blue-500/[0.05] blur-[120px] rounded-full pointer-events-none" />

        {/* Background graph nodes */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03]" preserveAspectRatio="xMidYMid slice">
          {Array.from({ length: 15 }).map((_, i) => (
            <circle
              key={i}
              cx={`${10 + Math.random() * 80}%`}
              cy={`${10 + Math.random() * 80}%`}
              r="2"
              fill="#f59e0b"
              style={{ animation: `node-pulse 3s ease-in-out infinite`, animationDelay: `${i * 0.3}s` }}
            />
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <line
              key={`l${i}`}
              x1={`${15 + i * 10}%`}
              y1={`${20 + Math.random() * 60}%`}
              x2={`${25 + i * 10}%`}
              y2={`${20 + Math.random() * 60}%`}
              stroke="rgba(245,158,11,0.1)"
              strokeWidth="0.5"
              strokeDasharray="4 4"
              style={{ animation: 'flow-dash 3s linear infinite', animationDelay: `${i * 0.4}s` }}
            />
          ))}
        </svg>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center" data-reveal>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">
            Transform your industrial{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#C8FFE0] via-[#7BE495] to-[#2ECC71] drop-shadow-[0_0_20px_rgba(46,204,113,0.15)]">
              operations today.
            </span>
          </h2>
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 font-light">
            Join forward-thinking industrial teams who are already using UAO Brain to unify their knowledge, predict failures, and maintain compliance — all running locally.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <button
              onClick={() => navigate('/signup')}
              className="flex items-center justify-center gap-3 px-10 py-4 rounded-xl bg-white text-black hover:bg-zinc-100 transition-all font-semibold text-base active:scale-95 shadow-[0_0_30px_-5px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_-5px_rgba(255,255,255,0.4)]"
            >
              Start Building Free <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="flex items-center justify-center gap-3 px-10 py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all font-medium text-base text-zinc-300 shadow-lg"
            >
              <Rocket className="w-4 h-4 text-zinc-400" /> Schedule a Demo
            </button>
          </div>

          {/* Tertiary link */}
          <a
            href="#"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors font-medium mb-10"
          >
            <BookOpen className="w-3 h-3" /> Read the Documentation
          </a>

          {/* Confidence indicators */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-zinc-500">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-accent-500/60" /> Free tier available
            </span>
            <span className="flex items-center gap-1.5">
              <CreditCard className="w-3 h-3 text-zinc-600" /> No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-zinc-600" /> Deploy in minutes
            </span>
          </div>
        </div>
      </section>

      {/* Footer bar */}
      <div className="border-t border-white/5 py-8 bg-[#0e0e11]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-600">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4" /> UAO Brain
          </div>
          <p>© 2026 Unified Asset & Operations Brain. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
