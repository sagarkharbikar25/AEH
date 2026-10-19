import React, { useState } from 'react';
import { TOOLS, CONSTELLATIONS } from '../catalog';
import { Tool, RaceState } from '../types';

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
    <div className="relative w-full h-[520px] md:h-[620px] rounded border border-[var(--line)] bg-[var(--ink-900)] overflow-hidden shadow-2xl flex flex-col justify-between">
      
      {/* Chart Title Overlay */}
      <div className="absolute top-4 left-5 z-10 pointer-events-none">
        <div className="text-[10px] font-mono tracking-widest text-[var(--brass)] uppercase">
          PLATE 0 · CELESTIAL ATLAS
        </div>
        <div className="font-display text-xl text-[var(--parchment)] tracking-wide">
          Octant of 240 Instruments
        </div>
        <div className="text-xs text-[var(--parchment-muted)] font-mono">
          {shortlistedIds.size > 0 
            ? `${shortlistedIds.size} stars ignited in focus` 
            : '240 tools mapped across 12 constellations'}
        </div>
      </div>

      {/* Star Chart SVG */}
      <svg 
        viewBox="0 0 1000 700" 
        className="w-full h-full select-none"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Radial Polaris Golden Glow Filter */}
          <radialGradient id="polarisGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF2B2" stopOpacity="1" />
            <stop offset="40%" stopColor="#F0CF85" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#C9A45C" stopOpacity="0" />
          </radialGradient>

          {/* Constellation field glow */}
          <radialGradient id="constellationFocus" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#6F86C9" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#070B16" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Faint Celestial Coordinate Lines */}
        <g stroke="var(--line-dim)" strokeWidth="0.5" strokeDasharray="3,6" opacity="0.6">
          <line x1="50" y1="350" x2="950" y2="350" />
          <line x1="500" y1="40" x2="500" y2="660" />
          <circle cx="500" cy="350" r="280" fill="none" />
          <circle cx="500" cy="350" r="160" fill="none" />
        </g>

        {/* Constellations */}
        {CONSTELLATIONS.map((c) => {
          const isCategoryActive = activeCategory === c.id;
          return (
            <g key={c.id}>
              {/* Highlight halo when active */}
              {isCategoryActive && (
                <circle 
                  cx={c.cx} 
                  cy={c.cy} 
                  r="110" 
                  fill="url(#constellationFocus)" 
                  className="animate-pulse-slow"
                />
              )}

              {/* Constellation Label */}
              <text 
                x={c.cx} 
                y={c.cy - 52} 
                textAnchor="middle" 
                fill={isCategoryActive ? 'var(--brass-bright)' : 'var(--line)'}
                className="font-mono text-[9px] tracking-widest uppercase transition-colors duration-500"
              >
                {c.name}
              </text>
              <text 
                x={c.cx} 
                y={c.cy - 40} 
                textAnchor="middle" 
                fill={isCategoryActive ? 'var(--parchment)' : 'var(--parchment-muted)'}
                className="font-display text-[11px] italic transition-colors duration-500"
              >
                {c.domain.split('&')[0]}
              </text>

              {/* Faint constellation boundary ring */}
              <circle 
                cx={c.cx} 
                cy={c.cy} 
                r="70" 
                fill="none" 
                stroke={isCategoryActive ? 'var(--brass)' : 'var(--line)'}
                strokeWidth={isCategoryActive ? 0.8 : 0.4}
                strokeDasharray={isCategoryActive ? 'none' : '2,4'}
                opacity={isCategoryActive ? 0.8 : 0.25}
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

          // Determine visual styling
          let radius = 2.4;
          let starFill = 'var(--parchment-dim)';
          let opacity = 0.55;

          if (raceState.status === 'idle') {
            radius = 2.2;
            opacity = 0.6;
          } else if (isChosen) {
            radius = 6;
            starFill = 'var(--brass-bright)';
            opacity = 1;
          } else if (isShortlisted) {
            radius = 4.2;
            starFill = 'var(--brass-bright)';
            opacity = 0.95;
          } else if (isCategoryStar) {
            radius = 3;
            starFill = 'var(--parchment)';
            opacity = 0.75;
          } else {
            // Dimmed out when another category is chosen
            radius = 1.8;
            opacity = 0.2;
          }

          if (isHovered) {
            radius += 2;
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
              {/* Polaris Final Pick Glowing Halo */}
              {isChosen && (
                <>
                  <circle 
                    cx={star.x} 
                    cy={star.y} 
                    r="24" 
                    fill="url(#polarisGlow)" 
                    className="animate-pulse"
                  />
                  <circle 
                    cx={star.x} 
                    cy={star.y} 
                    r="14" 
                    fill="none" 
                    stroke="var(--brass-bright)" 
                    strokeWidth="1.2"
                  />
                </>
              )}

              {/* Shortlist expanding ring */}
              {isShortlisted && !isChosen && (
                <circle 
                  cx={star.x} 
                  cy={star.y} 
                  r="8" 
                  fill="none" 
                  stroke="var(--brass)" 
                  strokeWidth="0.8"
                  strokeDasharray="2,2"
                />
              )}

              {/* Core Star Node */}
              <circle 
                cx={star.x} 
                cy={star.y} 
                r={radius} 
                fill={starFill} 
                opacity={opacity}
              />
            </g>
          );
        })}
      </svg>

      {/* Interactive Hover / Selection Tooltip */}
      {hoveredStar && (
        <div className="absolute bottom-4 left-5 right-5 md:right-auto md:w-96 p-3.5 rounded border border-[var(--brass)] bg-[var(--ink-800)]/95 shadow-xl backdrop-blur z-20">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[var(--brass)] mb-1">
            <span>{hoveredStar.category} · {hoveredStar.id}</span>
            {shortlistedIds.has(hoveredStar.id) && (
              <span className="text-[var(--lichen)] font-bold">★ SHORTLISTED</span>
            )}
            {chosenStarId === hoveredStar.id && (
              <span className="text-[var(--brass-bright)] font-bold">✪ POLARIS PICK</span>
            )}
          </div>
          <div className="font-display font-semibold text-base text-[var(--parchment)] mb-1">
            {hoveredStar.name.replace(/_/g, ' ')}
          </div>
          <p className="text-xs text-[var(--parchment-dim)] leading-relaxed">
            {hoveredStar.descriptor}
          </p>
        </div>
      )}

      {/* Legend Footer */}
      <div className="border-t border-[var(--line)] bg-[var(--ink-900)]/80 px-4 py-2 flex flex-wrap items-center justify-between text-[11px] font-mono text-[var(--parchment-muted)]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--parchment-dim)] opacity-40" />
            <span>240 Tools in Sky</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--brass)]" />
            <span>Shortlist (1 to 6)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[var(--brass-bright)] shadow-[0_0_8px_var(--brass-bright)]" />
            <span className="text-[var(--brass-bright)] font-bold">Polaris Pick</span>
          </span>
        </div>
        <div className="hidden sm:block text-[10px] text-[var(--brass)]">
          DECIDER 2B HIERARCHICAL PROJECTION
        </div>
      </div>

    </div>
  );
};
