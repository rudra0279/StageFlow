import React from 'react';
import { useCountdown } from '../../hooks/useCountdown';
import { formatCountdown } from '../../utils/timeUtils';
import { Clock, AlertCircle } from 'lucide-react';

export const StageTimer = ({ session }) => {
  const { secondsRemaining, isOvertime, percentageElapsed } = useCountdown(session);

  return (
    <div
      className={`rounded-2xl border p-5 transition-all duration-300 ${
        isOvertime
          ? 'bg-rose-950/40 border-rose-500 shadow-2xl shadow-rose-950/60 glow-border-rose animate-alert'
          : 'bg-stage-900 border-stage-800'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 text-slate-400">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          Stage Countdown
        </span>

        {isOvertime ? (
          <span className="text-[11px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-rose-500 text-white animate-pulse flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            TIME OVERRUN
          </span>
        ) : (
          <span className="text-[11px] font-mono text-cyan-400 font-semibold">
            {session ? `${session.durationMinutes}m Allocated` : 'Idle'}
          </span>
        )}
      </div>

      {/* Main Big Number Display */}
      <div className="flex items-baseline justify-center py-2">
        <span
          className={`font-mono font-black text-6xl md:text-7xl tracking-tighter ${
            isOvertime ? 'text-rose-400' : 'text-white'
          }`}
        >
          {formatCountdown(secondsRemaining)}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 rounded-full bg-stage-950 overflow-hidden mt-3 border border-stage-800">
        <div
          className={`h-full transition-all duration-1000 ${
            isOvertime
              ? 'bg-rose-500 w-full'
              : percentageElapsed > 80
              ? 'bg-amber-400'
              : 'bg-gradient-to-r from-cyan-500 to-blue-500'
          }`}
          style={{ width: `${percentageElapsed}%` }}
        />
      </div>

      <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 font-mono">
        <span>0%</span>
        <span>{percentageElapsed}% Elapsed</span>
        <span>100%</span>
      </div>
    </div>
  );
};
