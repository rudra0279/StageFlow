import React from 'react';
import { Card } from '../common/Card';
import { FastForward, Clock, User } from 'lucide-react';
import { formatTime } from '../../utils/timeUtils';

export const NextUpCard = ({ nextSession }) => {
  if (!nextSession) {
    return (
      <Card className="border-stage-800 bg-stage-900/60 p-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
          <FastForward className="w-4 h-4 text-cyan-400" />
          Coming Up Next
        </div>
        <p className="text-xs text-slate-500">This is the final scheduled session.</p>
      </Card>
    );
  }

  const speaker = nextSession.speakerId;

  return (
    <Card className="border-stage-800 hover:border-stage-700 bg-stage-900/70 p-4 transition-colors">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
          <FastForward className="w-3.5 h-3.5" />
          UP NEXT
        </span>
        <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatTime(nextSession.calculatedStartTime)}
        </span>
      </div>

      <h4 className="text-sm font-bold text-white tracking-tight line-clamp-1">
        {nextSession.title}
      </h4>

      {speaker && (
        <div className="flex items-center gap-2 mt-2 text-xs text-slate-300">
          <User className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-medium text-slate-200">{speaker.name}</span>
          {speaker.company && (
            <span className="text-slate-500 text-[11px]">({speaker.company})</span>
          )}
        </div>
      )}
    </Card>
  );
};
