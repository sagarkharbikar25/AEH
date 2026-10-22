import React from 'react';
import { NavLink } from 'react-router-dom';
import { Compass, BarChart3, Database, BookOpen, AlertCircle } from 'lucide-react';

export const Navigation: React.FC = () => {
  return (
    <header className="border-b border-white/10 bg-[#02040A]/85 backdrop-blur-md sticky top-0 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
        
        {/* Brand with Gemini Logo */}
        <NavLink to="/" className="flex items-center gap-3.5 group">
          <div className="relative w-11 h-11 rounded-full p-0.5 border border-amber-400/50 bg-[#050A15] group-hover:border-amber-300 transition-all shadow-[0_0_15px_rgba(245,208,97,0.25)] flex items-center justify-center overflow-hidden">
            <img 
              src="/polaris-logo.png" 
              alt="Polaris Emblem" 
              className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-500" 
            />
            {/* Ambient pulse halo */}
            <div className="absolute inset-0 rounded-full border border-cyan-400/30 animate-ping opacity-20 pointer-events-none" />
          </div>
          <div>
            <div className="font-display font-bold text-2xl tracking-wider text-slate-100 group-hover:text-amber-300 transition-colors flex items-center gap-2">
              <span>POLARIS</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 tracking-normal font-normal">
                MCP 2B
              </span>
            </div>
            <div className="text-[11px] font-mono tracking-widest text-slate-400 -mt-0.5">
              THE CELESTIAL TOOL ROUTER
            </div>
          </div>
        </NavLink>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-2">
          <NavLink 
            to="/" 
            end
            className={({ isActive }) => `flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-mono tracking-wider transition-all ${
              isActive 
                ? 'bg-white/10 text-amber-300 border border-amber-400/40 shadow-[0_0_12px_rgba(245,208,97,0.15)] font-semibold' 
                : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Compass className="w-4 h-4 text-amber-400" />
            <span>Atlas</span>
          </NavLink>

          <NavLink 
            to="/almanac" 
            className={({ isActive }) => `flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-mono tracking-wider transition-all ${
              isActive 
                ? 'bg-white/10 text-amber-300 border border-amber-400/40 shadow-[0_0_12px_rgba(245,208,97,0.15)] font-semibold' 
                : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <span>Almanac</span>
          </NavLink>

          <NavLink 
            to="/index" 
            className={({ isActive }) => `flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-mono tracking-wider transition-all ${
              isActive 
                ? 'bg-white/10 text-amber-300 border border-amber-400/40 shadow-[0_0_12px_rgba(245,208,97,0.15)] font-semibold' 
                : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Database className="w-4 h-4 text-purple-400" />
            <span>240 Tools</span>
          </NavLink>

          <NavLink 
            to="/method" 
            className={({ isActive }) => `flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-mono tracking-wider transition-all ${
              isActive 
                ? 'bg-white/10 text-amber-300 border border-amber-400/40 shadow-[0_0_12px_rgba(245,208,97,0.15)] font-semibold' 
                : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>Method</span>
          </NavLink>

          <NavLink 
            to="/dev/errors" 
            className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-md text-xs font-mono tracking-wider transition-all ${
              isActive 
                ? 'bg-red-950/60 text-red-400 border border-red-500/50' 
                : 'text-slate-400 hover:text-red-400 border border-transparent'
            }`}
            title="Inspect all 8 Error Screens"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Errors</span>
          </NavLink>
        </nav>

        {/* MCP Pulse Radar Pill */}
        <div className="hidden lg:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-xs font-mono shadow-[0_0_12px_rgba(56,189,248,0.2)]">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400" />
          </span>
          <span className="text-slate-400 text-[11px]">MCP ROUTER:</span>
          <span className="text-cyan-300 font-semibold text-[11px]">ONLINE (EC2)</span>
        </div>

      </div>
    </header>
  );
};
