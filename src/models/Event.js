// src/models/Event.js
const mongoose = require('mongoose');
const { MemoryEvent } = require('./inMemoryStore');

const EventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true,
    },
    audience: {
      type: String,
      default: 'General audience, students, and professionals',
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
    },
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'UPCOMING', 'LIVE', 'COMPLETED', 'PAUSED'],
      default: 'UPCOMING',
    },
    currentSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agenda',
      default: null,
    },
    eventHealth: {
      type: String,
      enum: ['ON_TRACK', 'SLIGHT_DELAY', 'RUNNING_LATE', 'CRITICAL_DELAY'],
      default: 'ON_TRACK',
    },
    delayTotalMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

const MongooseEvent = mongoose.models.Event || mongoose.model('Event', EventSchema);

const EventProxy = new Proxy(MongooseEvent, {
  get(target, prop) {
    if (process.env.NODE_ENV === 'test' || process.env.USE_IN_MEMORY_DB === 'true' || mongoose.connection.readyState === 0) {
      if (prop in MemoryEvent) {
        return MemoryEvent[prop];
      }
    }
    return target[prop];
  }
});

module.exports = EventProxy;
