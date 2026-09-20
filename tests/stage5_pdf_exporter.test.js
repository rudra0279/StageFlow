// tests/stage5_pdf_exporter.test.js

const fs = require('fs');
const path = require('path');
const {
  generateRunOfShowPdf,
  normalizeRunOfShowData,
  pdfTheme,
  pdfUtils
} = require('../src/services/pdf');

const {
  fixtureA,
  fixtureB,
  fixtureC,
  fixtureD,
  fixtureE
} = require('./fixtures/stage5PdfFixtures');

/**
 * Robust text extractor for uncompressed PDF buffers generated with PDFKit.
 * Decodes hexadecimal text strings and standard strings from TJ/Tj operators.
 */
function extractPdfText(pdfBuffer) {
  const content = pdfBuffer.toString('latin1');
  let extracted = '';

  // Extract all [ ... ] TJ blocks
  const tjBlocks = content.match(/\[(.*?)\]\s*TJ/gs) || [];
  for (const block of tjBlocks) {
    const items = block.match(/<([0-9a-fA-F]+)>|\((.*?)\)/g) || [];
    for (const item of items) {
      if (item.startsWith('<')) {
        const hex = item.slice(1, -1);
        extracted += Buffer.from(hex, 'hex').toString('latin1');
      } else if (item.startsWith('(')) {
        extracted += item.slice(1, -1);
      }
    }
    extracted += ' ';
  }

  // Extract single (str) Tj and <hex> Tj
  const singleTj = content.match(/(<[0-9a-fA-F]+>|\(.*?\))\s*Tj/g) || [];
  for (const item of singleTj) {
    if (item.startsWith('<')) {
      const hex = item.slice(1, item.indexOf('>'));
      extracted += Buffer.from(hex, 'hex').toString('latin1') + ' ';
    } else if (item.startsWith('(')) {
      extracted += item.slice(1, item.lastIndexOf(')')) + ' ';
    }
  }

  return extracted.replace(/\s+/g, ' ').trim();
}

describe('Stage 5: Run-of-Show PDF Exporter Engine', () => {
  const tempOutputDir = path.join(__dirname, 'temp_output');

  beforeAll(() => {
    if (!fs.existsSync(tempOutputDir)) {
      fs.mkdirSync(tempOutputDir, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(tempOutputDir)) {
      fs.rmSync(tempOutputDir, { recursive: true, force: true });
    }
  });

  // =========================================================================
  // 1. PDF File Creation & Non-Empty Output
  // =========================================================================
  describe('1. PDF File Creation & Output Verification', () => {
    test('generateRunOfShowPdf returns a non-empty Buffer for Fixture A', async () => {
      const buffer = await generateRunOfShowPdf(fixtureA);
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(1000);
    });

    test('writes to outputPath when specified in options', async () => {
      const testFile = path.join(tempOutputDir, 'test_fixture_a.pdf');
      const buffer = await generateRunOfShowPdf(fixtureA, { outputPath: testFile });

      expect(fs.existsSync(testFile)).toBe(true);
      const diskContent = fs.readFileSync(testFile);
      expect(diskContent.length).toBe(buffer.length);
      expect(diskContent.length).toBeGreaterThan(1000);
    });

    test('produces a single-page document for compact schedule (Fixture A)', async () => {
      const buffer = await generateRunOfShowPdf(fixtureA, { compress: false });
      const countMatch = buffer.toString('latin1').match(/\/Type\s*\/Pages.*?\/Count\s+(\d+)/s);
      const pageCount = countMatch ? parseInt(countMatch[1], 10) : 0;
      expect(pageCount).toBe(1);
    });
  });

  // =========================================================================
  // 2. Valid PDF Structure
  // =========================================================================
  describe('2. Valid PDF Binary Structure', () => {
    let pdfBuffer;

    beforeAll(async () => {
      // Use compress: false to allow structural inspection of PDF objects
      pdfBuffer = await generateRunOfShowPdf(fixtureA, { compress: false });
    });

    test('starts with PDF header magic number %PDF-', () => {
      const header = pdfBuffer.slice(0, 5).toString('ascii');
      expect(header).toBe('%PDF-');
    });

    test('terminates with standard PDF trailer marker %%EOF', () => {
      const trailer = pdfBuffer.slice(pdfBuffer.length - 20).toString('ascii');
      expect(trailer).toContain('%%EOF');
    });

    test('contains PDF Catalog and Pages dictionaries', () => {
      const rawText = pdfBuffer.toString('latin1');
      expect(rawText).toContain('/Type /Catalog');
      expect(rawText).toContain('/Type /Pages');
      expect(rawText).toContain('/Type /Page');
    });

    test('contains Font definitions and standard typography resources', () => {
      const rawText = pdfBuffer.toString('latin1');
      expect(rawText).toContain('/Font');
      expect(rawText).toContain('Helvetica');
    });
  });

  // =========================================================================
  // 3. Expected Content Verification (Fixture A)
  // =========================================================================
  describe('3. Expected Content Verification (Fixture A)', () => {
    let uncompressedBuffer;
    let extractedText;

    beforeAll(async () => {
      uncompressedBuffer = await generateRunOfShowPdf(fixtureA, { compress: false });
      extractedText = extractPdfText(uncompressedBuffer);
    });

    test('includes event title, venue, and branding in output', () => {
      expect(extractedText).toContain('STAGEPILOT');
      expect(extractedText).toContain('StagePilot Single Track Showcase');
      expect(extractedText).toContain('Auditorium Alpha');
    });

    test('includes all scheduled sessions from Fixture A', () => {
      expect(extractedText).toContain('Opening Welcome & Keynote Kickoff');
      expect(extractedText).toContain('Architecting Event-Driven Live Teleprompters');
      expect(extractedText).toContain('Community Town Hall & Closing Address');
    });

    test('includes speakers and affiliations', () => {
      expect(extractedText).toContain('Jane Doe');
      expect(extractedText).toContain('Alex Smith');
      expect(extractedText).toContain('Morgan Lee');
      expect(extractedText).toContain('CloudScale');
      expect(extractedText).toContain('StagePilot Inc.');
    });
  });

  // =========================================================================
  // 4. Multi-Track Layout Handling (Fixture B)
  // =========================================================================
  describe('4. Multi-Track Handling (Fixture B)', () => {
    let bufferB;
    let extractedB;

    beforeAll(async () => {
      bufferB = await generateRunOfShowPdf(fixtureB, { compress: false });
      extractedB = extractPdfText(bufferB);
    });

    test('generates substantial output for multi-track event', () => {
      expect(Buffer.isBuffer(bufferB)).toBe(true);
      expect(bufferB.length).toBeGreaterThan(2000);
    });

    test('displays distinct banners for Track A, Track B, and Track C', () => {
      expect(extractedB).toContain('TRACK A');
      expect(extractedB).toContain('TRACK B');
      expect(extractedB).toContain('TRACK C');
    });

    test('renders track-specific sessions within their respective tracks', () => {
      // Track A sessions
      expect(extractedB).toContain('The Future of Autonomous Distributed Systems');
      expect(extractedB).toContain('Zero-Latency Multi-Region Data Replication');

      // Track B sessions
      expect(extractedB).toContain('Hands-on Workshop: Building Generative AI Workflows');
      expect(extractedB).toContain('Practical Edge Computing Deployments with WebAssembly');

      // Track C sessions
      expect(extractedB).toContain('Speed Mentoring: Scaling from Seed to Series B');
      expect(extractedB).toContain('Founders & Investors Roundtable');
    });

    test('preserves session order without ambiguous timeline merging', () => {
      const normalized = normalizeRunOfShowData(fixtureB);
      expect(normalized.tracks.length).toBe(3);
      expect(normalized.tracks[0].name).toContain('Track A');
      expect(normalized.tracks[1].name).toContain('Track B');
      expect(normalized.tracks[2].name).toContain('Track C');

      expect(normalized.tracks[0].sessions[0].title).toContain('Autonomous Distributed Systems');
      expect(normalized.tracks[0].sessions[1].title).toContain('Zero-Latency Multi-Region Data Replication');
    });
  });

  // =========================================================================
  // 5. Scheduled vs Current Time & Delay Display (Fixture C)
  // =========================================================================
  describe('5. Scheduled vs Current Time & Delay Display (Fixture C)', () => {
    let bufferC;
    let extractedC;

    beforeAll(async () => {
      bufferC = await generateRunOfShowPdf(fixtureC, { compress: false });
      extractedC = extractPdfText(bufferC);
    });

    test('reflects overall event delay in header badge', () => {
      expect(extractedC).toContain('DELAY: +15m');
    });

    test('displays both Scheduled and Current times for delayed session', () => {
      // Session C2 is delayed by 15 min (Sched: 10:00 - 11:00, Curr: 10:15 - 11:15)
      expect(extractedC).toContain('Sched: 10:00 - 11:00');
      expect(extractedC).toContain('Curr: 10:15 - 11:15');
      expect(extractedC).toContain('+15 min');
    });

    test('displays on-time session with on-schedule indicator', () => {
      // Session C1 is on schedule (09:00 - 10:00)
      expect(extractedC).toContain('09:00 - 10:00');
      expect(extractedC).toContain('On Schedule');
      expect(extractedC).toContain('On Time');
    });

    test('displays authoritative export data without recalculating secondary delays', () => {
      const normalized = normalizeRunOfShowData(fixtureC);
      const delayedSess = normalized.tracks[0].sessions[1];
      expect(delayedSess.delayMinutes).toBe(15);
      expect(delayedSess.currentStartTime).toBe('10:15');
    });
  });

  // =========================================================================
  // 6. Special Characters & Long Content (Fixture D)
  // =========================================================================
  describe('6. Special Characters & Long Content Handling (Fixture D)', () => {
    let bufferD;
    let extractedD;

    beforeAll(async () => {
      bufferD = await generateRunOfShowPdf(fixtureD, { compress: false });
      extractedD = extractPdfText(bufferD);
    });

    test('successfully generates PDF without throwing on special characters', () => {
      expect(Buffer.isBuffer(bufferD)).toBe(true);
      expect(bufferD.length).toBeGreaterThan(2000);
    });

    test('renders accents: Café and José García accurately', () => {
      expect(extractedD).toContain('Café');
      expect(extractedD).toContain('José García');
    });

    test('renders Dr. O\'Connor, AI & Education, and R&D', () => {
      expect(extractedD).toContain("Dr. O'Connor");
      expect(extractedD).toContain('AI & Education');
      expect(extractedD).toContain('R&D');
    });

    test('handles long event titles, session titles, and affiliations cleanly', () => {
      expect(extractedD).toContain('Grand Paris Conference');
      expect(extractedD).toContain('Next-Generation Cognitive Architectures');
      expect(extractedD).toContain('Laboratoire Européen');
    });
  });

  // =========================================================================
  // 7. Multi-Page Pagination & Quality (Fixture E)
  // =========================================================================
  describe('7. Multi-Page Handling (Fixture E)', () => {
    let bufferE;
    let rawStringE;
    let extractedE;

    beforeAll(async () => {
      bufferE = await generateRunOfShowPdf(fixtureE, { compress: false });
      rawStringE = bufferE.toString('latin1');
      extractedE = extractPdfText(bufferE);
    });

    test('generates large multi-page PDF document (> 10KB)', () => {
      expect(Buffer.isBuffer(bufferE)).toBe(true);
      expect(bufferE.length).toBeGreaterThan(10000);
    });

    test('creates multiple pages for 25+ sessions', () => {
      // Find /Type /Pages /Count N
      const countMatch = rawStringE.match(/\/Type\s*\/Pages.*?\/Count\s+(\d+)/s);
      const pageCount = countMatch ? parseInt(countMatch[1], 10) : 0;
      expect(pageCount).toBeGreaterThan(1);
    });

    test('renders running footer with Page X of Y on all pages', () => {
      expect(extractedE).toContain('Page 1 of');
      expect(extractedE).toContain('StagePilot');
      expect(extractedE).toContain('AI Stage Co-Pilot & Run-of-Show Engine');
    });

    test('renders running header on subsequent pages', () => {
      expect(extractedE).toContain('STAGEPILOT RUN-OF-SHOW');
    });
  });

  // =========================================================================
  // 8. Missing Optional Data Resilience
  // =========================================================================
  describe('8. Resilience to Missing / Minimal Data', () => {
    test('handles completely empty input without crashing', async () => {
      const buffer = await generateRunOfShowPdf({});
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(800);
    });

    test('handles event with null/undefined venue, dates, and empty tracks', async () => {
      const sparseData = {
        event: {
          title: null,
          venue: undefined,
          date: null,
          healthStatus: undefined,
          totalDelayMinutes: null
        },
        tracks: [],
        sessions: []
      };

      const buffer = await generateRunOfShowPdf(sparseData, { compress: false });
      const extracted = extractPdfText(buffer);
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(extracted).toContain('StagePilot Run-of-Show Event');
      expect(extracted).toContain('Venue TBA');
    });

    test('handles session with missing speaker, missing duration, and missing times', async () => {
      const sparseSessionData = {
        event: { title: 'Sparse Session Event' },
        sessions: [
          {
            title: 'Minimal Session',
            track: 'Track Alpha',
            speaker: null,
            scheduledStartTime: null,
            scheduledEndTime: null,
            durationMinutes: null,
            delayMinutes: null,
            status: null
          }
        ]
      };

      const buffer = await generateRunOfShowPdf(sparseSessionData, { compress: false });
      const extracted = extractPdfText(buffer);
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(extracted).toContain('Minimal Session');
      expect(extracted).toContain('Speaker TBA');
      expect(extracted).toContain('Time TBA');
      expect(extracted).toContain('On Schedule');
    });
  });

  // =========================================================================
  // 9. Contract Normalization Unit Tests
  // =========================================================================
  describe('9. Contract Normalization Unit Tests', () => {
    test('normalizes aliases: name -> title, room -> track, designation -> title', () => {
      const raw = {
        event: { name: 'Alias Event Name' },
        tracks: ['Stage 1'],
        speakers: [{ id: 's1', name: 'John Doe', designation: 'Lead Tech' }],
        sessions: [{ name: 'Alias Session', room: 'Stage 1', speakerId: 's1' }]
      };

      const normalized = normalizeRunOfShowData(raw);
      expect(normalized.event.title).toBe('Alias Event Name');
      expect(normalized.tracks[0].name).toBe('Stage 1');
      expect(normalized.tracks[0].sessions[0].title).toBe('Alias Session');
      expect(normalized.tracks[0].sessions[0].speakerName).toBe('John Doe');
      expect(normalized.tracks[0].sessions[0].speakerAffiliation).toBe('Lead Tech');
    });

    test('cleanPdfText strips harmful characters and normalizes Unicode', () => {
      const text = pdfUtils.cleanPdfText('“Hello” — Dr. O’Connor • Café \u0000');
      expect(text).toBe('"Hello"  --  Dr. O\'Connor *  Café');
    });
  });

  // =========================================================================
  // 10. Sample Artifact Generation (Inspectable PDF files)
  // =========================================================================
  describe('10. Sample Artifact Generation', () => {
    test('generates sample PDF files for Fixtures A, B, C, D, E in docs/stage5_samples', async () => {
      const samplesDir = path.join(__dirname, '..', 'docs', 'stage5_samples');
      if (!fs.existsSync(samplesDir)) {
        fs.mkdirSync(samplesDir, { recursive: true });
      }

      const files = [
        { name: 'StagePilot_FixtureA_SingleTrack.pdf', fixture: fixtureA },
        { name: 'StagePilot_FixtureB_MultiTrack.pdf', fixture: fixtureB },
        { name: 'StagePilot_FixtureC_DelayedSessions.pdf', fixture: fixtureC },
        { name: 'StagePilot_FixtureD_SpecialCharacters.pdf', fixture: fixtureD },
        { name: 'StagePilot_FixtureE_MultiPage.pdf', fixture: fixtureE }
      ];

      for (const item of files) {
        const filePath = path.join(samplesDir, item.name);
        const buffer = await generateRunOfShowPdf(item.fixture, { outputPath: filePath });
        expect(fs.existsSync(filePath)).toBe(true);
        expect(buffer.length).toBeGreaterThan(1000);
      }
    });
  });
});
