import React from 'react';
import { NavLink } from 'react-router-dom';
import { Sparkles, Compass, BarChart3, Database, BookOpen, AlertCircle } from 'lucide-react';

interface NavigationProps {
  onReplayClick?: (replayId: string) => void;
}

export const Navigation: React.FC<NavigationProps> = () => {
  return (
    <header className="border-b border-[var(--line)] bg-[var(--ink-900)]/90 backdrop-blur sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <NavLink to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded border border-[var(--brass)] flex items-center justify-center bg-[var(--ink-800)] group-hover:border-[var(--brass-bright)] transition-colors">
              <Sparkles className="w-4 h-4 text-[var(--brass-bright)]" />
            </div>
            <div>
              <div className="font-display font-bold text-xl tracking-wider text-[var(--parchment)] group-hover:text-[var(--brass-bright)] transition-colors">
                POLARIS
              </div>
              <div className="text-[10px] font-mono tracking-widest text-[var(--brass)] uppercase -mt-1">
                240-Tool Celestial Router
              </div>
            </div>
          </NavLink>
        </div>

        {/* Primary Links */}
        <nav className="flex items-center gap-1 md:gap-2">
          <NavLink 
            to="/" 
            end
            className={({ isActive }) => `flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono tracking-wider transition-colors ${
              isActive ? 'bg-[var(--line)] text-[var(--brass-bright)]' : 'text-[var(--parchment-dim)] hover:text-[var(--parchment)] hover:bg-[var(--ink-800)]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Atlas</span>
          </NavLink>

          <NavLink 
            to="/almanac" 
            className={({ isActive }) => `flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono tracking-wider transition-colors ${
              isActive ? 'bg-[var(--line)] text-[var(--brass-bright)]' : 'text-[var(--parchment-dim)] hover:text-[var(--parchment)] hover:bg-[var(--ink-800)]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Almanac</span>
          </NavLink>

          <NavLink 
            to="/index" 
            className={({ isActive }) => `flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono tracking-wider transition-colors ${
              isActive ? 'bg-[var(--line)] text-[var(--brass-bright)]' : 'text-[var(--parchment-dim)] hover:text-[var(--parchment)] hover:bg-[var(--ink-800)]'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Index of Stars</span>
          </NavLink>

          <NavLink 
            to="/method" 
            className={({ isActive }) => `flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono tracking-wider transition-colors ${
              isActive ? 'bg-[var(--line)] text-[var(--brass-bright)]' : 'text-[var(--parchment-dim)] hover:text-[var(--parchment)] hover:bg-[var(--ink-800)]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Method</span>
          </NavLink>

          <NavLink 
            to="/dev/errors" 
            className={({ isActive }) => `flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono tracking-wider transition-colors ${
              isActive ? 'bg-[var(--line)] text-[var(--ember)]' : 'text-[var(--parchment-dim)] hover:text-[var(--ember)]'
            }`}
            title="Inspect all 8 Error Screens"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Errors</span>
          </NavLink>
        </nav>

        {/* Observatory Status Pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded border border-[var(--line)] bg-[var(--ink-800)] text-[11px] font-mono">
          <span className="w-2 h-2 rounded-full bg-[var(--lichen)] animate-pulse" />
          <span className="text-[var(--parchment-dim)]">OBSERVATORY:</span>
          <span className="text-[var(--lichen)]">ONLINE (EC2)</span>
        </div>

      </div>
    </header>
  );
};
