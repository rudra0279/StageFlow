// src/services/pdf/pdfUtils.js

const pdfTheme = require('./pdfTheme.js');

/**
 * Normalizes and cleans text for PDFKit standard Helvetica (WinAnsiEncoding).
 * Preserves Latin accents (Café, José García, Dr. O'Connor, AI & Education, R&D),
 * while mapping non-standard Unicode punctuation to reliable PDF equivalents.
 *
 * @param {string|any} input
 * @returns {string}
 */
function cleanPdfText(input) {
  if (input === null || input === undefined) return '';
  let str = String(input);

  // Normalize Unicode
  str = str.normalize('NFKC');

  // Replace typographic punctuation with clean standard characters
  str = str
    .replace(/[\u2018\u2019\u201B]/g, "'")    // Smart single quotes
    .replace(/[\u201C\u201D\u201F]/g, '"')    // Smart double quotes
    .replace(/\u2014/g, ' -- ')                 // Em-dash
    .replace(/\u2013/g, ' - ')                  // En-dash
    .replace(/\u2026/g, '...')                 // Ellipsis
    .replace(/\u2022/g, '* ')                   // Bullet point
    .replace(/[\u00A0\u2007\u202F]/g, ' ')      // Non-breaking spaces
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Strip control characters

  return str.trim();
}

/**
 * Format a Date, ISO string, or time string to a standard 24h operational time string (e.g. "09:30").
 * @param {Date|string} dateOrStr
 * @returns {string}
 */
function formatTime(dateOrStr) {
  if (!dateOrStr) return '--:--';

  // If already in simple HH:MM format
  if (typeof dateOrStr === 'string' && /^\d{1,2}:\d{2}(\s*(AM|PM))?$/i.test(dateOrStr.trim())) {
    return dateOrStr.trim();
  }

  try {
    const d = new Date(dateOrStr);
    if (isNaN(d.getTime())) {
      return String(dateOrStr).trim() || '--:--';
    }

    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${mins}`;
  } catch {
    return String(dateOrStr) || '--:--';
  }
}

/**
 * Formats a start and end time into a clean operational range string (e.g., "10:00 - 11:00").
 * @param {Date|string} start
 * @param {Date|string} end
 * @returns {string}
 */
function formatTimeRange(start, end) {
  const s = formatTime(start);
  const e = formatTime(end);
  if (s === '--:--' && e === '--:--') return 'Time TBA';
  if (e === '--:--') return s;
  return `${s} - ${e}`;
}

/**
 * Format a Date or date string to a human-readable event date.
 * @param {Date|string} dateOrStr
 * @returns {string}
 */
function formatEventDate(dateOrStr) {
  if (!dateOrStr) return 'Date TBA';

  // Check if simple string like "2026-09-20"
  try {
    const d = new Date(dateOrStr);
    if (isNaN(d.getTime())) return String(dateOrStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return String(dateOrStr);
  }
}

/**
 * Format delay badge text and category.
 * @param {number} delayMinutes
 * @returns {{ label: string, isDelayed: boolean, color: string, bg: string }}
 */
function formatDelayBadge(delayMinutes) {
  const mins = Number(delayMinutes) || 0;
  if (mins <= 0) {
    return {
      label: 'On Time',
      isDelayed: false,
      color: pdfTheme.colors.onTimeGreen,
      bg: pdfTheme.colors.onTimeBg
    };
  }

  if (mins <= 15) {
    return {
      label: `+${mins} min`,
      isDelayed: true,
      color: pdfTheme.colors.delayAmber,
      bg: pdfTheme.colors.delayAmberBg
    };
  }

  return {
    label: `+${mins} min`,
    isDelayed: true,
    color: pdfTheme.colors.delayCritical,
    bg: pdfTheme.colors.delayCriticalBg
  };
}

/**
 * Format duration in minutes.
 * @param {number} durationMinutes
 * @returns {string}
 */
function formatDuration(durationMinutes) {
  const mins = Number(durationMinutes) || 0;
  if (mins <= 0) return '--';
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
  }
  return `${mins}m`;
}

/**
 * Get status badge style.
 * @param {string} status
 * @returns {{ label: string, bg: string, text: string }}
 */
function getStatusStyle(status) {
  const s = String(status || '').toUpperCase();
  switch (s) {
    case 'LIVE':
      return {
        label: 'LIVE',
        bg: pdfTheme.colors.statusLiveBg,
        text: pdfTheme.colors.statusLiveText
      };
    case 'COMPLETED':
      return {
        label: 'COMPLETED',
        bg: pdfTheme.colors.statusCompletedBg,
        text: pdfTheme.colors.statusCompletedText
      };
    case 'DELAYED':
      return {
        label: 'DELAYED',
        bg: pdfTheme.colors.statusDelayedBg,
        text: pdfTheme.colors.statusDelayedText
      };
    case 'UPCOMING':
    default:
      return {
        label: s || 'UPCOMING',
        bg: pdfTheme.colors.statusUpcomingBg,
        text: pdfTheme.colors.statusUpcomingText
      };
  }
}

/**
 * Get accent color for a track name.
 * @param {string} trackName
 * @returns {string} Hex color
 */
function getTrackAccentColor(trackName) {
  if (!trackName) return pdfTheme.colors.trackAccents.default;
  for (const [key, color] of Object.entries(pdfTheme.colors.trackAccents)) {
    if (trackName.toLowerCase().includes(key.toLowerCase())) {
      return color;
    }
  }
  return pdfTheme.colors.trackAccents.default;
}

module.exports = {
  cleanPdfText,
  formatTime,
  formatTimeRange,
  formatEventDate,
  formatDelayBadge,
  formatDuration,
  getStatusStyle,
  getTrackAccentColor
};
