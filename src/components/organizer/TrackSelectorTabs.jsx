import React from 'react';
import { Layers, Clock } from 'lucide-react';

export const TrackSelectorTabs = ({
  tracks = [],
  selectedTrackFilter = 'ALL',
  onSelectTrackFilter,
  trackDelays = {},
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 p-1.5 glass-panel rounded-2xl border border-slate-800">
      <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
        <Layers className="w-3.5 h-3.5 text-cyan-400" />
        <span>TRACKS:</span>
      </div>

      {/* ALL TRACKS TAB */}
      <button
        onClick={() => onSelectTrackFilter('ALL')}
        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
          selectedTrackFilter === 'ALL'
            ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
            : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
        }`}
      >
        ALL TRACKS (PARALLEL)
      </button>

      {/* INDIVIDUAL TRACK TABS */}
      {tracks.map((track) => {
        const isSelected = selectedTrackFilter === track.id;
        const delay = trackDelays[track.id] || track.delayMinutes || 0;

        return (
          <button
            key={track.id}
            onClick={() => onSelectTrackFilter(track.id)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              isSelected
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-900/60 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <span>{track.shortName || track.name}</span>

            {/* Delay Indicator Badge */}
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold ${
                delay > 0
                  ? isSelected
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : isSelected
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {delay > 0 ? `+${delay}m` : 'ON TIME'}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default TrackSelectorTabs;
