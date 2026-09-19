import React from 'react';

export const LiveIndicator = ({ isLive = true, label = 'LIVE ON STAGE', showPulse = true }) => {
  if (!isLive) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-semibold text-slate-400">
        <span className="w-2 h-2 rounded-full bg-slate-500"></span>
        <span>OFF AIR</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 border border-red-500/50 text-xs font-bold text-red-400 tracking-wider glow-live-box">
      <span className="relative flex h-2.5 w-2.5">
        {showPulse && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        )}
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
      </span>
      <span>{label}</span>
    </div>
  );
};

export default LiveIndicator;
