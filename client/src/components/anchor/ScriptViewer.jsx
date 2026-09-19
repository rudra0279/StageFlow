import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Sparkles, Copy, Check, Maximize2, RefreshCw } from 'lucide-react';

export const ScriptViewer = ({
  session,
  onOpenTeleprompter,
  onOpenGenerateModal
}) => {
  const [activeTab, setActiveTab] = useState('introduction');
  const [copied, setCopied] = useState(false);

  const scripts = session?.aiScripts || {};

  const currentScript = scripts[activeTab] || '';

  const handleCopy = () => {
    if (!currentScript) return;
    navigator.clipboard.writeText(currentScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { id: 'introduction', label: 'Speaker Intro' },
    { id: 'transition', label: 'Bridge / Transition' },
    { id: 'delay', label: 'Delay Filler' },
    { id: 'closing', label: 'Closing Wrap' }
  ];

  return (
    <Card className="bg-stage-900 border-stage-800">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stage-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h3 className="text-base font-bold text-white tracking-tight">AI Teleprompter Script</h3>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onOpenGenerateModal(session, activeTab)}
            icon={RefreshCw}
          >
            Regenerate
          </Button>

          {currentScript && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                icon={copied ? Check : Copy}
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>

              <Button
                variant="violet"
                size="sm"
                onClick={() => onOpenTeleprompter(currentScript, session)}
                icon={Maximize2}
              >
                Teleprompter View
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 my-3 bg-stage-950 p-1 rounded-lg border border-stage-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-stage-850 text-white shadow-sm border border-stage-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Script Display */}
      <div className="p-4 rounded-xl bg-stage-950/90 border border-stage-850 min-h-[140px] flex items-center justify-center">
        {currentScript ? (
          <p className="text-slate-100 text-base sm:text-lg leading-relaxed teleprompter-text select-text">
            {currentScript}
          </p>
        ) : (
          <div className="text-center py-6">
            <p className="text-xs text-slate-500 mb-3">
              No script generated yet for this section.
            </p>
            <Button
              variant="violet"
              size="sm"
              icon={Sparkles}
              onClick={() => onOpenGenerateModal(session, activeTab)}
            >
              Generate with AI
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};
