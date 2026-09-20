import React, { useState, useEffect, useRef } from 'react';
import { eventApi } from '../../api/eventApi';
import {
  MessageSquare,
  Send,
  ShieldCheck,
  Radio,
  Clock,
  ArrowDown,
  Sparkles,
  Lock,
  User
} from 'lucide-react';
import { Button } from '../common/Button';

export const EventCommandChat = ({ eventId, currentUser, socket, prefillRecipient }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [hasNewMessageBelow, setHasNewMessageBelow] = useState(false);

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const senderName = currentUser?.name || 'Organizer';
  const senderRole = currentUser?.roleTitle || (currentUser?.role === 'anchor' ? 'Stage Anchor / MC' : 'Event Lead');

  const loadMessages = async () => {
    try {
      const res = await eventApi.getMessages(eventId);
      if (res.success && res.data) {
        setMessages(res.data);
      }
    } catch (err) {
      console.error('Failed to load command chat messages:', err);
    }
  };

  useEffect(() => {
    if (eventId) {
      loadMessages();
    }
  }, [eventId]);

  // When a recipient is selected from the committee directory, prefill mention
  useEffect(() => {
    if (prefillRecipient) {
      setInputText((prev) => `@${prefillRecipient.name} `);
    }
  }, [prefillRecipient]);

  // Socket.IO Real-Time Chat Message Handler
  useEffect(() => {
    if (!socket || !eventId) return;

    const handleChatMessage = (data) => {
      if (data && data.message && (data.eventId === eventId || data.message.eventId === eventId)) {
        setMessages((prev) => {
          // Avoid duplicate messages
          if (prev.some((m) => m._id === data.message._id)) return prev;
          return [...prev, data.message];
        });

        // Check if user is scrolled up
        if (scrollContainerRef.current) {
          const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
          const isScrolledToBottom = scrollHeight - scrollTop - clientHeight < 60;
          if (!isScrolledToBottom) {
            setHasNewMessageBelow(true);
          }
        }
      }
    };

    socket.on('commandChatMessage', handleChatMessage);

    return () => {
      socket.off('commandChatMessage', handleChatMessage);
    };
  }, [socket, eventId]);

  // Auto-scroll on initial load and when near bottom
  useEffect(() => {
    if (!hasNewMessageBelow) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, hasNewMessageBelow]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 40;
    if (isAtBottom) {
      setHasNewMessageBelow(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setHasNewMessageBelow(false);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const payload = {
        message: text,
        senderName,
        senderRole,
      };

      const res = await eventApi.sendMessage(eventId, payload);
      if (res.success && res.data) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === res.data._id)) return prev;
          return [...prev, res.data];
        });
      }
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      console.error('Failed to send command chat message:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-3xl bg-stage-900 border border-stage-800 shadow-2xl flex flex-col h-[560px] overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 px-6 bg-stage-950 border-b border-stage-800/90 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white tracking-wider uppercase font-mono">
                EVENT COMMAND CHAT
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                LIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Restricted organizer committee operations frequency
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-stage-900 px-3 py-1 rounded-full border border-stage-800">
          <Lock className="w-3 h-3 text-cyan-400" />
          <span>Committee Only</span>
        </div>
      </div>

      {/* Messages Scroll Thread */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 p-6 space-y-4 overflow-y-auto relative"
      >
        {messages.map((msg, idx) => {
          const isMe =
            currentUser &&
            (msg.senderName?.toLowerCase() === currentUser.name?.toLowerCase() ||
              msg.senderId === currentUser.id);

          const timeDisplay = msg.createdAt || msg.timestamp
            ? new Date(msg.createdAt || msg.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            : '';

          return (
            <div
              key={msg._id || idx}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              {/* Sender Name & Role Pill */}
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-xs font-bold text-slate-200">
                  {isMe ? 'You' : msg.senderName}
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.2 rounded bg-stage-950 border border-stage-800 text-cyan-300">
                  {msg.senderRole || 'Organizer'}
                </span>
                {timeDisplay && (
                  <span className="text-[10px] font-mono text-slate-500">
                    {timeDisplay}
                  </span>
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed shadow-md ${
                  isMe
                    ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-100 rounded-tr-sm'
                    : 'bg-stage-950 border border-stage-800 text-slate-200 rounded-tl-sm'
                }`}
              >
                {msg.message}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />

        {/* New message indicator */}
        {hasNewMessageBelow && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-cyan-500 text-stage-950 font-bold text-xs flex items-center gap-1.5 shadow-xl animate-bounce"
          >
            <span>New messages below</span>
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSendMessage} className="p-4 bg-stage-950 border-t border-stage-800/90 flex gap-3">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Coordinate as ${senderName} (${senderRole})...`}
          className="flex-1 px-4 py-2.5 rounded-xl bg-stage-900 border border-stage-800 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs text-white placeholder:text-slate-500"
        />

        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={sending}
          disabled={!inputText.trim()}
          icon={Send}
          className="px-5 shadow-lg shadow-cyan-500/20"
        >
          Send
        </Button>
      </form>
    </div>
  );
};
