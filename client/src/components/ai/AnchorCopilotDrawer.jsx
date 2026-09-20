import React, { useState, useEffect } from 'react';
import { Bot, Send, Sparkles, X, Wand2, Zap, CornerDownLeft } from 'lucide-react';
import { Button } from '../common/Button';
import { aiApi } from '../../api/aiApi';

export const AnchorCopilotDrawer = ({
  isOpen,
  onClose,
  eventId,
  session,
  externalMessage
}) => {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Greetings! I am your AI Stage Co-Pilot. How can I assist with your live event stage orchestration right now?'
    }
  ]);

  useEffect(() => {
    if (externalMessage) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: `[Q&A AI Assistance - ${externalMessage.action?.toUpperCase()}]\nQuestion: "${externalMessage.questionText}"\n\n${externalMessage.result}`,
          provider: 'StagePilot AI Question Assist'
        }
      ]);
    }
  }, [externalMessage]);

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const quickActions = [
    { label: 'Generate Introduction', query: 'Generate a 30-second energetic stage introduction for the current speaker' },
    { label: 'Create Filler', query: 'Create 30s engaging audience filler while a technical pause is resolved' },
    { label: 'Handle Delay', query: 'Draft an upbeat stage announcement explaining a minor schedule delay' },
    { label: 'Generate Announcement', query: 'Formulate a clear stage announcement for upcoming schedule events' },
    { label: 'Assist Anchor', query: 'Summarize key speaker background and key takeaways for the anchor' },
    { label: 'Summarize Question', query: 'Summarize the top audience questions for the live Q&A panel' },
    { label: 'Create Transition', query: 'Create a smooth segue script transition between current and next session' }
  ];

  const handleSend = async (questionText = query) => {
    const text = questionText.trim();
    if (!text) return;

    setMessages((prev) => [...prev, { sender: 'user', text }]);
    setQuery('');
    setLoading(true);

    try {
      const res = await aiApi.askCopilot({
        eventId,
        sessionId: session?._id,
        track: session?.track || session?.room,
        query: text
      });

      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: res.data.answer,
          provider: res.data.provider
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'AI stage co-pilot experienced a telemetry delay. Retrying connection...'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] glass-panel border-l border-purple-500/30 shadow-2xl flex flex-col animate-fade-in">
      {/* Header */}
      <div className="p-4 bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
            <Wand2 className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black text-[var(--text-primary)] tracking-tight">AI STAGE CO-PILOT</h4>
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-live-dot" />
            </div>
            <p className="text-[10px] font-mono text-purple-400 font-semibold uppercase tracking-wider">
              Real-Time Stage Telemetry & Script AI
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[88%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-md ${
                m.sender === 'user'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-none font-medium'
                  : 'bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-bl-none'
              }`}
            >
              {m.text}
            </div>
            {m.provider && (
              <span className="text-[9px] text-purple-400 mt-1 font-mono font-semibold px-1">
                ⚡ {m.provider}
              </span>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-purple-400 font-mono italic p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20 animate-pulse">
            <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />
            AI Co-Pilot processing stage request...
          </div>
        )}
      </div>

      {/* Quick Action Grid */}
      <div className="p-3 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] space-y-2">
        <p className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider">
          BACKSTAGE QUICK ACTIONS:
        </p>
        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
          {quickActions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => handleSend(action.query)}
              className="text-[10px] font-semibold bg-[var(--bg-elevated)] hover:bg-purple-500/15 text-[var(--text-secondary)] hover:text-purple-300 px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] hover:border-purple-500/30 transition-all flex items-center gap-1.5 shrink-0"
            >
              <Zap className="w-3 h-3 text-purple-400 shrink-0" />
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="p-3 bg-[var(--bg-elevated)] border-t border-[var(--border-subtle)] flex items-center gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="How can I help with the live event?"
          className="flex-1 bg-[var(--bg-glass)] border border-[var(--border-subtle)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-purple-500 font-medium"
        />
        <Button
          variant="violet"
          size="sm"
          onClick={() => handleSend()}
          disabled={loading || !query.trim()}
          icon={Send}
          className="shadow-md shadow-purple-500/20"
        />
      </div>
    </div>
  );
};

export default AnchorCopilotDrawer;

