import React from 'react';
import { Clock, Play, User, CheckCircle2 } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export const AgendaTimeline = ({ agenda = [], onJumpSegment }) => {
  return (
    <div className="glass-panel p-5 rounded-2xl">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Live Agenda Sequence
          </h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">{agenda.length} Segments Total</span>
      </div>

      <div className="relative border-l-2 border-slate-800 ml-3 space-y-6 my-2 pl-6">
        {agenda.map((item) => {
          const isLive = item.status === 'LIVE';
          const isCompleted = item.status === 'COMPLETED';

          return (
            <div key={item.id} className="relative group">
              {/* Timeline Marker Circle */}
              <span
                className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 transition-all ${
                  isLive
                    ? 'bg-red-500 border-red-400 shadow-lg shadow-red-500/50 animate-pulse'
                    : isCompleted
                    ? 'bg-slate-700 border-slate-600'
                    : 'bg-stage-card border-slate-700'
                }`}
              ></span>

              <div
                className={`p-4 rounded-xl border transition-all ${
                  isLive
                    ? 'bg-red-950/20 border-red-500/50 shadow-lg shadow-red-950/20'
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-cyan-400">{item.startTime}</span>
                    <span className="text-xs text-slate-500 font-mono">({item.allocatedMinutes} mins)</span>
                  </div>
                  <StatusBadge status={item.status} size="sm" />
                </div>

                <h4 className="text-sm font-bold text-slate-100 mb-1">{item.title}</h4>
                <p className="text-xs text-slate-400 mb-3">{item.description}</p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.speakerName}</span>
                  </div>

                  {!isLive && onJumpSegment && (
                    <button
                      onClick={() => onJumpSegment(item.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      <Play className="w-3 h-3" />
                      <span>{isCompleted ? 'Replay' : 'Jump Live'}</span>
                    </button>
                  )}
                  {isLive && (
                    <span className="text-[11px] font-bold text-red-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> CURRENTLY ON STAGE
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AgendaTimeline;
