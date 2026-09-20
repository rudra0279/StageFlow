import React from 'react';

export const LoadingState = ({ message = 'Synchronizing live event stream...', className = '' }) => {
  return (
    <div className={`glass-panel rounded-2xl p-12 text-center flex flex-col items-center justify-center my-6 ${className}`}>
      <div className="relative w-12 h-12 mb-4">
        <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 border-t-cyan-500 animate-spin" />
        <div className="absolute inset-2 rounded-full border-2 border-purple-500/20 border-t-purple-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
      </div>
      <p className="text-xs sm:text-sm font-medium text-slate-300 tracking-wide animate-pulse">
        {message}
      </p>
    </div>
  );
};

export default LoadingState;
