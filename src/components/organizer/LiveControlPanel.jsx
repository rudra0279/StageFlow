import React, { useState } from 'react';
import { Send, AlertOctagon, Plus, Minus, Bell, Radio } from 'lucide-react';
import CountdownTimer from '../common/CountdownTimer';

export const LiveControlPanel = ({
  activeItem,
  remainingSeconds,
  isTimerRunning,
  onToggleTimer,
  onResetTimer,
  onAdjustTimer,
  onSendAlert,
}) => {
  const [alertText, setAlertText] = useState('');

  const handleSendPrompt = (e) => {
    e.preventDefault();
    if (!alertText.trim()) return;
    if (onSendAlert) {
      onSendAlert(alertText);
    }
    setAlertText('');
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-red-500/20">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-red-500 animate-pulse" />
          <h2 className="text-base font-bold text-slate-100 uppercase tracking-wide">
            Organizer Broadcast Deck
          </h2>
        </div>
        <span className="px-2.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 text-[10px] font-bold uppercase tracking-widest">
          MASTER CONTROL
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Live Master Timer */}
        <div>
          <CountdownTimer
            seconds={remainingSeconds}
            isRunning={isTimerRunning}
            onToggle={onToggleTimer}
            onReset={() => onResetTimer(activeItem ? activeItem.allocatedMinutes * 60 : 900)}
            onAdjust={onAdjustTimer}
            size="xl"
            label={activeItem ? `LIVE: ${activeItem.title}` : 'LIVE TIMER'}
          />

          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={() => onAdjustTimer(180)}
              className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center justify-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>+3 Mins Buffer</span>
            </button>
            <button
              onClick={() => onAdjustTimer(-180)}
              className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center justify-center gap-1 transition-colors"
            >
              <Minus className="w-3.5 h-3.5 text-amber-400" />
              <span>-3 Mins Wrap</span>
            </button>
          </div>
        </div>

        {/* Right Column: Stage Broadcast Cue Messaging */}
        <div className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 mb-2">
              <Bell className="w-4 h-4 text-cyan-400" />
              <span>PUSH DIRECT STAGE CUE TO ANCHOR</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Type custom prompt or alert to instantly display on the anchor's AI teleprompter monitor.
            </p>

            <form onSubmit={handleSendPrompt} className="space-y-3">
              <textarea
                value={alertText}
                onChange={(e) => setAlertText(e.target.value)}
                placeholder="e.g. 'Wrap up in 2 mins. Next speaker Dr. Chen is waiting stage right.'"
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              ></textarea>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-cyan-500/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transmit Cue Prompt</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSendAlert && onSendAlert('EMERGENCY: Wrap up segment immediately!')}
                  className="p-2.5 rounded-xl bg-red-950/60 hover:bg-red-900/60 border border-red-800 text-red-400 text-xs font-semibold transition-colors"
                  title="Emergency Stage Alert"
                >
                  <AlertOctagon className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 mt-4 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Anchor Connection Signal:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> STAGE READY
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveControlPanel;
