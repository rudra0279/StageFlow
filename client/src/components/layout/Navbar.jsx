import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { useTheme } from '../../context/ThemeContext';
import { Radio, Sparkles, LogOut, Sun, Moon, LayoutDashboard, MonitorPlay, MessageSquare } from 'lucide-react';
import { Badge } from '../common/Badge';
import { SessionSecurityBadge } from '../common/SessionSecurityBadge';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { isConnected } = useSocket();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isQaActive = location.pathname.startsWith('/qa') || location.pathname.includes('/qa');

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-[var(--bg-glass)] backdrop-blur-xl border-b border-[var(--border-highlight)] shadow-xl py-2.5'
          : 'bg-[var(--bg-glass)] backdrop-blur-md border-b border-[var(--border-subtle)] py-3.5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo & Live Pill */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Radio className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg text-[var(--text-primary)] tracking-tight">StagePilot</span>
              <span className="text-[10px] uppercase font-bold tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-live-dot" /> LIVE
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] font-medium">The Operating System for Live Events</p>
          </div>
        </Link>

        {/* Center Nav Shortcuts */}
        <div className="hidden lg:flex items-center gap-6 text-xs font-semibold text-[var(--text-secondary)]">
          <Link to="/organizer" className="hover:text-cyan-400 transition-colors flex items-center gap-1.5">
            <LayoutDashboard className="w-3.5 h-3.5 text-cyan-400" />
            <span>Command Center</span>
          </Link>
          <Link to="/anchor" className="hover:text-purple-400 transition-colors flex items-center gap-1.5">
            <MonitorPlay className="w-3.5 h-3.5 text-purple-400" />
            <span>Anchor Station</span>
          </Link>
          <Link to="/qa" className="hover:text-cyan-400 transition-colors flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
            <span>Audience Q&A</span>
          </Link>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-3">
          {/* Theme Switcher Toggle Button */}
          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            className="p-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-highlight)] shadow-sm transition-all active:scale-95"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500" />
            )}
          </button>

          {/* Real-time Socket Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs shadow-sm">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="text-[var(--text-secondary)] text-[11px] font-mono">
              {isConnected ? 'LIVE SYNC' : 'OFFLINE'}
            </span>
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <SessionSecurityBadge />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-1.5 rounded-xl hover:bg-[var(--bg-elevated)] transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-3.5 py-1.5 rounded-xl shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all active:scale-95"
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

