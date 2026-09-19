import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Sparkles, Bot, Wand2 } from 'lucide-react';
import { aiApi } from '../../api/aiApi';

export const ScriptGeneratorModal = ({
  isOpen,
  onClose,
  eventId,
  session,
  defaultScriptType = 'introduction',
  onSuccess
}) => {
  const [scriptType, setScriptType] = useState(defaultScriptType);
  const [tone, setTone] = useState('professional');
  const [delayMinutes, setDelayMinutes] = useState('10');
  const [reason, setReason] = useState('Audio check & demo calibration');
  const [loading, setLoading] = useState(false);
  const [generatedResult, setGeneratedResult] = useState(null);

  const scriptTypes = [
    { id: 'introduction', label: 'Speaker Introduction' },
    { id: 'opening', label: 'Opening Welcome Script' },
    { id: 'transition', label: 'Bridge / Transition' },
    { id: 'delay', label: 'Delay Filler Script' },
    { id: 'closing', label: 'Closing Remarks' }
  ];

  const tones = [
    { id: 'professional', label: 'Professional' },
    { id: 'energetic', label: 'High Energy' },
    { id: 'humorous', label: 'Lighthearted' },
    { id: 'inspiring', label: 'Inspiring' }
  ];

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setGeneratedResult(null);

    try {
      const res = await aiApi.generateScript({
        eventId,
        sessionId: session?._id,
        scriptType,
        tone,
        customParams: {
          delayMinutes,
          reason
        }
      });

      setGeneratedResult(res.data);
      if (onSuccess) onSuccess(res.data);
    } catch (err) {
      console.error('Generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate AI Teleprompter Script"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleGenerate} className="space-y-4">
        {/* Script Type selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Select Script Objective
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {scriptTypes.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => {
                  setScriptType(type.id);
                  setGeneratedResult(null);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-semibold text-left transition-all border ${
                  scriptType === type.id
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-sm'
                    : 'bg-stage-950 text-slate-400 border-stage-800 hover:border-stage-700'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tone selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Anchor Voice & Tone
          </label>
          <div className="flex flex-wrap gap-2">
            {tones.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTone(t.id)}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all border ${
                  tone === t.id
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                    : 'bg-stage-950 text-slate-400 border-stage-800 hover:border-slate-600'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conditional Delay inputs */}
        {scriptType === 'delay' && (
          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-stage-950 border border-stage-800">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Delay Minutes
              </label>
              <input
                type="number"
                value={delayMinutes}
                onChange={(e) => setDelayMinutes(e.target.value)}
                className="w-full bg-stage-900 border border-stage-700 rounded px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Reason
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-stage-900 border border-stage-700 rounded px-2.5 py-1.5 text-xs text-white"
              />
            </div>
          </div>
        )}

        {/* Trigger button */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="violet"
            loading={loading}
            icon={Wand2}
          >
            Generate Stage Script
          </Button>
        </div>

        {/* Generated Result preview */}
        {generatedResult && (
          <div className="mt-4 p-4 rounded-xl bg-stage-950 border border-purple-500/40 animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5" />
                Script Ready ({generatedResult.provider})
              </span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-mono">
                {generatedResult.tone}
              </span>
            </div>
            <p className="text-slate-100 text-sm leading-relaxed teleprompter-text font-medium">
              {generatedResult.script}
            </p>
          </div>
        )}
      </form>
    </Modal>
  );
};
