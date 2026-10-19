import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

interface FirstLightProps {
  onComplete: () => void;
}

export const FirstLight: React.FC<FirstLightProps> = ({ onComplete }) => {
  const [stage, setStage] = useState<number>(0);

  useEffect(() => {
    // Check if user already saw First Light this session
    const hasSeen = sessionStorage.getItem('polaris_first_light_played');
    if (hasSeen) {
      onComplete();
      return;
    }

    // Sequence stages:
    // 0: Ink sky (0ms)
    // 1: Stars spark (400ms)
    // 2: Constellation line draws (1000ms)
    // 3: Polaris ignites & title appears (1500ms)
    // 4: Complete and fade out (2400ms)
    const t1 = setTimeout(() => setStage(1), 300);
    const t2 = setTimeout(() => setStage(2), 900);
    const t3 = setTimeout(() => setStage(3), 1400);
    const t4 = setTimeout(() => {
      sessionStorage.setItem('polaris_first_light_played', 'true');
      onComplete();
    }, 2500);

    const handleSkip = () => {
      sessionStorage.setItem('polaris_first_light_played', 'true');
      onComplete();
    };

    window.addEventListener('keydown', handleSkip);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      window.removeEventListener('keydown', handleSkip);
    };
  }, [onComplete]);

  const dismiss = () => {
    sessionStorage.setItem('polaris_first_light_played', 'true');
    onComplete();
  };

  return (
    <div 
      onClick={dismiss}
      className="fixed inset-0 z-50 bg-[var(--ink-900)] flex flex-col items-center justify-center cursor-pointer select-none overflow-hidden"
    >
      {/* Background SVG sky */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 700">
        {/* Constellation line */}
        {stage >= 2 && (
          <path
            d="M 250,300 L 420,240 L 500,200 L 620,280 L 750,350"
            fill="none"
            stroke="var(--brass)"
            strokeWidth="1.2"
            strokeDasharray="600"
            strokeDashoffset="0"
            className="transition-all duration-1000"
            opacity={stage >= 2 ? 0.7 : 0}
          />
        )}

        {/* Stars */}
        {stage >= 1 && (
          <g>
            <circle cx="250" cy="300" r="3" fill="var(--parchment)" opacity="0.8" />
            <circle cx="420" cy="240" r="3.5" fill="var(--parchment)" opacity="0.9" />
            <circle cx="620" cy="280" r="3" fill="var(--parchment)" opacity="0.8" />
            <circle cx="750" cy="350" r="4" fill="var(--parchment)" opacity="0.9" />
          </g>
        )}

        {/* Polaris Golden Star */}
        {stage >= 3 && (
          <g className="animate-pulse">
            <circle cx="500" cy="200" r="28" fill="url(#splashGlow)" opacity="0.9" />
            <circle cx="500" cy="200" r="6" fill="var(--brass-bright)" />
            <circle cx="500" cy="200" r="14" fill="none" stroke="var(--brass)" strokeWidth="1" />
          </g>
        )}

        <defs>
          <radialGradient id="splashGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF2B2" stopOpacity="1" />
            <stop offset="50%" stopColor="#C9A45C" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#070B16" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>

      {/* Wordmark and Tagline */}
      <div className={`relative z-10 text-center transition-all duration-700 ${stage >= 3 ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-[var(--brass-bright)] animate-spin-slow" />
          <span className="font-mono text-xs tracking-[0.3em] uppercase text-[var(--brass)]">
            AWS STRANDS DECIDER 2B
          </span>
        </div>
        <h1 className="font-display text-5xl md:text-7xl font-bold tracking-widest text-[var(--parchment)] mb-3">
          POLARIS
        </h1>
        <p className="font-body italic text-lg md:text-xl text-[var(--parchment-dim)] max-w-md mx-auto">
          One decision. 240 tools.
        </p>
      </div>

      {/* Skip Hint */}
      <div className="absolute bottom-8 text-[11px] font-mono text-[var(--parchment-muted)] tracking-wider">
        [ CLICK OR PRESS ANY KEY TO ENTER OBSERVATORY ]
      </div>

    </div>
  );
};
