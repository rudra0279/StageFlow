/**
 * Format ISO date string to readable time (e.g., 09:30 AM)
 */
export const formatTime = (dateInput) => {
  if (!dateInput) return '--:--';
  const date = new Date(dateInput);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Format duration in minutes into clean readable text (e.g., "45m" or "1h 15m")
 */
export const formatDuration = (minutes) => {
  if (!minutes) return '0m';
  if (minutes < 60) return `${minutes}m`;
  const hrs = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hrs}h ${remaining}m` : `${hrs}h`;
};

/**
 * Format seconds into mm:ss
 */
export const formatCountdown = (totalSeconds) => {
  const isNegative = totalSeconds < 0;
  const absSeconds = Math.abs(totalSeconds);
  const mins = Math.floor(absSeconds / 60);
  const secs = absSeconds % 60;
  const pad = (n) => n.toString().padStart(2, '0');
  return `${isNegative ? '+' : ''}${pad(mins)}:${pad(secs)}`;
};
