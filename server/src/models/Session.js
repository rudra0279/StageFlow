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
      type: Date
    },
    calculatedStartTime: {
      type: Date
    },
    startTime: {
      type: Date
    },
    endTime: {
      type: Date
    },
    type: {
      type: String,
      default: 'presentation'
    },
    room: {
      type: String,
      default: 'Main Stage'
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
      default: SESSION_STATUS.UPCOMING,
      uppercase: true
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
    },
    teleprompterState: {
      currentScriptType: { type: String, default: 'introduction' },
      scrollProgress: { type: Number, default: 0 },
      lastWordIndex: { type: Number, default: 0 },
      paceWpm: { type: Number, default: 0 },
      lastSpokenSnippet: { type: String, default: '' },
      updatedAt: { type: Date, default: null }
    }
  },
  { timestamps: true }
);

sessionSchema.pre('validate', function (next) {
  if (this.status) {
    this.status = this.status.toUpperCase();
  }
  if (!this.scheduledStartTime && this.startTime) {
    this.scheduledStartTime = this.startTime;
  }
  if (!this.startTime && this.scheduledStartTime) {
    this.startTime = this.scheduledStartTime;
  }
  if (!this.calculatedStartTime && this.scheduledStartTime) {
    this.calculatedStartTime = this.scheduledStartTime;
  }
  if (this.startTime && this.endTime) {
    const diffMins = Math.round((new Date(this.endTime) - new Date(this.startTime)) / 60000);
    if (diffMins > 0) {
      this.durationMinutes = diffMins;
    }
  } else if (this.scheduledStartTime && this.durationMinutes && !this.endTime) {
    this.endTime = new Date(new Date(this.scheduledStartTime).getTime() + this.durationMinutes * 60000);
  }
  if (!this.scheduledStartTime) {
    this.invalidate('scheduledStartTime', 'Session scheduledStartTime or startTime is required');
  }
  next();
});

export const Session = mongoose.model('Session', sessionSchema);
export const Agenda = Session;
