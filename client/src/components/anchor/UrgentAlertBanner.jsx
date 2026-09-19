import React from 'react';
import { AlertOctagon, Clock, X, Bell } from 'lucide-react';

export const UrgentAlertBanner = ({
  alert,
  delayNotice,
  onDismissAlert,
  onDismissDelay
}) => {
  if (!alert && !delayNotice) return null;

  return (
    <div className="space-y-2 mb-6">
      {/* 1. Critical/Direct Stage Alert */}
      {alert && (
        <div
          className={`relative rounded-xl border p-4 flex items-start justify-between gap-4 shadow-2xl transition-all ${
            alert.urgency === 'CRITICAL'
              ? 'bg-gradient-to-r from-rose-950 via-rose-900 to-red-950 border-rose-500 animate-alert'
              : 'bg-amber-950/70 border-amber-500/70'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-black/40 border border-white/10 shrink-0">
              <AlertOctagon
                className={`w-6 h-6 ${
                  alert.urgency === 'CRITICAL' ? 'text-rose-400 animate-pulse' : 'text-amber-400'
                }`}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-white">
                  STAGE NOTICE: {alert.type}
                </span>
                <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded font-mono text-slate-300">
                  {alert.urgency}
                </span>
              </div>
              <p className="text-base sm:text-lg font-bold text-white mt-1 leading-snug">
                "{alert.message}"
              </p>
            </div>
          </div>

          <button
            onClick={onDismissAlert}
            className="p-1 rounded text-white/70 hover:text-white hover:bg-black/30 transition-colors shrink-0"
            title="Acknowledge & Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* 2. Live Delay Notification */}
      {delayNotice && (
        <div className="relative rounded-xl border border-amber-500/60 bg-amber-950/40 p-4 flex items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/40 shrink-0">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  SCHEDULE DELAY BROADCAST
                </span>
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                  +{delayNotice.delayMinutes} MINS
                </span>
              </div>
              <p className="text-sm font-medium text-slate-200 mt-0.5">
                {delayNotice.targetSessionTitle ? `"${delayNotice.targetSessionTitle}": ` : ''}
                {delayNotice.reason || 'Schedule adjusted by organizer'}
              </p>
            </div>
          </div>

          <button
            onClick={onDismissDelay}
            className="p-1 rounded text-slate-400 hover:text-white transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
