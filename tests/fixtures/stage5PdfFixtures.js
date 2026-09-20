// tests/fixtures/stage5PdfFixtures.js

/**
 * Stage 5 Run-of-Show PDF Exporter Test Fixtures
 * Matches the normalized Run-of-Show export contract.
 */

// Fixture A: One track, three sessions (clean single page)
const fixtureA = {
  event: {
    title: 'StagePilot Single Track Showcase',
    date: '2026-09-20',
    venue: 'Auditorium Alpha',
    healthStatus: 'ON_TRACK',
    totalDelayMinutes: 0,
    status: 'LIVE'
  },
  tracks: [
    { id: 'track-a', name: 'Track A (Main Stage)' }
  ],
  speakers: [
    { id: 'spk-1', name: 'Jane Doe', title: 'VP of Product', company: 'StagePilot Inc.' },
    { id: 'spk-2', name: 'Alex Smith', title: 'Principal Architect', company: 'CloudScale' },
    { id: 'spk-3', name: 'Morgan Lee', title: 'Community Lead', company: 'OpenSource Guild' }
  ],
  sessions: [
    {
      id: 'sess-a1',
      title: 'Opening Welcome & Keynote Kickoff',
      track: 'Track A (Main Stage)',
      speakerId: 'spk-1',
      orderIndex: 0,
      scheduledStartTime: '2026-09-20T09:00:00Z',
      scheduledEndTime: '2026-09-20T09:30:00Z',
      currentStartTime: '2026-09-20T09:00:00Z',
      currentEndTime: '2026-09-20T09:30:00Z',
      durationMinutes: 30,
      delayMinutes: 0,
      status: 'COMPLETED'
    },
    {
      id: 'sess-a2',
      title: 'Architecting Event-Driven Live Teleprompters',
      track: 'Track A (Main Stage)',
      speakerId: 'spk-2',
      orderIndex: 1,
      scheduledStartTime: '2026-09-20T09:30:00Z',
      scheduledEndTime: '2026-09-20T10:30:00Z',
      currentStartTime: '2026-09-20T09:30:00Z',
      currentEndTime: '2026-09-20T10:30:00Z',
      durationMinutes: 60,
      delayMinutes: 0,
      status: 'LIVE'
    },
    {
      id: 'sess-a3',
      title: 'Community Town Hall & Closing Address',
      track: 'Track A (Main Stage)',
      speakerId: 'spk-3',
      orderIndex: 2,
      scheduledStartTime: '2026-09-20T10:30:00Z',
      scheduledEndTime: '2026-09-20T11:00:00Z',
      currentStartTime: '2026-09-20T10:30:00Z',
      currentEndTime: '2026-09-20T11:00:00Z',
      durationMinutes: 30,
      delayMinutes: 0,
      status: 'UPCOMING'
    }
  ],
  exportTimestamp: '2026-09-20T09:45:00.000Z'
};

// Fixture B: Multi-track (Track A, Track B, Track C) with multiple sessions
const fixtureB = {
  event: {
    title: 'Global Tech Horizon Summit 2026',
    date: '2026-09-20',
    venue: 'San Francisco Convention Center',
    healthStatus: 'ON_TRACK',
    totalDelayMinutes: 0,
    status: 'LIVE'
  },
  tracks: [
    { id: 'track-a', name: 'Track A (Main Stage)' },
    { id: 'track-b', name: 'Track B (Workshop Hall)' },
    { id: 'track-c', name: 'Track C (Networking Lounge)' }
  ],
  speakers: [
    { id: 'spk-101', name: 'Elena Rostova', title: 'Head of Engineering', company: 'Quantum Robotics' },
    { id: 'spk-102', name: 'Carlos Santos', title: 'VP of Infrastructure', company: 'Global Data Corp' },
    { id: 'spk-103', name: 'Aisha Patel', title: 'Lead AI Researcher', company: 'DeepCognition Lab' },
    { id: 'spk-104', name: 'Hiroshi Tanaka', title: 'Principal Engineer', company: 'Edge Compute Ltd' },
    { id: 'spk-105', name: 'Zoe Washington', title: 'Product Director', company: 'SyncWave' },
    { id: 'spk-106', name: 'Marcus Brody', title: 'Founder & CEO', company: 'VentureSprint' }
  ],
  sessions: [
    // Track A
    {
      id: 'sess-b1',
      title: 'The Future of Autonomous Distributed Systems',
      track: 'Track A (Main Stage)',
      speakerId: 'spk-101',
      orderIndex: 0,
      scheduledStartTime: '2026-09-20T10:00:00Z',
      scheduledEndTime: '2026-09-20T11:00:00Z',
      durationMinutes: 60,
      delayMinutes: 0,
      status: 'LIVE'
    },
    {
      id: 'sess-b2',
      title: 'Zero-Latency Multi-Region Data Replication',
      track: 'Track A (Main Stage)',
      speakerId: 'spk-102',
      orderIndex: 1,
      scheduledStartTime: '2026-09-20T11:00:00Z',
      scheduledEndTime: '2026-09-20T12:00:00Z',
      durationMinutes: 60,
      delayMinutes: 0,
      status: 'UPCOMING'
    },
    // Track B
    {
      id: 'sess-b3',
      title: 'Hands-on Workshop: Building Generative AI Workflows',
      track: 'Track B (Workshop Hall)',
      speakerId: 'spk-103',
      orderIndex: 0,
      scheduledStartTime: '2026-09-20T10:00:00Z',
      scheduledEndTime: '2026-09-20T11:30:00Z',
      durationMinutes: 90,
      delayMinutes: 0,
      status: 'LIVE'
    },
    {
      id: 'sess-b4',
      title: 'Practical Edge Computing Deployments with WebAssembly',
      track: 'Track B (Workshop Hall)',
      speakerId: 'spk-104',
      orderIndex: 1,
      scheduledStartTime: '2026-09-20T11:30:00Z',
      scheduledEndTime: '2026-09-20T12:30:00Z',
      durationMinutes: 60,
      delayMinutes: 0,
      status: 'UPCOMING'
    },
    // Track C
    {
      id: 'sess-b5',
      title: 'Speed Mentoring: Scaling from Seed to Series B',
      track: 'Track C (Networking Lounge)',
      speakerId: 'spk-105',
      orderIndex: 0,
      scheduledStartTime: '2026-09-20T10:30:00Z',
      scheduledEndTime: '2026-09-20T11:30:00Z',
      durationMinutes: 60,
      delayMinutes: 0,
      status: 'LIVE'
    },
    {
      id: 'sess-b6',
      title: 'Founders & Investors Roundtable',
      track: 'Track C (Networking Lounge)',
      speakerId: 'spk-106',
      orderIndex: 1,
      scheduledStartTime: '2026-09-20T11:30:00Z',
      scheduledEndTime: '2026-09-20T12:30:00Z',
      durationMinutes: 60,
      delayMinutes: 0,
      status: 'UPCOMING'
    }
  ],
  exportTimestamp: '2026-09-20T10:15:00.000Z'
};

// Fixture C: Delayed sessions with adjusted times
const fixtureC = {
  event: {
    title: 'Live Stage Operations Summit',
    date: '2026-09-20',
    venue: 'Metropolitan Center, Hall 4',
    healthStatus: 'SLIGHT_DELAY',
    totalDelayMinutes: 15,
    status: 'LIVE'
  },
  tracks: [
    { id: 'track-a', name: 'Track A (Main Stage)' }
  ],
  speakers: [
    { id: 'spk-c1', name: 'Rachel Greene', title: 'Production Manager', company: 'Global Live Media' },
    { id: 'spk-c2', name: 'David Kim', title: 'Technical Director', company: 'AudioVisual Pro' },
    { id: 'spk-c3', name: 'Sarah Lin', title: 'Operations Lead', company: 'StageFlow Network' }
  ],
  sessions: [
    {
      id: 'sess-c1',
      title: 'Opening Logistics Briefing',
      track: 'Track A (Main Stage)',
      speakerId: 'spk-c1',
      orderIndex: 0,
      scheduledStartTime: '09:00',
      scheduledEndTime: '10:00',
      currentStartTime: '09:00',
      currentEndTime: '10:00',
      durationMinutes: 60,
      delayMinutes: 0,
      status: 'COMPLETED'
    },
    {
      id: 'sess-c2',
      title: 'Handling Unexpected Stage Overruns & Speaker Delays',
      track: 'Track A (Main Stage)',
      speakerId: 'spk-c2',
      orderIndex: 1,
      scheduledStartTime: '10:00',
      scheduledEndTime: '11:00',
      currentStartTime: '10:15',
      currentEndTime: '11:15',
      durationMinutes: 60,
      delayMinutes: 15,
      status: 'LIVE'
    },
    {
      id: 'sess-c3',
      title: 'Cascading Schedule Synchronization in Multi-Track Venues',
      track: 'Track A (Main Stage)',
      speakerId: 'spk-c3',
      orderIndex: 2,
      scheduledStartTime: '11:00',
      scheduledEndTime: '12:00',
      currentStartTime: '11:15',
      currentEndTime: '12:15',
      durationMinutes: 60,
      delayMinutes: 15,
      status: 'UPCOMING'
    }
  ],
  exportTimestamp: '2026-09-20T10:20:00.000Z'
};

// Fixture D: Long titles, special characters, and Unicode punctuation
const fixtureD = {
  event: {
    title: 'The 18th Annual International Symposium on Autonomous Systems, Cloud Infrastructures, and Next-Generation Artificial Intelligence Engineering — Grand Paris Conference',
    date: '2026-09-20',
    venue: 'Café & Exposition Hall “Le Méridien”, Boulevard Saint-Germain, Paris',
    healthStatus: 'ON_TRACK',
    totalDelayMinutes: 0,
    status: 'LIVE'
  },
  tracks: [
    { id: 'track-special', name: 'Track A (Keynotes & Special Sessions — Amphithéâtre)' }
  ],
  speakers: [
    {
      id: 'spk-d1',
      name: 'Dr. José García & Dr. O\'Connor',
      title: 'Distinguished Chairs of AI & Education',
      company: 'R&D Institute for Computational Linguistics'
    },
    {
      id: 'spk-d2',
      name: 'Professor François H. Müller-Schneider',
      title: 'Lead Scientist for High-Throughput Neural Systems & Robotics',
      company: 'Laboratoire Européen de Recherche et Développement (L’École Polytechnique)'
    }
  ],
  sessions: [
    {
      id: 'sess-d1',
      title: 'Opening Remarks: Café Culture, Human Creativity, and AI & Education in Modern R&D Environments',
      track: 'Track A (Keynotes & Special Sessions — Amphithéâtre)',
      speakerId: 'spk-d1',
      orderIndex: 0,
      scheduledStartTime: '09:00',
      scheduledEndTime: '10:15',
      currentStartTime: '09:00',
      currentEndTime: '10:15',
      durationMinutes: 75,
      delayMinutes: 0,
      status: 'COMPLETED'
    },
    {
      id: 'sess-d2',
      title: 'Deep Dive: “Next-Generation Cognitive Architectures” — Evaluating Low-Latency Inference, Edge Micro-Services, and Real-Time Telemetry Under Heavy Operational Loads (2026 Edition)',
      track: 'Track A (Keynotes & Special Sessions — Amphithéâtre)',
      speakerId: 'spk-d2',
      orderIndex: 1,
      scheduledStartTime: '10:15',
      scheduledEndTime: '11:45',
      currentStartTime: '10:15',
      currentEndTime: '11:45',
      durationMinutes: 90,
      delayMinutes: 0,
      status: 'LIVE'
    }
  ],
  exportTimestamp: '2026-09-20T10:30:00.000Z'
};

// Fixture E: Enough sessions for multiple pages (25 sessions across 3 tracks)
const generateFixtureE = () => {
  const tracks = [
    { id: 't-1', name: 'Track A (Main Stage)' },
    { id: 't-2', name: 'Track B (Technical Deep Dives)' },
    { id: 't-3', name: 'Track C (Workshops & Hands-On)' }
  ];

  const sessions = [];
  const speakers = [];

  const sessionTemplates = [
    'Keynote Address: Scaling Distributed State Machines',
    'High-Throughput WebSocket Broadcast Architectures',
    'Zero-Downtime Schema Migrations in Production',
    'Real-Time Audio Analysis & Teleprompter Tracking',
    'Microservices Observability with OpenTelemetry',
    'Database Sharding vs Distributed SQL: Benchmarks',
    'Designing Resilient Offline-First Client Applications',
    'Automated Quality Assurance in Continuous Delivery Pipelines',
    'Building Real-Time Live Stage Management Applications',
    'Interactive Audience Q&A Scaling Under Spikes'
  ];

  let sessCount = 0;
  tracks.forEach((track, tIdx) => {
    const countForTrack = tIdx === 0 ? 10 : 8;
    for (let i = 0; i < countForTrack; i++) {
      sessCount++;
      const spkId = `spk_e_${sessCount}`;
      const speaker = {
        id: spkId,
        name: `Speaker ${sessCount} (${['Dr. Adams', 'Eng. Chen', 'Prof. Novak', 'Dev. Garcia'][i % 4]})`,
        title: `Staff Engineer #${i + 1}`,
        company: `Tech Enterprise Group ${String.fromCharCode(65 + (i % 5))}`
      };
      speakers.push(speaker);

      const startHour = 8 + Math.floor(i * 1.2);
      const startMin = (i * 15) % 60;
      const endHour = startHour + 1;
      const endMin = startMin;

      const schedStart = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`;
      const schedEnd = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

      const delay = (i === 3 || i === 4) ? 15 : 0;
      const currStart = delay > 0 ? `${String(startHour).padStart(2, '0')}:${String(startMin + 15).padStart(2, '0')}` : schedStart;
      const currEnd = delay > 0 ? `${String(endHour).padStart(2, '0')}:${String(endMin + 15).padStart(2, '0')}` : schedEnd;

      sessions.push({
        id: `sess-e-${sessCount}`,
        title: `${sessionTemplates[i % sessionTemplates.length]} [Session ${sessCount}]`,
        track: track.name,
        speakerId: spkId,
        orderIndex: i,
        scheduledStartTime: schedStart,
        scheduledEndTime: schedEnd,
        currentStartTime: currStart,
        currentEndTime: currEnd,
        durationMinutes: 60,
        delayMinutes: delay,
        status: i === 0 ? 'COMPLETED' : (i === 1 ? 'LIVE' : (delay > 0 ? 'DELAYED' : 'UPCOMING'))
      });
    }
  });

  return {
    event: {
      title: 'Global Multi-Day Mega Conference 2026 — Comprehensive Run-of-Show',
      date: '2026-09-20',
      venue: 'Metropolitan Convention Complex, Halls 1–5',
      healthStatus: 'SLIGHT_DELAY',
      totalDelayMinutes: 15,
      status: 'LIVE'
    },
    tracks,
    speakers,
    sessions,
    exportTimestamp: '2026-09-20T08:00:00.000Z'
  };
};

const fixtureE = generateFixtureE();

module.exports = {
  fixtureA,
  fixtureB,
  fixtureC,
  fixtureD,
  fixtureE
};
