// src/services/pdf/pdfTheme.js

/**
 * Visual design constants and color palette for StagePilot Run-of-Show PDF.
 * Tailored for operational clarity, high contrast, and clean printing.
 */
const pdfTheme = {
  // Page geometry (standard Letter size in points: 72 points per inch)
  geometry: {
    pageWidth: 612,
    pageHeight: 792,
    margins: {
      top: 40,
      bottom: 45,
      left: 36,
      right: 36,
    },
    get contentWidth() {
      return this.pageWidth - this.margins.left - this.margins.right; // 540 pt
    },
    get contentHeight() {
      return this.pageHeight - this.margins.top - this.margins.bottom; // 707 pt
    }
  },

  // Color Palette (Hex colors)
  colors: {
    // Primary brand / headers
    primaryNavy: '#0F172A',     // Slate 900
    deepNavy: '#1E293B',        // Slate 800
    brandIndigo: '#3730A3',     // Indigo 800
    brandAccent: '#4F46E5',     // Indigo 600

    // Text hierarchy
    textPrimary: '#0F172A',     // Near-black
    textSecondary: '#475569',   // Slate 600
    textMuted: '#64748B',       // Slate 500
    textLight: '#94A3B8',       // Slate 400
    textWhite: '#FFFFFF',

    // Surface / Backgrounds
    pageBg: '#FFFFFF',
    surfaceLight: '#F8FAFC',    // Slate 50
    surfaceSubtle: '#F1F5F9',   // Slate 100
    surfaceTrackHeader: '#1E293B', // Dark track banner
    surfaceCardBorder: '#E2E8F0',  // Slate 200
    surfaceRowAlt: '#F8FAFC',

    // Operational Status Badges
    statusLiveBg: '#DCFCE7',    // Emerald 100
    statusLiveText: '#15803D',  // Emerald 700
    statusUpcomingBg: '#EFF6FF',// Blue 100
    statusUpcomingText: '#1D4ED8',// Blue 700
    statusCompletedBg: '#F1F5F9', // Slate 100
    statusCompletedText: '#475569', // Slate 600
    statusDelayedBg: '#FEE2E2', // Red 100
    statusDelayedText: '#B91C1C', // Red 700

    // Delays & Alerts
    onTimeGreen: '#16A34A',
    onTimeBg: '#DCFCE7',
    delayAmber: '#D97706',      // Amber 600
    delayAmberBg: '#FEF3C7',    // Amber 100
    delayCritical: '#DC2626',   // Red 600
    delayCriticalBg: '#FEE2E2', // Red 100

    // Track colors (for distinct multi-track accents)
    trackAccents: {
      'Track A': '#3B82F6',     // Blue
      'Track B': '#8B5CF6',     // Purple
      'Track C': '#06B6D4',     // Cyan
      'Track D': '#10B981',     // Emerald
      'default': '#6366F1'      // Indigo
    },

    // Dividers
    borderPrimary: '#CBD5E1',   // Slate 300
    borderSecondary: '#E2E8F0', // Slate 200
  },

  // Fonts
  fonts: {
    regular: 'Helvetica',
    bold: 'Helvetica-Bold',
    italic: 'Helvetica-Oblique',
    boldItalic: 'Helvetica-BoldOblique',
  },

  // Typography Scale
  typography: {
    docTitle: { size: 18, leading: 22 },
    sectionTitle: { size: 12, leading: 15 },
    trackBanner: { size: 11, leading: 14 },
    sessionTitle: { size: 10, leading: 13 },
    speakerName: { size: 9, leading: 12 },
    bodyRegular: { size: 8.5, leading: 11 },
    badgeText: { size: 7.5, leading: 9.5 },
    caption: { size: 7.5, leading: 9.5 },
    footer: { size: 7, leading: 9 },
  },

  // Column width allocations for session rows (Sum = 540 pt)
  columns: {
    time: 110,        // Scheduled & Current time
    delay: 65,        // Delay badge / On Time
    content: 285,     // Title, speaker, affiliation
    meta: 80,         // Duration & Status badges
  }
};

module.exports = pdfTheme;
