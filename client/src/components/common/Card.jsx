import React from 'react';

export const Card = ({
  children,
  className = '',
  hoverEffect = false,
  glow = false,
  ...props
}) => {
  return (
    <div
      className={`bg-stage-900 border border-stage-800/80 rounded-xl p-5 ${
        hoverEffect ? 'hover:border-stage-700 transition-all duration-200' : ''
      } ${glow ? 'glow-border-cyan border-cyan-500/30' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
