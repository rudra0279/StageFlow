import React, { useState } from 'react';
import { Bot, Send, Sparkles, RefreshCw, Zap, Layers } from 'lucide-react';
import { useAI } from '../../hooks/useAI';
import { useAgenda } from '../../hooks/useAgenda';

export const AIChatBox = () => {
  const { generateScript, loading } = useAI();
  const {
    tracks,
    activeTrackId,
    getActiveSessionForTrack,
    getNextSessionForTrack,
    trackDelays,
  } = useAgenda();

  const activeTrack = tracks.find((t) => t.id === activeTrackId) || tracks[0];
  const activeSession = getActiveSessionForTrack(activeTrackId);
  const nextSession = getNextSessionForTrack(activeTrackId);
  const delay = trackDelays[activeTrackId] || activeTrack.delayMinutes || 0;

  const [messages, setMessages] = useState([
    {
      id: 'm1',
      sender: 'ai',
      text: `Hello! I am StagePilot AI for ${activeTrack.shortName || 'Track A'}. Ask me to draft track transitions, next speaker intros, or track delay announcements.`,
    },
  ]);
  const [input, setInput] = useState('');

  const sendQuery = async (queryText) => {
    if (!queryText.trim() || loading) return;

    const userMsg = { id: `msg_${Date.now()}`, sender: 'user', text: queryText };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await generateScript({
        topic: `${queryText} for ${activeTrack.name} (Current Speaker: ${
          activeSession?.speakerName || 'None'
        }, Next Speaker: ${nextSession?.speakerName || 'None'}, Track Delay: ${delay} mins)`,
        durationMinutes: 2,
      });

      let aiResponseText = res.script;
      if (!aiResponseText) {
        if (queryText.includes('Next Speaker')) {
          aiResponseText = nextSession
            ? `The next speaker on ${activeTrack.shortName} is ${nextSession.speakerName} presenting "${nextSession.title}" at ${nextSession.startTime}.`
            : `There are no further upcoming speakers scheduled on ${activeTrack.shortName}.`;
        } else if (queryText.includes('Delay Announcement')) {
          aiResponseText = delay > 0
            ? `Attention ${activeTrack.shortName} attendees: Our session is currently running +${delay} minutes behind schedule. We appreciate your patience!`
            : `${activeTrack.shortName} is currently running strictly on schedule!`;
        } else {
          aiResponseText = `Here is a custom script for ${activeTrack.shortName}: Welcome back! We are currently live with ${activeSession?.speakerName || 'our presenter'} discussing ${activeSession?.title || 'the topic'}.`;
        }
      }

      const aiMsg = { id: `msg_ai_${Date.now()}`, sender: 'ai', text: aiResponseText };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `msg_err_${Date.now()}`, sender: 'ai', text: 'Error generating AI response.' },
      ]);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const text = input;
    setInput('');
    sendQuery(text);
  };

  return (
    <div className="glass-panel rounded-2xl flex flex-col h-[520px] border border-cyan-500/20 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <span>STAGEPILOT AI COPILOT</span>
            </h3>
            <p className="text-[10px] text-cyan-300 font-mono">
              Active Context: {activeTrack.shortName} ({delay > 0 ? `+${delay}m delay` : 'On Time'})
            </p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-mono font-bold">
          ONLINE
        </span>
      </div>

      {/* Multi-Track Quick Action Shortcuts */}
      <div className="p-2.5 bg-slate-950/80 border-b border-slate-800 flex flex-wrap gap-1.5 text-[10px]">
        <button
          onClick={() => sendQuery(`Who is the Next Speaker on ${activeTrack.shortName}?`)}
          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-semibold flex items-center gap-1"
        >
          <Zap className="w-3 h-3 text-cyan-400" />
          <span>[Next Track Speaker]</span>
        </button>

        <button
          onClick={() => sendQuery(`Draft Track Transition script for ${activeTrack.shortName}`)}
          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-semibold flex items-center gap-1"
        >
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>[Track Transition]</span>
        </button>

        <button
          onClick={() => sendQuery(`Draft Track Delay Announcement for ${activeTrack.shortName}`)}
          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-semibold flex items-center gap-1"
        >
          <Layers className="w-3 h-3 text-amber-400" />
          <span>[Track Delay Announcement]</span>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-2.5 max-w-[88%] ${
              m.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
            }`}
          >
            <div
              className={`p-2.5 rounded-xl text-xs leading-relaxed ${
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
            <span>AI processing track context...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask AI Co-Pilot for ${activeTrack.shortName}...`}
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
