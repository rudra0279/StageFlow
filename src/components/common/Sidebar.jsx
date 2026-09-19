import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Clock,
  Radio,
  Tv,
  Bot,
  ChevronRight,
} from 'lucide-react';

export const Sidebar = () => {
  const { user } = useAuth();
  const isAnchor = user?.role === 'anchor';

  const organizerLinks = [
    { path: ROUTES.ORGANIZER.DASHBOARD, label: 'Overview', icon: LayoutDashboard },
    { path: ROUTES.ORGANIZER.EVENTS, label: 'Events Catalog', icon: Calendar },
    { path: ROUTES.ORGANIZER.SPEAKERS, label: 'Speakers Roster', icon: Users },
    { path: ROUTES.ORGANIZER.AGENDA, label: 'Agenda Timeline', icon: Clock },
    { path: ROUTES.ORGANIZER.LIVE, label: 'Live Control Room', icon: Radio, badge: 'LIVE' },
  ];

  const anchorLinks = [
    { path: ROUTES.ANCHOR.DASHBOARD, label: 'Anchor Deck', icon: Tv },
    { path: ROUTES.ANCHOR.AI, label: 'AI Teleprompter', icon: Bot, badge: 'AI' },
  ];

  const links = isAnchor ? anchorLinks : organizerLinks;

  return (
    <aside className="w-64 bg-stage-sidebar border-r border-slate-800 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-4rem)]">
      <div className="p-4">
        {/* Viewport Category Header */}
        <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
          <span>{isAnchor ? 'Anchor Console' : 'Organizer Deck'}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
        </div>

        {/* Navigation Items */}
        <nav className="mt-2 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === ROUTES.ORGANIZER.DASHBOARD || link.path === ROUTES.ANCHOR.DASHBOARD}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold shadow-lg shadow-cyan-500/5'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </div>
                {link.badge ? (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      link.badge === 'LIVE'
                        ? 'bg-red-950 text-red-400 border border-red-800'
                        : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                    }`}
                  >
                    {link.badge}
                  </span>
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Telemetry Widget */}
      <div className="p-4 border-t border-slate-800/80 m-4 rounded-xl bg-slate-900/50">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
          <span>STAGEPILOT CORE</span>
          <span className="text-emerald-400 font-bold">ONLINE</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">
          Realtime Socket Sync: Active (Mock Telemetry Engine)
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
