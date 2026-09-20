// src/constants/organizerRoles.js

const ORGANIZER_WORK_ROLES = {
  EVENT_LEAD: 'EVENT_LEAD',
  OPERATIONS: 'OPERATIONS',
  STAGE_MANAGER: 'STAGE_MANAGER',
  TECHNICAL: 'TECHNICAL',
  REGISTRATION: 'REGISTRATION',
  VOLUNTEER_COORDINATOR: 'VOLUNTEER_COORDINATOR',
  SPEAKER_COORDINATOR: 'SPEAKER_COORDINATOR',
  MARKETING: 'MARKETING',
  LOGISTICS: 'LOGISTICS',
  FINANCE: 'FINANCE',
  MEDIA: 'MEDIA',
  SECURITY: 'SECURITY',
  CUSTOM: 'CUSTOM',
};

const ORGANIZER_ROLE_DEFINITIONS = [
  {
    role: ORGANIZER_WORK_ROLES.EVENT_LEAD,
    name: 'Event Lead',
    description: 'Overall event coordination, schedule authority, and cross-team escalation.',
    defaultResponsibilities: ['Executive decision making', 'Timeline enforcement', 'VIP handling'],
  },
  {
    role: ORGANIZER_WORK_ROLES.STAGE_MANAGER,
    name: 'Stage Manager',
    description: 'Direct control of the physical/virtual stage, anchor liaison, and cue management.',
    defaultResponsibilities: ['Teleprompter coordination', 'Stage pacing', 'Speaker stage entry/exit'],
  },
  {
    role: ORGANIZER_WORK_ROLES.TECHNICAL,
    name: 'Technical / AV Lead',
    description: 'Audio, visual, live stream, stage screens, and teleprompter technical health.',
    defaultResponsibilities: ['Microphone checks', 'Audio alert testing', 'Network stability'],
  },
  {
    role: ORGANIZER_WORK_ROLES.SPEAKER_COORDINATOR,
    name: 'Speaker Coordinator',
    description: 'Speaker hospitality, green room management, bio & pronunciation verification.',
    defaultResponsibilities: ['Speaker arrival check-in', 'Phonetic guides review', 'Slide deck collection'],
  },
  {
    role: ORGANIZER_WORK_ROLES.REGISTRATION,
    name: 'Registration Lead',
    description: 'Attendee check-in, badge distribution, and queue flow control.',
    defaultResponsibilities: ['Desk coordination', 'Audience entry flow', 'Attendee credentials'],
  },
  {
    role: ORGANIZER_WORK_ROLES.OPERATIONS,
    name: 'Operations',
    description: 'General floor operations, supply logistics, and event runner dispatch.',
    defaultResponsibilities: ['Room readiness', 'Supply stocking', 'General task execution'],
  },
  {
    role: ORGANIZER_WORK_ROLES.VOLUNTEER_COORDINATOR,
    name: 'Volunteer Coordinator',
    description: 'Staff briefing, shift scheduling, and ground support deployment.',
    defaultResponsibilities: ['Volunteer check-in', 'Post assignments', 'Relief rotations'],
  },
  {
    role: ORGANIZER_WORK_ROLES.LOGISTICS,
    name: 'Logistics',
    description: 'Venue coordination, signage, catering, and transit.',
    defaultResponsibilities: ['Signage placement', 'Catering schedules', 'Venue staff coordination'],
  },
  {
    role: ORGANIZER_WORK_ROLES.MARKETING,
    name: 'Marketing & Outreach',
    description: 'Live audience engagement, social announcements, and sponsor recognition.',
    defaultResponsibilities: ['Live social coverage', 'Sponsor mentions', 'Attendee announcements'],
  },
  {
    role: ORGANIZER_WORK_ROLES.MEDIA,
    name: 'Media & Production',
    description: 'Photography, videography, press management, and recording capture.',
    defaultResponsibilities: ['Session recordings', 'Photo coverage', 'Press access'],
  },
  {
    role: ORGANIZER_WORK_ROLES.SECURITY,
    name: 'Security & Safety',
    description: 'Access control, emergency egress, and medical readiness.',
    defaultResponsibilities: ['Stage perimeter', 'Emergency routes', 'Incident response'],
  },
  {
    role: ORGANIZER_WORK_ROLES.FINANCE,
    name: 'Finance & Budget',
    description: 'Expense approvals, vendor payouts, and on-site budget reconciliation.',
    defaultResponsibilities: ['Vendor receipts', 'Per-diem coordination', 'Budget tracking'],
  },
  {
    role: ORGANIZER_WORK_ROLES.CUSTOM,
    name: 'Custom Work Role',
    description: 'Flexible role with customized responsibilities defined by the event lead.',
    defaultResponsibilities: ['Ad-hoc event support'],
  },
];

module.exports = {
  ORGANIZER_WORK_ROLES,
  ORGANIZER_ROLE_DEFINITIONS,
};
