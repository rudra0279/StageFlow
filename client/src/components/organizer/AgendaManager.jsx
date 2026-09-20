import React, { useState } from 'react';
import { SessionItem } from './SessionItem';
import { DelayModal } from './DelayModal';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Plus, Calendar, Sparkles } from 'lucide-react';
import { sessionApi } from '../../api/sessionApi';

export const AgendaManager = ({
  eventId,
  sessions = [],
  onReload,
  onOpenAIModal
}) => {
  const [selectedSessionForDelay, setSelectedSessionForDelay] = useState(null);
  const [selectedTrack, setSelectedTrack] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDuration, setNewDuration] = useState(30);
  const [newStageNotes, setNewStageNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter sessions by selected track
  const filteredSessions = selectedTrack === 'ALL'
    ? sessions
    : sessions.filter((s) => (s.track || 'Track A') === selectedTrack);

  // Track definitions
  const tracksList = [
    { id: 'ALL', label: 'ALL STAGES', stageName: 'Full Event Run-of-Show' },
    { id: 'Track A', label: 'TRACK A', stageName: 'Main Auditorium' },
    { id: 'Track B', label: 'TRACK B', stageName: 'Workshop Hall' },
    { id: 'Track C', label: 'TRACK C', stageName: 'Innovation Lab' }
  ];

  // Activate session
  const handleActivate = async (session) => {
    try {
      await sessionApi.activateSession(eventId, session._id);
      if (onReload) onReload();
    } catch (err) {
      console.error('Error activating session:', err);
    }
  };

  // Submit delay
  const handleDelaySubmit = async (sessionId, delayMinutes, reason) => {
    try {
      await sessionApi.triggerDelay(eventId, sessionId, delayMinutes, reason);
      if (onReload) onReload();
    } catch (err) {
      console.error('Error applying delay:', err);
    }
  };

  // Add session
  const handleAddSession = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const now = new Date();
      await sessionApi.addSession(eventId, {
        title: newTitle,
        durationMinutes: Number(newDuration),
        stageNotes: newStageNotes,
        scheduledStartTime: now.toISOString()
      });

      setNewTitle('');
      setNewDuration(30);
      setNewStageNotes('');
      setIsAddModalOpen(false);
      if (onReload) onReload();
    } catch (err) {
      console.error('Error adding session:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-stage-800">
        <div>
          <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            Live Stage Agenda Timeline
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Real-time schedule control, live broadcasting, and cascading delay management</p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => setIsAddModalOpen(true)}
          className="shadow-md shadow-cyan-500/20"
        >
          Add Session
        </Button>
      </div>

      {/* Section 6: Live Track Selector Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {tracksList.map((t) => {
          const isActive = selectedTrack === t.id;
          const trackSessions = t.id === 'ALL' ? sessions : sessions.filter((s) => (s.track || 'Track A') === t.id);
          const liveSession = trackSessions.find((s) => s.status === 'LIVE');

          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTrack(t.id)}
              className={`p-3.5 rounded-2xl text-left border transition-all duration-200 flex flex-col justify-between space-y-2 ${
                isActive
                  ? 'bg-stage-900 border-cyan-500/60 shadow-lg shadow-cyan-500/10 glow-border-cyan'
                  : 'bg-stage-900/60 border-stage-800/80 hover:border-stage-700 hover:bg-stage-900/90'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className={`text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-md ${
                    isActive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-stage-800 text-slate-400'
                  }`}>
                    {t.label}
                  </span>

                  {liveSession ? (
                    <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                      LIVE
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono">
                      {trackSessions.length} {trackSessions.length === 1 ? 'session' : 'sessions'}
                    </span>
                  )}
                </div>

                <p className="text-xs font-bold text-white tracking-tight line-clamp-1">
                  {t.stageName}
                </p>
              </div>

              {liveSession ? (
                <p className="text-[11px] text-rose-300 font-medium truncate pt-1 border-t border-rose-500/20">
                  ▶ {liveSession.title}
                </p>
              ) : trackSessions.length > 0 ? (
                <p className="text-[11px] text-slate-400 truncate pt-1 border-t border-stage-800/80">
                  Next: {trackSessions[0].title}
                </p>
              ) : (
                <p className="text-[11px] text-slate-600 pt-1 border-t border-stage-800/80 italic">
                  No sessions
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Section 7: Live Session Timeline */}
      <div className="relative space-y-3 pt-1">
        {filteredSessions.length === 0 ? (
          <div className="p-10 text-center rounded-2xl bg-stage-900/60 border border-stage-800 text-slate-400 space-y-3">
            <p className="text-sm font-medium">No agenda sessions scheduled for this stage.</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
            >
              Create First Session
            </Button>
          </div>
        ) : (
          filteredSessions.map((session, index) => (
            <SessionItem
              key={session._id}
              session={session}
              index={index}
              onActivate={handleActivate}
              onOpenDelayModal={(s) => setSelectedSessionForDelay(s)}
              onOpenAIModal={onOpenAIModal}
            />
          ))
        )}
      </div>

      {/* Delay Modal */}
      <DelayModal
        isOpen={Boolean(selectedSessionForDelay)}
        onClose={() => setSelectedSessionForDelay(null)}
        session={selectedSessionForDelay}
        onSubmit={handleDelaySubmit}
      />

      {/* Add Session Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Agenda Session"
      >
        <form onSubmit={handleAddSession} className="space-y-4">
          <Input
            label="Session Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. Keynote: Autonomous Cloud Infrastructures"
            required
          />

          <Input
            label="Duration (Minutes)"
            type="number"
            min="5"
            max="240"
            value={newDuration}
            onChange={(e) => setNewDuration(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Stage Notes for Anchor
            </label>
            <textarea
              rows={2}
              value={newStageNotes}
              onChange={(e) => setNewStageNotes(e.target.value)}
              className="w-full bg-stage-950 border border-stage-700 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              placeholder="e.g. Check slide switcher on podium before starting"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stage-800">
            <Button
              variant="secondary"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
            >
              Save Session
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
