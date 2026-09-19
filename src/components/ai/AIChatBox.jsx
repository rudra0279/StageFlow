import React, { useState } from 'react';
import { Bot, Send, Sparkles, User, RefreshCw } from 'lucide-react';
import { useAI } from '../../hooks/useAI';

export const AIChatBox = () => {
  const { generateScript, loading } = useAI();
  const [messages, setMessages] = useState([
    {
      id: 'm1',
      sender: 'ai',
      text: 'Hello! I am StagePilot AI. Ask me to draft speaker intros, generate quick 30-second stage filler jokes, or summarize live audience questions.',
    },
  ]);
  const [input, setInput] = useState('');

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { id: `msg_${Date.now()}`, sender: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    const promptText = input;
    setInput('');

    try {
      const result = await generateScript({ topic: promptText, durationMinutes: 2 });
      const aiMsg = {
        id: `msg_ai_${Date.now()}`,
        sender: 'ai',
        text: result.script || `Here is a suggested draft for "${promptText}": Keep energy high, welcome our audience, and introduce the core keynote themes!`,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `msg_err_${Date.now()}`, sender: 'ai', text: 'Error contacting AI engine.' },
      ]);
    }
  };

  return (
    <div className="glass-panel rounded-2xl flex flex-col h-[480px] border border-cyan-500/20 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              STAGEPILOT AI ASSISTANT
            </h3>
            <p className="text-[10px] text-slate-400">Real-time Stage Telemetry & Script Copilot</p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-mono font-bold">
          ONLINE
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-2.5 max-w-[85%] ${
              m.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
            }`}
          >
            <div
              className={`p-2 rounded-xl text-xs ${
                m.sender === 'user'
                  ? 'bg-cyan-500 text-slate-950 font-medium rounded-tr-none'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-cyan-400 p-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>AI generating stage response...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask StagePilot AI (e.g. 'Draft 1-min keynote opener')..."
          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1 transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};

export default AIChatBox;
