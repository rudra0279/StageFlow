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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDuration, setNewDuration] = useState(30);
  const [newStageNotes, setNewStageNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-stage-800">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            Live Agenda & Sessions
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Control live stage status and push immediate delays</p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => setIsAddModalOpen(true)}
        >
          Add Session
        </Button>
      </div>

      {/* Session list */}
      <div className="space-y-3">
        {sessions.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-stage-900 border border-stage-800 text-slate-400">
            <p className="text-sm">No agenda sessions scheduled yet.</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => setIsAddModalOpen(true)}
            >
              Create First Session
            </Button>
          </div>
        ) : (
          sessions.map((session, index) => (
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
