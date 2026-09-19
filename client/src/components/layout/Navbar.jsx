import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { Radio, ShieldAlert, Sparkles, LogOut, User as UserIcon } from 'lucide-react';
import { Badge } from '../common/Badge';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { isConnected } = useSocket();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-stage-950/85 backdrop-blur-md border-b border-stage-850">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Radio className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg text-white tracking-tight">StagePilot</span>
              <span className="text-[10px] uppercase font-bold tracking-widest bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                Live
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">AI Co-Pilot for Live Events</p>
          </div>
        </Link>

        {/* Navigation & Status */}
        <div className="flex items-center gap-4">
          {/* Real-time Socket Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-stage-900 border border-stage-800 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-rose-500'
              }`}
            />
            <span className="text-slate-400 text-[11px] font-mono">
              {isConnected ? 'LIVE SYNC' : 'OFFLINE'}
            </span>
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {/* Role badge */}
              <Badge variant={user?.role === 'ORGANIZER' ? 'cyan' : 'violet'} dot>
                {user?.role}
              </Badge>

              {/* User info */}
              <div className="hidden md:block text-right">
                <p className="text-xs font-semibold text-slate-200">{user?.name}</p>
                <p className="text-[10px] text-slate-500">{user?.email}</p>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-2 rounded-lg bg-stage-900 border border-stage-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-stage-900 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-3.5 py-1.5 rounded-lg shadow-md hover:from-cyan-400 hover:to-blue-500 transition-all"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
