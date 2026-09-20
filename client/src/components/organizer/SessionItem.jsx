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
      className={`relative rounded-2xl border p-4 sm:p-5 transition-all duration-300 ${
        isLive
          ? 'bg-gradient-to-r from-stage-900 via-stage-850 to-stage-900 border-rose-500/60 shadow-xl shadow-rose-950/50 glow-border-rose ring-1 ring-rose-500/30'
          : isCompleted
          ? 'bg-stage-950/40 border-stage-850/60 opacity-60'
          : 'bg-stage-900/80 border-stage-800/80 hover:border-stage-700 hover:bg-stage-900/95 shadow-md'
      }`}
    >
      {/* Top row: Order, Track, Times, Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <span className={`w-7 h-7 rounded-lg text-xs font-mono font-bold flex items-center justify-center border shadow-sm ${
            isLive
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              : 'bg-stage-800 text-slate-300 border-stage-700'
          }`}>
            #{index + 1}
          </span>

          <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            {formatTime(session.calculatedStartTime)}
          </span>

          <span className="text-xs font-mono text-slate-400">
            ({formatDuration(session.durationMinutes)})
          </span>

          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 bg-stage-800/80 px-2 py-0.5 rounded border border-stage-750">
            {session.track || 'Track A'}
          </span>

          {session.delayOffsetMinutes > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-fade-in">
              +{session.delayOffsetMinutes}m delay
            </span>
          )}
        </div>

        <span className={`text-[11px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full border shadow-sm flex items-center gap-1.5 ${badgeConfig.className}`}>
          {isLive && <span className="w-2 h-2 rounded-full bg-rose-500 animate-live-dot" />}
          {badgeConfig.label}
        </span>
      </div>

      {/* Main Content: Title & Speaker */}
      <div className="mb-3 space-y-1">
        <h4 className="text-base sm:text-lg font-extrabold text-white tracking-tight leading-snug">
          {session.title}
        </h4>

        {session.speakerId ? (
          <div className="flex items-center gap-2 text-xs text-slate-300 pt-0.5">
            {session.speakerId.avatarUrl ? (
              <img
                src={session.speakerId.avatarUrl}
                alt={session.speakerId.name}
                className="w-5 h-5 rounded-full object-cover border border-stage-700 shadow-sm"
              />
            ) : null}
            <span className="font-bold text-slate-100">{session.speakerId.name}</span>
            {session.speakerId.title && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">{session.speakerId.title}</span>
              </>
            )}
            {session.speakerId.company && (
              <span className="text-slate-500 font-medium">({session.speakerId.company})</span>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic pt-0.5">Speaker: Main Presenter</p>
        )}
      </div>

      {/* Stage notes if present */}
      {session.stageNotes && (
        <div className="mb-3 px-3.5 py-2 rounded-xl bg-stage-950/80 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2 shadow-inner">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          <span><strong>Stage Note:</strong> {session.stageNotes}</span>
        </div>
      )}

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-stage-800/80">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenAIModal(session)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/30 hover:bg-purple-500/20 transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            AI Co-Pilot Scripts
            {session.aiScripts?.introduction && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 ml-0.5 shadow-sm shadow-emerald-400/50" title="Script Ready" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {!isCompleted && (
            <button
              onClick={() => onOpenDelayModal(session)}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-all"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              + Push Delay
            </button>
          )}

          {!isLive && !isCompleted && (
            <button
              onClick={() => onActivate(session)}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-lg shadow-rose-600/30 transition-all active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Go LIVE on Stage
            </button>
          )}

          {isLive && (
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold px-3.5 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-md">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              ON AIR / BROADCASTING
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
