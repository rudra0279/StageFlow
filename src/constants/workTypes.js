// src/constants/workTypes.js

const AVAILABLE_WORK_TYPES = [
  {
    id: 'STAGE_MANAGEMENT',
    name: 'Stage Management',
    category: 'OPERATIONS',
    defaultEnabled: true,
    suggestedRole: 'STAGE_MANAGER',
    description: 'Stage flow, anchor communication, audio/flash alerts, and session timing.',
  },
  {
    id: 'SPEAKER_MANAGEMENT',
    name: 'Speaker Management',
    category: 'PROGRAM',
    defaultEnabled: true,
    suggestedRole: 'SPEAKER_COORDINATOR',
    description: 'Speaker arrival, green room coordination, presentation files, and pronunciation.',
  },
  {
    id: 'REGISTRATION',
    name: 'Registration',
    category: 'LOGISTICS',
    defaultEnabled: true,
    suggestedRole: 'REGISTRATION',
    description: 'Audience check-in, badges, entry flow, and QR verification.',
  },
  {
    id: 'TECHNICAL_AV',
    name: 'Technical/AV',
    category: 'TECHNICAL',
    defaultEnabled: true,
    suggestedRole: 'TECHNICAL',
    description: 'Microphones, teleprompter, stage monitors, live stream, and audio chime alerts.',
  },
  {
    id: 'LOGISTICS',
    name: 'Logistics',
    category: 'LOGISTICS',
    defaultEnabled: false,
    suggestedRole: 'LOGISTICS',
    description: 'Signage, directional guidance, transport, and physical assets.',
  },
  {
    id: 'HOSPITALITY',
    name: 'Hospitality',
    category: 'OPERATIONS',
    defaultEnabled: false,
    suggestedRole: 'OPERATIONS',
    description: 'Green room catering, VIP reception, and refreshment management.',
  },
  {
    id: 'MARKETING',
    name: 'Marketing',
    category: 'OUTREACH',
    defaultEnabled: false,
    suggestedRole: 'MARKETING',
    description: 'Live social posts, event announcements, and audience engagement.',
  },
  {
    id: 'MEDIA',
    name: 'Media',
    category: 'MEDIA',
    defaultEnabled: false,
    suggestedRole: 'MEDIA',
    description: 'Event photography, session recording, and press briefings.',
  },
  {
    id: 'SECURITY',
    name: 'Security',
    category: 'SAFETY',
    defaultEnabled: false,
    suggestedRole: 'SECURITY',
    description: 'Access control, emergency egress check, and perimeter safety.',
  },
  {
    id: 'VOLUNTEER_MANAGEMENT',
    name: 'Volunteer Management',
    category: 'OPERATIONS',
    defaultEnabled: false,
    suggestedRole: 'VOLUNTEER_COORDINATOR',
    description: 'Volunteer briefing, shift scheduling, and station rotations.',
  },
  {
    id: 'FINANCE',
    name: 'Finance',
    category: 'ADMIN',
    defaultEnabled: false,
    suggestedRole: 'FINANCE',
    description: 'On-site vendor invoices, per-diem distribution, and receipts.',
  },
  {
    id: 'AUDIENCE_MANAGEMENT',
    name: 'Audience Management',
    category: 'OPERATIONS',
    defaultEnabled: false,
    suggestedRole: 'OPERATIONS',
    description: 'Hall seating flow, overflow rooms, and audience Q&A runners.',
  },
];

const WORK_TYPE_SUGGESTED_TASKS = {
  STAGE_MANAGEMENT: [
    {
      title: 'Review Run-of-Show with Anchor',
      description: 'Confirm session cues, intro pronunciations, and flash alert signals with the stage anchor.',
      priority: 'HIGH',
      workType: 'STAGE_MANAGEMENT',
      suggestedRole: 'STAGE_MANAGER',
    },
    {
      title: 'Verify Stage Cue Lighting and Speaker Timer',
      description: 'Test countdown display visibility from podium and confidence monitor.',
      priority: 'MEDIUM',
      workType: 'STAGE_MANAGEMENT',
      suggestedRole: 'STAGE_MANAGER',
    },
    {
      title: 'Check Green Room Stage Lineup',
      description: 'Ensure next speaker is in position 10 minutes prior to session start.',
      priority: 'MEDIUM',
      workType: 'STAGE_MANAGEMENT',
      suggestedRole: 'STAGE_MANAGER',
    },
  ],
  SPEAKER_MANAGEMENT: [
    {
      title: 'Confirm Speaker Arrival and Check-In',
      description: 'Verify all scheduled keynote and workshop speakers have checked in at the green room.',
      priority: 'HIGH',
      workType: 'SPEAKER_MANAGEMENT',
      suggestedRole: 'SPEAKER_COORDINATOR',
    },
    {
      title: 'Verify Presentation Slides and Display Aspect Ratio',
      description: 'Pre-load and test slide decks on stage presentation laptop in 16:9 ratio.',
      priority: 'HIGH',
      workType: 'SPEAKER_MANAGEMENT',
      suggestedRole: 'SPEAKER_COORDINATOR',
    },
    {
      title: 'Review Phonetic Pronunciation Guide with Anchor',
      description: 'Verify speaker name and company pronunciations in the StagePilot anchor station.',
      priority: 'MEDIUM',
      workType: 'SPEAKER_MANAGEMENT',
      suggestedRole: 'SPEAKER_COORDINATOR',
    },
  ],
  TECHNICAL_AV: [
    {
      title: 'Test Wireless Lavalier and Handheld Microphones',
      description: 'Complete RF spectrum sweep and audio level check for main stage microphones.',
      priority: 'URGENT',
      workType: 'TECHNICAL_AV',
      suggestedRole: 'TECHNICAL',
    },
    {
      title: 'Verify Teleprompter Feed and Auto-Scroll Follower',
      description: 'Ensure teleprompter web client is synchronized with speech follower engine.',
      priority: 'HIGH',
      workType: 'TECHNICAL_AV',
      suggestedRole: 'TECHNICAL',
    },
    {
      title: 'Test Audio Alert Chime and Flash Alert Overlay',
      description: 'Verify Socket.IO alert delivery to teleprompter and anchor displays.',
      priority: 'HIGH',
      workType: 'TECHNICAL_AV',
      suggestedRole: 'TECHNICAL',
    },
    {
      title: 'Run Live Stream and Recording Check',
      description: 'Confirm stream bitrates and local backup audio/video recording feeds.',
      priority: 'MEDIUM',
      workType: 'TECHNICAL_AV',
      suggestedRole: 'TECHNICAL',
    },
  ],
  REGISTRATION: [
    {
      title: 'Prepare Registration Desks and Scanners',
      description: 'Set up attendee check-in desks, badges, and QR verification terminals.',
      priority: 'HIGH',
      workType: 'REGISTRATION',
      suggestedRole: 'REGISTRATION',
    },
    {
      title: 'Verify Attendee and VIP Credential Lists',
      description: 'Audit registered attendee export against badge printer database.',
      priority: 'MEDIUM',
      workType: 'REGISTRATION',
      suggestedRole: 'REGISTRATION',
    },
  ],
  LOGISTICS: [
    {
      title: 'Audit Venue Directional Signage',
      description: 'Ensure clear wayfinding signs for Track A, Track B, Track C, and restrooms.',
      priority: 'MEDIUM',
      workType: 'LOGISTICS',
      suggestedRole: 'LOGISTICS',
    },
  ],
  SECURITY: [
    {
      title: 'Confirm Emergency Egress and Stage Perimeter Safety',
      description: 'Check that emergency exits are unobstructed and security staff is stationed.',
      priority: 'HIGH',
      workType: 'SECURITY',
      suggestedRole: 'SECURITY',
    },
  ],
  VOLUNTEER_MANAGEMENT: [
    {
      title: 'Brief Volunteer Crew on StagePilot Station Roles',
      description: 'Assign runner posts for microphone handling and audience Q&A support.',
      priority: 'MEDIUM',
      workType: 'VOLUNTEER_MANAGEMENT',
      suggestedRole: 'VOLUNTEER_COORDINATOR',
    },
  ],
  MARKETING: [
    {
      title: 'Publish Opening Ceremony Live Stream Announcement',
      description: 'Post live stream link and event hashtag on official channels.',
      priority: 'LOW',
      workType: 'MARKETING',
      suggestedRole: 'MARKETING',
    },
  ],
  MEDIA: [
    {
      title: 'Setup Official Stage Photographer and Press Pit',
      description: 'Ensure media riser has clear line of sight to main stage and anchor position.',
      priority: 'LOW',
      workType: 'MEDIA',
      suggestedRole: 'MEDIA',
    },
  ],
  HOSPITALITY: [
    {
      title: 'Stock Green Room and Speaker Lounge Refreshments',
      description: 'Check water, coffee, and catering readiness for arriving speakers.',
      priority: 'LOW',
      workType: 'HOSPITALITY',
      suggestedRole: 'OPERATIONS',
    },
  ],
  FINANCE: [
    {
      title: 'Prepare Cash Box and Vendor Invoice Sign-Off Binder',
      description: 'Have receipt envelopes and authorization signature forms ready.',
      priority: 'LOW',
      workType: 'FINANCE',
      suggestedRole: 'FINANCE',
    },
  ],
  AUDIENCE_MANAGEMENT: [
    {
      title: 'Coordinate Main Auditorium Seating Flow',
      description: 'Monitor hall occupancy and open overflow seating when main floor reaches 85%.',
      priority: 'MEDIUM',
      workType: 'AUDIENCE_MANAGEMENT',
      suggestedRole: 'OPERATIONS',
    },
  ],
};

function getDefaultWorkTypes() {
  return AVAILABLE_WORK_TYPES.map(wt => ({
    id: wt.id,
    name: wt.name,
    category: wt.category,
    enabled: wt.defaultEnabled,
    suggestedRole: wt.suggestedRole,
    description: wt.description,
  }));
}

function getSuggestedTasksForWorkTypes(enabledWorkTypeIds = []) {
  const suggestions = [];
  for (const wtId of enabledWorkTypeIds) {
    if (WORK_TYPE_SUGGESTED_TASKS[wtId]) {
      suggestions.push(...WORK_TYPE_SUGGESTED_TASKS[wtId]);
    }
  }
  return suggestions;
}

module.exports = {
  AVAILABLE_WORK_TYPES,
  WORK_TYPE_SUGGESTED_TASKS,
  getDefaultWorkTypes,
  getSuggestedTasksForWorkTypes,
};
