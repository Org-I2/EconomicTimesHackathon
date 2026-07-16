import React from 'react';
import { Lock, CheckCircle2, Server, Database, Cpu, ShieldCheck } from 'lucide-react';

/* ─── Architecture Diagram ─── */
function ArchitectureDiagram() {
  return (
    <div className="relative w-full max-w-4xl mx-auto mt-16">
      {/* Ambient teal glow behind diagram */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-teal-500/[0.05] blur-[120px] rounded-[100%] pointer-events-none" />
      
      {/* Outer shield boundary */}
      <div className="relative rounded-3xl border border-white/[0.08] bg-[#0e0e11]/80 backdrop-blur-xl p-8 md:p-12 shadow-2xl shadow-black/40">
        {/* Shield label */}
        <div className="absolute -top-4 left-8 flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0e0e11] border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-lg">
          <ShieldCheck className="w-4 h-4" /> Your Private Network
        </div>

        {/* Architecture flow */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4 mt-4">
          {/* Documents input */}
          <div className="flex flex-col items-center gap-4 flex-1">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-lg shadow-blue-500/5 group">
              <Database className="w-8 h-8 text-blue-400 group-hover:scale-110 transition-transform duration-500" />
            </div>
            <span className="text-xs text-zinc-400 text-center font-medium">Your<br />Documents</span>
          </div>

          {/* Arrow */}
          <div className="hidden md:block flex-shrink-0">
            <svg width="60" height="24" viewBox="0 0 60 24">
              <line x1="0" y1="12" x2="45" y2="12" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeDasharray="6 4"
                style={{ animation: 'pipeline-flow 2s linear infinite' }}
              />
              <polygon points="45,6 60,12 45,18" fill="rgba(255,255,255,0.15)" />
            </svg>
          </div>
          <div className="md:hidden">
            <svg width="24" height="40" viewBox="0 0 24 40">
              <line x1="12" y1="0" x2="12" y2="25" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeDasharray="6 4" />
              <polygon points="6,25 12,40 18,25" fill="rgba(255,255,255,0.15)" />
            </svg>
          </div>

          {/* Processing core */}
          <div className="flex flex-col items-center gap-4 flex-1 relative">
            <div className="w-16 h-16 rounded-2xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center relative shadow-lg shadow-accent-500/5 group">
              <Cpu className="w-8 h-8 text-accent-400 group-hover:scale-110 transition-transform duration-500" />
              {/* Orbiting dot */}
              <div className="absolute inset-[-10px] animate-[orbit_4s_linear_infinite]">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-accent-400 shadow-[0_0_10px_#f59e0b]" />
              </div>
            </div>
            <span className="text-xs text-zinc-400 text-center font-medium">Local LLM<br />(Ollama)</span>
          </div>

          {/* Arrow */}
          <div className="hidden md:block flex-shrink-0">
            <svg width="60" height="24" viewBox="0 0 60 24">
              <line x1="0" y1="12" x2="45" y2="12" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeDasharray="6 4"
                style={{ animation: 'pipeline-flow 2s linear infinite 0.5s' }}
              />
              <polygon points="45,6 60,12 45,18" fill="rgba(255,255,255,0.15)" />
            </svg>
          </div>
          <div className="md:hidden">
            <svg width="24" height="40" viewBox="0 0 24 40">
              <line x1="12" y1="0" x2="12" y2="25" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeDasharray="6 4" />
              <polygon points="6,25 12,40 18,25" fill="rgba(255,255,255,0.15)" />
            </svg>
          </div>

          {/* Storage */}
          <div className="flex gap-6 flex-1 justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/5 group">
                <Server className="w-8 h-8 text-emerald-400 group-hover:scale-110 transition-transform duration-500" />
              </div>
              <span className="text-xs text-zinc-400 text-center font-medium">SQLite</span>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-lg shadow-purple-500/5 group">
                <Database className="w-8 h-8 text-purple-400 group-hover:scale-110 transition-transform duration-500" />
              </div>
              <span className="text-xs text-zinc-400 text-center font-medium">ChromaDB</span>
            </div>
          </div>

          {/* Arrow */}
          <div className="hidden md:block flex-shrink-0">
            <svg width="60" height="24" viewBox="0 0 60 24">
              <line x1="0" y1="12" x2="45" y2="12" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeDasharray="6 4"
                style={{ animation: 'pipeline-flow 2s linear infinite 1s' }}
              />
              <polygon points="45,6 60,12 45,18" fill="rgba(255,255,255,0.15)" />
            </svg>
          </div>
          <div className="md:hidden">
            <svg width="24" height="40" viewBox="0 0 24 40">
              <line x1="12" y1="0" x2="12" y2="25" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeDasharray="6 4" />
              <polygon points="6,25 12,40 18,25" fill="rgba(255,255,255,0.15)" />
            </svg>
          </div>

          {/* Results */}
          <div className="flex flex-col items-center gap-4 flex-1">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shadow-lg shadow-cyan-500/5 group">
              <CheckCircle2 className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform duration-500" />
            </div>
            <span className="text-xs text-zinc-400 text-center font-medium">Actionable<br />Intelligence</span>
          </div>
        </div>

        {/* "Data never leaves" border animation */}
        <div className="absolute inset-0 rounded-3xl pointer-events-none overflow-hidden">
          <div
            className="absolute inset-0 rounded-3xl"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0%, rgba(34,197,94,0.2) 10%, transparent 25%)',
              animation: 'orbit 6s linear infinite',
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Security Section ─── */
export function SecuritySection() {
  const badges = [
    { icon: <Cpu className="w-3.5 h-3.5 text-accent-400" />, label: 'Local LLM Execution' },
    { icon: <Database className="w-3.5 h-3.5 text-purple-400" />, label: 'Embedded Vector DB' },
    { icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />, label: 'Air-Gapped Ready' },
    { icon: <Server className="w-3.5 h-3.5 text-blue-400" />, label: 'On-Premise Only' },
  ];

  return (
    <section id="security" className="py-32 relative overflow-hidden border-y border-white/5 bg-black/20">
      {/* Concentric rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl aspect-square pointer-events-none opacity-[0.04]">
        <div className="absolute inset-0 rounded-full border border-white/30 animate-[spin_80s_linear_infinite]" />
        <div className="absolute inset-20 rounded-full border border-white/40 animate-[spin_50s_linear_infinite_reverse]" />
        <div className="absolute inset-40 rounded-full border border-emerald-500/30 animate-[spin_30s_linear_infinite]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <div className="text-center" data-reveal>
          <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-8 backdrop-blur-md">
            <Lock className="w-6 h-6 text-zinc-300" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-6">
            Zero Cloud Dependencies.
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto mb-8 font-light">
            Industrial data is highly sensitive. UAO Brain runs completely on-premises using local open-weight models and an embedded vector engine.{' '}
            <span className="text-zinc-200 font-medium">Your data never leaves your network.</span>
          </p>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-4" data-reveal data-reveal-delay="200">
            {badges.map((b, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs font-medium text-zinc-300 hover:border-white/10 transition-colors"
              >
                {b.icon} {b.label}
              </div>
            ))}
          </div>
        </div>

        {/* Architecture diagram */}
        <div data-reveal data-reveal-delay="400">
          <ArchitectureDiagram />
        </div>
      </div>
    </section>
  );
}
