import React from 'react';
import { Calendar, MapPin, Users, Clock, ArrowRight } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export const EventCard = ({ event, onSelect }) => {
  return (
    <div className="glass-panel-interactive p-5 rounded-2xl flex flex-col justify-between h-full relative group">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="text-base font-bold text-slate-100 group-hover:text-cyan-400 transition-colors">
              {event.title}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{event.subtitle}</p>
          </div>
          <StatusBadge status={event.status} />
        </div>

        <div className="space-y-2 mt-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>{event.date} • {event.startTime} - {event.endTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>{event.totalAttendees?.toLocaleString()} Expected Attendees</span>
          </div>
        </div>
      </div>

      <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span>DRIFT: {event.timeDriftMinutes > 0 ? `+${event.timeDriftMinutes}m` : '0m'}</span>
        </div>
        <button
          onClick={() => onSelect && onSelect(event.id)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <span>Open Control Room</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default EventCard;
