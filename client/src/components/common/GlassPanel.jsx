import React from 'react';

export const GlassPanel = ({
  children,
  className = '',
  interactive = false,
  glow = null, // 'cyan' | 'rose' | 'violet' | 'emerald'
  ...props
}) => {
  const glowClasses = {
    cyan: 'glow-border-cyan border-cyan-500/30',
    rose: 'glow-border-rose border-rose-500/30',
    violet: 'glow-border-violet border-purple-500/30',
    emerald: 'glow-border-emerald border-emerald-500/30'
  };

  const baseClass = interactive ? 'glass-panel-interactive' : 'glass-panel';

  return (
    <div
      className={`${baseClass} rounded-2xl p-5 ${glow ? glowClasses[glow] || '' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassPanel;
