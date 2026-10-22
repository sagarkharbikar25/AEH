import React from 'react';
import { NavLink } from 'react-router-dom';
import { Compass, BarChart3, Database, BookOpen, AlertCircle } from 'lucide-react';

export const Navigation: React.FC = () => {
  return (
    <header className="border-b border-[#E0FFC2]/12 bg-[#02120e]/90 backdrop-blur-md sticky top-0 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
        
        {/* Brand with Logo */}
        <NavLink to="/" className="flex items-center gap-3.5 group">
          <div className="relative w-11 h-11 rounded-full p-0.5 border border-[#E0FFC2]/50 bg-[#041c14] group-hover:border-[#E0FFC2] transition-all shadow-[0_0_15px_rgba(224,255,194,0.25)] flex items-center justify-center overflow-hidden">
            <img 
              src="/polaris-logo.png" 
              alt="Polaris Emblem" 
              className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-500" 
            />
            {/* Ambient pulse halo */}
            <div className="absolute inset-0 rounded-full border border-[#E0FFC2]/40 animate-ping opacity-25 pointer-events-none" />
          </div>
          <div>
            <div className="font-display font-bold text-2xl tracking-wider text-[#F2FDF0] group-hover:text-[#E0FFC2] transition-colors flex items-center gap-2">
              <span>POLARIS</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#064734] border border-[#E0FFC2]/40 text-[#E0FFC2] tracking-normal font-semibold">
                MCP 2B
              </span>
            </div>
            <div className="text-[11px] font-mono tracking-widest text-[#82A98B] -mt-0.5 font-medium">
              THE CELESTIAL TOOL ROUTER
            </div>
          </div>
        </NavLink>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-2">
          <NavLink 
            to="/" 
            end
            className={({ isActive }) => `flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono tracking-wider transition-all ${
              isActive 
                ? 'bg-[#064734]/60 text-[#E0FFC2] border border-[#E0FFC2]/50 shadow-[0_0_14px_rgba(224,255,194,0.2)] font-semibold' 
                : 'text-[#C2E2BE] hover:text-[#E0FFC2] hover:bg-[#064734]/25 border border-transparent'
            }`}
          >
            <Compass className="w-4 h-4 text-[#E0FFC2]" />
            <span>Atlas</span>
          </NavLink>

          <NavLink 
            to="/almanac" 
            className={({ isActive }) => `flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono tracking-wider transition-all ${
              isActive 
                ? 'bg-[#064734]/60 text-[#E0FFC2] border border-[#E0FFC2]/50 shadow-[0_0_14px_rgba(224,255,194,0.2)] font-semibold' 
                : 'text-[#C2E2BE] hover:text-[#E0FFC2] hover:bg-[#064734]/25 border border-transparent'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-emerald-300" />
            <span>Almanac</span>
          </NavLink>

          <NavLink 
            to="/index" 
            className={({ isActive }) => `flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono tracking-wider transition-all ${
              isActive 
                ? 'bg-[#064734]/60 text-[#E0FFC2] border border-[#E0FFC2]/50 shadow-[0_0_14px_rgba(224,255,194,0.2)] font-semibold' 
                : 'text-[#C2E2BE] hover:text-[#E0FFC2] hover:bg-[#064734]/25 border border-transparent'
            }`}
          >
            <Database className="w-4 h-4 text-teal-300" />
            <span>240 Tools</span>
          </NavLink>

          <NavLink 
            to="/method" 
            className={({ isActive }) => `flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono tracking-wider transition-all ${
              isActive 
                ? 'bg-[#064734]/60 text-[#E0FFC2] border border-[#E0FFC2]/50 shadow-[0_0_14px_rgba(224,255,194,0.2)] font-semibold' 
                : 'text-[#C2E2BE] hover:text-[#E0FFC2] hover:bg-[#064734]/25 border border-transparent'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>Method</span>
          </NavLink>

          <NavLink 
            to="/dev/errors" 
            className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono tracking-wider transition-all ${
              isActive 
                ? 'bg-rose-950/60 text-rose-300 border border-rose-500/50' 
                : 'text-[#82A98B] hover:text-rose-300 border border-transparent'
            }`}
            title="Inspect all 8 Error Screens"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Errors</span>
          </NavLink>
        </nav>

        {/* MCP Pulse Radar Pill */}
        <div className="hidden lg:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-[#E0FFC2]/30 bg-[#064734]/50 text-xs font-mono shadow-[0_0_14px_rgba(224,255,194,0.18)]">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E0FFC2] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#E0FFC2]" />
          </span>
          <span className="text-[#C2E2BE] text-[11px] font-medium">MCP ROUTER:</span>
          <span className="text-[#E0FFC2] font-bold text-[11px] tracking-wide">ONLINE (EC2)</span>
        </div>

      </div>
    </header>
  );
};
