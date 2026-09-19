import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, ZoomIn, ZoomOut, RotateCcw, Eye, Sparkles } from 'lucide-react';

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
  const containerRef = useRef(null);

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
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Teleprompter Header Bar */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              AI TELEPROMPTER VIEWPORT
            </h3>
            <p className="text-[10px] text-slate-400">Active Speaker: {speakerName}</p>
          </div>
        </div>

        {/* Teleprompter Display Controls */}
        <div className="flex items-center gap-2">
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

          <button
            onClick={() => setIsScrolling(!isScrolling)}
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
        <div className="p-3 bg-cyan-950/80 border-b border-cyan-500/40 text-cyan-200 text-xs font-medium flex items-center justify-between animate-pulse px-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <span><strong>LIVE AI CUE:</strong> {aiPrompts[0].content || aiPrompts[0]}</span>
          </div>
          <span className="text-[10px] bg-cyan-900 border border-cyan-700 px-2 py-0.5 rounded font-mono">NEW</span>
        </div>
      )}

      {/* Teleprompter Scroll Content Box */}
      <div
        ref={containerRef}
        className="flex-1 p-8 md:p-12 overflow-y-auto teleprompter-text text-slate-100 font-medium tracking-wide selection:bg-cyan-500 selection:text-slate-950 space-y-6"
        style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
      >
        <p className="leading-relaxed whitespace-pre-wrap">
          {scriptText || 'No active script loaded. Load agenda item or request AI script generation.'}
        </p>

        {/* Scroll Padding End */}
        <div className="h-40"></div>
      </div>
    </div>
  );
};

export default Teleprompter;
