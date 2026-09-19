import mongoose from 'mongoose';
import { SESSION_STATUS } from '../constants/eventStatus.js';

const sessionSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Session title is required'],
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    speakerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Speaker',
      default: null
    },
    orderIndex: {
      type: Number,
      required: true,
      default: 0
    },
    scheduledStartTime: {
      type: Date,
      required: true
    },
    calculatedStartTime: {
      type: Date,
      required: true
    },
    actualStartTime: {
      type: Date,
      default: null
    },
    actualEndTime: {
      type: Date,
      default: null
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
      default: 30
    },
    delayOffsetMinutes: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: Object.values(SESSION_STATUS),
      default: SESSION_STATUS.UPCOMING
    },
    aiScripts: {
      opening: { type: String, default: '' },
      introduction: { type: String, default: '' },
      transition: { type: String, default: '' },
      closing: { type: String, default: '' },
      delay: { type: String, default: '' }
    },
    stageNotes: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

export const Session = mongoose.model('Session', sessionSchema);
