import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Clock, AlertTriangle } from 'lucide-react';

export const DelayModal = ({
  isOpen,
  onClose,
  session,
  onSubmit
}) => {
  const [delayMinutes, setDelayMinutes] = useState(10);
  const [reason, setReason] = useState('Speaker preparation & AV check');
  const [loading, setLoading] = useState(false);

  const presetMinutes = [5, 10, 15, 20];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(session._id, delayMinutes, reason);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!session) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Inject Stage Delay & Cascade Schedule">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="p-3 rounded-lg bg-stage-950 border border-stage-800 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-slate-300">
              Applying delay to: <span className="text-white">{session.title}</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              This will automatically push forward the start times of all subsequent agenda sessions and alert the live anchor.
            </p>
          </div>
        </div>

        {/* Quick presets */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Select Delay Duration
          </label>
          <div className="grid grid-cols-4 gap-2">
            {presetMinutes.map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setDelayMinutes(mins)}
                className={`py-2.5 rounded-lg font-bold text-sm transition-all border ${
                  delayMinutes === mins
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                    : 'bg-stage-800 text-slate-300 border-stage-700 hover:border-slate-500'
                }`}
              >
                +{mins} mins
              </button>
            ))}
          </div>
        </div>

        {/* Reason */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Reason (Shown to Anchor & Broadcasted)
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-stage-950 border border-stage-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
            placeholder="e.g. Flight delay, AV technical calibration..."
            required
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="amber"
            loading={loading}
            icon={Clock}
          >
            Cascade +{delayMinutes}m Delay
          </Button>
        </div>
      </form>
    </Modal>
  );
};
