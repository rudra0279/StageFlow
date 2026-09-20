import React from 'react';
import { Gauge, Zap } from 'lucide-react';

export const SpeechAssistant = ({ targetWPM = 145, currentWPM = 142 }) => {
  const isPaceGood = Math.abs(currentWPM - targetWPM) < 15;

  return (
    <div className="bg-stage-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-xl border ${isPaceGood ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
          <Gauge className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">SPEECH CADENCE RATE</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-mono font-bold text-slate-100">{currentWPM} WPM</span>
            <span className="text-xs text-slate-400 font-mono">(Target: {targetWPM} WPM)</span>
          </div>
        </div>
      </div>

      <div className="text-right">
        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md border ${isPaceGood ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800' : 'bg-amber-950/60 text-amber-400 border-amber-800'}`}>
          <Zap className="w-3.5 h-3.5" />
          {isPaceGood ? 'OPTIMAL PACING' : currentWPM > targetWPM ? 'SLOW DOWN SLIGHTLY' : 'SPEED UP SLIGHTLY'}
        </span>
      </div>
    </div>
  );
};

export default SpeechAssistant;
