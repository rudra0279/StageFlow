import React from 'react';

export const Loader = ({ text = 'Loading...', size = 'md' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="relative">
        <div className={`${sizes[size]} rounded-full border-2 border-stage-700 border-t-cyan-400 animate-spin`} />
      </div>
      {text && <p className="text-xs text-slate-400 font-medium tracking-wider uppercase">{text}</p>}
    </div>
  );
};
