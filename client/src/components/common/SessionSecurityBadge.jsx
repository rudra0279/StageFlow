import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ShieldCheck, LogOut, Clock, User, ChevronDown, ChevronUp } from 'lucide-react';

export const SessionSecurityBadge = () => {
  const { user, token, logout, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!token) return;

    const parseJwtExpiry = () => {
      try {
        const payloadBase64 = token.split('.')[1];
        if (!payloadBase64) return null;
        const decoded = JSON.parse(atob(payloadBase64));
        if (decoded.exp) {
          const expMs = decoded.exp * 1000;
          const diffMs = expMs - Date.now();
          if (diffMs <= 0) {
            setTimeLeft('Expired');
            logout();
          } else {
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            setTimeLeft(`${hours}h ${mins}m`);
          }
        }
      } catch (e) {
        setTimeLeft('Active');
      }
    };

    parseJwtExpiry();
    const timer = setInterval(parseJwtExpiry, 60000);
    return () => clearInterval(timer);
  }, [token, logout]);

  if (!isAuthenticated || !user) {
    return null;
  }

  const roleColor =
    user.role === 'ORGANIZER'
      ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
      : 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-cyan-500/40 text-xs transition-all shadow-sm"
        title="Session Security Status"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-medium text-[var(--text-primary)] truncate max-w-[120px]">
          {user.name || user.email}
        </span>
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${roleColor}`}>
          {user.role}
        </span>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 glass-panel rounded-2xl p-4 shadow-2xl z-50 border border-[var(--border-subtle)] animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-[var(--text-primary)]">SESSION STATUS</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
              ● Active
            </span>
          </div>

          <div className="py-3 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Role:</span>
              <span className="font-semibold text-[var(--text-primary)]">{user.role}</span>
            </div>
            {user.roleTitle && (
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Role Title:</span>
                <span className="text-[var(--text-primary)] truncate max-w-[150px]">{user.roleTitle}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Session Valid:</span>
              <span className="font-mono text-cyan-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeLeft || '7d Active'}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--border-subtle)]">
            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold transition-colors border border-rose-500/30"
            >
              <LogOut className="w-3.5 h-3.5" />
              Log Out Securely
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionSecurityBadge;
