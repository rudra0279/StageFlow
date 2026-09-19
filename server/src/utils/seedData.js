import mongoose from 'mongoose';
import { ENV } from '../config/env.js';
import { User } from '../models/User.js';
import { Event } from '../models/Event.js';
import { Session } from '../models/Session.js';
import { Speaker } from '../models/Speaker.js';
import { Announcement } from '../models/Announcement.js';
import { ScriptLog } from '../models/ScriptLog.js';
import { ROLES } from '../constants/roles.js';
import { SESSION_STATUS, HEALTH_STATUS, EVENT_STATUS } from '../constants/eventStatus.js';

export const seedDatabase = async (standalone = false) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log('[Seed] Connecting to MongoDB...');
      await mongoose.connect(ENV.MONGODB_URI);
      console.log('[Seed] Connected.');
    }

    // Clear old data
    await User.deleteMany({});
    await Event.deleteMany({});
    await Session.deleteMany({});
    await Speaker.deleteMany({});
    await Announcement.deleteMany({});
    await ScriptLog.deleteMany({});

    console.log('[Seed] Cleared existing records.');

    // 1. Create Users
    const organizer = await User.create({
      name: 'Sarah Connor',
      email: 'organizer@stagepilot.io',
      password: 'password123',
      role: ROLES.ORGANIZER,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
    });

    const anchor = await User.create({
      name: 'David Sterling',
      email: 'anchor@stagepilot.io',
      password: 'password123',
      role: ROLES.ANCHOR,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
    });

    console.log('[Seed] Created default users:');
    console.log('       Organizer: organizer@stagepilot.io / password123');
    console.log('       Anchor:    anchor@stagepilot.io / password123');

    // 2. Create Event
    const today = new Date();
    today.setHours(9, 0, 0, 0);

    const event = await Event.create({
      title: 'Global Tech Horizon Summit 2026',
      description: 'The premier annual summit exploring frontiers in Generative AI, Quantum Computing, and Next-Gen Robotics.',
      date: today,
      venue: 'Metropolitan Convention Hall – Main Stage',
      theme: 'Autonomous Intelligence & Frontier Systems',
      organizerId: organizer._id,
      totalDelayMinutes: 0,
      healthStatus: HEALTH_STATUS.ON_SCHEDULE,
      status: EVENT_STATUS.LIVE
    });

    // 3. Create Speakers
    const speaker1 = await Speaker.create({
      eventId: event._id,
      name: 'Dr. Elena Rostova',
      title: 'VP of Autonomous Systems',
      company: 'NeuroScale AI',
      bio: 'Leading researcher in multi-agent LLM systems and synthetic cognitive architectures.',
      pronunciationGuide: 'eh-LEH-nah ross-TOH-vah',
      keyAchievements: ['Pioneered AgentSwarm architecture', 'Author of "Beyond Single Modality"', 'MIT Tech Review 35 under 35'],
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200'
    });

    const speaker2 = await Speaker.create({
      eventId: event._id,
      name: 'Marcus Vance',
      title: 'Chief Quantum Architect',
      company: 'Qubit Logic Corp',
      bio: 'Pioneering fault-tolerant quantum algorithms and hybrid classical-quantum cloud pipelines.',
      pronunciationGuide: 'MAR-kus VANS',
      keyAchievements: ['Built first commercial 128-qubit cluster', 'Former Principal Quantum Scientist at IBM'],
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200'
    });

    const speaker3 = await Speaker.create({
      eventId: event._id,
      name: 'Aisha Al-Mansoor',
      title: 'Head of Robotics Innovation',
      company: 'Kinetics Dynamic',
      bio: 'Specialist in humanoid kinematics, real-time spatial vision, and physical AI safety controls.',
      pronunciationGuide: 'ah-EE-shah al-man-SOOR',
      keyAchievements: ['TEDx Speaker', 'Deployed autonomous rescue robotics in 4 continents'],
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200'
    });

    const speaker4 = await Speaker.create({
      eventId: event._id,
      name: 'Liam Chen',
      title: 'Managing Director',
      company: 'Horizon Ventures',
      bio: 'Veteran early-stage tech investor who backed 14 deep-tech unicorns in silicon and frontier AI.',
      pronunciationGuide: 'LEE-um CHEN',
      keyAchievements: ['Forbes Midas List 2024 & 2025', 'Early backer of OpenCompute'],
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200'
    });

    // 4. Create Sessions
    const start1 = new Date(today.getTime());
    const start2 = new Date(today.getTime() + 45 * 60000);
    const start3 = new Date(today.getTime() + 90 * 60000);
    const start4 = new Date(today.getTime() + 135 * 60000);

    const session1 = await Session.create({
      eventId: event._id,
      title: 'Opening Keynote: The Dawn of Autonomous Swarms',
      speakerId: speaker1._id,
      orderIndex: 0,
      scheduledStartTime: start1,
      calculatedStartTime: start1,
      actualStartTime: start1,
      durationMinutes: 45,
      delayOffsetMinutes: 0,
      status: SESSION_STATUS.LIVE,
      stageNotes: 'Check with audio desk on wireless mic 1 before Dr. Rostova takes the stage.',
      aiScripts: {
        opening: 'Welcome everyone to Global Tech Horizon Summit 2026! We stand at the precipice of a computational revolution. Today, we bring together the visionaries building the foundation of tomorrow.',
        introduction: 'It is my absolute pleasure to introduce Dr. Elena Rostova, VP of Autonomous Systems at NeuroScale AI. Elena has transformed how multi-agent architectures communicate and self-optimize. Please welcome Dr. Elena Rostova!'
      }
    });

    const session2 = await Session.create({
      eventId: event._id,
      title: 'Commercial Quantum Supremacy: Fact vs Fiction',
      speakerId: speaker2._id,
      orderIndex: 1,
      scheduledStartTime: start2,
      calculatedStartTime: start2,
      durationMinutes: 40,
      delayOffsetMinutes: 0,
      status: SESSION_STATUS.UPCOMING,
      stageNotes: 'Marcus has 3 live terminal demos. Screen sharing switches to HDMI 2.',
      aiScripts: {
        introduction: 'Next on stage, we dive deep into quantum hardware. Please give a warm welcome to Marcus Vance, Chief Quantum Architect at Qubit Logic Corp!'
      }
    });

    const session3 = await Session.create({
      eventId: event._id,
      title: 'Physical AI: Humanoids Walking into Industry',
      speakerId: speaker3._id,
      orderIndex: 2,
      scheduledStartTime: start3,
      calculatedStartTime: start3,
      durationMinutes: 40,
      delayOffsetMinutes: 0,
      status: SESSION_STATUS.UPCOMING,
      stageNotes: 'Robot prototype demo on stage right at minute 15.'
    });

    const session4 = await Session.create({
      eventId: event._id,
      title: 'Fireside Chat: Where the Smart Capital is Flowing',
      speakerId: speaker4._id,
      orderIndex: 3,
      scheduledStartTime: start4,
      calculatedStartTime: start4,
      durationMinutes: 40,
      delayOffsetMinutes: 0,
      status: SESSION_STATUS.UPCOMING,
      stageNotes: 'Audience mic runners need to be positioned for Q&A.'
    });

    // Update event active session
    event.currentSessionId = session1._id;
    await event.save();

    // 5. Create Initial Sample Announcement
    await Announcement.create({
      eventId: event._id,
      message: 'All speakers please mic up in Green Room B 15 minutes before talk.',
      urgency: 'LOW',
      type: 'STAGE_DIRECTION',
      senderRole: 'ORGANIZER'
    });

    console.log('[Seed] Successfully seeded event:');
    console.log(`       Event ID: ${event._id}`);
    console.log(`       Title:    ${event.title}`);
    console.log(`       Sessions: 4 agenda items`);
    console.log('[Seed] Done! You can now start the application.');

    if (standalone) {
      process.exit(0);
    }
  } catch (error) {
    console.error('[Seed] Error during database seeding:', error);
    if (standalone) {
      process.exit(1);
    }
    throw error;
  }
};

import { fileURLToPath } from 'url';
const isMain = process.argv[1] && (
  process.argv[1] === fileURLToPath(import.meta.url) ||
  process.argv[1].endsWith('seedData.js')
);

if (isMain) {
  seedDatabase(true);
}
