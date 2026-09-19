// src/models/Agenda.js
const mongoose = require('mongoose');
const { MemoryAgenda } = require('./inMemoryStore');

const AgendaSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Session title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    speakerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Speaker',
      default: null,
    },
    startTime: {
      type: Date,
      required: [true, 'Session start time is required'],
    },
    endTime: {
      type: Date,
      required: [true, 'Session end time is required'],
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ['UPCOMING', 'LIVE', 'COMPLETED', 'DELAYED', 'SKIPPED'],
      default: 'UPCOMING',
    },
    type: {
      type: String,
      enum: ['KEYNOTE', 'WORKSHOP', 'BREAK', 'PANEL', 'PRESENTATION', 'CEREMONY', 'OTHER'],
      default: 'KEYNOTE',
    },
    room: {
      type: String,
      default: 'Main Stage',
    },
    delayMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    orderIndex: {
      type: Number,
      default: 0,
    },
    track: {
      type: String,
      default: null,
    },
    trackId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const MongooseAgenda = mongoose.models.Agenda || mongoose.model('Agenda', AgendaSchema);

const AgendaProxy = new Proxy(MongooseAgenda, {
  get(target, prop) {
    if (process.env.NODE_ENV === 'test' || process.env.USE_IN_MEMORY_DB === 'true' || mongoose.connection.readyState === 0) {
      if (prop in MemoryAgenda) {
        return MemoryAgenda[prop];
      }
    }
    return target[prop];
  }
});

module.exports = AgendaProxy;
