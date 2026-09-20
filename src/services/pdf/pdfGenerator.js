// src/services/pdf/pdfGenerator.js

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const pdfTheme = require('./pdfTheme.js');
const { normalizeRunOfShowData } = require('./pdfContract.js');
const {
  cleanPdfText,
  formatTime,
  formatTimeRange,
  formatEventDate,
  formatDelayBadge,
  formatDuration,
  getStatusStyle,
  getTrackAccentColor
} = require('./pdfUtils.js');

/**
 * Main Run-of-Show PDF Generation Engine.
 *
 * @param {Object} rawData - Normalized or raw Run-of-Show export data
 * @param {Object} [options] - Configuration options
 * @param {string} [options.outputPath] - Optional file path to save the generated PDF
 * @param {boolean} [options.compress] - Enable/disable stream compression (default: true)
 * @returns {Promise<Buffer>} - Resolves to PDF Buffer
 */
function generateRunOfShowPdf(rawData, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      // 1. Normalize data according to Stage 5 contract
      const data = normalizeRunOfShowData(rawData);

      // 2. Initialize PDF Document
      const { geometry, colors, fonts, typography, columns } = pdfTheme;
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: geometry.margins,
        bufferPages: true,
        compress: options.compress !== false,
        info: {
          Title: `${data.event.title} - Run of Show`,
          Author: 'StagePilot StageFlow Engine',
          Subject: 'Operational Event Schedule',
          Keywords: 'StagePilot, Run-of-Show, Stage Management, Schedule, Multi-Track',
          CreationDate: new Date()
        }
      });

      // Stream buffering
      const buffers = [];
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        if (options.outputPath) {
          try {
            const dir = path.dirname(options.outputPath);
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(options.outputPath, pdfBuffer);
          } catch (err) {
            return reject(err);
          }
        }
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Coordinates tracker
      let currentY = geometry.margins.top;
      const leftX = geometry.margins.left;
      const contentWidth = geometry.contentWidth;
      const bottomLimit = geometry.pageHeight - geometry.margins.bottom;

      // ==========================================
      // HELPER: Page break check
      // ==========================================
      function ensureSpace(neededHeight) {
        if (currentY + neededHeight > bottomLimit) {
          doc.addPage();
          currentY = geometry.margins.top;
          renderRunningHeader();
        }
      }

      // ==========================================
      // 1. EVENT HEADER (Page 1)
      // ==========================================
      function renderEventHeader() {
        // Document Top Banner / Tag
        doc.font(fonts.bold).fontSize(typography.badgeText.size).fillColor(colors.brandAccent);
        doc.text('STAGEPILOT  |  LIVE RUN-OF-SHOW SCHEDULE', leftX, currentY);
        currentY += 12;

        // Event Title (handles long titles safely)
        doc.font(fonts.bold).fontSize(typography.docTitle.size).fillColor(colors.primaryNavy);
        const titleText = data.event.title;
        doc.text(titleText, leftX, currentY, { width: contentWidth - 140 });
        const titleHeight = doc.heightOfString(titleText, { width: contentWidth - 140 });

        // Health / Status Badge on Top Right
        const badgeX = leftX + contentWidth - 130;
        const isDelayed = data.event.totalDelayMinutes > 0;
        const statusBadgeBg = isDelayed ? colors.delayAmberBg : colors.onTimeBg;
        const statusBadgeText = isDelayed ? colors.delayAmber : colors.onTimeGreen;
        const statusLabel = isDelayed
          ? `DELAY: +${data.event.totalDelayMinutes}m`
          : `STATUS: ${data.event.healthStatus || 'ON TRACK'}`;

        doc.roundedRect(badgeX, currentY, 130, 22, 4).fill(statusBadgeBg);
        doc.font(fonts.bold).fontSize(8).fillColor(statusBadgeText);
        doc.text(statusLabel, badgeX, currentY + 6, { width: 130, align: 'center' });

        currentY += Math.max(titleHeight + 6, 28);

        // Sub-bar: Venue, Date, Export Timestamp
        const formattedDate = formatEventDate(data.event.date);
        const venueText = data.event.venue;
        const exportText = `Exported: ${new Date(data.exportTimestamp).toLocaleString('en-US', { hour12: false })}`;

        doc.font(fonts.regular).fontSize(typography.bodyRegular.size).fillColor(colors.textSecondary);
        const metaLine = `Date: ${formattedDate}   |   Venue: ${venueText}   |   ${exportText}`;
        doc.text(metaLine, leftX, currentY, { width: contentWidth });
        currentY += 16;

        // Divider Rule
        doc.strokeColor(colors.borderPrimary).lineWidth(1.5);
        doc.moveTo(leftX, currentY).lineTo(leftX + contentWidth, currentY).stroke();
        currentY += 14;
      }

      // ==========================================
      // 2. RUNNING HEADER (Page 2+)
      // ==========================================
      function renderRunningHeader() {
        doc.font(fonts.bold).fontSize(typography.caption.size).fillColor(colors.brandAccent);
        doc.text('STAGEPILOT RUN-OF-SHOW', leftX, currentY);

        doc.font(fonts.regular).fontSize(typography.caption.size).fillColor(colors.textMuted);
        doc.text(data.event.title, leftX + 160, currentY, { width: contentWidth - 280, ellipsis: true });

        const exportStr = new Date(data.exportTimestamp).toLocaleDateString();
        doc.text(exportStr, leftX + contentWidth - 110, currentY, { width: 110, align: 'right' });

        currentY += 12;
        doc.strokeColor(colors.borderSecondary).lineWidth(0.8);
        doc.moveTo(leftX, currentY).lineTo(leftX + contentWidth, currentY).stroke();
        currentY += 12;
      }

      // ==========================================
      // 3. TRACK HEADER BANNER
      // ==========================================
      function renderTrackBanner(track) {
        const bannerHeight = 26;
        const accentColor = getTrackAccentColor(track.name);

        // Ensure track banner + at least one session fits
        ensureSpace(bannerHeight + 65);

        // Dark banner background
        doc.roundedRect(leftX, currentY, contentWidth, bannerHeight, 3).fill(colors.surfaceTrackHeader);

        // Left accent bar
        doc.roundedRect(leftX, currentY, 5, bannerHeight, 2).fill(accentColor);

        // Track Title
        doc.font(fonts.bold).fontSize(typography.trackBanner.size).fillColor(colors.textWhite);
        doc.text(track.name.toUpperCase(), leftX + 14, currentY + 7);

        // Track session count & delay tag on right
        const trackDelayStr = track.maxDelayMinutes > 0 ? `Max Delay: +${track.maxDelayMinutes}m` : 'On Schedule';
        const trackMeta = `${track.sessionCount} Sessions   |   ${trackDelayStr}`;
        doc.font(fonts.regular).fontSize(typography.caption.size).fillColor(colors.textLight);
        doc.text(trackMeta, leftX + contentWidth - 210, currentY + 8, { width: 200, align: 'right' });

        currentY += bannerHeight + 6;

        // Table Column Header Bar
        renderTableHeader();
      }

      // ==========================================
      // 4. TABLE COLUMN HEADERS
      // ==========================================
      function renderTableHeader() {
        const headerHeight = 16;
        ensureSpace(headerHeight + 50);

        doc.rect(leftX, currentY, contentWidth, headerHeight).fill(colors.surfaceSubtle);

        doc.font(fonts.bold).fontSize(typography.caption.size).fillColor(colors.textSecondary);
        let colX = leftX + 6;

        // 1. Time Column
        doc.text('SCHEDULE / CURRENT', colX, currentY + 4, { width: columns.time });
        colX += columns.time;

        // 2. Delay Column
        doc.text('DELAY', colX, currentY + 4, { width: columns.delay });
        colX += columns.delay;

        // 3. Content Column
        doc.text('SESSION & SPEAKER', colX, currentY + 4, { width: columns.content });
        colX += columns.content;

        // 4. Meta Column (Duration / Status)
        doc.text('DURATION / STATUS', colX, currentY + 4, { width: columns.meta, align: 'right' });

        currentY += headerHeight + 3;
      }

      // ==========================================
      // 5. SESSION ROW
      // ==========================================
      function renderSessionRow(session, isAlternate) {
        // Measure required height
        const contentColWidth = columns.content - 10;
        doc.font(fonts.bold).fontSize(typography.sessionTitle.size);
        const titleHeight = doc.heightOfString(session.title, { width: contentColWidth });

        // Calculate affiliations height
        let extraHeight = 12; // Speaker name
        if (session.speakerAffiliation) extraHeight += 11; // Designation / Company

        const rowContentHeight = Math.max(titleHeight + extraHeight + 14, 46);
        const rowHeight = rowContentHeight;

        // Check page break
        ensureSpace(rowHeight + 4);

        // Row background
        const rowBg = isAlternate ? colors.surfaceRowAlt : colors.pageBg;
        doc.rect(leftX, currentY, contentWidth, rowHeight).fill(rowBg);

        // Left accent indicator for delayed session
        if (session.delayMinutes > 0) {
          doc.rect(leftX, currentY, 3, rowHeight).fill(colors.delayAmber);
        }

        let colX = leftX + 6;
        const rowCenterOffset = currentY + 5;

        // ----------------------------------------------------
        // Column 1: Time (Scheduled vs Current)
        // ----------------------------------------------------
        const schedStr = formatTimeRange(session.scheduledStartTime, session.scheduledEndTime);
        const currStr = formatTimeRange(session.currentStartTime, session.currentEndTime);
        const hasTimeShift = session.delayMinutes > 0 || (schedStr !== currStr && currStr !== 'Time TBA');

        if (hasTimeShift) {
          // Scheduled (original)
          doc.font(fonts.regular).fontSize(7.5).fillColor(colors.textMuted);
          doc.text(`Sched: ${schedStr}`, colX, rowCenterOffset, { width: columns.time - 6 });

          // Current (adjusted)
          doc.font(fonts.bold).fontSize(8.5).fillColor(colors.primaryNavy);
          doc.text(`Curr:  ${currStr}`, colX, rowCenterOffset + 13, { width: columns.time - 6 });
        } else {
          doc.font(fonts.bold).fontSize(8.5).fillColor(colors.primaryNavy);
          doc.text(schedStr, colX, rowCenterOffset + 4, { width: columns.time - 6 });
          doc.font(fonts.regular).fontSize(7).fillColor(colors.onTimeGreen);
          doc.text('On Schedule', colX, rowCenterOffset + 16, { width: columns.time - 6 });
        }

        colX += columns.time;

        // ----------------------------------------------------
        // Column 2: Delay Badge
        // ----------------------------------------------------
        const delayBadge = formatDelayBadge(session.delayMinutes);
        const badgeY = rowCenterOffset + 3;
        const badgeW = 54;
        const badgeH = 16;

        doc.roundedRect(colX, badgeY, badgeW, badgeH, 3).fill(delayBadge.bg);
        doc.font(fonts.bold).fontSize(7.5).fillColor(delayBadge.color);
        doc.text(delayBadge.label, colX, badgeY + 4, { width: badgeW, align: 'center' });

        colX += columns.delay;

        // ----------------------------------------------------
        // Column 3: Session Title & Speaker
        // ----------------------------------------------------
        let textY = rowCenterOffset;

        // Title
        doc.font(fonts.bold).fontSize(typography.sessionTitle.size).fillColor(colors.primaryNavy);
        doc.text(session.title, colX, textY, { width: contentColWidth });
        textY += titleHeight + 2;

        // Speaker Name
        doc.font(fonts.regular).fontSize(typography.speakerName.size).fillColor(colors.textSecondary);
        const speakerLine = session.speakerName ? `Speaker: ${session.speakerName}` : 'Speaker TBA';
        doc.text(speakerLine, colX, textY, { width: contentColWidth });
        textY += 11;

        // Speaker Affiliation (if present)
        if (session.speakerAffiliation) {
          doc.font(fonts.italic).fontSize(typography.caption.size).fillColor(colors.textMuted);
          doc.text(session.speakerAffiliation, colX, textY, { width: contentColWidth });
        }

        colX += columns.content;

        // ----------------------------------------------------
        // Column 4: Duration & Status
        // ----------------------------------------------------
        const metaX = colX;
        const durStr = formatDuration(session.durationMinutes);
        doc.font(fonts.regular).fontSize(7.5).fillColor(colors.textMuted);
        doc.text(`Duration: ${durStr}`, metaX, rowCenterOffset, { width: columns.meta - 6, align: 'right' });

        // Status pill badge
        const st = getStatusStyle(session.status);
        const statusBadgeW = 56;
        const statusBadgeH = 15;
        const statusBadgeX = metaX + columns.meta - statusBadgeW - 6;
        const statusBadgeY = rowCenterOffset + 13;

        doc.roundedRect(statusBadgeX, statusBadgeY, statusBadgeW, statusBadgeH, 3).fill(st.bg);
        doc.font(fonts.bold).fontSize(7).fillColor(st.text);
        doc.text(st.label, statusBadgeX, statusBadgeY + 4, { width: statusBadgeW, align: 'center' });

        // Row bottom divider line
        currentY += rowHeight;
        doc.strokeColor(colors.surfaceCardBorder).lineWidth(0.6);
        doc.moveTo(leftX, currentY).lineTo(leftX + contentWidth, currentY).stroke();
        currentY += 2;
      }

      // ==========================================
      // EXECUTION: Render Document Body
      // ==========================================
      // 1. Initial Page Header
      renderEventHeader();

      // 2. Iterate Tracks
      if (!data.tracks || data.tracks.length === 0) {
        doc.font(fonts.regular).fontSize(10).fillColor(colors.textMuted);
        doc.text('No tracks or sessions scheduled for this event.', leftX, currentY + 20);
      } else {
        data.tracks.forEach((track, trackIdx) => {
          // Render Track Banner
          renderTrackBanner(track);

          // Render Sessions within Track
          if (track.sessions.length === 0) {
            doc.font(fonts.italic).fontSize(8.5).fillColor(colors.textMuted);
            doc.text('No sessions currently scheduled in this track.', leftX + 10, currentY + 6);
            currentY += 22;
          } else {
            track.sessions.forEach((session, sIdx) => {
              const isAlternate = sIdx % 2 === 1;
              renderSessionRow(session, isAlternate);
            });
          }

          // Spacing between tracks
          currentY += 14;
        });
      }

      // ==========================================
      // 6. RUNNING FOOTER PASS (Across all pages)
      // ==========================================
      const range = doc.bufferedPageRange();
      const totalPages = range.count;

      for (let i = range.start; i < range.start + totalPages; i++) {
        doc.switchToPage(i);
        doc.page.margins.bottom = 0;

        const footerY = geometry.pageHeight - geometry.margins.bottom + 10;

        // Footer subtle divider
        doc.strokeColor(colors.borderSecondary).lineWidth(0.5);
        doc.moveTo(leftX, footerY - 5).lineTo(leftX + contentWidth, footerY - 5).stroke();

        // Left: System branding
        doc.font(fonts.regular).fontSize(typography.footer.size).fillColor(colors.textMuted);
        doc.text('StagePilot • AI Stage Co-Pilot & Run-of-Show Engine', leftX, footerY, {
          lineBreak: false
        });

        // Center: Export Timestamp
        const exportDateStr = `Generated: ${new Date(data.exportTimestamp).toISOString()}`;
        doc.text(exportDateStr, leftX, footerY, {
          width: contentWidth,
          align: 'center',
          lineBreak: false
        });

        // Right: Page count "Page X of Y"
        const pageLabel = `Page ${i + 1} of ${totalPages}`;
        doc.font(fonts.bold).fontSize(typography.footer.size).fillColor(colors.textSecondary);
        doc.text(pageLabel, leftX + contentWidth - 80, footerY, {
          width: 80,
          align: 'right',
          lineBreak: false
        });
      }

      // Finalize PDF stream
      doc.end();

    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateRunOfShowPdf
};
