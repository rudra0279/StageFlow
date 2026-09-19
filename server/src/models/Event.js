import mongoose from 'mongoose';
import { EVENT_STATUS, HEALTH_STATUS } from '../constants/eventStatus.js';

const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true
    },
    title: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    date: {
      type: Date,
      required: true
    },
    startTime: {
      type: Date
    },
    endTime: {
      type: Date
    },
    venue: {
      type: String,
      default: 'Main Stage'
    },
    category: {
      type: String,
      enum: ['hackathon', 'workshop', 'seminar', 'competition', 'cultural', 'other'],
      default: 'hackathon'
    },
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    currentSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      default: null
    },
    totalDelayMinutes: {
      type: Number,
      default: 0
    },
    healthStatus: {
      type: String,
      enum: Object.values(HEALTH_STATUS),
      default: HEALTH_STATUS.ON_SCHEDULE
    },
    status: {
      type: String,
      enum: Object.values(EVENT_STATUS),
      default: EVENT_STATUS.DRAFT
    },
    theme: {
      type: String,
      default: 'Tech & Innovation'
    }
  },
  { timestamps: true }
);

eventSchema.pre('validate', function (next) {
  if (!this.title && this.name) {
    this.title = this.name;
  }
  if (!this.name && this.title) {
    this.name = this.title;
  }
  if (!this.title) {
    this.invalidate('title', 'Event title or name is required');
  }
  next();
});

export const Event = mongoose.model('Event', eventSchema);
