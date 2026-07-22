import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu } from 'lucide-react';

export function LandingNav() {
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-[#0e0e11]/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className="w-7 h-7 rounded-lg bg-accent-500 flex items-center justify-center">
            <Cpu className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight text-white">UAO Brain</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-xs font-medium text-zinc-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#pipeline" className="hover:text-white transition-colors">How it Works</a>
          <a href="#product" className="hover:text-white transition-colors">Product</a>
          <a href="#security" className="hover:text-white transition-colors">Security</a>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/login')}
            className="text-xs font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Log in
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="text-xs font-medium px-3 py-1.5 rounded-md bg-white text-black hover:bg-zinc-200 transition-colors"
          >
            Sign Up
          </button>
        </div>
      </div>
    </nav>
  );
}
