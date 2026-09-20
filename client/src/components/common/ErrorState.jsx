import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

export const ErrorState = ({
  title = 'Connection Disrupted',
  message = 'Failed to fetch event data from the backend.',
  onRetry = null,
  className = ''
}) => {
  return (
    <div className={`glass-panel border-rose-500/30 rounded-2xl p-8 text-center flex flex-col items-center justify-center my-6 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3 glow-border-rose">
        <AlertTriangle className="w-7 h-7" />
      </div>
      <h3 className="text-base sm:text-lg font-bold text-rose-200 mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-4">{message}</p>
      {onRetry && (
        <Button variant="danger" size="sm" onClick={onRetry}>
          Retry Connection
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
