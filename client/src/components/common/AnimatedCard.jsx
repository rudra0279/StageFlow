import React from 'react';

export const AnimatedCard = ({
  children,
  className = '',
  glow = null,
  active = false,
  onClick,
  ...props
}) => {
  const glowStyles = {
    cyan: 'border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.25)]',
    emerald: 'border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.25)]',
    purple: 'border-purple-500/40 shadow-[0_0_25px_rgba(168,85,247,0.25)]',
    rose: 'border-rose-500/40 shadow-[0_0_25px_rgba(244,63,94,0.25)]'
  };

  return (
    <div
      onClick={onClick}
      className={`glass-panel rounded-2xl p-5 transition-all duration-300 transform hover:-translate-y-1 ${
        active ? 'border-cyan-500/50 bg-cyan-500/5 shadow-lg shadow-cyan-500/10' : ''
      } ${glow ? glowStyles[glow] || '' : 'hover:border-cyan-500/30'} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default AnimatedCard;
