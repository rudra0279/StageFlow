import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Radio,
  Sparkles,
  Clock,
  LayoutDashboard,
  MonitorPlay,
  ArrowRight,
  CheckCircle2,
  Users,
  ShieldCheck,
  MessageSquare,
  FileDown,
  Layers,
  Zap,
  HelpCircle,
  Eye,
  Sliders,
  Play
} from 'lucide-react';
import { Button } from '../components/common/Button';

export const LandingPage = () => {
  // Interactive Active Track Simulator State
  const [activeTrackIndex, setActiveTrackIndex] = useState(0);
  const [qaStep, setQaStep] = useState(1);

  // Auto-cycle track status every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTrackIndex((prev) => (prev + 1) % 3);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Auto-cycle QA pipeline animation step every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setQaStep((prev) => (prev >= 4 ? 1 : prev + 1));
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  const tracks = [
    {
      id: 'track-a',
      name: 'TRACK A',
      hall: 'Main Auditorium',
      status: activeTrackIndex === 0 ? 'LIVE' : 'COMPLETED',
      statusColor: activeTrackIndex === 0 ? 'emerald' : 'slate',
      session: 'Opening Keynote: Autonomous AI Systems',
      speaker: 'Dr. Elena Rostova',
      time: '09:00 - 10:00',
      teleprompterActive: true,
      audioLevel: 'Normal (98dB)'
    },
    {
      id: 'track-b',
      name: 'TRACK B',
      hall: 'Developer Workshop Hall',
      status: activeTrackIndex === 1 ? 'LIVE' : activeTrackIndex === 0 ? 'NEXT' : 'COMPLETED',
      statusColor: activeTrackIndex === 1 ? 'emerald' : activeTrackIndex === 0 ? 'amber' : 'slate',
      session: 'Workshop: Real-Time RAG & Vector Sockets',
      speaker: 'Priya Patel (Tech Lead)',
      time: '10:15 - 11:30',
      teleprompterActive: activeTrackIndex === 1,
      audioLevel: 'Mic Check Ready'
    },
    {
      id: 'track-c',
      name: 'TRACK C',
      hall: 'Executive Innovation Pavilion',
      status: activeTrackIndex === 2 ? 'LIVE' : 'UPCOMING',
      statusColor: activeTrackIndex === 2 ? 'emerald' : 'purple',
      session: 'Panel: High-Frequency Stage Orchestration',
      speaker: 'Rahul Sharma & Panelists',
      time: '11:45 - 12:45',
      teleprompterActive: activeTrackIndex === 2,
      audioLevel: 'Awaiting Standby'
    }
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between overflow-hidden">
      {/* Cinematic Hero Section */}
      <section className="relative px-4 pt-12 pb-16 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full text-center flex flex-col justify-center items-center">
        {/* Stage Lighting & moving gradient spotlights */}
        <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-cyan-500/15 via-blue-600/10 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse-slow" />
        <div className="absolute top-10 right-1/4 translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-bl from-purple-500/15 via-indigo-600/10 to-transparent rounded-full blur-3xl pointer-events-none animate-float-slow" />

        {/* Subtle moving grid background */}
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0f_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0f_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none"
          style={{ opacity: 0.6 }}
        />

        {/* Live pill badge */}
        <div className="relative z-10 inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-stage-900/90 border border-cyan-500/30 text-xs text-slate-300 mb-8 shadow-xl shadow-cyan-500/10 backdrop-blur-md">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-live-dot" />
          <span className="font-mono font-bold tracking-widest text-white uppercase">STAGEPILOT</span>
          <span className="text-slate-600 font-mono">|</span>
          <span className="text-cyan-300 font-semibold">LIVE EVENT OPERATIONS PLATFORM</span>
        </div>

        {/* Main Product Heading */}
        <h1 className="relative z-10 text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.08] max-w-5xl">
          THE CONTROL CENTER BEHIND A{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
            LIVE EVENT
          </span>
        </h1>

        {/* Subhead */}
        <p className="relative z-10 mt-6 text-base sm:text-xl text-slate-300 max-w-3xl font-normal leading-relaxed">
          Manage every moment. Every stage. Every speaker. Every audience interaction. Zero-latency synchronization across multi-track stages and broadcast teleprompters.
        </p>

        {/* Primary Call-to-Action Buttons */}
        <div className="relative z-10 mt-9 flex flex-wrap items-center justify-center gap-4">
          <Link to="/organizer">
            <Button
              variant="primary"
              size="lg"
              icon={LayoutDashboard}
              className="shadow-xl shadow-cyan-500/25 px-6"
            >
              Enter Event War-Room
            </Button>
          </Link>

          <Link to="/register">
            <Button
              variant="secondary"
              size="lg"
              icon={CheckCircle2}
              className="border-cyan-500/40 text-cyan-300 hover:border-cyan-300 hover:text-white px-6"
            >
              Register with Invite Code
            </Button>
          </Link>

          <Link to="/anchor">
            <Button
              variant="violet"
              size="lg"
              icon={MonitorPlay}
              className="shadow-xl shadow-purple-500/20 px-5"
            >
              Stage Anchor View
            </Button>
          </Link>

          <Link to="/qa">
            <Button
              variant="secondary"
              size="lg"
              icon={MessageSquare}
              className="border-stage-700 text-slate-300 hover:text-white px-5"
            >
              Audience Q&A
            </Button>
          </Link>
        </div>

        {/* ========================================================= */}
        {/* ANIMATED EVENT VISUALIZATION 1: DYNAMIC TRACK STATUS      */}
        {/* ========================================================= */}
        <div className="relative z-10 mt-16 w-full max-w-5xl text-left space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 px-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-mono font-bold tracking-widest text-slate-300 uppercase">
                MULTI-TRACK STAGE MATRIX (REAL-TIME ISOLATION)
              </span>
            </div>
            <span className="text-xs font-mono text-cyan-400">
              Auto-cycling Stage Simulation • Click any track to inspect
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tracks.map((t, idx) => {
              const isSelected = activeTrackIndex === idx;
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setActiveTrackIndex(idx)}
                  className={`text-left p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                    isSelected
                      ? 'bg-stage-900/90 border-cyan-400/80 shadow-xl shadow-cyan-500/15 ring-1 ring-cyan-400/50'
                      : 'bg-stage-900/60 border-stage-800 hover:border-stage-700 opacity-80'
                  }`}
                >
                  {/* Top Track Indicator & Status Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-extrabold text-white tracking-wider">
                      {t.name}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                        t.status === 'LIVE'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : t.status === 'NEXT'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      }`}
                    >
                      {t.status === 'LIVE' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-live-dot" />
                      )}
                      {t.status}
                    </span>
                  </div>

                  <p className="text-[11px] font-mono text-slate-400 mb-1">{t.hall}</p>
                  <h4 className="text-sm font-bold text-white mb-2 leading-snug line-clamp-2">
                    {t.session}
                  </h4>
                  <p className="text-xs text-cyan-300 font-medium mb-3">{t.speaker}</p>

                  <div className="pt-3 border-t border-stage-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {t.time}
                    </span>
                    <span className={isSelected ? 'text-cyan-400 font-bold' : 'text-slate-500'}>
                      {t.teleprompterActive ? '● Prompter Active' : 'Prompter Standby'}
                    </span>
                  </div>

                  {/* Active Playhead progress bar */}
                  {isSelected && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================= */}
        {/* ANIMATED EVENT VISUALIZATION 2: AUDIENCE Q&A -> AI -> ANCHOR */}
        {/* ========================================================= */}
        <div className="relative z-10 mt-14 w-full max-w-5xl text-left space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 px-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
              <span className="text-xs font-mono font-bold tracking-widest text-slate-300 uppercase">
                INTELLIGENT AUDIENCE Q&A PIPELINE (ZERO DELAY)
              </span>
            </div>
            <span className="text-xs font-mono text-purple-400">
              Visual Product Lifecycle Flow
            </span>
          </div>

          <div className="p-6 rounded-3xl bg-stage-900/90 border border-stage-800 shadow-2xl grid grid-cols-1 md:grid-cols-4 gap-4 relative overflow-hidden">
            {/* Flow Connecting Line */}
            <div className="hidden md:block absolute top-1/2 left-12 right-12 h-0.5 bg-gradient-to-r from-cyan-500/20 via-purple-500/30 to-indigo-500/20 -translate-y-1/2 pointer-events-none" />

            {/* Step 1: Audience Mobile Submission */}
            <div
              className={`p-4 rounded-2xl border transition-all duration-300 relative z-10 ${
                qaStep === 1
                  ? 'bg-cyan-500/15 border-cyan-400 shadow-lg shadow-cyan-500/15'
                  : 'bg-stage-950 border-stage-800 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-stage-900 text-cyan-300 border border-stage-700">
                  STEP 1
                </span>
                <HelpCircle className="w-4 h-4 text-cyan-400" />
              </div>
              <h5 className="text-xs font-bold text-white mb-1">Audience Question</h5>
              <p className="text-[11px] text-slate-300 italic mb-2">
                "What time does the keynote begin, and will slides be shared?"
              </p>
              <span className="text-[10px] font-mono text-cyan-400">● Mobile Web Q&A</span>
            </div>

            {/* Step 2: AI Co-Pilot Processing */}
            <div
              className={`p-4 rounded-2xl border transition-all duration-300 relative z-10 ${
                qaStep === 2
                  ? 'bg-purple-500/15 border-purple-400 shadow-lg shadow-purple-500/15'
                  : 'bg-stage-950 border-stage-800 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-stage-900 text-purple-300 border border-stage-700">
                  STEP 2
                </span>
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
              <h5 className="text-xs font-bold text-white mb-1">AI Co-Pilot Filter</h5>
              <div className="space-y-1 text-[11px] text-slate-300">
                <p>• Quality Score: <span className="text-emerald-400 font-mono font-bold">96%</span></p>
                <p>• Duplicates: <span className="text-cyan-300 font-mono font-bold">None</span></p>
                <p>• Toxicity: <span className="text-emerald-400 font-mono font-bold">0.0% Clean</span></p>
              </div>
            </div>

            {/* Step 3: Organizer War-Room Approval */}
            <div
              className={`p-4 rounded-2xl border transition-all duration-300 relative z-10 ${
                qaStep === 3
                  ? 'bg-emerald-500/15 border-emerald-400 shadow-lg shadow-emerald-500/15'
                  : 'bg-stage-950 border-stage-800 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-stage-900 text-emerald-300 border border-stage-700">
                  STEP 3
                </span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <h5 className="text-xs font-bold text-white mb-1">Organizer Approves</h5>
              <p className="text-[11px] text-slate-300 mb-2">
                Organizer clicks 1-click Approve in War-Room moderation queue.
              </p>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                ✓ Pushed to Stage
              </span>
            </div>

            {/* Step 4: Stage Anchor Station Teleprompter */}
            <div
              className={`p-4 rounded-2xl border transition-all duration-300 relative z-10 ${
                qaStep === 4
                  ? 'bg-blue-500/15 border-blue-400 shadow-lg shadow-blue-500/15'
                  : 'bg-stage-950 border-stage-800 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-stage-900 text-blue-300 border border-stage-700">
                  STEP 4
                </span>
                <MonitorPlay className="w-4 h-4 text-blue-400" />
              </div>
              <h5 className="text-xs font-bold text-white mb-1">Anchor Teleprompter</h5>
              <p className="text-[11px] text-slate-300 mb-2">
                Question instantly projected on MC stage glass with 1-click answer mark.
              </p>
              <span className="text-[10px] font-mono text-cyan-300 font-bold">
                ● Live on Stage Glass
              </span>
            </div>
          </div>
        </div>

        {/* Feature Grid: 4 Core Pillars */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-5 text-left max-w-5xl w-full">
          <div className="p-5 rounded-2xl bg-stage-900/70 border border-stage-800 hover:border-cyan-500/40 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Cascading Delay Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              One-click +5, +10, +15m schedule drift recalculation across all downstream stage sessions.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-stage-900/70 border border-stage-800 hover:border-purple-500/40 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Committee & Tasks</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Role-based task management, automatic work area suggestions, and real-time organizer coordination chat.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-stage-900/70 border border-stage-800 hover:border-emerald-500/40 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
              <Radio className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">High-Contrast Prompter</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Designed for blinding stage lights with speech follower, auto-scroll, mirror mode, and flash alerts.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-stage-900/70 border border-stage-800 hover:border-blue-500/40 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
              <FileDown className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Stage 5 PDF Exporter</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Instant print-ready Run-of-Show PDF exporter with track isolation and real-time delay markers.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
