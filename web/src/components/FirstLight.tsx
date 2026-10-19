import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface FirstLightProps {
  onComplete: () => void;
}

export const FirstLight: React.FC<FirstLightProps> = ({ onComplete }) => {
  const [stage, setStage] = useState<number>(0);

  useEffect(() => {
    const hasSeen = sessionStorage.getItem('polaris_first_light_played');
    if (hasSeen) {
      onComplete();
      return;
    }

    const t1 = setTimeout(() => setStage(1), 300);
    const t2 = setTimeout(() => setStage(2), 900);
    const t3 = setTimeout(() => setStage(3), 1500);
    const t4 = setTimeout(() => {
      sessionStorage.setItem('polaris_first_light_played', 'true');
      onComplete();
    }, 2800);

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
      className="fixed inset-0 z-50 bg-[#010206] flex flex-col items-center justify-center cursor-pointer select-none overflow-hidden"
    >
      {/* Background Radial Space Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.15)_0%,transparent_70%)] pointer-events-none" />

      {/* Center Astrolabe Logo */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
        className="relative mb-6"
      >
        <div className="w-28 h-28 md:w-36 md:h-36 rounded-full p-1 border-2 border-amber-400/60 bg-[#050A15] shadow-[0_0_50px_rgba(245,208,97,0.35)] flex items-center justify-center overflow-hidden">
          <img 
            src="/polaris-logo.png" 
            alt="Polaris Logo" 
            className="w-full h-full object-cover rounded-full"
          />
        </div>
        {/* Pulsing ring */}
        <div className="absolute -inset-4 rounded-full border border-cyan-400/30 animate-ping opacity-40 pointer-events-none" />
      </motion.div>

      {/* Typography */}
      <div className={`relative z-10 text-center transition-all duration-700 ${stage >= 2 ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}>
        <div className="font-mono text-xs tracking-[0.35em] uppercase text-cyan-400 mb-2">
          AWS STRANDS DECIDER 2B · TOOL ROUTER
        </div>
        <h1 className="font-display text-5xl md:text-7xl font-bold tracking-widest text-slate-100 mb-2">
          POLARIS
        </h1>
        <p className="font-body italic text-lg md:text-xl text-amber-200/90 max-w-md mx-auto">
          One decision. 240 tools.
        </p>
      </div>

      {/* Skip Hint */}
      <div className="absolute bottom-8 text-[11px] font-mono text-slate-500 tracking-wider">
        [ CLICK OR PRESS ANY KEY TO ENTER ]
      </div>

    </div>
  );
};
