import React from 'react';
import { Clock, User, Play, CheckCircle2, Plus, AlertTriangle, Layers } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export const MultiTrackScheduleView = ({
  tracks = [],
  agenda = [],
  selectedTrackFilter = 'ALL',
  trackDelays = {},
  onJumpSegment,
  onAdjustTrackDelay,
}) => {
  const displayTracks =
    selectedTrackFilter === 'ALL'
      ? tracks
      : tracks.filter((t) => t.id === selectedTrackFilter);

  return (
    <div className="space-y-6">
      {/* Grid container: 3 parallel columns on desktop, 1 on mobile */}
      <div
        className={`grid gap-6 ${
          displayTracks.length === 1
            ? 'grid-cols-1'
            : displayTracks.length === 2
            ? 'grid-cols-1 md:grid-cols-2'
            : 'grid-cols-1 lg:grid-cols-3'
        }`}
      >
        {displayTracks.map((track) => {
          const trackSessions = agenda.filter((item) => item.trackId === track.id);
          const delay = trackDelays[track.id] || track.delayMinutes || 0;
          const isRunningLate = delay > 0;

          return (
            <div
              key={track.id}
              className="glass-panel p-5 rounded-3xl border border-slate-800 flex flex-col justify-between"
            >
              {/* Track Header Card */}
              <div>
                <div className="flex items-start justify-between gap-2 pb-3 mb-4 border-b border-slate-800">
                  <div>
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block mb-0.5">
                      {track.venue}
                    </span>
                    <h3 className="text-sm font-extrabold text-slate-100">{track.name}</h3>
                  </div>

                  {/* Delay Status Pill */}
                  <div
                    className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-bold flex items-center gap-1 ${
                      isRunningLate
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {isRunningLate ? <AlertTriangle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    <span>{isRunningLate ? `Running +${delay}m` : 'On Schedule'}</span>
                  </div>
                </div>

                {/* Session Timeline Items for Track */}
                <div className="space-y-3">
                  {trackSessions.map((session) => {
                    const isLive = session.status === 'LIVE';
                    const isCompleted = session.status === 'COMPLETED';

                    return (
                      <div
                        key={session.id}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isLive
                            ? 'bg-red-950/30 border-red-500/50 shadow-lg shadow-red-950/20'
                            : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-cyan-300">
                              {session.startTime}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              ({session.allocatedMinutes}m)
                            </span>
                          </div>
                          <StatusBadge status={session.status} size="sm" />
                        </div>

                        <h4 className="text-xs font-bold text-slate-100 leading-snug mb-1">
                          {session.title}
                        </h4>

                        <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-800/60 text-xs">
                          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-500" />
                            <strong className="text-slate-300">{session.speakerName}</strong>
                          </span>

                          {!isLive && onJumpSegment && (
                            <button
                              onClick={() => onJumpSegment(session.id)}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                            >
                              <Play className="w-3 h-3" />
                              <span>{isCompleted ? 'Replay' : 'Go Live'}</span>
                            </button>
                          )}
                          {isLive && (
                            <span className="text-[10px] font-bold text-red-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> ON STAGE
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Track Quick Actions Footer */}
              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono text-slate-500">Track Buffer Control:</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onAdjustTrackDelay && onAdjustTrackDelay(track.id, 5)}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-amber-400 border border-slate-700"
                    title="Add +5m delay to this track"
                  >
                    +5m Delay
                  </button>
                  <button
                    onClick={() => onAdjustTrackDelay && onAdjustTrackDelay(track.id, 10)}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-amber-400 border border-slate-700"
                    title="Add +10m delay to this track"
                  >
                    +10m Delay
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MultiTrackScheduleView;
