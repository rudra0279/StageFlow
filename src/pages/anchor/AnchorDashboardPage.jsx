import React from 'react';
import { useAgenda } from '../../hooks/useAgenda';
import { useAI } from '../../hooks/useAI';
import Teleprompter from '../../components/anchor/Teleprompter';
import AnchorPromptCard from '../../components/anchor/AnchorPromptCard';
import SpeechAssistant from '../../components/anchor/SpeechAssistant';
import CountdownTimer from '../../components/common/CountdownTimer';
import LiveIndicator from '../../components/common/LiveIndicator';
import { Tv, Sparkles, User, Mic } from 'lucide-react';

export const AnchorDashboardPage = () => {
  const { activeItem, remainingSeconds, isTimerRunning, toggleTimer } = useAgenda();
  const { suggestions, fontSize, setFontSize, teleprompterSpeed, setTeleprompterSpeed } = useAI();

  return (
    <div className="space-y-6">
      {/* Anchor Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-cyan-500/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-100">ANCHOR STAGE DECK</h1>
            <p className="text-xs text-slate-400">On-Stage Live Viewport & Script Assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <LiveIndicator isLive={true} label="ON STAGE LIVE" />
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-14rem)] min-h-[600px]">
        {/* Left Column (2 cols wide): Teleprompter Monitor */}
        <div className="lg:col-span-2 h-full">
          <Teleprompter
            scriptText={
              activeItem?.teleprompterScript ||
              'Ladies and gentlemen, welcome to the Global AI Summit 2026. Our next session explores next-generation real-time intelligent co-pilot architectures...'
            }
            speakerName={activeItem?.speakerName || 'Marcus Vance'}
            aiPrompts={suggestions}
            fontSize={fontSize}
            speed={teleprompterSpeed}
            onFontSizeChange={setFontSize}
            onSpeedChange={setTeleprompterSpeed}
          />
        </div>

        {/* Right Column: Giant Timer, Cue Cards & Speech Cadence */}
        <div className="flex flex-col justify-between gap-4 overflow-y-auto">
          {/* Large Stage Timer */}
          <CountdownTimer
            seconds={remainingSeconds}
            isRunning={isTimerRunning}
            onToggle={toggleTimer}
            size="xl"
            label="STAGE TIME REMAINING"
            showControls={false}
          />

          <SpeechAssistant currentWPM={142} targetWPM={145} />

          <AnchorPromptCard
            title="KEY TALKING POINTS"
            introText={activeItem?.description || 'Introduce Dr. Sophia Chen and highlight scaling paradigms.'}
            keyPoints={[
              'Introduce Dr. Sophia Chen, Chief AI Scientist at NeuralScale',
              'Remind audience of live Q&A via QR code on main screens',
              'Signal 2-minute wrap-up icon when timer hits 02:00',
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default AnchorDashboardPage;
