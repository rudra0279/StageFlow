import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingState = ({ message = 'Loading stage telemetry...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 min-h-[300px] w-full text-center">
      <div className="relative flex items-center justify-center mb-4">
        <div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 animate-ping absolute"></div>
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin relative z-10" />
      </div>
      <p className="text-sm font-medium text-slate-400 tracking-wide">{message}</p>
    </div>
  );
};

export default LoadingState;
