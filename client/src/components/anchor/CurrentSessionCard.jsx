import React from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Mic, Volume2, Award, User, Tag } from 'lucide-react';

export const CurrentSessionCard = ({ session }) => {
  if (!session) {
    return (
      <Card className="p-6 text-center text-slate-500">
        <p className="text-sm">No active session on stage right now.</p>
      </Card>
    );
  }

  const speaker = session.speakerId;

  return (
    <Card className="border-rose-500/30 bg-stage-900/90 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-stage-800">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          <span className="text-xs font-black uppercase tracking-widest text-rose-400">
            CURRENTLY ON STAGE
          </span>
        </div>
        <span className="text-xs font-mono text-slate-400">
          Duration: {session.durationMinutes}m
        </span>
      </div>

      {/* Session Title */}
      <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-3 leading-snug">
        {session.title}
      </h2>

      {/* Speaker details */}
      {speaker ? (
        <div className="mt-4 pt-4 border-t border-stage-800/80 space-y-3">
          <div className="flex items-center gap-3.5">
            {speaker.avatarUrl ? (
              <img
                src={speaker.avatarUrl}
                alt={speaker.name}
                className="w-14 h-14 rounded-xl object-cover border-2 border-rose-500/30 shadow-md"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-stage-800 border border-stage-700 flex items-center justify-center text-slate-400">
                <User className="w-6 h-6" />
              </div>
            )}

            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {speaker.name}
              </h3>
              <p className="text-xs text-slate-300">
                {speaker.title} {speaker.company ? `• ${speaker.company}` : ''}
              </p>
            </div>
          </div>

          {/* Phonetic Pronunciation Guide (Crucial for live stage MCs) */}
          {speaker.pronunciationGuide && (
            <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 flex items-center gap-2 text-xs">
              <Volume2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="text-slate-400">Pronunciation:</span>
              <span className="font-mono font-bold text-cyan-300 tracking-wide">
                "{speaker.pronunciationGuide}"
              </span>
            </div>
          )}

          {/* Key Achievements */}
          {speaker.keyAchievements && speaker.keyAchievements.length > 0 && (
            <div className="space-y-1 pt-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Award className="w-3 h-3 text-amber-400" />
                Quick Speaker Highlights
              </p>
              <ul className="text-xs text-slate-300 space-y-0.5 list-disc list-inside">
                {speaker.keyAchievements.slice(0, 3).map((item, idx) => (
                  <li key={idx} className="truncate">{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-slate-500 mt-2">No speaker profile attached to this session.</p>
      )}

      {/* Stage notes for anchor */}
      {session.stageNotes && (
        <div className="mt-4 p-3 rounded-lg bg-stage-950 border border-stage-800 text-xs text-amber-300 flex items-start gap-2">
          <Tag className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <span>Stage Note: {session.stageNotes}</span>
        </div>
      )}
    </Card>
  );
};
