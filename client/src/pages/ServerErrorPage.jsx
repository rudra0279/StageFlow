import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export const ServerErrorPage = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full glass-panel rounded-3xl p-8 shadow-2xl relative z-10 border border-[var(--border-subtle)] text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-500/20">
          <AlertTriangle className="w-8 h-8 text-white" />
        </div>

        <h1 className="text-4xl font-black text-rose-400 font-mono tracking-tight">500</h1>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mt-2">Server Subsystem Interruption</h2>
        <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed">
          An unexpected issue occurred while processing this live stage transaction. The incident has been recorded safely in the event audit logs.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="primary"
            onClick={() => window.location.reload()}
            icon={RefreshCw}
            className="w-full sm:w-auto"
          >
            Reload View
          </Button>
          <Link to="/" className="w-full sm:w-auto">
            <Button variant="secondary" icon={Home} className="w-full">
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ServerErrorPage;
