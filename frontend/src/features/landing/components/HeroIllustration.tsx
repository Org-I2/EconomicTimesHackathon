import React, { useEffect, useState } from 'react';

export function HeroIllustration() {
  const [nodes, setNodes] = useState<{x: number, y: number, r: number, delay: number, type: string}[]>([]);

  useEffect(() => {
    // Generate static nodes for the knowledge graph
    const newNodes = Array.from({ length: 45 }).map((_, i) => ({
      x: 100 + Math.random() * 600,
      y: 50 + Math.random() * 300,
      r: Math.random() > 0.8 ? 6 : Math.random() * 2 + 2,
      delay: Math.random() * 5,
      type: i % 5 === 0 ? 'core' : (i % 2 === 0 ? 'node' : 'leaf')
    }));
    setNodes(newNodes);
  }, []);

  return (
    <div className="relative w-full max-w-6xl mx-auto mt-20 px-6 perspective-[2000px]">
      <div 
        className="relative rounded-3xl border border-white/[0.05] bg-black/40 backdrop-blur-3xl shadow-[0_0_150px_-20px_rgba(245,158,11,0.15)] overflow-hidden transition-transform duration-[2000ms] ease-out hover:rotate-x-2 hover:shadow-[0_0_200px_-20px_rgba(245,158,11,0.25)]"
        style={{ transformStyle: 'preserve-3d', transform: 'rotateX(8deg) translateY(-20px)' }}
      >
        {/* Cinematic Glare & Reflection */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.02] via-transparent to-white/[0.05] pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent-500/50 to-transparent" />
        
        {/* Top Window Bar (Minimalist) */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-white/[0.05] bg-white/[0.01]">
          <div className="flex gap-2 opacity-50">
            <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
          </div>
          <span className="text-[10px] text-zinc-500 font-mono tracking-[0.3em]">REASONING_ENGINE_CORE</span>
        </div>

        {/* Inner Canvas (The Neural Graph) */}
        <div className="relative h-[450px] md:h-[600px] overflow-hidden bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.03)_0%,transparent_70%)]">
          {/* Base Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:50px_50px]" />
          
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg viewBox="0 0 800 400" className="w-full h-full" style={{ filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.5))' }}>
              <defs>
                <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.4" />
                </linearGradient>
                <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Dynamic Edges */}
              {nodes.map((node, i) => {
                if (i >= nodes.length - 1) return null;
                // Connect to 2-3 nearby nodes to form a web
                const targets = nodes.slice(i + 1, i + 4);
                return targets.map((target, j) => (
                  <g key={`${i}-${j}`}>
                    {/* Base line */}
                    <path
                      d={`M ${node.x} ${node.y} Q ${(node.x + target.x) / 2} ${(node.y + target.y) / 2 + (j * 20 - 20)} ${target.x} ${target.y}`}
                      fill="none"
                      stroke="url(#edgeGradient)"
                      strokeWidth={node.type === 'core' || target.type === 'core' ? 1.5 : 0.5}
                      opacity={0.3}
                    />
                    {/* Flowing packet */}
                    {Math.random() > 0.5 && (
                      <path
                        d={`M ${node.x} ${node.y} Q ${(node.x + target.x) / 2} ${(node.y + target.y) / 2 + (j * 20 - 20)} ${target.x} ${target.y}`}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2"
                        strokeDasharray="4 40"
                        className="animate-[flow-dash_4s_linear_infinite]"
                        style={{ animationDelay: `${node.delay}s` }}
                        opacity={0.8}
                      />
                    )}
                  </g>
                ));
              })}

              {/* Dynamic Nodes */}
              {nodes.map((node, i) => (
                <g key={i}>
                  {node.type === 'core' && (
                    <circle cx={node.x} cy={node.y} r={node.r * 4} fill="url(#coreGlow)" className="animate-pulse" style={{ animationDelay: `${node.delay}s`, animationDuration: '4s' }} />
                  )}
                  <circle 
                    cx={node.x} 
                    cy={node.y} 
                    r={node.r} 
                    fill={node.type === 'core' ? '#f59e0b' : (node.type === 'node' ? '#3b82f6' : '#10b981')} 
                    style={{ filter: `drop-shadow(0 0 ${node.r * 2}px ${node.type === 'core' ? '#f59e0b' : '#3b82f6'})` }}
                  />
                  {node.type === 'core' && (
                    <circle cx={node.x} cy={node.y} r={node.r * 1.5} fill="none" stroke="#f59e0b" strokeWidth="1" opacity="0.5" className="animate-[spin_4s_linear_infinite]" strokeDasharray="4 4" />
                  )}
                </g>
              ))}

              {/* Central Semantic Engine (Holographic Cylinder) */}
              <g transform="translate(400, 200)">
                <ellipse cx="0" cy="-40" rx="80" ry="20" fill="none" stroke="rgba(245, 158, 11, 0.4)" strokeWidth="1" className="animate-pulse" />
                <ellipse cx="0" cy="0" rx="80" ry="20" fill="rgba(245, 158, 11, 0.05)" stroke="rgba(245, 158, 11, 0.8)" strokeWidth="2" style={{ filter: 'drop-shadow(0 0 20px rgba(245,158,11,0.5))' }} />
                <ellipse cx="0" cy="40" rx="80" ry="20" fill="none" stroke="rgba(245, 158, 11, 0.4)" strokeWidth="1" className="animate-pulse" style={{ animationDelay: '1s' }} />
                
                <path d="M -80 0 L -80 -40" stroke="rgba(245, 158, 11, 0.4)" strokeWidth="1" />
                <path d="M 80 0 L 80 -40" stroke="rgba(245, 158, 11, 0.4)" strokeWidth="1" />
                <path d="M -80 0 L -80 40" stroke="rgba(245, 158, 11, 0.4)" strokeWidth="1" />
                <path d="M 80 0 L 80 40" stroke="rgba(245, 158, 11, 0.4)" strokeWidth="1" />
                
                {/* Core Particle inside cylinder */}
                <circle cx="0" cy="0" r="15" fill="url(#coreGlow)" />
                <circle cx="0" cy="0" r="4" fill="#ffffff" style={{ filter: 'drop-shadow(0 0 10px #ffffff)' }} />
              </g>
            </svg>
          </div>
          
          {/* Subtle Corner Annotations (No Metrics, purely decorative) */}
          <div className="absolute top-6 left-6 text-[9px] text-zinc-500 font-mono tracking-widest opacity-40">
            SEMANTIC_LAYER // ACTIVE
          </div>
          <div className="absolute bottom-6 right-6 text-[9px] text-zinc-500 font-mono tracking-widest opacity-40 text-right">
            NEURAL_ROUTING // STABLE
          </div>
        </div>
      </div>
    </div>
  );
}
