import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { ShieldAlert, LogIn, Home, RefreshCw } from 'lucide-react';

export const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.from || '/';

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      {/* Ambient background blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full glass-panel rounded-3xl p-8 shadow-2xl relative z-10 border border-[var(--border-subtle)] text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
          <ShieldAlert className="w-8 h-8 text-white" />
        </div>

        <h1 className="text-4xl font-black text-amber-400 font-mono tracking-tight">401</h1>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mt-2">Authentication Required</h2>
        <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed">
          Your session has expired or you need valid credentials to access this live event command view.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="primary"
            onClick={() => navigate('/login', { state: { from: returnTo } })}
            icon={LogIn}
            className="w-full sm:w-auto"
          >
            Sign In to Continue
          </Button>
          <Link to="/" className="w-full sm:w-auto">
            <Button variant="secondary" icon={Home} className="w-full">
              Back Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
