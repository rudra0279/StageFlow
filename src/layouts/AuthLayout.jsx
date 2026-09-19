import React from 'react';
import { Outlet } from 'react-router-dom';
import { Radio } from 'lucide-react';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-stage-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Radio className="w-7 h-7 animate-pulse" />
          </div>
          <span className="text-2xl font-extrabold tracking-wider text-slate-100">
            STAGE<span className="text-cyan-400">PILOT</span>
          </span>
        </div>

        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
