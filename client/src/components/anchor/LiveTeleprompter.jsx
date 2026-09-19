import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, ZoomIn, ZoomOut, FlipHorizontal, ArrowDown } from 'lucide-react';
import { Button } from '../common/Button';

export const LiveTeleprompter = ({
  isOpen,
  onClose,
  scriptText = '',
  speakerName = '',
  sessionTitle = ''
}) => {
  const [fontSize, setFontSize] = useState(38); // px
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(2);
  const [isMirrored, setIsMirrored] = useState(false);
  const scrollRef = useRef(null);

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
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
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

          {/* Auto-scroll Play/Pause */}
          <Button
            variant={isScrolling ? 'amber' : 'primary'}
            size="sm"
            onClick={() => setIsScrolling(!isScrolling)}
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

      {/* Main Reading Canvas */}
      <div
        ref={scrollRef}
        className={`flex-1 overflow-y-auto px-8 sm:px-20 lg:px-32 py-20 flex justify-center ${
          isMirrored ? 'scale-x-[-1]' : ''
        }`}
      >
        <div className="max-w-4xl w-full">
          <p
            className="teleprompter-text font-bold text-zinc-100 leading-relaxed tracking-wide"
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.65 }}
          >
            {scriptText}
          </p>
        </div>
      </div>
    </div>
  );
};
