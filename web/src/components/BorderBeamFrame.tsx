import React from 'react';
import { motion } from 'framer-motion';

interface BorderBeamFrameProps {
  children: React.ReactNode;
  className?: string;
  activeBeam?: boolean;
  terminalLabel?: string;
  portId?: string;
}

export const BorderBeamFrame: React.FC<BorderBeamFrameProps> = ({
  children,
  className = '',
  activeBeam = true,
  terminalLabel = 'MCP TERMINAL',
  portId = 'BUS // 8000'
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`relative rounded-xl border border-white/10 bg-[#040814]/90 shadow-[0_8px_32px_rgba(0,0,0,0.7)] backdrop-blur-xl overflow-hidden group ${className}`}
    >
      {/* Moving Laser Beam on Border if active */}
      {activeBeam && (
        <div className="absolute inset-0 pointer-events-none rounded-xl z-20">
          {/* Subtle top edge animated gradient trace */}
          <div className="absolute -top-[1px] inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
          <div className="absolute -bottom-[1px] inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-50" />
        </div>
      )}

      {/* Optical Corner Reticles (Precision Hardware Brackets) */}
      <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 border-t border-l border-amber-400/40 pointer-events-none z-20" />
      <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 border-t border-r border-amber-400/40 pointer-events-none z-20" />
      <div className="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 border-b border-l border-cyan-400/30 pointer-events-none z-20" />
      <div className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 border-b border-r border-cyan-400/30 pointer-events-none z-20" />

      {/* Hardware Top Rail Telemetry Bar */}
      <div className="border-b border-white/5 bg-[#02050E]/80 px-4 py-1.5 flex items-center justify-between text-[10px] font-mono text-slate-500 select-none">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="tracking-widest text-slate-400 font-semibold">{terminalLabel}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-amber-400/80 font-bold">{portId}</span>
          <span className="text-slate-600 hidden sm:inline">CALIBRATED</span>
        </div>
      </div>

      {/* Frame Content */}
      <div className="p-5 lg:p-6 relative z-10">
        {children}
      </div>
    </motion.div>
  );
};
