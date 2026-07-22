import React from 'react';
import { useScrollReveal } from './hooks/useScrollReveal';
import { LandingNav } from './components/LandingNav';
import { HeroSection } from './components/HeroSection';
import { FeaturesSection } from './components/FeaturesSection';
import { PipelineSection } from './components/PipelineSection';
import { ProductShowcase } from './components/ProductShowcase';
import { SecuritySection } from './components/SecuritySection';
import { CTASection } from './components/CTASection';

/* ─── Premium Section Divider ─── */
function SectionTransition({ glowColorClass = 'via-accent-500/50' }: { glowColorClass?: string }) {
  return (
    <div className="relative w-full h-32 flex items-center justify-center -my-16 z-10 pointer-events-none">
      {/* Horizontal Base line */}
      <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" />
      {/* Horizontal Glowing center */}
      <div className={`absolute w-1/3 h-px bg-gradient-to-r from-transparent ${glowColorClass} to-transparent blur-[2px]`} />
      
      {/* Vertical connection line */}
      <div className="absolute w-px h-full bg-gradient-to-b from-transparent via-white/[0.05] to-transparent" />
      
      {/* Center Node */}
      <div className="absolute w-2 h-2 rounded-full bg-[#0e0e11] border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)] flex items-center justify-center">
        <div className={`w-1 h-1 rounded-full bg-gradient-to-r from-transparent ${glowColorClass} to-transparent opacity-80`} />
      </div>
    </div>
  );
}

export default function LandingPage() {
  const revealRef = useScrollReveal();

  return (
    <div
      ref={revealRef}
      className="min-h-screen bg-[#0e0e11] text-zinc-50 font-sans selection:bg-accent-500/30 overflow-x-hidden"
    >
      <LandingNav />
      
      <HeroSection />
      <SectionTransition glowColorClass="via-amber-500/40" />
      
      <FeaturesSection />
      <SectionTransition glowColorClass="via-blue-500/40" />
      
      <PipelineSection />
      <SectionTransition glowColorClass="via-teal-500/40" />
      
      <ProductShowcase />
      <SectionTransition glowColorClass="via-purple-500/40" />
      
      <SecuritySection />
      <SectionTransition glowColorClass="via-emerald-500/40" />
      
      <CTASection />
    </div>
  );
}
