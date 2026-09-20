// src/utils/pdfGenerator.js

/**
 * Generates a valid PDF buffer representing the complete multi-track Run-of-Show for an event.
 * @param {Object} options
 * @param {string} options.title
 * @param {string|Date} options.date
 * @param {string} options.venue
 * @param {string} options.theme
 * @param {number} options.totalDelayMinutes
 * @param {Array<{name: string, delay: number, sessions: Array}>} options.tracks
 * @returns {Buffer}
 */
function generatePdfBuffer({ title, date, venue, theme, totalDelayMinutes, tracks = [] }) {
  const dateStr = date ? new Date(date).toLocaleDateString() : 'N/A';
  
  const lines = [
    `STAGEPILOT / STAGEFLOW - RUN-OF-SHOW PDF EXPORT`,
    `=============================================================`,
    `Event Title : ${title}`,
    `Venue       : ${venue || 'Main Stage'}`,
    `Theme       : ${theme || 'General Tech'}`,
    `Date        : ${dateStr}`,
    `Event Drift : +${totalDelayMinutes || 0} minutes`,
    `=============================================================`,
    ``
  ];

  tracks.forEach((track) => {
    lines.push(`--- TRACK: ${track.name} (Track Drift: +${track.delay || 0}m) ---`);
    if (track.sessions && track.sessions.length > 0) {
      track.sessions.forEach((s, idx) => {
        const timeVal = s.time || s.startTime || 'TBD';
        const speakerVal = s.speaker || s.speakerName || 'TBA';
        const durVal = s.duration || s.durationMinutes || 30;
        const statusVal = s.status || 'UPCOMING';
        lines.push(`  ${idx + 1}. [${timeVal}] ${s.title}`);
        lines.push(`     Speaker: ${speakerVal} | Duration: ${durVal}m | Status: ${statusVal}`);
        if (s.delayMinutes) {
          lines.push(`     Session Delay: +${s.delayMinutes}m`);
        }
      });
    } else {
      lines.push(`  (No sessions scheduled for this track)`);
    }
    lines.push(``);
  });

  const contentStream = lines.map((line, idx) => {
    const escaped = String(line)
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
    const yPos = Math.max(20, 750 - (idx * 16));
    return `BT /F1 10 Tf 50 ${yPos} Td (${escaped}) Tj ET`;
  }).join('\n');

  const streamLength = Buffer.byteLength(contentStream);

  const obj1 = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
  const obj2 = `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`;
  const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n`;
  const obj4 = `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${contentStream}\nendstream\nendobj\n`;
  const obj5 = `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;

  const header = `%PDF-1.4\n`;
  
  const o1 = header.length;
  const o2 = o1 + obj1.length;
  const o3 = o2 + obj2.length;
  const o4 = o3 + obj3.length;
  const o5 = o4 + obj4.length;
  const startXref = o5 + obj5.length;

  const pad = (n) => String(n).padStart(10, '0');

  const xref = `xref\n0 6\n0000000000 65535 f \n${pad(o1)} 00000 n \n${pad(o2)} 00000 n \n${pad(o3)} 00000 n \n${pad(o4)} 00000 n \n${pad(o5)} 00000 n \n`;
  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF`;

  const fullPdf = header + obj1 + obj2 + obj3 + obj4 + obj5 + xref + trailer;
  return Buffer.from(fullPdf);
}

module.exports = {
  generatePdfBuffer
};
