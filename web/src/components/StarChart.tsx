import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TOOLS, CONSTELLATIONS } from '../catalog';
import { type Tool, type RaceState } from '../types';
import { Radio, Cpu, Star, Award } from 'lucide-react';

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
    <div className="relative w-full h-[620px] lg:h-[720px] rounded-xl border border-white/10 bg-[#02040A] overflow-hidden shadow-2xl flex flex-col justify-between group">
      
      {/* Moving Laser Beam on Frame Border */}
      <div className="absolute inset-0 pointer-events-none rounded-xl border border-white/5 z-20">
        <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
        <div className="absolute inset-x-0 bottom-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-40" />
      </div>

      {/* Optical Corner Reticles */}
      <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-amber-400/50 pointer-events-none z-20" />
      <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-amber-400/50 pointer-events-none z-20" />
      <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-cyan-400/50 pointer-events-none z-20" />
      <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-cyan-400/50 pointer-events-none z-20" />

      {/* Header Overlay */}
      <div className="absolute top-4 left-6 right-6 z-10 pointer-events-none flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-[10px] font-mono tracking-widest text-amber-300 font-bold uppercase">
              PLATE 0 · CELESTIAL MCP TOPOLOGY
            </span>
          </div>
          <h2 className="font-display text-2xl lg:text-3xl text-slate-100 font-bold tracking-wide">
            Radial MCP Web & Star Atlas
          </h2>
          <div className="text-xs text-slate-400 font-mono mt-0.5">
            Central Decider Core · 12 Surrounding Subsystems · 240 Instruments
          </div>
        </div>

        {/* Live Router Status */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-md border border-white/10 bg-[#050A15]/90 backdrop-blur text-xs font-mono shadow-md">
          <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="text-slate-400">CORE HUB:</span>
          <span className="text-amber-300 font-bold uppercase">
            {raceState.decision ? `${raceState.decision.tier}` : 'NOMINAL'}
          </span>
        </div>
      </div>

      {/* SVG Canvas with Radial Web Architecture */}
      <svg 
        viewBox="0 0 1000 700" 
        className="w-full h-full select-none"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Radial Center Core Supernova */}
          <radialGradient id="centerCoreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFBEB" stopOpacity="1" />
            <stop offset="30%" stopColor="#FDE047" stopOpacity="0.9" />
            <stop offset="65%" stopColor="#38BDF8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#02040A" stopOpacity="0" />
          </radialGradient>

          {/* Active Constellation Glow */}
          <radialGradient id="activeMcpNodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#FDE047" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#02040A" stopOpacity="0" />
          </radialGradient>

          {/* Background Nebula Halo */}
          <radialGradient id="skyNebulaBackdrop" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1E293B" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#0F172A" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#02040A" stopOpacity="0" />
          </radialGradient>

          <filter id="glowFilter" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ambient Cosmic Background Disc */}
        <circle cx="500" cy="350" r="320" fill="url(#skyNebulaBackdrop)" />

        {/* Concentric Orbit Guide Rings */}
        <g stroke="rgba(255, 255, 255, 0.05)" strokeWidth="0.8" fill="none">
          <circle cx="500" cy="350" r="120" strokeDasharray="3 6" />
          <circle cx="500" cy="350" r="230" strokeDasharray="4 6" />
          <circle cx="500" cy="350" r="310" strokeDasharray="2 8" />
        </g>

        {/* --- WEB NETWORK CONDUITS --- */}

        {/* Perimeter Web Links Connecting Adjacent Constellations (0->1->2...->11->0) */}
        {CONSTELLATIONS.map((c, i) => {
          const next = CONSTELLATIONS[(i + 1) % CONSTELLATIONS.length];
          return (
            <line
              key={`web-${c.id}-${next.id}`}
              x1={c.cx}
              y1={c.cy}
              x2={next.cx}
              y2={next.cy}
              stroke="rgba(56, 189, 248, 0.15)"
              strokeWidth="1"
              strokeDasharray="4 6"
            />
          );
        })}

        {/* Radial Spoke Lines from Central Core (500, 350) to each Constellation */}
        {CONSTELLATIONS.map((c) => {
          const isActive = activeCategory === c.id;
          return (
            <g key={`spoke-${c.id}`}>
              <line
                x1="500"
                y1="350"
                x2={c.cx}
                y2={c.cy}
                stroke={isActive ? '#38BDF8' : 'rgba(255, 255, 255, 0.12)'}
                strokeWidth={isActive ? 2 : 1}
                strokeDasharray={isActive ? 'none' : '3 6'}
                filter={isActive ? 'url(#glowFilter)' : undefined}
                className={isActive ? 'transition-all duration-500' : ''}
              />

              {/* Animated Photon Pulse travelling from Center Core to Active Constellation */}
              {isActive && (
                <circle r="4" fill="#FDE047" filter="url(#glowFilter)">
                  <animateMotion
                    path={`M 500 350 L ${c.cx} ${c.cy}`}
                    dur="1.2s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
            </g>
          );
        })}

        {/* Idle Ambient Travelling Photons on Ring */}
        <circle r="2.5" fill="#38BDF8" opacity="0.7">
          <animateMotion
            path={`M ${CONSTELLATIONS[0].cx} ${CONSTELLATIONS[0].cy} ${CONSTELLATIONS.map(c => `L ${c.cx} ${c.cy}`).join(' ')} Z`}
            dur="18s"
            repeatCount="indefinite"
          />
        </circle>

        {/* --- 12 SURROUNDING CONSTELLATIONS (MCP SUBSYSTEMS) --- */}
        {CONSTELLATIONS.map((c) => {
          const isActive = activeCategory === c.id;
          return (
            <g key={c.id}>
              {/* Outer Energy Pulse Ring if Active */}
              {isActive && (
                <>
                  <circle 
                    cx={c.cx} 
                    cy={c.cy} 
                    r="68" 
                    fill="url(#activeMcpNodeGlow)" 
                    className="animate-pulse"
                  />
                  <circle 
                    cx={c.cx} 
                    cy={c.cy} 
                    r="54" 
                    fill="none" 
                    stroke="#38BDF8" 
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    className="animate-spin-slow origin-center"
                  />
                </>
              )}

              {/* Constellation Base Node Ring */}
              <circle 
                cx={c.cx} 
                cy={c.cy} 
                r="42" 
                fill={isActive ? 'rgba(5, 10, 25, 0.95)' : 'rgba(3, 6, 16, 0.7)'} 
                stroke={isActive ? '#FDE047' : 'rgba(255, 255, 255, 0.2)'}
                strokeWidth={isActive ? 1.5 : 0.8}
                filter={isActive ? 'url(#glowFilter)' : undefined}
              />

              {/* Constellation Title */}
              <text 
                x={c.cx} 
                y={c.cy - 12} 
                textAnchor="middle" 
                fill={isActive ? '#FDE047' : 'rgba(248, 250, 252, 0.75)'}
                className="font-mono text-[10px] tracking-widest uppercase font-bold select-none"
              >
                {c.name}
              </text>
              <text 
                x={c.cx} 
                y={c.cy + 2} 
                textAnchor="middle" 
                fill={isActive ? '#FFFFFF' : 'rgba(203, 213, 225, 0.45)'}
                className="font-display text-[11px] italic select-none"
              >
                {c.domain.split('&')[0]}
              </text>
              <text 
                x={c.cx} 
                y={c.cy + 15} 
                textAnchor="middle" 
                fill={isActive ? '#38BDF8' : 'rgba(148, 163, 184, 0.4)'}
                className="font-mono text-[8px] tracking-wider select-none"
              >
                20 TOOLS
              </text>
            </g>
          );
        })}

        {/* --- 240 STARS SURROUNDING THEIR CONSTELLATION HUBS --- */}
        {TOOLS.map((star) => {
          const isShortlisted = shortlistedIds.has(star.id);
          const isChosen = chosenStarId === star.id;
          const isCategoryStar = activeCategory === star.category;
          const isHovered = hoveredStar?.id === star.id;

          let radius = 2.4;
          let starFill = 'rgba(226, 232, 240, 0.55)';
          let opacity = 0.6;

          if (isChosen) {
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
            opacity = 0.85;
          } else {
            radius = 1.7;
            opacity = 0.2;
          }

          if (isHovered) {
            radius += 2.5;
            opacity = 1;
          }

          return (
            <g 
              key={star.id} 
              className="cursor-pointer"
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(null)}
              onClick={() => onSelectStar?.(star)}
            >
              {/* Polaris Supernova Aura on Chosen Tool */}
              {isChosen && (
                <>
                  <circle 
                    cx={star.x} 
                    cy={star.y} 
                    r="28" 
                    fill="url(#centerCoreGlow)" 
                    className="animate-pulse"
                  />
                  <circle 
                    cx={star.x} 
                    cy={star.y} 
                    r="14" 
                    fill="none" 
                    stroke="#FDE047" 
                    strokeWidth="1.5"
                    className="animate-ping opacity-60"
                  />
                </>
              )}

              {/* Shortlist Wave */}
              {isShortlisted && !isChosen && (
                <circle 
                  cx={star.x} 
                  cy={star.y} 
                  r="9" 
                  fill="none" 
                  stroke="#38BDF8" 
                  strokeWidth="1"
                  strokeDasharray="2 3"
                />
              )}

              {/* Star Core */}
              <circle 
                cx={star.x} 
                cy={star.y} 
                r={radius} 
                fill={starFill} 
                opacity={opacity}
                className="transition-all duration-200"
              />
            </g>
          );
        })}

        {/* --- CENTRAL MCP ORB (THE CORE HUB AT 500, 350) --- */}
        <g className="cursor-pointer">
          {/* Ambient Outer Halo */}
          <circle 
            cx="500" 
            cy="350" 
            r="75" 
            fill="url(#centerCoreGlow)" 
            opacity="0.8"
            className="animate-pulse"
          />

          {/* Rotating Celestial Gyroscope Rings */}
          <circle 
            cx="500" 
            cy="350" 
            r="56" 
            fill="none" 
            stroke="#FDE047" 
            strokeWidth="1.5"
            strokeDasharray="6 8"
            className="animate-spin-slow origin-center"
          />
          <circle 
            cx="500" 
            cy="350" 
            r="44" 
            fill="none" 
            stroke="#38BDF8" 
            strokeWidth="1"
            strokeDasharray="4 4"
          />

          {/* Core Disc */}
          <circle 
            cx="500" 
            cy="350" 
            r="35" 
            fill="#050A15" 
            stroke="#FDE047" 
            strokeWidth="2"
            filter="url(#glowFilter)"
          />

          {/* Center 8-pointed Polaris Star */}
          <polygon 
            points="500,328 504,344 520,344 507,353 512,369 500,359 488,369 493,353 480,344 496,344"
            fill="#FFFBEB"
          />

          {/* Center Label */}
          <text 
            x="500" 
            y="398" 
            textAnchor="middle" 
            fill="#FDE047" 
            className="font-mono text-[10px] tracking-widest uppercase font-bold"
          >
            DECIDER 2B
          </text>
          <text 
            x="500" 
            y="410" 
            textAnchor="middle" 
            fill="#38BDF8" 
            className="font-mono text-[8px] tracking-wider"
          >
            MCP HOST CORE
          </text>
        </g>
      </svg>

      {/* Floating Tooltip */}
      <AnimatePresence>
        {hoveredStar && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-5 left-6 right-6 md:right-auto md:w-[420px] p-4 rounded-xl border border-[#E0FFC2]/50 bg-[#041c14]/95 shadow-[0_0_30px_rgba(0,0,0,0.9)] backdrop-blur-md z-30"
          >
            <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[#E0FFC2] mb-1.5">
              <span>{hoveredStar.category} · {hoveredStar.id}</span>
              {shortlistedIds.has(hoveredStar.id) && (
                <span className="text-emerald-300 font-bold px-2 py-0.5 rounded bg-[#064734] border border-[#E0FFC2]/40 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current text-emerald-300" />
                  <span>SHORTLISTED</span>
                </span>
              )}
              {chosenStarId === hoveredStar.id && (
                <span className="text-[#E0FFC2] font-bold px-2 py-0.5 rounded bg-[#064734] border border-[#E0FFC2]/60 shadow-[0_0_10px_rgba(224,255,194,0.2)] flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-[#E0FFC2]" />
                  <span>POLARIS WINNER</span>
                </span>
              )}
            </div>
            <div className="font-display font-bold text-lg text-[#F2FDF0] mb-1">
              {hoveredStar.name.replace(/_/g, ' ')}
            </div>
            <p className="text-xs text-[#C2E2BE] leading-relaxed font-body">
              {hoveredStar.descriptor}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Legend */}
      <div className="border-t border-[#E0FFC2]/12 bg-[#02120e]/95 px-6 py-3 flex flex-wrap items-center justify-between text-xs font-mono text-[#82A98B]">
        <div className="flex items-center gap-5">
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E0FFC2] shadow-[0_0_8px_#E0FFC2]" />
            <span className="text-[#E0FFC2] font-bold">Center: Decider 2B MCP Hub</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399]" />
            <span className="text-emerald-300">Surrounding 12 Subsystems</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#82A98B] opacity-60" />
            <span>240 Tools in Orbit</span>
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-[#E0FFC2]">
          <Radio className="w-3.5 h-3.5 animate-pulse text-[#E0FFC2]" />
          <span>RADIAL GEODESIC TOPOLOGY ACTIVE</span>
        </div>
      </div>

    </div>
  );
};
