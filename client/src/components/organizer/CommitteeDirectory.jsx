import React, { useState, useEffect } from 'react';
import { eventApi } from '../../api/eventApi';
import { Users, Mail, Phone, ShieldCheck, CheckCircle2, MessageSquare, Loader2, Sparkles, UserCheck } from 'lucide-react';
import { Button } from '../common/Button';

export const CommitteeDirectory = ({ eventId, currentUser, onSelectMemberForChat }) => {
  const [committee, setCommittee] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCommittee = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await eventApi.getCommittee(eventId);
      if (res.success && res.data) {
        setCommittee(res.data);
      }
    } catch (err) {
      console.error('Failed to load committee:', err);
      setError('Could not load committee directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      loadCommittee();
    }
  }, [eventId]);

  if (loading) {
    return (
      <div className="p-8 rounded-3xl bg-stage-900/80 border border-stage-800 text-center flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
        <p className="text-xs text-slate-400 font-mono">Loading Organizer Committee Directory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Security Badge */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-stage-900/90 border border-stage-800">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-black text-white tracking-tight">
              ORGANIZER COMMITTEE DIRECTORY
            </h3>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
              {committee.length} Members
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Authorized production team, stage directors, and technical operations coordinators.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stage-950 border border-stage-800 text-xs text-emerald-400 font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Committee Access Level: Authorized</span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Committee Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {committee.map((member) => {
          const isCurrentUser =
            currentUser &&
            (currentUser.email?.toLowerCase() === member.email?.toLowerCase() ||
              currentUser.id === member._id);

          return (
            <div
              key={member._id || member.email}
              className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-4 relative overflow-hidden ${
                isCurrentUser
                  ? 'bg-stage-900/90 border-cyan-500/60 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                  : 'bg-stage-900/60 border-stage-800/90 hover:border-stage-700'
              }`}
            >
              {/* Current User Corner Ribbon */}
              {isCurrentUser && (
                <div className="absolute top-0 right-0 bg-cyan-500 text-stage-950 text-[9px] font-mono font-black uppercase px-2.5 py-0.5 rounded-bl-lg shadow-sm">
                  YOU
                </div>
              )}

              <div className="space-y-3">
                {/* Avatar and Name */}
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md shrink-0">
                    {member.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-base font-extrabold text-white truncate tracking-tight">
                      {member.name}
                    </h4>
                    <span className="inline-block text-[11px] font-mono font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-md mt-0.5">
                      {member.roleTitle || 'Organizer'}
                    </span>
                  </div>
                </div>

                {/* Responsibility */}
                <div className="pt-2 border-t border-stage-800/80 text-xs">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-0.5">
                    Core Responsibility:
                  </span>
                  <p className="text-slate-200 font-medium leading-relaxed">
                    {member.responsibility || 'Live Stage Production & Operations'}
                  </p>
                </div>

                {/* Contact Information (Privacy-Guarded) */}
                <div className="p-3 rounded-xl bg-stage-950/80 border border-stage-800/80 space-y-1.5 text-xs font-mono">
                  <a
                    href={`mailto:${member.email}`}
                    className="flex items-center gap-2 text-slate-300 hover:text-cyan-300 transition-colors truncate"
                  >
                    <Mail className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </a>

                  {member.contactPhone && (
                    <a
                      href={`tel:${member.contactPhone}`}
                      className="flex items-center gap-2 text-slate-400 hover:text-cyan-300 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{member.contactPhone}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Status and Action Footer */}
              <div className="pt-3 border-t border-stage-800/80 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {member.status || 'ACTIVE'}
                </span>

                {onSelectMemberForChat && (
                  <button
                    type="button"
                    onClick={() => onSelectMemberForChat(member)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Ping in Chat</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
