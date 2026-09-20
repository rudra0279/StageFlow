import React, { useState } from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { aiApi } from '../../api/aiApi';

export const CueCardGenerator = ({ eventId, session, speaker, onGenerated }) => {
  const [loading, setLoading] = useState(false);
  const [cueCard, setCueCard] = useState(null);

  const handleGenerate = async () => {
    if (!speaker && !session) return;
    setLoading(true);
    try {
      const res = await aiApi.generateScript({
        eventId,
        sessionId: session?._id,
        scriptType: 'SPEAKER_INTRO',
        tone: 'ENTHUSIASTIC',
        customParams: {
          speakerName: speaker?.name || session?.speakerName,
          topic: session?.title,
        },
      });

      const generated = {
        title: `Cue Card: ${speaker?.name || session?.speakerName || 'Speaker'}`,
        intro: `Introducing ${speaker?.name || session?.speakerName || 'our speaker'}, speaking on "${session?.title || 'Keynote'}".`,
        script: res?.data?.script || res?.script || 'Welcome to the stage!',
        bulletPoints: speaker?.keyPoints || [
          `Topic: ${session?.title || 'Main Session'}`,
          'Live Demo Transition',
          'Audience Q&A Prompt'
        ],
      };
      setCueCard(generated);
      if (onGenerated) onGenerated(generated);
    } catch (err) {
      console.error('Failed to generate cue card:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-stage-900 border border-slate-800 p-5 rounded-2xl">
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

      {cueCard && (
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
      )}
    </div>
  );
};

export default CueCardGenerator;
