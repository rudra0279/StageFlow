import React from 'react';
import { Smile, TrendingUp } from 'lucide-react';

export const SentimentIndicator = ({ score = 88 }) => {
  return (
    <div className="bg-stage-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
          <Smile className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
            AUDIENCE ENGAGEMENT
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-100 font-mono">{score}% Positive</span>
            <span className="text-xs text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> High Interest
            </span>
          </div>
        </div>
      </div>
      <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
        <div
          className="bg-emerald-400 h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%` }}
        ></div>
      </div>
    </div>
  );
};

export default SentimentIndicator;
