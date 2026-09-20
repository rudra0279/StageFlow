import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Radio,
  Sparkles,
  Clock,
  LayoutDashboard,
  MonitorPlay,
  CheckCircle2,
  Users,
  ShieldCheck,
  MessageSquare,
  FileDown,
  HelpCircle,
  Zap,
  ArrowRight,
  ChevronRight,
  Mic,
  ThumbsUp,
  Play,
  RotateCcw,
  Wand2,
  Activity,
  Layers
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { useParallax } from '../hooks/useParallax';
import { AnimatedEventBackground } from '../components/background/AnimatedEventBackground';
import { exportRunOfShowPdf } from '../utils/exportUtils';

export const LandingPage = () => {
  const parallaxOffset = useParallax(12);

  // Active track index for simulation
  const [activeTrackIndex, setActiveTrackIndex] = useState(0);

  // Interactive AI typing response preview state
  const [aiSelectedPrompt, setAiSelectedPrompt] = useState('intro');
  const [aiTypingResponse, setAiTypingResponse] = useState('');
  const [aiIsTyping, setAiIsTyping] = useState(false);

  // Interactive Q&A Upvote simulation state
  const [qaQuestions, setQaQuestions] = useState([
    { id: 1, text: 'How do autonomous agents recalculate downstream schedule delays in real-time?', author: 'David K. (Staff Architect)', upvotes: 142, track: 'Track A', answered: false },
    { id: 2, text: 'Can the teleprompter mirror mode adjust automatically to speech pace?', author: 'Sarah M. (Anchor Lead)', upvotes: 98, track: 'Track B', answered: false },
    { id: 3, text: 'Is the Run-of-Show PDF export generated entirely client-side or on server?', author: 'Alex R. (Event Tech Manager)', upvotes: 76, track: 'Track C', answered: true }
  ]);
  const [upvotedSet, setUpvotedSet] = useState(new Set());

  // Interactive PDF Export Simulation State
  const [exportSimStep, setExportSimStep] = useState(0); // 0: Idle, 1: Preparing, 2: Generating, 3: Downloading, 4: Complete

  // Auto-cycle track status simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTrackIndex((prev) => (prev + 1) % 3);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // AI Prompt typing effect simulation
  useEffect(() => {
    const aiResponses = {
      intro: '“Ladies and gentlemen, welcome to Stage A! Please put your hands together for Dr. Elena Rostova as she unveils the future of real-time event orchestration!”',
      delay: '“Attention attendees: Track B will commence in 5 minutes to accommodate live audio calibration. Grab a coffee at the Innovation Hub!”',
      transition: '“That concludes our deep dive into Vector Databases! Next up in 10 minutes on Main Stage: High-Frequency Stage Orchestration with Rahul Sharma.”',
      qa: '“Synthesizing top 3 questions: 1. Real-time delay propagation algorithm. 2. Speech-following accuracy. 3. Multi-room teleprompter sync.”'
    };

    const fullText = aiResponses[aiSelectedPrompt] || aiResponses.intro;
    setAiIsTyping(true);
    setAiTypingResponse('');

    let charIdx = 0;
    const interval = setInterval(() => {
      if (charIdx < fullText.length) {
        setAiTypingResponse(fullText.slice(0, charIdx + 1));
        charIdx++;
      } else {
        setAiIsTyping(false);
        clearInterval(interval);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [aiSelectedPrompt]);

  const handleSimulateUpvote = (id) => {
    if (upvotedSet.has(id)) return;
    setUpvotedSet((prev) => new Set(prev).add(id));
    setQaQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, upvotes: q.upvotes + 1 } : q))
    );
  };

  const handleSimulatePdfExport = () => {
    if (exportSimStep > 0 && exportSimStep < 4) return;
    setExportSimStep(1);
    setTimeout(() => setExportSimStep(2), 1000);
    setTimeout(() => setExportSimStep(3), 2200);
    setTimeout(() => setExportSimStep(4), 3400);
    setTimeout(() => setExportSimStep(0), 7000);
  };

  const tracks = [
    {
      id: 'track-a',
      name: 'TRACK A',
      hall: 'Main Auditorium',
      status: activeTrackIndex === 0 ? 'LIVE' : 'COMPLETED',
      session: 'Opening Keynote: Autonomous AI Systems',
      speaker: 'Dr. Elena Rostova',
      time: '09:00 - 10:00',
      delay: '+0m',
      progress: 65,
    },
    {
      id: 'track-b',
      name: 'TRACK B',
      hall: 'Developer Workshop Hall',
      status: activeTrackIndex === 1 ? 'LIVE' : activeTrackIndex === 0 ? 'NEXT' : 'COMPLETED',
      session: 'Workshop: Real-Time RAG & Vector Sockets',
      speaker: 'Priya Patel (Tech Lead)',
      time: '10:15 - 11:30',
      delay: '+3m',
      progress: activeTrackIndex === 1 ? 40 : 0,
    },
    {
      id: 'track-c',
      name: 'TRACK C',
      hall: 'Executive Innovation Pavilion',
      status: activeTrackIndex === 2 ? 'LIVE' : 'UPCOMING',
      session: 'Panel: High-Frequency Stage Orchestration',
      speaker: 'Rahul Sharma & Panelists',
      time: '11:45 - 12:45',
      delay: '+0m',
      progress: activeTrackIndex === 2 ? 20 : 0,
    }
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between overflow-hidden relative">
      {/* ========================================================= */}
      {/* REUSABLE ANIMATED BACKGROUND SYSTEM (8 SUB-LAYERS)        */}
      {/* ========================================================= */}
      <AnimatedEventBackground parallaxOffset={parallaxOffset} />

      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40 z-0" xmlns="http://www.w3.org/2000/svg">
        <path d="M-100,150 Q400,50 900,300 T1900,100" fill="none" stroke="url(#lightTrailGrad1)" strokeWidth="1.5" strokeDasharray="8 6" className="animate-pulse" />
        <path d="M-100,450 Q600,600 1200,200 T2100,500" fill="none" stroke="url(#lightTrailGrad2)" strokeWidth="1" strokeDasharray="12 8" />
        <defs>
          <linearGradient id="lightTrailGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lightTrailGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.1" />
          </linearGradient>
        </defs>
      </svg>

      {/* Layer 3: Floating Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400/40 animate-particle-rise"
            style={{
              left: `${(i * 8.5) + 4}%`,
              top: `${(i * 7) + 20}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${5 + (i % 4)}s`
            }}
          />
        ))}
      </div>

      {/* Layer 5: Stage Light Beams */}
      <div
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-cyan-400/10 via-purple-500/5 to-transparent blur-2xl pointer-events-none animate-light-beam"
        style={{
          transform: `translateX(-50%) translate(${parallaxOffset.x * 0.5}px, ${parallaxOffset.y * 0.2}px)`
        }}
      />

      {/* ========================================================= */}
      {/* SECTION 1: ANIMATED HERO & FLOATING GLASS PANELS          */}
      {/* ========================================================= */}
      <section className="relative px-4 pt-16 pb-20 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full text-center flex flex-col justify-center items-center z-10">
        
        {/* StagePilot LIVE Pill Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[var(--bg-glass)] border border-[var(--border-highlight)] text-xs text-[var(--text-secondary)] mb-8 shadow-xl backdrop-blur-md animate-fade-in">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-live-dot" />
          <span className="font-mono font-bold tracking-widest text-[var(--text-primary)] uppercase">STAGEPILOT</span>
          <span className="text-[var(--text-muted)] font-mono">|</span>
          <span className="text-cyan-400 font-semibold">THE OPERATING SYSTEM FOR LIVE EVENTS</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-[var(--text-primary)] tracking-tight leading-[1.08] max-w-5xl">
          TURN EVENTS INTO{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
            EXPERIENCES
          </span>
        </h1>

        {/* Supporting Message */}
        <p className="mt-6 text-lg sm:text-2xl text-[var(--text-secondary)] max-w-3xl font-medium leading-relaxed">
          Plan. Coordinate. Present. Engage. All in One Place.
        </p>
        <p className="mt-2 text-xs sm:text-sm text-[var(--text-muted)] max-w-2xl font-mono">
          Zero-latency multi-track stage control, AI teleprompter co-pilot, instant Run-of-Show PDF export, and real-time audience Q&A.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 relative z-20">
          <Link to="/organizer">
            <Button
              variant="primary"
              size="lg"
              icon={LayoutDashboard}
              className="shadow-2xl shadow-cyan-500/30 px-7 py-4 text-base font-extrabold hover:scale-105 active:scale-95 transition-all"
            >
              Enter Live Command Center
            </Button>
          </Link>

          <Link to="/anchor">
            <Button
              variant="violet"
              size="lg"
              icon={MonitorPlay}
              className="shadow-2xl shadow-purple-500/25 px-6 py-4 text-base font-bold hover:scale-105 active:scale-95 transition-all"
            >
              Stage Anchor Station
            </Button>
          </Link>

          <Link to="/qa">
            <Button
              variant="secondary"
              size="lg"
              icon={MessageSquare}
              className="border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-cyan-400 px-6 py-4 text-base font-medium"
            >
              Audience Q&A
            </Button>
          </Link>
        </div>

        {/* Floating Interactive Glass Cards Around Hero (Cursor Parallax) */}
        <div className="w-full max-w-6xl mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left relative">
          
          {/* Floating Card A */}
          <div
            className="p-5 rounded-3xl glass-panel-interactive border-cyan-500/30 shadow-xl relative overflow-hidden transform transition-all duration-300"
            style={{
              transform: `translate(${parallaxOffset.x * 0.4}px, ${parallaxOffset.y * 0.4}px)`
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-live-dot" /> LIVE NOW
              </span>
              <span className="text-[11px] font-mono text-[var(--text-muted)]">09:45 AM</span>
            </div>
            <h4 className="text-xs font-bold text-[var(--text-primary)] truncate">Main Auditorium – Stage A</h4>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 font-medium truncate">Keynote: Autonomous AI Systems</p>
          </div>

          {/* Floating Card B */}
          <div
            className="p-5 rounded-3xl glass-panel-interactive border-purple-500/30 shadow-xl relative overflow-hidden transform transition-all duration-300"
            style={{
              transform: `translate(${parallaxOffset.x * -0.5}px, ${parallaxOffset.y * 0.5}px)`
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" /> AI CO-PILOT
              </span>
              <span className="text-[10px] font-mono text-cyan-400">ACTIVE</span>
            </div>
            <h4 className="text-xs font-bold text-[var(--text-primary)]">Backstage Script Assist</h4>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 italic">“Next session starts in 4 min”</p>
          </div>

          {/* Floating Card C */}
          <div
            className="p-5 rounded-3xl glass-panel-interactive border-blue-500/30 shadow-xl relative overflow-hidden transform transition-all duration-300"
            style={{
              transform: `translate(${parallaxOffset.x * 0.6}px, ${parallaxOffset.y * -0.4}px)`
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/30 flex items-center gap-1">
                <Users className="w-3 h-3 text-blue-400" /> AUDIENCE
              </span>
              <span className="text-[10px] font-mono text-emerald-400">● REAL-TIME</span>
            </div>
            <h4 className="text-xs font-bold text-[var(--text-primary)]">1,284 Participants Connected</h4>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 font-medium">32 questions submitted</p>
          </div>

          {/* Floating Card D */}
          <div
            className="p-5 rounded-3xl glass-panel-interactive border-amber-500/30 shadow-xl relative overflow-hidden transform transition-all duration-300"
            style={{
              transform: `translate(${parallaxOffset.x * -0.3}px, ${parallaxOffset.y * -0.5}px)`
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" /> TRACK B
              </span>
              <span className="text-[10px] font-mono text-amber-400">+3 MIN DELAY</span>
            </div>
            <h4 className="text-xs font-bold text-[var(--text-primary)]">Cascading Delay Engine</h4>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 font-medium">Auto-recalculated downstream</p>
          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 2: LIVE EVENT CONTROL COMMAND CENTER VISUAL       */}
      {/* ========================================================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full z-10">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30">
            WAR ROOM ARCHITECTURE
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-[var(--text-primary)] tracking-tight">
            Control the entire event from one place.
          </h2>
          <p className="text-sm sm:text-base text-[var(--text-secondary)]">
            Instant event health scoring, real-time schedule telemetry, and one-click stage alert broadcasts.
          </p>
        </div>

        {/* Command Center Canvas Visual */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border-[var(--border-subtle)] shadow-2xl space-y-6 relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-live-dot" />
              <h3 className="text-lg font-bold text-[var(--text-primary)] font-mono uppercase tracking-wider">
                LIVE STAGE TELEMETRY MATRIX
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              <Activity className="w-4 h-4 animate-pulse" />
              <span>Cascading Delay Active: +3m</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Event Health Score */}
            <div className="p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[var(--text-secondary)]">EVENT HEALTH SCORE</span>
                <span className="text-xs font-mono text-emerald-400 font-bold">94% OPTIMAL</span>
              </div>
              <div className="w-full bg-[var(--bg-glass)] h-3 rounded-full overflow-hidden border border-[var(--border-subtle)]">
                <div className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 h-full w-[94%] transition-all duration-500" />
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">3 Tracks Running • 0 Critical Alerts</p>
            </div>

            {/* Current Active Session */}
            <div className="p-5 rounded-2xl bg-[var(--bg-elevated)] border border-rose-500/30 glow-border-rose space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-rose-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-live-dot" />
                  CURRENT SESSION (TRACK A)
                </span>
                <span className="text-[10px] font-mono text-slate-400">10:00 AM</span>
              </div>
              <h4 className="text-sm font-bold text-[var(--text-primary)]">Autonomous AI & Agent Systems</h4>
              <p className="text-xs text-cyan-400 font-medium">Dr. Elena Rostova (Keynote Speaker)</p>
            </div>

            {/* Next Up Session */}
            <div className="p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[var(--text-secondary)]">NEXT UP ON STAGE</span>
                <span className="text-[10px] font-mono text-slate-400">10:15 AM</span>
              </div>
              <h4 className="text-sm font-bold text-[var(--text-primary)]">Real-Time Vector Sockets & RAG</h4>
              <p className="text-xs text-[var(--text-secondary)]">Priya Patel (Tech Lead)</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 3: MULTI-TRACK MANAGEMENT VISUALIZATION          */}
      {/* ========================================================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full z-10">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/30">
            MULTI-TRACK ISOLATION
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-[var(--text-primary)] tracking-tight">
            Orchestrate multiple stages simultaneously.
          </h2>
          <p className="text-sm sm:text-base text-[var(--text-secondary)]">
            Separate stages into independent execution tracks with real-time progress indicators and delay buffers.
          </p>
        </div>

        <div className="space-y-4">
          {tracks.map((t, idx) => {
            const isSelected = activeTrackIndex === idx;
            return (
              <div
                key={t.id}
                onClick={() => setActiveTrackIndex(idx)}
                className={`p-6 rounded-3xl border transition-all duration-300 cursor-pointer ${
                  isSelected
                    ? 'glass-panel border-cyan-400 shadow-2xl shadow-cyan-500/15 ring-1 ring-cyan-400/40 scale-[1.01]'
                    : 'bg-[var(--bg-glass)] border-[var(--border-subtle)] hover:border-[var(--border-highlight)] opacity-85'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-extrabold px-3 py-1 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                      {t.name}
                    </span>
                    <h3 className="text-base font-bold text-[var(--text-primary)]">{t.hall}</h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-mono font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                        t.status === 'LIVE'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-purple-500/20 text-purple-400 border-purple-500/40'
                      }`}
                    >
                      {t.status === 'LIVE' && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-live-dot" />}
                      {t.status}
                    </span>
                    <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                      {t.delay}
                    </span>
                  </div>
                </div>

                {/* Animated Track Line Progress */}
                <div className="relative w-full bg-[var(--bg-elevated)] h-2 rounded-full overflow-hidden border border-[var(--border-subtle)] my-3">
                  <div
                    className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 h-full transition-all duration-700"
                    style={{ width: `${t.progress}%` }}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between text-xs text-[var(--text-secondary)] pt-2">
                  <span className="font-bold text-[var(--text-primary)]">Current: {t.session}</span>
                  <span className="font-mono text-[var(--text-muted)]">{t.time} • Speaker: {t.speaker}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 4: AI CO-PILOT INTERACTIVE PREVIEW                */}
      {/* ========================================================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/30">
              AI BACKSTAGE CO-PILOT
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-[var(--text-primary)] tracking-tight">
              Intelligent Stage Scripts & Telemetry Assistance
            </h2>
            <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
              Generate 30-second speaker intros, audience filler lines, smooth transition segues, and emergency stage announcements with contextual AI.
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              {[
                { id: 'intro', label: 'Generate Introduction' },
                { id: 'delay', label: 'Handle 5-Min Delay' },
                { id: 'transition', label: 'Create Transition' },
                { id: 'qa', label: 'Summarize Q&A' }
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setAiSelectedPrompt(p.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    aiSelectedPrompt === p.id
                      ? 'bg-purple-500/20 text-purple-300 border-purple-400 shadow-md shadow-purple-500/15 font-bold'
                      : 'bg-[var(--bg-glass)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-purple-400/40'
                  }`}
                >
                  ⚡ {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* AI Interactive Typing Terminal Window */}
          <div className="glass-panel rounded-3xl p-6 border-purple-500/30 shadow-2xl space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-white">
                  <Wand2 className="w-4 h-4 animate-pulse" />
                </div>
                <span className="text-xs font-mono font-bold text-[var(--text-primary)]">STAGEPILOT AI ASSISTANT</span>
              </div>
              <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                PRODUCER ENGINE
              </span>
            </div>

            <div className="min-h-[160px] p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs sm:text-sm font-mono text-[var(--text-primary)] leading-relaxed relative">
              <p>{aiTypingResponse}</p>
              {aiIsTyping && <span className="inline-block w-2 h-4 bg-purple-400 ml-1 animate-pulse" />}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 5: ANCHOR STATION & TELEPROMPTER PREVIEW          */}
      {/* ========================================================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full z-10">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
            HIGH-CONTRAST STAGE HUD
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-[var(--text-primary)] tracking-tight">
            Stage Anchor Station & Speech Follower Prompter
          </h2>
          <p className="text-sm sm:text-base text-[var(--text-secondary)]">
            Distraction-free distance reading with automatic speech-following STT, mirror mode for beamsplitter glass, and speed controls.
          </p>
        </div>

        {/* Teleprompter Visual Canvas */}
        <div className="bg-black border border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-2xl text-white space-y-6 max-w-4xl mx-auto relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800 text-xs font-mono">
            <div className="flex items-center gap-2 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span className="font-extrabold uppercase tracking-wider">STAGE TELEPROMPTER – ON AIR</span>
            </div>
            <span className="text-zinc-500">FONT: 38PX • SPEED: 1.5X • STT: ACTIVE</span>
          </div>

          <div className="py-6 space-y-4 text-center">
            <p className="teleprompter-text font-bold text-2xl sm:text-4xl text-zinc-100 leading-relaxed tracking-wide">
              “Welcome everyone to the main stage. Today we are exploring the frontiers of autonomous live event orchestration...”
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-zinc-800 text-xs font-mono text-zinc-400">
            <span>Speaker: Dr. Elena Rostova</span>
            <span className="text-cyan-400">NEXT: Real-Time Vector Sockets</span>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 6: AUDIENCE Q&A INTERACTIVE CARDS                 */}
      {/* ========================================================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full z-10">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/30">
            REAL-TIME ENGAGEMENT
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-[var(--text-primary)] tracking-tight">
            Audience Q&A & Moderation Feed
          </h2>
          <p className="text-sm sm:text-base text-[var(--text-secondary)]">
            Live question submission, upvote aggregation, organizer approval moderation, and instant anchor feed synchronization.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {qaQuestions.map((q) => (
            <div
              key={q.id}
              className="p-6 rounded-3xl glass-panel-interactive border-[var(--border-subtle)] space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
                    {q.track}
                  </span>
                  {q.answered ? (
                    <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      ANSWERED
                    </span>
                  ) : (
                    <span className="text-cyan-300 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      APPROVED
                    </span>
                  )}
                </div>

                <p className="text-sm font-semibold text-[var(--text-primary)] leading-relaxed">
                  “{q.text}”
                </p>
              </div>

              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                <span className="text-[var(--text-secondary)] font-medium">{q.author}</span>
                <button
                  type="button"
                  onClick={() => handleSimulateUpvote(q.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold transition-all ${
                    upvotedSet.has(q.id)
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-md'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-cyan-400 hover:text-[var(--text-primary)]'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{q.upvotes}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 7: RUN-OF-SHOW PDF EXPORT ANIMATION               */}
      {/* ========================================================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full z-10">
        <div className="glass-panel rounded-3xl p-8 sm:p-12 border-[var(--border-subtle)] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl text-left">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30">
              DOCUMENT AUTOMATION
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] tracking-tight">
              Instant Run-of-Show PDF Export
            </h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Export complete print-ready PDF schedules with multi-track alignment, speaker lists, calculated delay metrics, and stage notes.
            </p>

            <Button
              variant="primary"
              size="lg"
              icon={FileDown}
              onClick={handleSimulatePdfExport}
              className="shadow-xl shadow-cyan-500/20 px-6 py-3"
            >
              Simulate Run-of-Show PDF Export
            </Button>
          </div>

          {/* Animated Export Progression Visual */}
          <div className="w-full max-w-xs p-6 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-3 text-left shadow-lg">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <span className="text-xs font-mono font-bold text-[var(--text-primary)]">RUN-OF-SHOW PDF</span>
              <FileDown className="w-4 h-4 text-cyan-400" />
            </div>

            {[
              { step: 1, label: 'Preparing Event Schedule' },
              { step: 2, label: 'Generating PDF' },
              { step: 3, label: 'Downloading' },
              { step: 4, label: 'Export Complete' }
            ].map((s) => {
              const isCurrent = exportSimStep === s.step;
              const isDone = exportSimStep > s.step;
              return (
                <div
                  key={s.step}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                    isDone
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : isCurrent
                      ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 animate-pulse'
                      : 'bg-[var(--bg-glass)] border-[var(--border-subtle)] text-[var(--text-muted)] opacity-50'
                  }`}
                >
                  <span>{s.label}</span>
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 8: FINAL ANIMATED CTA                             */}
      {/* ========================================================= */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full text-center z-10">
        <div className="glass-panel rounded-3xl p-10 sm:p-16 border-cyan-500/30 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <h2 className="text-3xl sm:text-5xl font-black text-[var(--text-primary)] tracking-tight leading-tight">
            Turn your next live event into a cinematic experience.
          </h2>
          <p className="text-sm sm:text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            Experience zero-latency multi-track stage orchestration, AI teleprompter assistance, and live audience Q&A.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link to="/organizer">
              <Button
                variant="primary"
                size="lg"
                icon={ArrowRight}
                className="shadow-2xl shadow-cyan-500/30 px-8 py-4 text-base font-extrabold hover:scale-105 active:scale-95 transition-all"
              >
                Enter Live Command Center
              </Button>
            </Link>

            <Link to="/register">
              <Button
                variant="secondary"
                size="lg"
                icon={CheckCircle2}
                className="border-cyan-500/40 text-cyan-400 hover:border-cyan-400 px-6 py-4 text-base font-medium"
              >
                Register Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;
