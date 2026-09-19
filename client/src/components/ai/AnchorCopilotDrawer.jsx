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
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-stage-950 border-l border-stage-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 bg-stage-900 border-b border-stage-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-md">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Stage AI Co-Pilot</h4>
            <p className="text-[10px] text-slate-400">Contextual stage assistant</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-stage-800"
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
              className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-cyan-600 text-white rounded-br-none'
                  : 'bg-stage-900 border border-stage-800 text-slate-200 rounded-bl-none'
              }`}
            >
              {m.text}
            </div>
            {m.provider && (
              <span className="text-[9px] text-slate-500 mt-1 font-mono">
                {m.provider}
              </span>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 italic p-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            Co-Pilot thinking...
          </div>
        )}
      </div>

      {/* Quick query pills */}
      <div className="px-3 py-2 bg-stage-900/60 border-t border-stage-850 flex flex-wrap gap-1.5">
        {quickPills.map((pill) => (
          <button
            key={pill}
            type="button"
            onClick={() => handleSend(pill)}
            className="text-[11px] bg-stage-850 hover:bg-stage-800 text-slate-300 px-2 py-1 rounded border border-stage-800 transition-colors"
          >
            {pill}
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
          placeholder="Ask quick question..."
          className="flex-1 bg-stage-950 border border-stage-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />
        <Button
          variant="primary"
          size="sm"
          onClick={() => handleSend()}
          disabled={loading || !query.trim()}
          icon={Send}
        />
      </div>
    </div>
  );
};
