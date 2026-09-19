import React from 'react';
import { Play, Clock, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatTime, formatDuration } from '../../utils/timeUtils';
import { getSessionStatusBadge } from '../../utils/healthUtils';
import { Badge } from '../common/Badge';

export const SessionItem = ({
  session,
  onActivate,
  onOpenDelayModal,
  onOpenAIModal,
  index
}) => {
  const isLive = session.status === 'LIVE';
  const isCompleted = session.status === 'COMPLETED';
  const badgeConfig = getSessionStatusBadge(session.status);

  return (
    <div
      className={`relative rounded-xl border p-4 transition-all duration-200 ${
        isLive
          ? 'bg-stage-900 border-rose-500/50 shadow-lg shadow-rose-950/40 glow-border-rose'
          : isCompleted
          ? 'bg-stage-950/60 border-stage-850 opacity-60'
          : 'bg-stage-900/90 border-stage-800 hover:border-stage-700'
      }`}
    >
      {/* Top row: Order, Times, Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-md bg-stage-800 border border-stage-700 text-slate-300 flex items-center justify-center text-xs font-mono font-bold">
            #{index + 1}
          </span>
          <span className="text-xs font-mono text-cyan-400 font-semibold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatTime(session.calculatedStartTime)}
          </span>
          <span className="text-xs text-slate-500">
            ({formatDuration(session.durationMinutes)})
          </span>

          {session.delayOffsetMinutes > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              +{session.delayOffsetMinutes}m delay
            </span>
          )}
        </div>

        <span className={`text-[11px] uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${badgeConfig.className}`}>
          {badgeConfig.label}
        </span>
      </div>

      {/* Main Content: Title & Speaker */}
      <div className="mb-3">
        <h4 className="text-base font-semibold text-white tracking-tight mb-1">
          {session.title}
        </h4>

        {session.speakerId ? (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            {session.speakerId.avatarUrl ? (
              <img
                src={session.speakerId.avatarUrl}
                alt={session.speakerId.name}
                className="w-5 h-5 rounded-full object-cover border border-stage-700"
              />
            ) : null}
            <span className="font-medium text-slate-200">{session.speakerId.name}</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">{session.speakerId.title}</span>
            {session.speakerId.company && (
              <span className="text-slate-500">({session.speakerId.company})</span>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">No speaker assigned</p>
        )}
      </div>

      {/* Stage notes if present */}
      {session.stageNotes && (
        <div className="mb-3 px-3 py-1.5 rounded-lg bg-stage-950/80 border border-stage-850 text-xs text-amber-300/80 flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
          <span>{session.stageNotes}</span>
        </div>
      )}

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-stage-800/80">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onOpenAIModal(session)}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-500/10 to-indigo-500/10 text-purple-300 border border-purple-500/20 hover:bg-purple-500/20 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            AI Scripts
            {session.aiScripts?.introduction && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5" title="Has script" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {!isCompleted && (
            <button
              onClick={() => onOpenDelayModal(session)}
              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              + Delay
            </button>
          )}

          {!isLive && !isCompleted && (
            <button
              onClick={() => onActivate(session)}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-md shadow-rose-600/30 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Go LIVE
            </button>
          )}

          {isLive && (
            <div className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping mr-1" />
              Broadcasting on Stage
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
