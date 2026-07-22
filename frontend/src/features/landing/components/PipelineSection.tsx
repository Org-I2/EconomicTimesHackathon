import React from 'react';
import {
  Upload, ScanLine, Boxes, Network, Search, MessageSquare, Wrench, Shield
} from 'lucide-react';

const pipelineSteps = [
  {
    icon: <Upload className="w-6 h-6" />,
    title: 'Upload',
    desc: 'Drag & drop PDFs, manuals, and logs',
    color: '#a855f7',
  },
  {
    icon: <ScanLine className="w-6 h-6" />,
    title: 'OCR & Parsing',
    desc: 'AI-powered document scanning',
    color: '#3b82f6',
  },
  {
    icon: <Boxes className="w-6 h-6" />,
    title: 'Entity Extraction',
    desc: 'Extract components & relationships',
    color: '#14b8a6',
  },
  {
    icon: <Network className="w-6 h-6" />,
    title: 'Knowledge Graph',
    desc: 'Build semantic facility map',
    color: '#f59e0b',
  },
  {
    icon: <Search className="w-6 h-6" />,
    title: 'Semantic Search',
    desc: 'Find answers instantly',
    color: '#6366f1',
  },
  {
    icon: <MessageSquare className="w-6 h-6" />,
    title: 'AI Chat',
    desc: 'Chat with your documents',
    color: '#22c55e',
  },
  {
    icon: <Wrench className="w-6 h-6" />,
    title: 'Maintenance Intel',
    desc: 'Predict failures & schedule',
    color: '#f97316',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Compliance',
    desc: 'Automated audit readiness',
    color: '#ef4444',
  },
];

export function PipelineSection() {
  return (
    <section id="pipeline" className="py-28 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-accent-500/[0.03] blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16" data-reveal>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-4">
            From raw documents to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#C8FFE0] via-[#7BE495] to-[#2ECC71] drop-shadow-[0_0_20px_rgba(46,204,113,0.15)]">
              actionable intelligence.
            </span>
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto font-light">
            Watch your unstructured data transform through an intelligent processing pipeline — entirely on your infrastructure.
          </p>
        </div>

        {/* Pipeline — Desktop: horizontal, Mobile: vertical */}
        <div className="relative" data-reveal data-reveal-delay="200">
          {/* Desktop horizontal layout */}
          <div className="hidden lg:block">
            {/* Connecting line */}
            <div className="absolute top-[48px] left-[6%] right-[6%] h-[1px]">
              <svg className="w-full h-full" preserveAspectRatio="none">
                <line
                  x1="0" y1="0" x2="100%" y2="0"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="1.5"
                  strokeDasharray="6 4"
                  style={{ animation: 'pipeline-flow 3s linear infinite' }}
                />
              </svg>
            </div>

            <div className="grid grid-cols-8 gap-4">
              {pipelineSteps.map((step, i) => (
                <div
                  key={i}
                  className="relative group flex flex-col items-center text-center"
                  data-reveal
                  data-reveal-delay={String(100 + i * 80)}
                >
                  {/* Node */}
                  <div
                    className="w-[96px] h-[96px] rounded-3xl border flex items-center justify-center mb-5 transition-all duration-500 group-hover:scale-110 shadow-lg shadow-black/30"
                    style={{
                      borderColor: `${step.color}30`,
                      background: `linear-gradient(135deg, ${step.color}15, transparent)`,
                      boxShadow: `inset 0 0 20px ${step.color}05`,
                    }}
                  >
                    <div style={{ color: step.color }} className="group-hover:scale-110 transition-transform duration-500">{step.icon}</div>
                  </div>

                  {/* Pulse dot at connection */}
                  <div
                    className="absolute top-[44px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full z-10"
                    style={{
                      backgroundColor: step.color,
                      boxShadow: `0 0 10px ${step.color}`,
                      animation: 'node-pulse 2s ease-in-out infinite',
                      animationDelay: `${i * 0.3}s`,
                    }}
                  />

                  <h4 className="text-sm font-semibold text-zinc-100 mb-1.5">{step.title}</h4>
                  <p className="text-xs text-zinc-500 leading-tight px-2">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile vertical layout */}
          <div className="lg:hidden space-y-1">
            {pipelineSteps.map((step, i) => (
              <div key={i} className="relative flex items-start gap-4" data-reveal data-reveal-delay={String(i * 60)}>
                {/* Vertical line */}
                {i < pipelineSteps.length - 1 && (
                  <div className="absolute left-[28px] top-[60px] w-[1px] h-[calc(100%-20px)]">
                    <svg className="w-full h-full">
                      <line
                        x1="0" y1="0" x2="0" y2="100%"
                        stroke="rgba(255,255,255,0.06)"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                        style={{ animation: 'pipeline-flow 2s linear infinite' }}
                      />
                    </svg>
                  </div>
                )}

                {/* Node */}
                <div
                  className="w-14 h-14 rounded-xl border flex items-center justify-center shrink-0"
                  style={{
                    borderColor: `${step.color}20`,
                    background: `${step.color}08`,
                  }}
                >
                  <div style={{ color: step.color }}>{step.icon}</div>
                </div>

                {/* Text */}
                <div className="pt-2 pb-6">
                  <h4 className="text-sm font-semibold text-zinc-200 mb-0.5">{step.title}</h4>
                  <p className="text-xs text-zinc-500">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
