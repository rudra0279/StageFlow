import React, { useState } from 'react';
import { useAgenda } from '../../hooks/useAgenda';
import { useEvent } from '../../hooks/useEvent';
import { useAI } from '../../hooks/useAI';
import { useSocket } from '../../hooks/useSocket';
import LiveControlPanel from '../../components/organizer/LiveControlPanel';
import LiveIndicator from '../../components/common/LiveIndicator';
import StatusBadge from '../../components/common/StatusBadge';
import { Radio, Wifi, Send, Volume2, Shield, Eye, AlertOctagon } from 'lucide-react';

export const LivePage = () => {
  const { activeEvent } = useEvent();
  const {
    activeItem,
    remainingSeconds,
    isTimerRunning,
    toggleTimer,
    resetTimer,
    adjustActiveTime,
  } = useAgenda();
  const { addCustomAlert } = useAI();
  const { isConnected, emitEvent } = useSocket('stage_control');
  const [broadcastMessage, setBroadcastMessage] = useState('');

  const handleSendAlert = (text) => {
    addCustomAlert('Organizer Alert', text, 'warning');
    emitEvent('stage_cue_broadcast', { message: text, timestamp: new Date().toISOString() });
    setBroadcastMessage(text);
  };

  return (
    <div className="space-y-6">
      {/* Master Telemetry Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-red-500/30">
        <div className="flex items-center gap-3">
          <LiveIndicator isLive={true} label="MASTER CONTROL ROOM LIVE" />
          <div className="h-4 w-[1px] bg-slate-800 hidden sm:block"></div>
          <span className="text-xs font-bold text-slate-200">
            {activeEvent?.title || 'Global AI Summit 2026'}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Wifi className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span>SOCKET: <strong className={isConnected ? 'text-emerald-400' : 'text-amber-400'}>{isConnected ? 'SYNCED' : 'MOCK ENGINE'}</strong></span>
          </div>

          <div className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
            AUDIO: <strong className="text-cyan-400">MIC 1 FEED ACTIVE</strong>
          </div>
        </div>
      </div>

      {/* Main Control Panel Deck */}
      <LiveControlPanel
        activeItem={activeItem}
        remainingSeconds={remainingSeconds}
        isTimerRunning={isTimerRunning}
        onToggleTimer={toggleTimer}
        onResetTimer={resetTimer}
        onAdjustTimer={adjustActiveTime}
        onSendAlert={handleSendAlert}
      />

      {/* Broadcast Log & Stage Telemetry Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>Anchor Teleprompter Feed Mirror</span>
          </h3>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 h-36 overflow-y-auto leading-relaxed">
            {activeItem?.teleprompterScript || 'Loading teleprompter script...'}
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Send className="w-4 h-4 text-cyan-400" />
            <span>Recent Broadcast Cues Sent</span>
          </h3>
          {broadcastMessage ? (
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs font-medium space-y-1">
              <span className="text-[10px] font-mono text-amber-400 uppercase block font-bold">
                LAST TRANSMITTED PROMPT
              </span>
              <p>"{broadcastMessage}"</p>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">
              No custom prompts transmitted yet. Use the control deck above to push cues to Anchor.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LivePage;
