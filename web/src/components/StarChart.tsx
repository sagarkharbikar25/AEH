import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TOOLS, CONSTELLATIONS } from '../catalog';
import { Tool, RaceState } from '../types';
import { Sparkles, Radio } from 'lucide-react';

interface StarChartProps {
  raceState: RaceState;
  onSelectStar?: (star: Tool) => void;
}

export const StarChart: React.FC<StarChartProps> = ({ raceState, onSelectStar }) => {
  const [hoveredStar, setHoveredStar] = useState<Tool | null>(null);

  const activeCategory = raceState.decision?.category;
  const shortlistedIds = new Set(raceState.decision?.shortlistedTools.map((t) => t.id) || []);
  const chosenStarId = raceState.selectedStarId || raceState.laneB.chosenTool;

  return (
    <div className="relative w-full h-[580px] lg:h-[680px] rounded-xl border border-white/10 bg-[#02040A] overflow-hidden shadow-2xl flex flex-col justify-between group">
      
      {/* Moving Line in Border (Perimeter Beam) */}
      <div className="absolute inset-0 pointer-events-none rounded-xl border border-white/5 z-20">
        <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
      </div>

      {/* Header Overlay */}
      <div className="absolute top-5 left-6 z-10 pointer-events-none flex items-start justify-between right-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-[11px] font-mono tracking-widest text-amber-300 font-bold uppercase">
              PLATE 0 · CELESTIAL MCP OCTANT
            </span>
          </div>
          <h2 className="font-display text-2xl lg:text-3xl text-slate-100 font-bold tracking-wide">
            240-Instrument Star Atlas
          </h2>
          <div className="text-xs text-slate-400 font-mono mt-0.5">
            {shortlistedIds.size > 0 
              ? `${shortlistedIds.size} MCP stars ignited by Decider 2B` 
              : '12 Constellations · 240 Tools in Orbit'}
          </div>
        </div>

        {/* Live Decider Mode Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded border border-white/10 bg-[#050A15]/80 backdrop-blur text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">DECIDER:</span>
          <span className="text-amber-300 font-semibold uppercase">
            {raceState.decision ? `${raceState.decision.tier} TIER` : 'READY'}
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <svg 
        viewBox="0 0 1000 700" 
        className="w-full h-full select-none"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Radial Polaris Supernova Glow */}
          <radialGradient id="polarisSupernova" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFBEB" stopOpacity="1" />
            <stop offset="35%" stopColor="#FDE047" stopOpacity="0.85" />
            <stop offset="70%" stopColor="#D97706" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#02040A" stopOpacity="0" />
          </radialGradient>

          {/* Active Constellation MCP Nebula Glow */}
          <radialGradient id="mcpNebulaGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.25" />
            <stop offset="60%" stopColor="#6366F1" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#02040A" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Subtle Celestial Coordinates Wireframe */}
        <g stroke="rgba(255, 255, 255, 0.04)" strokeWidth="0.8" strokeDasharray="4,8">
          <line x1="50" y1="350" x2="950" y2="350" />
          <line x1="500" y1="30" x2="500" y2="670" />
          <circle cx="500" cy="350" r="300" fill="none" />
          <circle cx="500" cy="350" r="170" fill="none" />
          <circle cx="500" cy="350" r="60" fill="none" />
        </g>

        {/* 12 Constellations */}
        {CONSTELLATIONS.map((c) => {
          const isCategoryActive = activeCategory === c.id;
          return (
            <g key={c.id}>
              {/* Animated MCP Pulse Rings when Category is Active */}
              {isCategoryActive && (
                <>
                  <circle 
                    cx={c.cx} 
                    cy={c.cy} 
                    r="120" 
                    fill="url(#mcpNebulaGlow)" 
                    className="animate-pulse"
                  />
                  <circle 
                    cx={c.cx} 
                    cy={c.cy} 
                    r="85" 
                    fill="none" 
                    stroke="#38BDF8" 
                    strokeWidth="1.2"
                    strokeDasharray="4,6"
                    className="animate-spin-slow origin-center"
                  />
                  <circle 
                    cx={c.cx} 
                    cy={c.cy} 
                    r="60" 
                    fill="none" 
                    stroke="#FDE047" 
                    strokeWidth="0.8"
                    opacity="0.6"
                  />
                </>
              )}

              {/* Constellation Name & Domain Label */}
              <text 
                x={c.cx} 
                y={c.cy - 52} 
                textAnchor="middle" 
                fill={isCategoryActive ? '#FDE047' : 'rgba(255,255,255,0.4)'}
                className="font-mono text-[10px] tracking-widest uppercase font-bold transition-colors duration-500"
              >
                {c.name}
              </text>
              <text 
                x={c.cx} 
                y={c.cy - 38} 
                textAnchor="middle" 
                fill={isCategoryActive ? '#F8FAFC' : 'rgba(255,255,255,0.2)'}
                className="font-display text-[12px] italic transition-colors duration-500"
              >
                {c.domain.split('&')[0]}
              </text>

              {/* Faint Boundary Arc */}
              <circle 
                cx={c.cx} 
                cy={c.cy} 
                r="70" 
                fill="none" 
                stroke={isCategoryActive ? '#F5D061' : 'rgba(255,255,255,0.06)'}
                strokeWidth={isCategoryActive ? 1 : 0.5}
                strokeDasharray={isCategoryActive ? 'none' : '3,6'}
              />
            </g>
          );
        })}

        {/* 240 Stars */}
        {TOOLS.map((star) => {
          const isShortlisted = shortlistedIds.has(star.id);
          const isChosen = chosenStarId === star.id;
          const isCategoryStar = activeCategory === star.category;
          const isHovered = hoveredStar?.id === star.id;

          let radius = 2.4;
          let starFill = 'rgba(226, 232, 240, 0.5)';
          let opacity = 0.55;

          if (raceState.status === 'idle') {
            radius = 2.2;
            opacity = 0.6;
          } else if (isChosen) {
            radius = 7;
            starFill = '#FDE047';
            opacity = 1;
          } else if (isShortlisted) {
            radius = 4.5;
            starFill = '#FDE047';
            opacity = 0.95;
          } else if (isCategoryStar) {
            radius = 3.2;
            starFill = '#E2E8F0';
            opacity = 0.75;
          } else {
            radius = 1.6;
            opacity = 0.15;
          }

          if (isHovered) {
            radius += 2.5;
            opacity = 1;
          }

          return (
            <g 
              key={star.id} 
              className="cursor-pointer transition-all duration-300"
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(null)}
              onClick={() => onSelectStar?.(star)}
            >
              {/* Polaris Supernova Aura */}
              {isChosen && (
                <>
                  <circle 
                    cx={star.x} 
                    cy={star.y} 
                    r="32" 
                    fill="url(#polarisSupernova)" 
                    className="animate-pulse"
                  />
                  <circle 
                    cx={star.x} 
                    cy={star.y} 
                    r="16" 
                    fill="none" 
                    stroke="#FDE047" 
                    strokeWidth="1.5"
                    className="animate-ping opacity-60"
                  />
                  <line 
                    x1={star.x - 14} y1={star.y} 
                    x2={star.x + 14} y2={star.y} 
                    stroke="#FFFBEB" strokeWidth="1.2" 
                  />
                  <line 
                    x1={star.x} y1={star.y - 14} 
                    x2={star.x} y2={star.y + 14} 
                    stroke="#FFFBEB" strokeWidth="1.2" 
                  />
                </>
              )}

              {/* Shortlist Expanding Ring */}
              {isShortlisted && !isChosen && (
                <circle 
                  cx={star.x} 
                  cy={star.y} 
                  r="10" 
                  fill="none" 
                  stroke="#38BDF8" 
                  strokeWidth="1"
                  strokeDasharray="2,3"
                />
              )}

              {/* Core Star */}
              <circle 
                cx={star.x} 
                cy={star.y} 
                r={radius} 
                fill={starFill} 
                opacity={opacity}
                className="transition-all duration-300"
              />
            </g>
          );
        })}
      </svg>

      {/* Floating Tooltip with Glassmorphic Border */}
      <AnimatePresence>
        {hoveredStar && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-5 left-6 right-6 md:right-auto md:w-[420px] p-4 rounded-xl border border-amber-400/50 bg-[#050A15]/95 shadow-[0_0_24px_rgba(0,0,0,0.8)] backdrop-blur-md z-30"
          >
            <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-amber-300 mb-1.5">
              <span>{hoveredStar.category} · {hoveredStar.id}</span>
              {shortlistedIds.has(hoveredStar.id) && (
                <span className="text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40">
                  ★ SHORTLISTED
                </span>
              )}
              {chosenStarId === hoveredStar.id && (
                <span className="text-amber-300 font-bold px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-400/50">
                  ✪ POLARIS WINNER
                </span>
              )}
            </div>
            <div className="font-display font-bold text-lg text-slate-100 mb-1">
              {hoveredStar.name.replace(/_/g, ' ')}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-body">
              {hoveredStar.descriptor}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Legend */}
      <div className="border-t border-white/10 bg-[#030610]/90 px-6 py-3 flex flex-wrap items-center justify-between text-xs font-mono text-slate-400">
        <div className="flex items-center gap-5">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-400 opacity-40" />
            <span>240 Tools in Sky</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#38BDF8]" />
            <span className="text-cyan-300">Shortlisted (1 to 6)</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_10px_#FDE047]" />
            <span className="text-amber-300 font-bold">Polaris Pick</span>
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400">
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>DECIDER 2B HIERARCHICAL PROJECTION</span>
        </div>
      </div>

    </div>
  );
};
