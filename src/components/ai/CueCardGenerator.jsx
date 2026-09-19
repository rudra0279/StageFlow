import React, { useState } from 'react';
import { Sparkles, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAI } from '../../hooks/useAI';

export const CueCardGenerator = ({ speaker, onGenerated }) => {
  const { generateScript } = useAI();
  const [loading, setLoading] = useState(false);
  const [cueCard, setCueCard] = useState(null);

  const handleGenerate = async () => {
    if (!speaker) return;
    setLoading(true);
    try {
      const res = await generateScript({
        speakerName: speaker.name,
        topic: speaker.topic,
        durationMinutes: 15,
      });
      const generated = {
        title: `Cue Card: ${speaker.name}`,
        intro: `Welcome ${speaker.name}, ${speaker.role} at ${speaker.company}.`,
        script: res.script,
        bulletPoints: speaker.keyPoints || ['Key Insight 1', 'Live Demo Transition', 'Q&A Prompt'],
      };
      setCueCard(generated);
      if (onGenerated) onGenerated(generated);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-cyan-500/20">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
            AI Cue Card Generator
          </h3>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1 transition-colors"
        >
          {loading ? 'Generating...' : 'Auto-Generate'}
        </button>
      </div>

      {cueCard ? (
        <div className="space-y-3 mt-3">
          <p className="text-xs font-semibold text-cyan-300 italic">{cueCard.intro}</p>
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            {cueCard.bulletPoints.map((pt, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{pt}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-400 py-4 text-center">
          Click Auto-Generate to produce speaker introduction scripts and bullet prompts.
        </p>
      )}
    </div>
  );
};

export default CueCardGenerator;
