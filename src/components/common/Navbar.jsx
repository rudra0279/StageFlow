import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useEvent } from '../../hooks/useEvent';
import { LiveIndicator } from './LiveIndicator';
import { Radio, Shield, User, LogOut, Activity } from 'lucide-react';
import { getDriftBadgeColor } from '../../utils/timeUtils';

export const Navbar = () => {
  const { user, logout, switchRole } = useAuth();
  const { activeEvent, events, selectEvent, timeDrift } = useEvent();

  return (
    <header className="h-16 bg-stage-header border-b border-slate-800 px-4 md:px-6 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
      {/* Brand & Active Event Title */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <span className="font-extrabold text-lg tracking-wider text-slate-100 hidden sm:inline">
            STAGE<span className="text-cyan-400">PILOT</span>
          </span>
        </div>

        <div className="h-6 w-[1px] bg-slate-800 hidden md:block"></div>

        {/* Event Selector Dropdown */}
        {activeEvent && (
          <div className="flex items-center gap-2">
            <select
              value={activeEvent.id}
              onChange={(e) => selectEvent(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 max-w-[200px] md:max-w-[260px] truncate"
            >
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.title} ({evt.status})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Middle Live Telemetry Status */}
      <div className="hidden lg:flex items-center gap-3">
        <LiveIndicator isLive={activeEvent?.status === 'LIVE'} />

        {/* Drift Status */}
        <div className={`px-2.5 py-1 rounded-md border text-xs font-mono font-bold flex items-center gap-1.5 ${getDriftBadgeColor(timeDrift)}`}>
          <Activity className="w-3.5 h-3.5" />
          <span>SCHEDULE DRIFT: {timeDrift > 0 ? `+${timeDrift} MIN` : `${timeDrift} MIN`}</span>
        </div>
      </div>

      {/* Right Controls: Role Switcher & User Profile */}
      <div className="flex items-center gap-3">
        {/* Hackathon Role Switcher Button */}
        {user && (
          <button
            onClick={() => switchRole(user.role === 'organizer' ? 'anchor' : 'organizer')}
            title="Toggle between Organizer and Anchor viewports"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-semibold text-slate-300 transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Role:</span>
            <span className="text-cyan-400 font-bold uppercase">{user.role}</span>
          </button>
        )}

        {/* User Info */}
        {user && (
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
            <img
              src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
              alt={user.name}
              className="w-8 h-8 rounded-full border border-slate-700 object-cover"
            />
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-200 leading-none">{user.name}</span>
              <span className="text-[10px] text-slate-400 leading-none mt-1 capitalize">{user.role}</span>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
