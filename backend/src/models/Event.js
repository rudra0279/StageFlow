import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    date: {
      type: Date,
      required: [true, 'Event date is required']
    },
    venue: {
      type: String,
      default: 'Main Auditorium'
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
    status: {
      type: String,
      enum: ['draft', 'live', 'paused', 'completed'],
      default: 'draft'
    },
    totalDelayMinutes: {
      type: Number,
      default: 0
    },
    healthStatus: {
      type: String,
      enum: ['on_schedule', 'running_late', 'disrupted'],
      default: 'on_schedule'
    }
  },
  { timestamps: true }
);

export const Event = mongoose.model('Event', eventSchema);
