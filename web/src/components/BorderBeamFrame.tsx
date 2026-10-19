import React from 'react';
import { motion } from 'framer-motion';

interface BorderBeamFrameProps {
  children: React.ReactNode;
  className?: string;
  activeBeam?: boolean;
}

export const BorderBeamFrame: React.FC<BorderBeamFrameProps> = ({
  children,
  className = '',
  activeBeam = true
}) => {
  if (!activeBeam) {
    return (
      <div className={`plate ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`border-beam-container ${className}`}
    >
      <div className="border-beam-content p-6">
        {children}
      </div>
    </motion.div>
  );
};
