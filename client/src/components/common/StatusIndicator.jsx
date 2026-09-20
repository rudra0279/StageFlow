import React from 'react';

export const StatusIndicator = ({
  status = 'LIVE', // 'LIVE' | 'ON SCHEDULE' | 'RUNNING LATE' | 'CRITICAL' | 'PAUSED' | 'COMPLETED'
  pulse = true,
  size = 'md',
  className = ''
}) => {
  const configs = {
    LIVE: {
      color: 'bg-emerald-500 text-emerald-400 border-emerald-500/30',
      dot: 'bg-emerald-400',
      glow: 'shadow-[0_0_12px_rgba(16,185,129,0.5)]',
      label: '● LIVE'
    },
    'ON SCHEDULE': {
      color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      dot: 'bg-cyan-400',
      glow: 'shadow-[0_0_10px_rgba(6,182,212,0.3)]',
      label: 'ON SCHEDULE'
    },
    'RUNNING LATE': {
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      dot: 'bg-amber-400',
      glow: 'shadow-[0_0_10px_rgba(245,158,11,0.3)]',
      label: 'RUNNING LATE'
    },
    CRITICAL: {
      color: 'bg-rose-500/15 text-rose-400 border-rose-500/40',
      dot: 'bg-rose-500',
      glow: 'shadow-[0_0_15px_rgba(244,63,94,0.6)] animate-pulse',
      label: 'CRITICAL'
    },
    PAUSED: {
      color: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      dot: 'bg-purple-400',
      glow: 'shadow-[0_0_10px_rgba(168,85,247,0.3)]',
      label: 'PAUSED'
    },
    COMPLETED: {
      color: 'bg-slate-800 text-slate-400 border-slate-700',
      dot: 'bg-slate-500',
      glow: '',
      label: 'COMPLETED'
    }
  };

  const current = configs[status] || configs['LIVE'];
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1 font-semibold tracking-wider',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-bold tracking-wider',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-bold tracking-widest'
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border backdrop-blur-md uppercase transition-all duration-300 ${
        current.color
      } ${current.glow} ${sizeClasses[size] || sizeClasses.md} ${className}`}
    >
      <span
        className={`w-2 h-2 rounded-full shrink-0 ${current.dot} ${
          pulse && status === 'LIVE' ? 'animate-live-dot' : ''
        }`}
      />
      <span>{current.label}</span>
    </span>
  );
};

export default StatusIndicator;
