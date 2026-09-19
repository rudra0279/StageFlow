import React from 'react';

export const StatusBadge = ({ status = 'UPCOMING', size = 'md' }) => {
  const getStyles = () => {
    switch (status.toUpperCase()) {
      case 'LIVE':
      case 'ON STAGE':
        return 'bg-red-500/10 text-red-400 border-red-500/40 glow-live-box';
      case 'READY':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40';
      case 'DELAYED':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/40 glow-amber-box';
      case 'COMPLETED':
        return 'bg-slate-800/60 text-slate-400 border-slate-700';
      case 'UPCOMING':
      default:
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/40';
    }
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : size === 'lg' ? 'px-4 py-1.5 text-sm font-semibold' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border ${getStyles()} ${sizeClasses} uppercase tracking-wider`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {status}
    </span>
  );
};

export default StatusBadge;
