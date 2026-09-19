// src/models/Speaker.js
const mongoose = require('mongoose');
const { MemorySpeaker } = require('./inMemoryStore');

const SpeakerSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Speaker name is required'],
      trim: true,
    },
    designation: {
      type: String,
      default: '',
      trim: true,
    },
    organization: {
      type: String,
      default: '',
      trim: true,
    },
    topic: {
      type: String,
      default: '',
      trim: true,
    },
    bio: {
      type: String,
      default: '',
    },
    pronunciationGuide: {
      type: String,
      default: '',
      trim: true,
    },
    photo: {
      type: String,
      default: '',
    },
    linkedin: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const MongooseSpeaker = mongoose.models.Speaker || mongoose.model('Speaker', SpeakerSchema);

const SpeakerProxy = new Proxy(MongooseSpeaker, {
  get(target, prop) {
    if (process.env.NODE_ENV === 'test' || process.env.USE_IN_MEMORY_DB === 'true' || mongoose.connection.readyState === 0) {
      if (prop in MemorySpeaker) {
        return MemorySpeaker[prop];
      }
    }
    return target[prop];
  }
});

module.exports = SpeakerProxy;
