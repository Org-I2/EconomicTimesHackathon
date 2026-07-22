import React, { useEffect, useState } from 'react';
import { Cpu, Factory, FileText, Settings, Share2, Shield, Network } from 'lucide-react';

/* ─── 1. Cinematic Lighting ─── */
function CinematicLighting() {
  return (
    <>
      {/* Base Deep Dark Gradient */}
      <div className="absolute inset-0 bg-[#060608] opacity-100 pointer-events-none z-[-1]" />
      
      {/* Soft spotlight directly behind headline (Center Top) */}
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-amber-500/10 blur-[150px] rounded-full pointer-events-none mix-blend-screen" />
      
      {/* Deep blue edge lighting (Sides) */}
      <div className="absolute top-0 left-[-20%] w-[500px] h-full bg-blue-600/[0.04] blur-[150px] pointer-events-none mix-blend-screen" />
      <div className="absolute top-0 right-[-20%] w-[500px] h-full bg-blue-600/[0.04] blur-[150px] pointer-events-none mix-blend-screen" />
      
      {/* Ambient warm glow (Bottom) */}
      <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-amber-600/[0.03] blur-[200px] rounded-full pointer-events-none mix-blend-screen" />
      
      {/* Heavy Vignette */}
      <div className="absolute inset-0 shadow-[inset_0_0_250px_rgba(0,0,0,0.95)] pointer-events-none" />
    </>
  );
}

/* ─── 2. Engineering Blueprint Overlay ─── */
function EngineeringBlueprintOverlay() {
  return (
    <div className="absolute inset-0 opacity-[0.06] pointer-events-none mix-blend-screen">
      {/* Primary Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:100px_100px]" />
      {/* Secondary Sub-grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:25px_25px] opacity-20" />
      
      {/* Technical Construction Lines & Drafting Symbols */}
      <svg className="absolute w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="none">
        {/* Large Circles */}
        <circle cx="200" cy="300" r="150" fill="none" stroke="white" strokeWidth="2" strokeDasharray="10 20" />
        <circle cx="200" cy="300" r="100" fill="none" stroke="white" strokeWidth="1" />
        <circle cx="850" cy="700" r="200" fill="none" stroke="white" strokeWidth="1" strokeDasharray="5 15" />
        <circle cx="850" cy="700" r="180" fill="none" stroke="white" strokeWidth="0.5" />
        
        {/* Axis Lines */}
        <path d="M 0 500 L 1000 500" stroke="white" strokeWidth="1" strokeDasharray="50 10" />
        <path d="M 500 0 L 500 1000" stroke="white" strokeWidth="1" strokeDasharray="50 10" />
        
        {/* Crosshairs */}
        <path d="M 190 300 L 210 300 M 200 290 L 200 310" stroke="white" strokeWidth="1" />
        <path d="M 840 700 L 860 700 M 850 690 L 850 710" stroke="white" strokeWidth="1" />
        <path d="M 490 500 L 510 500 M 500 490 L 500 510" stroke="white" strokeWidth="1.5" />
        
        {/* Measurement Marks */}
        <path d="M 100 100 L 100 150 M 95 100 L 105 100 M 95 150 L 105 150" stroke="white" strokeWidth="1" />
        <text x="115" y="130" fill="white" fontSize="12" fontFamily="monospace" transform="rotate(-90 115 130)">R.450</text>
        
        <path d="M 800 100 L 900 100 M 800 95 L 800 105 M 900 95 L 900 105" stroke="white" strokeWidth="1" />
        <text x="830" y="90" fill="white" fontSize="12" fontFamily="monospace">1000MM</text>
        
        {/* Angles */}
        <path d="M 500 500 L 600 400" stroke="white" strokeWidth="1" />
        <path d="M 530 500 A 30 30 0 0 0 520 480" fill="none" stroke="white" strokeWidth="1" />
        <text x="540" y="495" fill="white" fontSize="10" fontFamily="monospace">45°</text>
      </svg>
    </div>
  );
}

/* ─── 3. Giant Knowledge Graph Network ─── */
function AINetwork() {
  const nodes = Array.from({ length: 80 }); // Doubled density
  return (
    <div className="absolute inset-0 pointer-events-none mix-blend-screen overflow-hidden opacity-25">
      <svg className="absolute w-full h-full" preserveAspectRatio="xMidYMid slice">
        {nodes.map((_, i) => {
          const x = Math.random() * 100;
          const y = Math.random() * 100;
          const r = Math.random() * 2 + 1;
          const delay = Math.random() * 5;
          return (
            <g key={i}>
              <circle cx={`${x}%`} cy={`${y}%`} r={r} fill="rgba(255,255,255,0.8)" />
              {/* Pulsing Aura */}
              <circle cx={`${x}%`} cy={`${y}%`} r={r * 3} fill="rgba(245, 158, 11, 0.4)" className="animate-pulse" style={{ animationDelay: `${delay}s`, animationDuration: '3s' }} />
              
              {/* Connections (dense) */}
              {i % 3 === 0 && (
                <path
                  d={`M${x}% ${y}% Q${50}% ${50}% ${Math.random() * 100}% ${Math.random() * 100}%`}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.15)"
                  strokeWidth="0.5"
                />
              )}
              {/* Moving Packets */}
              {i % 4 === 0 && (
                <path
                  d={`M${x}% ${y}% Q${50}% ${50}% ${Math.random() * 100}% ${Math.random() * 100}%`}
                  fill="none"
                  stroke="rgba(245, 158, 11, 0.5)"
                  strokeWidth="1.5"
                  strokeDasharray="4 20"
                  className="animate-[flow-dash_6s_linear_infinite]"
                  style={{ animationDelay: `${delay}s` }}
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ─── 4. Large Decorative Industrial Icons ─── */
function LargeDecorativeIcons() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden mix-blend-screen opacity-[0.03]">
      <Settings className="absolute top-[10%] left-[5%] w-[400px] h-[400px] text-white animate-[spin_60s_linear_infinite]" />
      <Cpu className="absolute top-[40%] right-[2%] w-[300px] h-[300px] text-white" />
      <Network className="absolute bottom-[5%] left-[20%] w-[350px] h-[350px] text-white" />
      <Factory className="absolute bottom-[-10%] right-[25%] w-[400px] h-[400px] text-white" />
    </div>
  );
}

/* ─── 5. Industrial Data Streams ─── */
function DataStream({ left, duration, color }: { left: string, duration: string, color: string }) {
  const [data, setData] = useState<string[]>([]);
  
  useEffect(() => {
    const chars = '0123456789ABCDEF!@#$%&*()';
    const generate = () => Array.from({length: 20}).map(() => chars[Math.floor(Math.random() * chars.length)]);
    setData(generate());
    const int = setInterval(() => setData(generate()), 150);
    return () => clearInterval(int);
  }, []);

  return (
    <div 
      className={`absolute top-[-20%] text-[8px] font-mono whitespace-pre leading-none pointer-events-none mix-blend-screen overflow-hidden w-4 flex flex-col items-center ${color}`}
      style={{ left, animation: `slide-down ${duration} linear infinite` }}
    >
      {data.map((c, i) => (
        <span key={i} className={i === data.length - 1 ? 'text-white/80 drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]' : ''}>
          {c}
        </span>
      ))}
    </div>
  );
}

function IndustrialDataStreams() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
      <DataStream left="5%" duration="12s" color="text-amber-500/20" />
      <DataStream left="15%" duration="18s" color="text-blue-500/20" />
      <DataStream left="85%" duration="15s" color="text-teal-500/20" />
      <DataStream left="95%" duration="20s" color="text-zinc-500/20" />
      <style>{`
        @keyframes slide-down {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(150vh); }
        }
      `}</style>
    </div>
  );
}

/* ─── 6. HUD Corner Brackets ─── */
function HUDBrackets() {
  return (
    <div className="absolute inset-0 pointer-events-none z-10 p-6 flex flex-col justify-between opacity-40">
      <div className="flex justify-between w-full">
        {/* Top Left */}
        <div className="w-12 h-12 border-t border-l border-zinc-500/50" />
        {/* Top Right */}
        <div className="w-12 h-12 border-t border-r border-zinc-500/50" />
      </div>
      
      <div className="flex justify-between w-full">
        {/* Bottom Left */}
        <div className="w-12 h-12 border-b border-l border-zinc-500/50" />
        {/* Bottom Right */}
        <div className="w-12 h-12 border-b border-r border-zinc-500/50" />
      </div>
    </div>
  );
}

/* ─── 7. Holographic Geometric Shapes ─── */
function HolographicShapes() {
  return (
    <div className="absolute inset-0 pointer-events-none opacity-[0.15] perspective-[1000px]">
      {/* 3D Wireframe Cube */}
      <div className="absolute top-[25%] left-[8%] w-32 h-32 border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)] animate-[spin_20s_linear_infinite]" style={{ transformStyle: 'preserve-3d' }}>
        <div className="absolute inset-0 border border-white/20 transform rotate-x-90" />
        <div className="absolute inset-0 border border-white/20 transform rotate-y-90" />
      </div>
      {/* 3D Hexagon/Ring */}
      <div className="absolute bottom-[25%] right-[8%] w-40 h-40 rounded-full border border-teal-500/30 shadow-[0_0_20px_rgba(20,184,166,0.2)] animate-[spin_15s_linear_infinite_reverse]" style={{ transformStyle: 'preserve-3d', transform: 'rotateX(60deg)' }}>
        <div className="absolute inset-2 rounded-full border border-teal-500/20" />
        <div className="absolute inset-4 rounded-full border border-teal-500/10 border-dashed" />
      </div>
      {/* Floating Cylinder Grid */}
      <div className="absolute top-[10%] right-[20%] w-20 h-40 border border-white/10 rounded-full opacity-50 animate-float-gentle" style={{ transform: 'rotate(15deg)' }}>
        <div className="absolute top-1/2 left-0 w-full border-t border-white/10" />
        <div className="absolute top-1/4 left-0 w-full border-t border-white/10" />
        <div className="absolute top-3/4 left-0 w-full border-t border-white/10" />
      </div>
    </div>
  );
}

/* ─── 8. Film Grain & Particles ─── */
function EnvironmentParticles() {
  return (
    <div className="absolute inset-0 pointer-events-none z-20 mix-blend-overlay opacity-60">
      {/* Heavy Grain */}
      <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/7/76/1k_Dissolve_Noise_Texture.png')] opacity-[0.06] animate-pulse" />
      {/* Floating Dust */}
      {Array.from({ length: 60 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: Math.random() * 2 + 'px',
            height: Math.random() * 2 + 'px',
            top: Math.random() * 100 + '%',
            left: Math.random() * 100 + '%',
            opacity: Math.random() * 0.4,
            animation: `float-gentle ${Math.random() * 10 + 5}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`
          }}
        />
      ))}
    </div>
  );
}

export function HeroDecorations() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-[#060608]">
      <CinematicLighting />
      <LargeDecorativeIcons />
      <EngineeringBlueprintOverlay />
      <AINetwork />
      <HolographicShapes />
      <IndustrialDataStreams />
      <EnvironmentParticles />
      <HUDBrackets />
    </div>
  );
}
