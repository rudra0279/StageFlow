/**
 * Formats seconds into MM:SS or HH:MM:SS string for countdown clocks
 */
export const formatTime = (seconds) => {
  if (seconds === null || seconds === undefined || isNaN(seconds)) return '00:00';
  
  const absSeconds = Math.abs(seconds);
  const hrs = Math.floor(absSeconds / 3600);
  const mins = Math.floor((absSeconds % 3600) / 60);
  const secs = absSeconds % 60;

  const pad = (num) => String(num).padStart(2, '0');

  if (hrs > 0) {
    return `${seconds < 0 ? '-' : ''}${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${seconds < 0 ? '-' : ''}${pad(mins)}:${pad(secs)}`;
};

/**
 * Capitalizes string
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Truncates text with ellipsis
 */
export const truncate = (str, length = 100) => {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
};
