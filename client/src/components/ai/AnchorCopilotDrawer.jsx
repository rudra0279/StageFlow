import React, { useState, useEffect } from 'react';
import { Bot, Send, Sparkles, X, MessageSquare, ChevronRight } from 'lucide-react';
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
      text: 'Hey! I am your AI Stage Co-Pilot. Ask me for quick speaker facts, audience icebreakers, or backup filler lines while live on stage.'
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

  const quickPills = [
    'Quick 1-sentence speaker fact',
    'Audience show-of-hands question',
    '30s filler line for technical pause'
  ];

  const handleSend = async (questionText = query) => {
    const text = questionText.trim();
    if (!text) return;

    // Append user message
    setMessages((prev) => [...prev, { sender: 'user', text }]);
    setQuery('');
    setLoading(true);

    try {
      const res = await aiApi.askCopilot({
        eventId,
        sessionId: session?._id,
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
          text: 'Sorry, could not fetch live context. Check back in a second.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 glass-panel border-l border-cyan-500/30 shadow-2xl flex flex-col animate-fade-in">
      {/* Header */}
      <div className="p-4 bg-stage-900/90 border-b border-stage-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Bot className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black text-white tracking-tight">AI Stage Co-Pilot</h4>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-live-dot" />
            </div>
            <p className="text-[10px] font-mono text-cyan-300">INTELLIGENT BACKSTAGE ASSISTANT</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-stage-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[88%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-md ${
                m.sender === 'user'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-none font-medium'
                  : 'bg-stage-900/90 border border-stage-800 text-slate-200 rounded-bl-none'
              }`}
            >
              {m.text}
            </div>
            {m.provider && (
              <span className="text-[9px] text-cyan-400 mt-1 font-mono font-semibold px-1">
                ⚡ {m.provider}
              </span>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-cyan-300 font-mono italic p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20 animate-pulse">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
            Stage AI Co-Pilot analyzing live telemetry...
          </div>
        )}
      </div>

      {/* Quick query pills */}
      <div className="p-3 bg-stage-950/80 border-t border-stage-850 flex flex-wrap gap-1.5">
        {quickPills.map((pill) => (
          <button
            key={pill}
            type="button"
            onClick={() => handleSend(pill)}
            className="text-[10px] font-semibold bg-stage-900 hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-300 px-2.5 py-1 rounded-lg border border-stage-800 hover:border-cyan-500/30 transition-all text-left"
          >
            ⚡ {pill}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 bg-stage-900 border-t border-stage-800 flex items-center gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask AI stage assistant..."
          className="flex-1 bg-stage-950 border border-stage-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-medium"
        />
        <Button
          variant="primary"
          size="sm"
          onClick={() => handleSend()}
          disabled={loading || !query.trim()}
          icon={Send}
          className="shadow-md shadow-cyan-500/20"
        />
      </div>
    </div>
  );
};
