import React from 'react';
import { Link } from 'react-router-dom';
import { Radio, Sparkles, Clock, ShieldAlert, Zap, LayoutDashboard, MonitorPlay, ArrowRight } from 'lucide-react';
import { Button } from '../components/common/Button';

export const LandingPage = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between">
      {/* Hero Section */}
      <section className="relative px-4 pt-16 pb-20 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center flex-1 flex flex-col justify-center items-center">
        {/* Glow orb background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-tr from-cyan-500/10 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Live pill badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stage-900 border border-stage-700 text-xs text-slate-300 mb-8 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-semibold text-cyan-300">Next-Gen Live Stage Orchestration</span>
          <span className="text-slate-600">|</span>
          <span>Zero-Refresh Real-Time Sync</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-tight max-w-4xl">
          The Real-Time <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent">AI Co-Pilot</span> for Live Events
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl font-normal leading-relaxed">
          Empower event organizers and stage anchors with synchronized schedules, intelligent cascading delays, and instant contextual teleprompter scripts.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link to="/organizer">
            <Button
              variant="primary"
              size="lg"
              icon={LayoutDashboard}
            >
              Organizer Dashboard
            </Button>
          </Link>

          <Link to="/anchor">
            <Button
              variant="violet"
              size="lg"
              icon={MonitorPlay}
            >
              Anchor Teleprompter View
            </Button>
          </Link>
        </div>

        {/* Demo credentials hint */}
        <div className="mt-6 p-3 rounded-lg bg-stage-900/60 border border-stage-800 text-xs text-slate-400 font-mono">
          <span>Demo Accounts: </span>
          <span className="text-cyan-300">organizer@stagepilot.io</span> or <span className="text-purple-300">anchor@stagepilot.io</span>
          <span className="text-slate-500"> (pw: password123)</span>
        </div>

        {/* Feature Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-5xl w-full">
          <div className="p-6 rounded-2xl bg-stage-900/80 border border-stage-800 hover:border-cyan-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Cascading Delay Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Add +5, +10, or +15 minutes with one click. The entire event timeline automatically recalculates and broadcasts instantly to stage anchors.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-stage-900/80 border border-stage-800 hover:border-purple-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Contextual AI Scripts</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Instant teleprompter generation for speaker intros, bridges, delay announcements, and closing speeches grounded in live event context.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-stage-900/80 border border-stage-800 hover:border-rose-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
              <Radio className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">High-Contrast Teleprompter</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Designed for bright stage lighting with auto-scroll, mirror glass beam-splitter mode, audio chimes, and instant flash broadcasts.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
