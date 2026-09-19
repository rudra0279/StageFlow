import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvent } from '../../hooks/useEvent';
import { useAgenda } from '../../hooks/useAgenda';
import { useAI } from '../../hooks/useAI';
import { ROUTES } from '../../constants/routes';
import CountdownTimer from '../../components/common/CountdownTimer';
import LiveIndicator from '../../components/common/LiveIndicator';
import StatusBadge from '../../components/common/StatusBadge';
import SentimentIndicator from '../../components/ai/SentimentIndicator';
import { Calendar, Users, Radio, ArrowRight, Activity, Sparkles, CheckCircle2 } from 'lucide-react';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { activeEvent, timeDrift } = useEvent();
  const { activeItem, remainingSeconds, isTimerRunning, toggleTimer } = useAgenda();
  const { suggestions, sentimentScore } = useAI();

  return (
    <div className="space-y-6">
      {/* Top Banner Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-extrabold text-slate-100">
              {activeEvent ? activeEvent.title : 'Global Live Event'}
            </h1>
            <LiveIndicator isLive={activeEvent?.status === 'LIVE'} />
          </div>
          <p className="text-xs text-slate-400">
            {activeEvent?.location || 'Main Stage Auditorium'} • {activeEvent?.date}
          </p>
        </div>

        <button
          onClick={() => navigate(ROUTES.ORGANIZER.LIVE)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs transition-all shadow-lg shadow-red-600/30 glow-live-box"
        >
          <Radio className="w-4 h-4 animate-pulse" />
          <span>ENTER LIVE CONTROL ROOM</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols wide): Live Stage Status & Countdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Countdown Card */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                CURRENT STAGE SEGMENT
              </span>
              <StatusBadge status={activeItem?.status || 'LIVE'} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div>
                <h3 className="text-lg font-extrabold text-slate-100 mb-1">
                  {activeItem ? activeItem.title : 'Keynote Presentation'}
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Speaker: <strong className="text-cyan-300">{activeItem?.speakerName || 'Dr. Sophia Chen'}</strong>
                </p>

                <div className="space-y-2 text-xs text-slate-400 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                  <div className="flex justify-between">
                    <span>Allocated Duration:</span>
                    <span className="font-mono text-slate-200 font-bold">{activeItem?.allocatedMinutes} Mins</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Schedule Offset:</span>
                    <span className="font-mono text-amber-400 font-bold">+{timeDrift} Mins</span>
                  </div>
                </div>
              </div>

              <div>
                <CountdownTimer
                  seconds={remainingSeconds}
                  isRunning={isTimerRunning}
                  onToggle={toggleTimer}
                  showControls={true}
                  size="lg"
                />
              </div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel p-4 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                ATTENDEE COUNT
              </span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-mono font-extrabold text-slate-100">1,420</span>
                <Users className="w-5 h-5 text-cyan-400" />
              </div>
            </div>

            <div className="glass-panel p-4 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                SCHEDULE HEALTH
              </span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-mono font-extrabold text-amber-400">+{timeDrift}m</span>
                <Activity className="w-5 h-5 text-amber-400" />
              </div>
            </div>

            <div className="glass-panel p-4 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                SLIDES READY
              </span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-mono font-extrabold text-emerald-400">100%</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Suggestions Telemetry */}
        <div className="space-y-6">
          <SentimentIndicator score={sentimentScore} />

          <div className="glass-panel p-5 rounded-3xl border border-cyan-500/20 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                  Live AI Telemetry Feed
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-mono font-bold">
                {suggestions.length} Alerts
              </span>
            </div>

            <div className="space-y-3">
              {suggestions.map((sug) => (
                <div
                  key={sug.id}
                  className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase font-mono">
                      {sug.timestamp}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">{sug.type}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">{sug.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{sug.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
