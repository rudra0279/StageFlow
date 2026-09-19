import React from 'react';
import { useAgenda } from '../../hooks/useAgenda';
import { useAI } from '../../hooks/useAI';
import Teleprompter from '../../components/anchor/Teleprompter';
import AnchorPromptCard from '../../components/anchor/AnchorPromptCard';
import SpeechAssistant from '../../components/anchor/SpeechAssistant';
import CountdownTimer from '../../components/common/CountdownTimer';
import LiveIndicator from '../../components/common/LiveIndicator';
import { Tv, Sparkles, User, Layers, ArrowRight, AlertTriangle, Clock } from 'lucide-react';

export const AnchorDashboardPage = () => {
  const {
    tracks,
    activeTrackId,
    selectTrack,
    getActiveSessionForTrack,
    getNextSessionForTrack,
    trackDelays,
    remainingSeconds,
    isTimerRunning,
    toggleTimer,
  } = useAgenda();

  const { suggestions, fontSize, setFontSize, teleprompterSpeed, setTeleprompterSpeed } = useAI();

  const activeTrack = tracks.find((t) => t.id === activeTrackId) || tracks[0];
  const activeSession = getActiveSessionForTrack(activeTrackId);
  const nextSession = getNextSessionForTrack(activeTrackId);
  const trackDelay = trackDelays[activeTrackId] || activeTrack.delayMinutes || 0;

  return (
    <div className="space-y-6">
      {/* Anchor Header Bar with Track Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-cyan-500/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-100">ANCHOR STAGE DECK</h1>
            <p className="text-xs text-slate-400">Assigned Venue: {activeTrack.venue}</p>
          </div>
        </div>

        {/* Track Selection Tabs for Anchor */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
            ASSIGNED TRACK:
          </span>
          {tracks.map((t) => {
            const isSelected = t.id === activeTrackId;
            const tDelay = trackDelays[t.id] || 0;
            return (
              <button
                key={t.id}
                onClick={() => selectTrack(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <span>{t.shortName}</span>
                <span
                  className={`text-[9px] font-mono px-1 rounded ${
                    tDelay > 0 ? 'bg-amber-950 text-amber-300' : 'bg-emerald-950 text-emerald-300'
                  }`}
                >
                  {tDelay > 0 ? `+${tDelay}m` : 'OK'}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <LiveIndicator isLive={true} label={`ON STAGE — ${activeTrack.shortName}`} />
        </div>
      </div>

      {/* Track Status Telemetry Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-slate-200">{activeTrack.name}</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">Speaker: <strong className="text-cyan-300">{activeSession?.speakerName || 'None'}</strong></span>
        </div>

        <div className="flex items-center gap-3 font-mono">
          <span className={`px-2 py-0.5 rounded border font-bold ${
            trackDelay > 0 ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
          }`}>
            TRACK DELAY: {trackDelay > 0 ? `+${trackDelay} MINS` : 'ON SCHEDULE'}
          </span>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-16rem)] min-h-[600px]">
        {/* Left Column (2 cols wide): Teleprompter Monitor */}
        <div className="lg:col-span-2 h-full">
          <Teleprompter
            scriptText={
              activeSession?.teleprompterScript ||
              `Welcome to ${activeTrack.name}. Loaded active session: ${activeSession?.title || 'Keynote Presentation'}.`
            }
            speakerName={activeSession?.speakerName || 'Anchor'}
            aiPrompts={suggestions.filter((s) => !s.trackId || s.trackId === activeTrackId)}
            fontSize={fontSize}
            speed={teleprompterSpeed}
            onFontSizeChange={setFontSize}
            onSpeedChange={setTeleprompterSpeed}
          />
        </div>

        {/* Right Column: Timer, Next Session Card on Track, Talking Points */}
        <div className="flex flex-col justify-between gap-4 overflow-y-auto">
          {/* Large Stage Timer */}
          <CountdownTimer
            seconds={remainingSeconds}
            isRunning={isTimerRunning}
            onToggle={toggleTimer}
            size="xl"
            label={`${activeTrack.shortName.toUpperCase()} REMAINING`}
            showControls={false}
          />

          {/* Next Session Strictly On Current Track */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <ArrowRight className="w-3 h-3 text-cyan-400" />
              <span>NEXT ON {activeTrack.shortName.toUpperCase()}</span>
            </span>
            {nextSession ? (
              <div>
                <h4 className="text-xs font-bold text-slate-100">{nextSession.title}</h4>
                <p className="text-[11px] text-slate-400">
                  Speaker: <strong className="text-cyan-300">{nextSession.speakerName}</strong> ({nextSession.startTime})
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">End of schedule for {activeTrack.shortName}.</p>
            )}
          </div>

          <SpeechAssistant currentWPM={142} targetWPM={145} />

          <AnchorPromptCard
            title={`TALKING POINTS — ${activeTrack.shortName}`}
            introText={activeSession?.description || `Introduce ${activeSession?.speakerName || 'speaker'}.`}
            keyPoints={
              activeSession?.keyPoints || [
                `Introduce ${activeSession?.speakerName || 'keynote speaker'} on ${activeTrack.shortName}`,
                'Remind audience of live Q&A via QR code',
                'Keep session on schedule',
              ]
            }
          />
        </div>
      </div>
    </div>
  );
};

export default AnchorDashboardPage;
