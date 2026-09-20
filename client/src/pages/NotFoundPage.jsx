import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Compass, Home } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full glass-panel rounded-3xl p-8 shadow-2xl relative z-10 border border-[var(--border-subtle)] text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/20">
          <Compass className="w-8 h-8 text-white" />
        </div>

        <h1 className="text-4xl font-black text-cyan-400 font-mono tracking-tight">404</h1>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mt-2">Stage Route Not Found</h2>
        <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed">
          The requested live event, track view, or navigation route could not be found in the current session schedule.
        </p>

        <div className="mt-8 flex justify-center">
          <Link to="/">
            <Button variant="primary" icon={Home}>
              Return to StagePilot Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
