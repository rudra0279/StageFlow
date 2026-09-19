export const getHealthBadgeConfig = (healthStatus) => {
  switch (healthStatus) {
    case 'ON_SCHEDULE':
      return {
        label: 'On Schedule',
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        dot: 'bg-emerald-400'
      };
    case 'RUNNING_LATE':
      return {
        label: 'Running Late',
        bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        dot: 'bg-amber-400'
      };
    case 'DISRUPTED':
      return {
        label: 'Schedule Disruption',
        bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        dot: 'bg-rose-400 animate-ping'
      };
    default:
      return {
        label: 'Healthy',
        bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        dot: 'bg-cyan-400'
      };
  }
};

export const getSessionStatusBadge = (status) => {
  switch (status) {
    case 'LIVE':
      return {
        label: 'ON STAGE NOW',
        className: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse font-bold'
      };
    case 'COMPLETED':
      return {
        label: 'Completed',
        className: 'bg-slate-800 text-slate-400 border-slate-700'
      };
    case 'SKIPPED':
      return {
        label: 'Skipped',
        className: 'bg-zinc-800 text-zinc-500 border-zinc-700'
      };
    default:
      return {
        label: 'Upcoming',
        className: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
      };
  }
};
