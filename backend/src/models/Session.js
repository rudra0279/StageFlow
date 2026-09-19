import mongoose from 'mongoose';

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
      required: [true, 'Agenda item title is required'],
      trim: true
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
      enum: ['upcoming', 'live', 'completed', 'skipped'],
      default: 'upcoming'
    },
    stageNotes: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

export const Session = mongoose.model('Session', sessionSchema);
