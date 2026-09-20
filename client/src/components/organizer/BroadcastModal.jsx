import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Radio, AlertOctagon } from 'lucide-react';

export const BroadcastModal = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [message, setMessage] = useState('');
  const [urgency, setUrgency] = useState('MEDIUM');
  const [type, setType] = useState('STAGE_DIRECTION');
  const [loading, setLoading] = useState(false);

  const quickPrompts = [
    'Wrap up talk in 2 minutes',
    'VIP Guest arrived early, prioritize stage entry',
    'Audio check needed on handheld mic 2',
    'Shorten audience Q&A to 1 question'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      await onSubmit({ message, urgency, type });
      setMessage('');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Broadcast Urgent Stage Alert">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--form-label-text)] mb-1.5">
            Alert Message (Flashes on Anchor Screen)
          </label>
          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full theme-input rounded-xl p-3 text-sm focus:outline-none"
            placeholder="Type urgent directive to anchor..."
            required
          />
        </div>

        {/* Quick clicks */}
        <div>
          <p className="text-[11px] text-[var(--text-secondary)] mb-2 font-medium">Quick stage directions:</p>
          <div className="flex flex-wrap gap-1.5">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setMessage(prompt)}
                className="text-xs bg-[var(--bg-elevated)] hover:bg-[var(--border-subtle)] text-[var(--text-secondary)] px-2.5 py-1 rounded-lg border border-[var(--border-subtle)] transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--form-label-text)] mb-1.5">
              Urgency Level
            </label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
              className="w-full theme-input rounded-xl px-3 py-2 text-sm focus:outline-none"
            >
              <option value="LOW">Low (Informational)</option>
              <option value="MEDIUM">Medium (Caution)</option>
              <option value="CRITICAL">Critical (Flashing Red Banner)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--form-label-text)] mb-1.5">
              Category
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full theme-input rounded-xl px-3 py-2 text-sm focus:outline-none"
            >
              <option value="STAGE_DIRECTION">Stage Direction</option>
              <option value="DELAY">Delay Notice</option>
              <option value="EMERGENCY">Emergency / AV Alert</option>
              <option value="GENERAL">General Notice</option>
            </select>
          </div>
        </div>


        <div className="flex items-center justify-end gap-3 pt-4 border-t border-stage-800">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            loading={loading}
            icon={Radio}
          >
            Send Flash Broadcast
          </Button>
        </div>
      </form>
    </Modal>
  );
};
