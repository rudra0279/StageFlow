// src/models/Announcement.js
const mongoose = require('mongoose');
const { MemoryAnnouncement } = require('./inMemoryStore');

const AnnouncementSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    message: {
      type: String,
      required: [true, 'Announcement message is required'],
      trim: true,
    },
    formattedSpeech: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['GENERAL', 'URGENT', 'SCHEDULE_CHANGE', 'FOOD', 'EMERGENCY'],
      default: 'GENERAL',
    },
    priority: {
      type: String,
      enum: ['NORMAL', 'HIGH', 'CRITICAL'],
      default: 'NORMAL',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

const MongooseAnnouncement = mongoose.models.Announcement || mongoose.model('Announcement', AnnouncementSchema);

const AnnouncementProxy = new Proxy(MongooseAnnouncement, {
  get(target, prop) {
    if (process.env.NODE_ENV === 'test' || process.env.USE_IN_MEMORY_DB === 'true' || mongoose.connection.readyState === 0) {
      if (prop in MemoryAnnouncement) {
        return MemoryAnnouncement[prop];
      }
    }
    return target[prop];
  }
});

module.exports = AnnouncementProxy;
