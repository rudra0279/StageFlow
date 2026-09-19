import React from 'react';
import { Play, Pause, RotateCcw, Plus, Minus } from 'lucide-react';
import { formatTime } from '../../utils/formatters';

export const CountdownTimer = ({
  seconds = 0,
  isRunning = false,
  onToggle,
  onReset,
  onAdjust,
  size = 'md', // 'sm', 'md', 'lg', 'xl'
  showControls = true,
  label = 'STAGE SEGMENT REMAINING',
}) => {
  const isOvertime = seconds < 0;
  const isNearEnd = seconds >= 0 && seconds <= 180; // < 3 mins

  const getTimerColor = () => {
    if (isOvertime) return 'text-red-500 animate-pulse';
    if (isNearEnd) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const getSizeClass = () => {
    switch (size) {
      case 'xl':
        return 'text-7xl font-extrabold tracking-tight';
      case 'lg':
        return 'text-5xl font-bold tracking-tight';
      case 'sm':
        return 'text-2xl font-bold tracking-tight';
      case 'md':
      default:
        return 'text-4xl font-bold tracking-tight';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-stage-card border border-slate-800 shadow-2xl relative overflow-hidden">
      {/* Background Subtle Gradient Glow */}
      <div className={`absolute inset-0 opacity-10 pointer-events-none ${isOvertime ? 'bg-red-600' : isNearEnd ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>

      {label && (
        <span className="text-[11px] font-bold tracking-widest text-slate-400 uppercase mb-1">
          {label}
        </span>
      )}

      {/* Main Clock */}
      <div className={`font-mono ${getSizeClass()} ${getTimerColor()} drop-shadow-md my-1`}>
        {formatTime(seconds)}
      </div>

      {isOvertime && (
        <span className="text-xs font-bold text-red-400 tracking-wider bg-red-950/60 border border-red-800 px-2 py-0.5 rounded uppercase mb-2">
          OVERTIME BY {formatTime(Math.abs(seconds))}
        </span>
      )}

      {/* Quick Action Controls */}
      {showControls && (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800/80 w-full justify-center">
          {onAdjust && (
            <button
              onClick={() => onAdjust(-60)}
              title="-1 Min"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
          )}

          {onToggle && (
            <button
              onClick={onToggle}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors shadow-lg ${
                isRunning
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
              }`}
            >
              {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isRunning ? 'PAUSE' : 'START'}</span>
            </button>
          )}

          {onReset && (
            <button
              onClick={onReset}
              title="Reset Timer"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {onAdjust && (
            <button
              onClick={() => onAdjust(60)}
              title="+1 Min"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CountdownTimer;
