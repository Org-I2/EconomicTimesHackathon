import React from 'react';
import {
  LayoutDashboard, MessageSquare, Network, TrendingUp, AlertTriangle, FileText, CheckCircle2
} from 'lucide-react';

/* ─── Dashboard Mockup ─── */
function DashboardMockup() {
  return (
    <div className="relative rounded-2xl border border-white/[0.08] bg-[#0e0e11]/90 backdrop-blur-md overflow-hidden shadow-[0_0_50px_-12px_rgba(0,0,0,0.8)] z-10">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      {/* Title bar */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.08] bg-white/[0.02]">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/50" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
          <div className="w-3 h-3 rounded-full bg-green-500/50" />
        </div>
        <span className="text-xs text-zinc-500 ml-3 font-mono">dashboard — UAO Brain</span>
      </div>
      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Metric row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Documents', value: '847', icon: <FileText className="w-5 h-5" />, color: 'text-blue-400' },
            { label: 'Entities', value: '12.4k', icon: <Network className="w-5 h-5" />, color: 'text-accent-400' },
            { label: 'Compliance', value: '94%', icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-emerald-400' },
          ].map((m, i) => (
            <div key={i} className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-5 shadow-inner">
              <div className={`${m.color} mb-3`}>{m.icon}</div>
              <div className="text-3xl font-bold text-zinc-100 mb-1">{m.value}</div>
              <div className="text-xs text-zinc-400 font-medium">{m.label}</div>
            </div>
          ))}
        </div>
        {/* Mini chart */}
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-4 h-32 flex items-end gap-1.5 shadow-inner">
          {[40, 55, 35, 70, 60, 80, 65, 75, 90, 70, 85, 95].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-gradient-to-t from-accent-500/20 to-accent-500/50"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        {/* Alert row */}
        <div className="flex items-center gap-3 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 shadow-inner">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs text-zinc-300 font-medium">Pump P-301 bearing vibration exceeds threshold</span>
          <span className="text-[10px] text-amber-400/60 ml-auto shrink-0 font-mono">2h ago</span>
        </div>
      </div>
    </div>
  );
}

/* ─── AI Chat Mockup ─── */
function ChatMockup() {
  return (
    <div className="relative rounded-2xl border border-white/[0.08] bg-[#0e0e11]/90 backdrop-blur-md overflow-hidden shadow-[0_0_50px_-12px_rgba(0,0,0,0.8)] z-10">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.08] bg-white/[0.02]">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/50" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
          <div className="w-3 h-3 rounded-full bg-green-500/50" />
        </div>
        <span className="text-xs text-zinc-500 ml-3 font-mono">ai-chat — UAO Brain</span>
      </div>
      <div className="p-6 space-y-5">
        {/* User */}
        <div className="flex justify-end">
          <div className="px-4 py-3 rounded-2xl rounded-tr-sm bg-accent-500/15 border border-accent-500/10 max-w-[80%] shadow-lg">
            <p className="text-sm text-zinc-100 font-medium">Show me the maintenance history for compressor C-205</p>
          </div>
        </div>
        {/* AI */}
        <div className="flex justify-start">
          <div className="px-5 py-4 rounded-2xl rounded-tl-sm bg-white/[0.04] border border-white/[0.08] max-w-[85%] shadow-lg">
            <p className="text-sm text-zinc-300 leading-relaxed">
              Compressor C-205 has <span className="text-white font-semibold">12 maintenance records</span> over the past 24 months. The most recent was a <span className="text-accent-400 font-medium">bearing replacement</span> on 2026-06-15...
            </p>
            <div className="mt-4 flex gap-2 flex-wrap">
              <span className="text-[10px] px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">WO-2891</span>
              <span className="text-[10px] px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">SOP-1124</span>
              <span className="text-[10px] px-2 py-1 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">OEM-C205</span>
            </div>
          </div>
        </div>
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] shadow-inner mt-4">
          <span className="text-sm text-zinc-500 flex-1 font-light">Ask about your documents...</span>
          <div className="w-8 h-8 rounded-lg bg-accent-500/20 flex items-center justify-center border border-accent-500/30">
            <TrendingUp className="w-4 h-4 text-accent-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Knowledge Graph Mockup ─── */
function GraphMockup() {
  const nodes = [
    { cx: 120, cy: 80, r: 8, color: '#f59e0b' },
    { cx: 220, cy: 50, r: 6, color: '#3b82f6' },
    { cx: 200, cy: 130, r: 7, color: '#22c55e' },
    { cx: 300, cy: 100, r: 6, color: '#ef4444' },
    { cx: 70, cy: 130, r: 4, color: '#a855f7' },
    { cx: 270, cy: 160, r: 5, color: '#14b8a6' },
    { cx: 170, cy: 190, r: 5, color: '#f59e0b' },
    { cx: 350, cy: 60, r: 4, color: '#6366f1' },
  ];
  const edges = [[0,1],[0,2],[0,3],[0,4],[3,5],[2,6],[1,7],[3,7]];

  return (
    <div className="relative rounded-2xl border border-white/[0.08] bg-[#0e0e11]/90 backdrop-blur-md overflow-hidden shadow-[0_0_50px_-12px_rgba(0,0,0,0.8)] z-10">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.08] bg-white/[0.02]">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/50" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
          <div className="w-3 h-3 rounded-full bg-green-500/50" />
        </div>
        <span className="text-xs text-zinc-500 ml-3 font-mono">knowledge-graph — UAO Brain</span>
      </div>
      <div className="p-6 h-[300px]">
        <svg viewBox="0 0 420 220" className="w-full h-full">
          {edges.map(([a,b], i) => (
            <line key={i} x1={nodes[a].cx} y1={nodes[a].cy} x2={nodes[b].cx} y2={nodes[b].cy}
              stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeDasharray="4 4"
              style={{ animation: `flow-dash 2.5s linear infinite`, animationDelay: `${i * 0.2}s` }}
            />
          ))}
          {nodes.map((n, i) => (
            <g key={i}>
              <circle cx={n.cx} cy={n.cy} r={n.r * 2.5} fill={n.color} opacity="0.08" />
              <circle cx={n.cx} cy={n.cy} r={n.r} fill={n.color} opacity="0.9"
                style={{ animation: `node-pulse 3s ease-in-out infinite`, animationDelay: `${i * 0.4}s` }}
              />
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

/* ─── Product Showcase Section ─── */
export function ProductShowcase() {
  const showcases = [
    {
      title: 'Real-time Operations Dashboard',
      desc: 'Monitor document processing, entity relationships, compliance status, and maintenance alerts — all in a single unified view designed for industrial operators.',
      mockup: <DashboardMockup />,
      icon: <LayoutDashboard className="w-5 h-5 text-accent-400" />,
    },
    {
      title: 'AI-Powered Chat Intelligence',
      desc: 'Ask natural language questions about your entire document corpus. Every answer is grounded in source documents with full citation trails.',
      mockup: <ChatMockup />,
      icon: <MessageSquare className="w-5 h-5 text-emerald-400" />,
    },
    {
      title: 'Living Knowledge Graph',
      desc: 'Visualize the semantic relationships between equipment, SOPs, incidents, and personnel. Navigate your facility knowledge like never before.',
      mockup: <GraphMockup />,
      icon: <Network className="w-5 h-5 text-blue-400" />,
    },
  ];

  return (
    <section id="product" className="py-28 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/30 to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="text-center mb-20" data-reveal>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-4">
            See it in action.
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto font-light">
            UAO Brain doesn't just describe capabilities — it delivers them through a purpose-built interface designed for industrial workflows.
          </p>
        </div>

        <div className="space-y-24">
          {showcases.map((item, i) => {
            const isReversed = i % 2 === 1;
            return (
              <div
                key={i}
                className={`flex flex-col ${isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-12 lg:gap-20 items-center relative`}
                data-reveal
                data-reveal-delay={String(i * 100)}
              >
                {/* Ambient Glow */}
                <div className={`absolute top-1/2 ${isReversed ? 'left-1/4' : 'right-1/4'} -translate-y-1/2 w-[500px] h-[500px] bg-white/[0.02] blur-[100px] rounded-full pointer-events-none`} />

                {/* Text */}
                <div className="flex-1 max-w-lg relative z-20">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-lg">
                    {item.icon}
                  </div>
                  <h3 className="text-3xl font-semibold tracking-tight mb-4 text-zinc-100">{item.title}</h3>
                  <p className="text-zinc-400 leading-relaxed text-lg font-light">{item.desc}</p>
                </div>

                {/* Mockup */}
                <div className="flex-1 w-full max-w-2xl relative">
                  {/* Subtle offset layer for more depth */}
                  <div className="absolute inset-0 bg-white/[0.02] rounded-2xl transform translate-x-4 translate-y-4 border border-white/[0.02] -z-10 blur-[1px]" />
                  {item.mockup}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
