import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  Sparkles,
  FlipHorizontal,
  Mic,
  MicOff,
  Radio,
  AlertCircle,
} from 'lucide-react';
import { useSpeechFollower } from '../../hooks/useSpeechFollower';

export const Teleprompter = ({
  scriptText = '',
  speakerName = 'Anchor',
  aiPrompts = [],
  fontSize = 32,
  speed = 2,
  onSpeedChange,
  onFontSizeChange,
}) => {
  const [isScrolling, setIsScrolling] = useState(false);
  const [isMirrored, setIsMirrored] = useState(false);
  const [isSpeechFollowerActive, setIsSpeechFollowerActive] = useState(false);

  const containerRef = useRef(null);

  // Custom Speech Follower Hook
  const {
    isSupported,
    status,
    isListening,
    activeWordIndex,
    errorMessage,
    parsedWords,
    wordRefs,
    toggleListening,
    resetFollower,
  } = useSpeechFollower({
    scriptText,
    containerRef,
  });

  // RAF / Interval Manual Auto-Scroll Loop
  useEffect(() => {
    let interval = null;
    if (isScrolling && containerRef.current) {
      interval = setInterval(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop += speed;
        }
      }, 50);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isScrolling, speed]);

  const handleResetScroll = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
    resetFollower();
  };

  const handleToggleSpeechFollower = () => {
    const nextState = !isSpeechFollowerActive;
    setIsSpeechFollowerActive(nextState);
    if (nextState) {
      setIsScrolling(false); // Pause manual scroll when speech follower takes over
    }
    toggleListening();
  };

  // Status Badge Rendering Helper
  const renderStatusBadge = () => {
    switch (status) {
      case 'LISTENING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold animate-pulse">
            <Radio className="w-3.5 h-3.5" />
            <span>LISTENING</span>
          </span>
        );
      case 'PAUSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold">
            <Pause className="w-3.5 h-3.5" />
            <span>PAUSED</span>
          </span>
        );
      case 'DENIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>MIC DENIED</span>
          </span>
        );
      case 'UNSUPPORTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-mono">
            UNSUPPORTED
          </span>
        );
      case 'MIC_OFF':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-xs font-semibold">
            <MicOff className="w-3.5 h-3.5" />
            <span>MIC OFF</span>
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
      {/* Teleprompter Header Bar */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                AI TELEPROMPTER VIEWPORT
              </h3>
              {renderStatusBadge()}
            </div>
            <p className="text-[10px] text-slate-400">Active Speaker: {speakerName}</p>
          </div>
        </div>

        {/* Teleprompter Display Controls */}
        <div className="flex items-center gap-2">
          {/* Live Speech-to-Text Follower Toggle Button */}
          {isSupported && (
            <button
              onClick={handleToggleSpeechFollower}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-lg border ${
                isSpeechFollowerActive
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-400 shadow-emerald-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="Toggle Live Speech-to-Text Script Follower"
            >
              {isSpeechFollowerActive ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
              <span>{isSpeechFollowerActive ? 'SPEECH FOLLOW: ON' : 'SPEECH FOLLOW'}</span>
            </button>
          )}

          {/* Mirror Toggle Button */}
          <button
            onClick={() => setIsMirrored(!isMirrored)}
            className={`p-1.5 rounded-lg border transition-colors ${
              isMirrored
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title="Mirror Display for Beamsplitter Glass"
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>

          {/* Font Controls */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => onFontSizeChange && onFontSizeChange(Math.max(20, fontSize - 4))}
              title="Decrease Font Size"
              className="p-1 text-slate-300 hover:text-white"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-bold text-slate-300 px-1">{fontSize}px</span>
            <button
              onClick={() => onFontSizeChange && onFontSizeChange(Math.min(56, fontSize + 4))}
              title="Increase Font Size"
              className="p-1 text-slate-300 hover:text-white"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Manual Auto Scroll Button */}
          <button
            onClick={() => {
              if (isSpeechFollowerActive) {
                setIsSpeechFollowerActive(false);
                toggleListening();
              }
              setIsScrolling(!isScrolling);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-lg ${
              isScrolling
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
            }`}
          >
            {isScrolling ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isScrolling ? 'PAUSE SCROLL' : 'AUTO SCROLL'}</span>
          </button>

          <button
            onClick={handleResetScroll}
            title="Reset to Top"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* AI Live Alert Overlay Banner if any */}
      {aiPrompts.length > 0 && (
        <div className="p-3 bg-cyan-950/80 border-b border-cyan-500/40 text-cyan-200 text-xs font-medium flex items-center justify-between animate-pulse px-6 z-10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              <strong>LIVE AI CUE:</strong> {aiPrompts[0].content || aiPrompts[0]}
            </span>
          </div>
          <span className="text-[10px] bg-cyan-900 border border-cyan-700 px-2 py-0.5 rounded font-mono">
            NEW
          </span>
        </div>
      )}

      {/* Error / Permission Banner if microphone issue occurs */}
      {errorMessage && (
        <div className="p-2.5 bg-red-950/80 border-b border-red-800 text-red-300 text-xs font-semibold flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Teleprompter Scroll Content Box */}
      <div
        ref={containerRef}
        className={`flex-1 p-8 md:p-12 overflow-y-auto teleprompter-text text-slate-100 font-medium tracking-wide selection:bg-cyan-500 selection:text-slate-950 ${
          isMirrored ? 'scale-x-[-1]' : ''
        }`}
        style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
      >
        {isSpeechFollowerActive && parsedWords.length > 0 ? (
          <div className="leading-relaxed whitespace-pre-wrap">
            {parsedWords.map((item, idx) => {
              if (item.isWhitespace) {
                return <span key={idx}>{item.text}</span>;
              }
              const isPast = activeWordIndex >= 0 && item.index < activeWordIndex;
              const isActive = activeWordIndex >= 0 && item.index === activeWordIndex;

              return (
                <span
                  key={idx}
                  ref={(el) => (wordRefs.current[item.index] = el)}
                  className={`transition-all duration-150 inline-block rounded px-0.5 ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 font-black scale-105 shadow-md shadow-cyan-500/50 underline'
                      : isPast
                      ? 'text-slate-500 opacity-60'
                      : 'text-slate-100 font-bold opacity-100'
                  }`}
                >
                  {item.text}
                </span>
              );
            })}
          </div>
        ) : (
          <p className="leading-relaxed whitespace-pre-wrap">
            {scriptText || 'No active script loaded. Load agenda item or request AI script generation.'}
          </p>
        )}

        {/* Scroll Padding End */}
        <div className="h-40"></div>
      </div>
    </div>
  );
};

export default Teleprompter;
