import React from 'react';
import { CheckCircle2, Mic, FileText, UserCheck } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export const SpeakerCard = ({ speaker, onStatusToggle }) => {
  return (
    <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <img
              src={speaker.avatar}
              alt={speaker.name}
              className="w-12 h-12 rounded-full border-2 border-slate-700 object-cover"
            />
            <div>
              <h4 className="text-sm font-bold text-slate-100">{speaker.name}</h4>
              <p className="text-xs text-slate-400">{speaker.role} at {speaker.company}</p>
            </div>
          </div>
          <StatusBadge status={speaker.status} size="sm" />
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 mb-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            PRESENTATION TOPIC
          </span>
          <p className="text-xs font-semibold text-cyan-300">{speaker.topic}</p>
        </div>

        <div className="space-y-2 text-xs text-slate-400">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Slides Deck:</span>
            </span>
            <span className="font-semibold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Ready
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-slate-400" />
              <span>Audio Feed:</span>
            </span>
            <span className="font-mono text-slate-300 font-semibold">{speaker.micAssigned}</span>
          </div>
        </div>
      </div>

      <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">Bio & Notes Configured</span>
        {onStatusToggle && (
          <button
            onClick={() => onStatusToggle(speaker.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Mark {speaker.status === 'ON STAGE' ? 'Completed' : 'On Stage'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default SpeakerCard;
