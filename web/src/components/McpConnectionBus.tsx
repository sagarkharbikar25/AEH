import React from 'react';

/**
 * McpConnectionBus
 * Visual circuit fiber interconnects that physically link Plate 0 (Star Chart)
 * with Plate I (Query), Plate II (The Race), and Plate III (Decision Trace).
 * Features traveling photon pulses along circuit traces.
 */
export const McpConnectionBus: React.FC = () => {
  return (
    <div className="hidden lg:block absolute inset-0 pointer-events-none z-10 overflow-hidden">
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Glowing linear gradient for the MCP bus line */}
          <linearGradient id="mcpBusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#FDE047" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.8" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="photonGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Trace 1: Star Chart Right Edge -> Plate I (Query) */}
        <path
          d="M 58% 280 L 60% 280 L 61% 210 L 63% 210"
          fill="none"
          stroke="rgba(56, 189, 248, 0.25)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />

        {/* Trace 2: Plate I -> Plate II (The Race) */}
        <path
          d="M 63% 410 L 61% 410 L 61% 490 L 63% 490"
          fill="none"
          stroke="rgba(245, 208, 97, 0.3)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />

        {/* Trace 3: Star Chart Lower -> Plate III (Trace) */}
        <path
          d="M 58% 620 L 61% 620 L 61% 760 L 63% 760"
          fill="none"
          stroke="rgba(56, 189, 248, 0.25)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />

        {/* Animated Traveling Photons (Light Pulses along the Bus) */}
        <circle r="3.5" fill="#38BDF8" filter="url(#photonGlow)">
          <animateMotion
            path="M 63% 210 L 61% 210 L 60% 280 L 58% 280"
            dur="2.8s"
            repeatCount="indefinite"
          />
        </circle>

        <circle r="3.5" fill="#FDE047" filter="url(#photonGlow)">
          <animateMotion
            path="M 58% 280 L 60% 280 L 61% 490 L 63% 490"
            dur="3.4s"
            begin="0.8s"
            repeatCount="indefinite"
          />
        </circle>

        <circle r="3.5" fill="#34D399" filter="url(#photonGlow)">
          <animateMotion
            path="M 63% 490 L 61% 490 L 61% 760 L 63% 760"
            dur="2.5s"
            begin="1.4s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Junction Nodes (Circuit Terminals) */}
        <g fill="#050A15" stroke="#38BDF8" strokeWidth="1.5">
          <circle cx="58%" cy="280" r="4.5" />
          <circle cx="63%" cy="210" r="4.5" />
          <circle cx="63%" cy="410" r="4.5" stroke="#FDE047" />
          <circle cx="63%" cy="490" r="4.5" stroke="#FDE047" />
          <circle cx="58%" cy="620" r="4.5" />
          <circle cx="63%" cy="760" r="4.5" stroke="#34D399" />
        </g>
      </svg>
    </div>
  );
};
