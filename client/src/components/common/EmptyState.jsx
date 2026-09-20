import React from 'react';
import { Layers } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Layers,
  title = 'No items found',
  description = 'There are no records to display right now.',
  action = null,
  className = ''
}) => {
  return (
    <div className={`glass-panel rounded-2xl p-10 text-center flex flex-col items-center justify-center my-6 ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 animate-float-slow">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-slate-100 mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-5">{description}</p>
      {action}
    </div>
  );
};

export default EmptyState;
