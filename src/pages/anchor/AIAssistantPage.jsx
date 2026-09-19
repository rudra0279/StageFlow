import React, { useState } from 'react';
import { useAI } from '../../hooks/useAI';
import AIChatBox from '../../components/ai/AIChatBox';
import SentimentIndicator from '../../components/ai/SentimentIndicator';
import { Bot, Sparkles, FileText, Send, Check } from 'lucide-react';

export const AIAssistantPage = () => {
  const { generateScript, sentimentScore } = useAI();
  const [topic, setTopic] = useState('Keynote Transition & Speaker Introductions');
  const [generatedResult, setGeneratedResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const res = await generateScript({ topic, durationMinutes: 5 });
      setGeneratedResult(res.script);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100">Anchor AI Co-Pilot & Script Studio</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Instant stage script generation, jokes, stage filler, and question summaries
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols wide): Quick Script Generator & Output */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-cyan-500/20 space-y-4">
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Instant Stage Script Generator</span>
            </h3>

            <form onSubmit={handleGenerate} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Topic or Stage Scenario
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. 2-minute filler while technical team fixes slides"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors shadow-lg shadow-cyan-500/20"
              >
                <Bot className="w-4 h-4" />
                <span>{loading ? 'AI Co-Pilot Crafting...' : 'Generate Stage Teleprompter Script'}</span>
              </button>
            </form>

            {generatedResult && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/40 text-xs text-slate-200 font-medium space-y-2 mt-4">
                <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400 uppercase font-bold">
                  <span>GENERATED SCRIPT RESULT</span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Check className="w-3.5 h-3.5" /> READY FOR TELEPROMPTER
                  </span>
                </div>
                <p className="leading-relaxed text-sm whitespace-pre-wrap">{generatedResult}</p>
              </div>
            )}
          </div>

          <SentimentIndicator score={sentimentScore} />
        </div>

        {/* Right Column: AI Chat Assistant */}
        <div>
          <AIChatBox />
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPage;
