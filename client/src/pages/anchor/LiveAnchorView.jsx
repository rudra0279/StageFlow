import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLiveEvent } from '../../hooks/useLiveEvent';
import { eventApi } from '../../api/eventApi';
import { StageTimer } from '../../components/anchor/StageTimer';
import { UrgentAlertBanner } from '../../components/anchor/UrgentAlertBanner';
import { CurrentSessionCard } from '../../components/anchor/CurrentSessionCard';
import { NextUpCard } from '../../components/anchor/NextUpCard';
import { ScriptViewer } from '../../components/anchor/ScriptViewer';
import { LiveTeleprompter } from '../../components/anchor/LiveTeleprompter';
import { AnchorCopilotDrawer } from '../../components/ai/AnchorCopilotDrawer';
import { ScriptGeneratorModal } from '../../components/ai/ScriptGeneratorModal';
import { Loader } from '../../components/common/Loader';
import { Button } from '../../components/common/Button';
import { Bot, Maximize2, Radio, Sparkles } from 'lucide-react';

import { AnchorQAFeed } from '../../components/anchor/AnchorQAFeed';

export const LiveAnchorView = () => {
  const { id } = useParams();
  const {
    event,
    activeSession,
    nextSession,
    activeAlert,
    delayNotice,
    loadEvent,
    dismissAlert,
    dismissDelayNotice,
    loading
  } = useLiveEvent();

  const [isTeleprompterOpen, setIsTeleprompterOpen] = useState(false);
  const [teleprompterText, setTeleprompterText] = useState('');
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [selectedScriptType, setSelectedScriptType] = useState('introduction');
  const [copilotExternalMsg, setCopilotExternalMsg] = useState(null);

  useEffect(() => {
    if (id) {
      loadEvent(id);
    } else {
      eventApi.getEvents().then((res) => {
        if (res.data && res.data.length > 0) {
          loadEvent(res.data[0]._id);
        }
      });
    }
  }, [id, loadEvent]);

  const handleOpenTeleprompter = (script, session) => {
    setTeleprompterText(script);
    setIsTeleprompterOpen(true);
  };

  const handleOpenGenerateModal = (session, scriptType = 'introduction') => {
    setSelectedScriptType(scriptType);
    setIsAIModalOpen(true);
  };

  const handleAiAssistResult = (assistResult) => {
    setCopilotExternalMsg(assistResult);
    setIsCopilotOpen(true);
  };

  if (loading && !event) {
    return <Loader text="Connecting to Live Stage Audio & Telemetry..." />;
  }

  return (
    <div className="min-h-screen bg-stage-950 text-slate-100 pb-20">
      {/* Top Stage Bar */}
      <div className="bg-stage-900/90 border-b border-stage-800 px-4 sm:px-8 py-3 flex items-center justify-between sticky top-16 z-30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                {event?.title || 'Live Stage Stream'}
              </h1>
              <span className="text-[10px] uppercase font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded">
                ANCHOR HUD
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Venue: {event?.venue || 'Main Stage'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsCopilotOpen(true)}
            icon={Bot}
          >
            AI Co-Pilot
          </Button>

          {activeSession?.aiScripts?.introduction && (
            <Button
              variant="violet"
              size="sm"
              onClick={() =>
                handleOpenTeleprompter(
                  activeSession.aiScripts.introduction,
                  activeSession
                )
              }
              icon={Maximize2}
            >
              Full Prompter
            </Button>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Urgent Alert Banner (Pulsing Red Broadcasts & Delay Notices) */}
        <UrgentAlertBanner
          alert={activeAlert}
          delayNotice={delayNotice}
          onDismissAlert={dismissAlert}
          onDismissDelay={dismissDelayNotice}
        />

        {/* Top Grid: Countdown Timer & Next Up Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <StageTimer session={activeSession} />
          </div>
          <div className="md:col-span-1 flex flex-col justify-between">
            <NextUpCard nextSession={nextSession} />
          </div>
        </div>

        {/* Middle Grid: Active Speaker Profile & Tabbed AI Scripts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Session & Speaker Card */}
          <CurrentSessionCard session={activeSession} />

          {/* AI Teleprompter Script Card */}
          <ScriptViewer
            session={activeSession}
            onOpenTeleprompter={handleOpenTeleprompter}
            onOpenGenerateModal={handleOpenGenerateModal}
          />
        </div>

        {/* Live Approved Q&A Feed for Anchor */}
        <AnchorQAFeed
          eventId={event?._id}
          track={activeSession?.track || activeSession?.room || 'Track A'}
          onAiAssistResult={handleAiAssistResult}
        />
      </div>

      {/* Fullscreen Teleprompter Modal */}
      <LiveTeleprompter
        isOpen={isTeleprompterOpen}
        onClose={() => setIsTeleprompterOpen(false)}
        scriptText={teleprompterText}
        speakerName={activeSession?.speakerId?.name}
        sessionTitle={activeSession?.title}
      />

      {/* AI Co-Pilot Slide-over Drawer */}
      <AnchorCopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        eventId={event?._id}
        session={activeSession}
        externalMessage={copilotExternalMsg}
      />

      {/* AI Script Generator Modal */}
      <ScriptGeneratorModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        eventId={event?._id}
        session={activeSession}
        defaultScriptType={selectedScriptType}
        onSuccess={() => loadEvent(event?._id)}
      />

      {/* Floating Co-Pilot Action Button */}
      {!isCopilotOpen && (
        <button
          onClick={() => setIsCopilotOpen(true)}
          className="fixed bottom-6 right-6 z-40 p-4 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-2xl shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 font-bold text-xs"
        >
          <Bot className="w-5 h-5 animate-pulse" />
          <span className="hidden sm:inline">Ask AI Co-Pilot</span>
        </button>
      )}
    </div>
  );
};
