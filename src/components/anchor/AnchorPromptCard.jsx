import React from 'react';
import { Lightbulb, CheckSquare, Sparkles } from 'lucide-react';

export const AnchorPromptCard = ({ title = 'Stage Cue Card', keyPoints = [], introText = '' }) => {
  return (
    <div className="glass-panel p-5 rounded-2xl border border-cyan-500/20">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
        <Sparkles className="w-4 h-4 text-cyan-400" />
        <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">{title}</h3>
      </div>

      {introText && (
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 font-medium italic mb-3">
          "{introText}"
        </div>
      )}

      <div className="space-y-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
          MUST-COVER TALKING POINTS
        </span>
        <ul className="space-y-1.5">
          {keyPoints.map((pt, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-slate-200">
              <CheckSquare className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
              <span>{pt}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AnchorPromptCard;
