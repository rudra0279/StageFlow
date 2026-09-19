/**
 * Returns current timestamp formatted as HH:MM:SS AM/PM
 */
export const getCurrentTimeString = () => {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

/**
 * Calculates drift status class based on time drift in minutes
 */
export const getDriftBadgeColor = (driftMinutes) => {
  if (driftMinutes === 0) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  if (driftMinutes > 0) return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
};
