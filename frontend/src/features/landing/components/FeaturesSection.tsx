import React from 'react';
import { Network, Search, Brain, Wrench } from 'lucide-react';

/* ─── Knowledge Graph Visualization ─── */
function GraphViz() {
  const nodes = [
    { cx: 80, cy: 50, r: 5, color: '#f59e0b', label: 'Pump' },
    { cx: 160, cy: 30, r: 4, color: '#3b82f6', label: 'SOP' },
    { cx: 140, cy: 100, r: 4, color: '#22c55e', label: 'Manual' },
    { cx: 220, cy: 70, r: 5, color: '#ef4444', label: 'Incident' },
    { cx: 50, cy: 110, r: 3, color: '#a855f7', label: 'Tech' },
    { cx: 200, cy: 130, r: 3, color: '#14b8a6', label: 'Lesson' },
  ];
  const edges = [
    [0, 1], [0, 2], [0, 3], [0, 4], [3, 5], [1, 3], [2, 5],
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="absolute inset-0 bg-accent-500/[0.03] group-hover:bg-accent-500/[0.08] blur-[60px] rounded-full transition-colors duration-700 pointer-events-none" />
      <svg viewBox="0 0 230 140" className="w-full h-full opacity-50 group-hover:opacity-100 transition-opacity duration-700 transform group-hover:scale-105">
        {edges.map(([a, b], i) => (
          <line
            key={i}
            x1={nodes[a].cx} y1={nodes[a].cy}
            x2={nodes[b].cx} y2={nodes[b].cy}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            style={{ animation: `flow-dash 2.5s linear infinite`, animationDelay: `${i * 0.2}s` }}
          />
        ))}
        {nodes.map((n, i) => (
          <g key={i}>
            <circle cx={n.cx} cy={n.cy} r={n.r * 2.5} fill={n.color} opacity="0.12" />
            <circle
              cx={n.cx} cy={n.cy} r={n.r} fill={n.color} opacity="0.9"
              style={{ animation: `node-pulse 3s ease-in-out infinite`, animationDelay: `${i * 0.5}s` }}
            />
            <text x={n.cx} y={n.cy + n.r + 14} textAnchor="middle" fill="rgba(161,161,170,0.8)" fontSize="8" fontFamily="Inter">{n.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ─── Search Results Visualization ─── */
function SearchViz() {
  const results = [
    { title: 'Pump P-301 Maintenance SOP', score: '98.2%', type: 'SOP' },
    { title: 'Q3 Vibration Analysis Report', score: '94.7%', type: 'Report' },
    { title: 'Motor M-12 Replacement Guide', score: '91.1%', type: 'Manual' },
  ];

  return (
    <div className="relative space-y-3 opacity-40 group-hover:opacity-100 transition-all duration-700 transform group-hover:scale-105 group-hover:-translate-y-2 mt-4">
      <div className="absolute inset-0 bg-blue-500/[0.03] group-hover:bg-blue-500/[0.08] blur-[60px] rounded-full transition-colors duration-700 pointer-events-none" />
      {/* Search bar mockup */}
      <div className="relative flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] shadow-lg shadow-black/40">
        <Search className="w-4 h-4 text-zinc-400" />
        <span className="text-sm text-zinc-300">pump P-301 vibration</span>
      </div>
      {/* Results */}
      {results.map((r, i) => (
        <div
          key={i}
          className="relative flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04] group-hover:border-white/[0.1] shadow-md transition-all"
          style={{
            animation: 'slide-in-results 0.5s ease-out both',
            animationDelay: `${0.8 + i * 0.15}s`,
            animationPlayState: 'paused',
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-[10px] px-2 py-1 rounded bg-white/5 text-zinc-400 shrink-0 font-medium">{r.type}</span>
            <span className="text-sm text-zinc-200 truncate">{r.title}</span>
          </div>
          <span className="text-xs text-emerald-400/90 shrink-0 ml-3 font-semibold">{r.score}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Chat Visualization ─── */
function ChatViz() {
  return (
    <div className="relative space-y-4 opacity-40 group-hover:opacity-100 transition-all duration-700 transform group-hover:scale-105 group-hover:-translate-y-2 mt-4">
      <div className="absolute inset-0 bg-emerald-500/[0.03] group-hover:bg-emerald-500/[0.08] blur-[60px] rounded-full transition-colors duration-700 pointer-events-none" />
      {/* User message */}
      <div className="relative flex justify-end">
        <div className="px-4 py-3 rounded-2xl rounded-tr-sm bg-accent-500/20 border border-accent-500/15 max-w-[85%] shadow-lg shadow-black/20">
          <p className="text-sm text-zinc-100">What's the torque spec for pump P-301 bearing assembly?</p>
        </div>
      </div>
      {/* AI response */}
      <div className="relative flex justify-start">
        <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white/[0.04] border border-white/[0.08] max-w-[90%] shadow-lg shadow-black/20">
          <p className="text-sm text-zinc-300 leading-relaxed">
            According to <span className="text-accent-400 font-medium">SOP-4412 §3.2</span>, the bearing assembly requires <span className="text-white font-semibold">45 Nm ± 5 Nm</span> torque...
          </p>
          <div className="mt-3 flex items-center gap-2 text-[10px] text-zinc-400">
            <span className="px-2 py-1 rounded bg-white/10 font-medium border border-white/5">SOP-4412</span>
            <span className="px-2 py-1 rounded bg-white/10 font-medium border border-white/5">OEM-Manual-P3</span>
          </div>
        </div>
      </div>
      {/* Typing indicator */}
      <div className="relative flex justify-start">
        <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white/[0.03] border border-white/[0.05]">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-zinc-400"
                style={{ animation: `typing-dots 1.4s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── RCA Tree Visualization ─── */
function RcaViz() {
  return (
    <div className="relative w-full h-full flex items-center justify-center opacity-40 group-hover:opacity-100 transition-all duration-700 transform group-hover:scale-105">
      <div className="absolute inset-0 bg-rose-500/[0.03] group-hover:bg-rose-500/[0.08] blur-[60px] rounded-full transition-colors duration-700 pointer-events-none" />
      <svg viewBox="0 0 260 140" className="w-full h-full relative z-10">
        {/* Root */}
        <rect x="90" y="8" width="80" height="26" rx="6" fill="rgba(239,68,68,0.2)" stroke="rgba(239,68,68,0.4)" strokeWidth="1.5" />
        <text x="130" y="25" textAnchor="middle" fill="#fecaca" fontSize="9" fontFamily="Inter" fontWeight="600">Pump Failure</text>

        {/* Level 1 connections */}
        <line x1="110" y1="34" x2="60" y2="60" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeDasharray="4 3" style={{ animation: 'flow-dash 2s linear infinite' }} />
        <line x1="150" y1="34" x2="200" y2="60" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeDasharray="4 3" style={{ animation: 'flow-dash 2s linear infinite 0.3s' }} />

        {/* Level 1 nodes */}
        <rect x="15" y="56" width="90" height="24" rx="5" fill="rgba(245,158,11,0.15)" stroke="rgba(245,158,11,0.3)" strokeWidth="1.5" />
        <text x="60" y="72" textAnchor="middle" fill="#fde68a" fontSize="8" fontFamily="Inter">Bearing Wear</text>

        <rect x="155" y="56" width="90" height="24" rx="5" fill="rgba(245,158,11,0.15)" stroke="rgba(245,158,11,0.3)" strokeWidth="1.5" />
        <text x="200" y="72" textAnchor="middle" fill="#fde68a" fontSize="8" fontFamily="Inter">Seal Degradation</text>

        {/* Level 2 connections */}
        <line x1="40" y1="80" x2="20" y2="106" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="3 2" style={{ animation: 'flow-dash 2s linear infinite 0.6s' }} />
        <line x1="80" y1="80" x2="100" y2="106" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="3 2" style={{ animation: 'flow-dash 2s linear infinite 0.9s' }} />
        <line x1="200" y1="80" x2="220" y2="106" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="3 2" style={{ animation: 'flow-dash 2s linear infinite 1.2s' }} />

        {/* Level 2 nodes */}
        <rect x="-8" y="102" width="60" height="22" rx="4" fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.2)" strokeWidth="1" />
        <text x="22" y="117" textAnchor="middle" fill="#bfdbfe" fontSize="7" fontFamily="Inter">Lubrication</text>

        <rect x="72" y="102" width="60" height="22" rx="4" fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.2)" strokeWidth="1" />
        <text x="102" y="117" textAnchor="middle" fill="#bfdbfe" fontSize="7" fontFamily="Inter">Vibration</text>

        <rect x="192" y="102" width="60" height="22" rx="4" fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.2)" strokeWidth="1" />
        <text x="222" y="117" textAnchor="middle" fill="#bfdbfe" fontSize="7" fontFamily="Inter">Temperature</text>

        {/* Highlight root cause */}
        <circle cx="22" cy="142" r="4" fill="#34d399" opacity="0.9" style={{ animation: 'node-pulse 2s ease-in-out infinite' }} />
        <text x="34" y="145" fill="#a7f3d0" fontSize="7.5" fontFamily="Inter" fontWeight="600">← Root Cause</text>
      </svg>
    </div>
  );
}

/* ─── Features Section ─── */
export function FeaturesSection() {
  return (
    <section id="features" className="py-28 relative">
      {/* Subtle background shift */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/50 to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="mb-16" data-reveal>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-4">
            Powerful primitives for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-300 to-zinc-500">heavy industries.</span>
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl font-light">
            Everything you need to turn unstructured industrial data into a semantic knowledge graph. Built for scale, designed for speed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* ── Knowledge Graph (2-col) ── */}
          <div className="md:col-span-2 relative group overflow-hidden rounded-3xl bg-zinc-900/50 border border-white/[0.08] hover:border-accent-500/30 shadow-2xl transition-all duration-500" data-reveal>
            <div className="absolute inset-0 bg-gradient-to-br from-accent-500/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative z-10 p-10 lg:p-12 flex flex-col lg:flex-row gap-8 min-h-[420px]">
              <div className="flex-1 flex flex-col justify-center">
                <div className="w-12 h-12 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-accent-500/20 transition-all duration-500 shadow-lg">
                  <Network className="w-6 h-6 text-accent-500" />
                </div>
                <h3 className="text-3xl font-semibold tracking-tight mb-3 text-zinc-100">Knowledge Graph</h3>
                <p className="text-zinc-400 leading-relaxed text-base max-w-sm">
                  Automatically extract entities, components, and relationships from P&IDs and manuals to build a living semantic map of your entire facility.
                </p>
              </div>
              <div className="flex-1 flex items-center justify-center relative">
                <GraphViz />
              </div>
            </div>
          </div>

          {/* ── Semantic Search (1-col) ── */}
          <div className="relative group overflow-hidden rounded-3xl bg-zinc-900/50 border border-white/[0.08] hover:border-blue-500/30 shadow-2xl transition-all duration-500" data-reveal data-reveal-delay="100">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative z-10 p-10 flex flex-col min-h-[420px]">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-500 shadow-lg">
                <Search className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-2xl font-semibold tracking-tight mb-3 text-zinc-100">Semantic Search</h3>
              <p className="text-zinc-400 leading-relaxed text-base mb-6">
                Find exact specifications instantly using dense vector embeddings.
              </p>
              <div className="flex-1 flex items-center justify-center">
                <div className="w-full">
                  <SearchViz />
                </div>
              </div>
            </div>
          </div>

          {/* ── AI Chat (1-col) ── */}
          <div className="relative group overflow-hidden rounded-3xl bg-zinc-900/50 border border-white/[0.08] hover:border-emerald-500/30 shadow-2xl transition-all duration-500" data-reveal data-reveal-delay="200">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative z-10 p-10 flex flex-col min-h-[420px]">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-500 shadow-lg">
                <Brain className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-semibold tracking-tight mb-3 text-zinc-100">AI Copilot</h3>
              <p className="text-zinc-400 leading-relaxed text-base mb-6">
                Chat directly with your manuals. RAG ensures accuracy and cites sources.
              </p>
              <div className="flex-1 flex items-end">
                <div className="w-full">
                  <ChatViz />
                </div>
              </div>
            </div>
          </div>

          {/* ── Predictive RCA (2-col) ── */}
          <div className="md:col-span-2 relative group overflow-hidden rounded-3xl bg-zinc-900/50 border border-white/[0.08] hover:border-rose-500/30 shadow-2xl transition-all duration-500" data-reveal data-reveal-delay="300">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative z-10 p-10 lg:p-12 flex flex-col lg:flex-row gap-8 min-h-[360px]">
              <div className="flex-1 flex flex-col justify-center">
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-rose-500/20 transition-all duration-500 shadow-lg">
                  <Wrench className="w-6 h-6 text-rose-400" />
                </div>
                <h3 className="text-3xl font-semibold tracking-tight mb-3 text-zinc-100">Predictive RCA</h3>
                <p className="text-zinc-400 leading-relaxed text-base max-w-sm">
                  Correlate historical breakdowns and compliance flags to identify root causes faster than ever before.
                </p>
              </div>
              <div className="flex-1 flex items-center justify-center relative">
                <RcaViz />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
