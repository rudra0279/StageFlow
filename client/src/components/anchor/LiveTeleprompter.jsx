import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  FlipHorizontal,
  Mic,
  MicOff,
  Radio,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { Button } from '../common/Button';
import { useSpeechFollower } from '../../hooks/useSpeechFollower';

export const LiveTeleprompter = ({
  isOpen,
  onClose,
  scriptText = '',
  speakerName = '',
  sessionTitle = '',
}) => {
  const [fontSize, setFontSize] = useState(38); // px
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(2);
  const [isMirrored, setIsMirrored] = useState(false);
  const [isSpeechFollowerActive, setIsSpeechFollowerActive] = useState(false);

  const scrollRef = useRef(null);

  // Custom Speech Follower Hook
  const {
    isSupported,
    status,
    activeWordIndex,
    errorMessage,
    parsedWords,
    wordRefs,
    toggleListening,
    resetFollower,
  } = useSpeechFollower({
    scriptText,
    containerRef: scrollRef,
  });

  // Auto-scroll loop
  useEffect(() => {
    let animationId;

    const scroll = () => {
      if (scrollRef.current && isScrolling) {
        scrollRef.current.scrollTop += scrollSpeed;
        if (
          scrollRef.current.scrollTop + scrollRef.current.clientHeight >=
          scrollRef.current.scrollHeight
        ) {
          setIsScrolling(false);
        }
      }
      if (isScrolling) {
        animationId = requestAnimationFrame(scroll);
      }
    };

    if (isScrolling) {
      animationId = requestAnimationFrame(scroll);
    }

    return () => cancelAnimationFrame(animationId);
  }, [isScrolling, scrollSpeed]);

  const handleToggleSpeechFollower = () => {
    const nextState = !isSpeechFollowerActive;
    setIsSpeechFollowerActive(nextState);
    if (nextState) {
      setIsScrolling(false);
    }
    toggleListening();
  };

  const handleReset = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
    resetFollower();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col select-none">
      {/* Top Floating Control Bar */}
      <div className="h-16 px-6 bg-zinc-950/90 border-b border-zinc-800 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-widest text-zinc-400">
            STAGE TELEPROMPTER
          </span>
          <span className="text-xs text-zinc-500 hidden sm:inline">•</span>
          <span className="text-xs font-bold text-zinc-200 hidden sm:inline truncate max-w-xs">
            {sessionTitle || speakerName}
          </span>

          {/* Status Indicator */}
          {status === 'LISTENING' && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/30 animate-pulse">
              <Radio className="w-3 h-3" /> LISTENING
            </span>
          )}
          {status === 'PAUSED' && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-mono font-bold border border-amber-500/30">
              PAUSED
            </span>
          )}
          {status === 'DENIED' && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-mono font-bold border border-red-500/30">
              MIC DENIED
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Live Speech Follower Toggle */}
          {isSupported && (
            <button
              onClick={handleToggleSpeechFollower}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                isSpeechFollowerActive
                  ? 'bg-emerald-500 text-black border-emerald-400 font-extrabold shadow-lg shadow-emerald-500/20'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              {isSpeechFollowerActive ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
              <span>{isSpeechFollowerActive ? 'STT FOLLOW: ON' : 'STT FOLLOW'}</span>
            </button>
          )}

          {/* Font Controls */}
          <div className="flex items-center bg-zinc-900 rounded-lg p-1 border border-zinc-800">
            <button
              onClick={() => setFontSize((f) => Math.max(24, f - 4))}
              className="p-1.5 text-zinc-400 hover:text-white rounded"
              title="Decrease Font Size"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono px-2 text-zinc-300">{fontSize}px</span>
            <button
              onClick={() => setFontSize((f) => Math.min(64, f + 4))}
              className="p-1.5 text-zinc-400 hover:text-white rounded"
              title="Increase Font Size"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center bg-zinc-900 rounded-lg p-1 border border-zinc-800 text-xs font-mono text-zinc-300">
            {[0.5, 1, 1.5, 2, 3].map((sp) => (
              <button
                key={sp}
                onClick={() => setScrollSpeed(sp)}
                className={`px-1.5 py-0.5 rounded ${
                  scrollSpeed === sp ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {sp}x
              </button>
            ))}
          </div>

          {/* Mirror toggle for physical teleprompter glass */}
          <button
            onClick={() => setIsMirrored(!isMirrored)}
            className={`p-2 rounded-lg border transition-colors ${
              isMirrored
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
            title="Mirror for Beamsplitter Glass"
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>

          {/* Reset button */}
          <button
            onClick={handleReset}
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
            title="Reset Scroll"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Auto-scroll Play/Pause */}
          <Button
            variant={isScrolling ? 'amber' : 'primary'}
            size="sm"
            onClick={() => {
              if (isSpeechFollowerActive) {
                setIsSpeechFollowerActive(false);
                toggleListening();
              }
              setIsScrolling(!isScrolling);
            }}
            icon={isScrolling ? Pause : Play}
          >
            {isScrolling ? 'Pause' : 'Auto Scroll'}
          </Button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Error Message Toast Banner if any */}
      {errorMessage && (
        <div className="p-2.5 bg-red-950/80 border-b border-red-800 text-red-300 text-xs font-medium flex items-center justify-between px-6 z-20">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Main Reading Canvas */}
      <div
        ref={scrollRef}
        className={`flex-1 overflow-y-auto px-8 sm:px-20 lg:px-32 py-20 flex justify-center ${
          isMirrored ? 'scale-x-[-1]' : ''
        }`}
      >
        <div className="max-w-4xl w-full">
          {isSpeechFollowerActive && parsedWords.length > 0 ? (
            <div
              className="teleprompter-text font-bold leading-relaxed tracking-wide whitespace-pre-wrap"
              style={{ fontSize: `${fontSize}px`, lineHeight: 1.65 }}
            >
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
                        ? 'bg-cyan-400 text-zinc-950 font-black scale-105 shadow-lg shadow-cyan-400/40 underline'
                        : isPast
                        ? 'text-zinc-600 opacity-50'
                        : 'text-zinc-100 font-bold opacity-100'
                    }`}
                  >
                    {item.text}
                  </span>
                );
              })}
            </div>
          ) : (
            <p
              className="teleprompter-text font-bold text-zinc-100 leading-relaxed tracking-wide whitespace-pre-wrap"
              style={{ fontSize: `${fontSize}px`, lineHeight: 1.65 }}
            >
              {scriptText}
            </p>
          )}

          <div className="h-48" />
        </div>
      </div>
    </div>
  );
};

export default LiveTeleprompter;
