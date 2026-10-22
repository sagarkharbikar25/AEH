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
      <svg className="w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Glowing linear gradient for the MCP bus line */}
          <linearGradient id="mcpBusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#064734" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#E0FFC2" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#064734" stopOpacity="0.8" />
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
          d="M 580 280 L 600 280 L 610 210 L 630 210"
          fill="none"
          stroke="rgba(224, 255, 194, 0.3)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />

        {/* Trace 2: Plate I -> Plate II (The Race) */}
        <path
          d="M 630 410 L 610 410 L 610 490 L 630 490"
          fill="none"
          stroke="rgba(224, 255, 194, 0.4)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />

        {/* Trace 3: Star Chart Lower -> Plate III (Trace) */}
        <path
          d="M 580 620 L 610 620 L 610 760 L 630 760"
          fill="none"
          stroke="rgba(224, 255, 194, 0.3)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />

        {/* Animated Traveling Photons (Light Pulses along the Bus) */}
        <circle r="3.5" fill="#E0FFC2" filter="url(#photonGlow)">
          <animateMotion
            path="M 630 210 L 610 210 L 600 280 L 580 280"
            dur="2.8s"
            repeatCount="indefinite"
          />
        </circle>

        <circle r="3.5" fill="#E0FFC2" filter="url(#photonGlow)">
          <animateMotion
            path="M 580 280 L 600 280 L 610 490 L 630 490"
            dur="3.4s"
            begin="0.8s"
            repeatCount="indefinite"
          />
        </circle>

        <circle r="3.5" fill="#5EEAD4" filter="url(#photonGlow)">
          <animateMotion
            path="M 630 490 L 610 490 L 610 760 L 630 760"
            dur="2.5s"
            begin="1.4s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Junction Nodes (Circuit Terminals) */}
        <g fill="#041c14" stroke="#E0FFC2" strokeWidth="1.5">
          <circle cx="580" cy="280" r="4.5" />
          <circle cx="630" cy="210" r="4.5" />
          <circle cx="630" cy="410" r="4.5" stroke="#E0FFC2" />
          <circle cx="630" cy="490" r="4.5" stroke="#E0FFC2" />
          <circle cx="580" cy="620" r="4.5" />
          <circle cx="630" cy="760" r="4.5" stroke="#5EEAD4" />
        </g>
      </svg>
    </div>
  );
};
