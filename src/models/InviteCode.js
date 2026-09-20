// src/models/InviteCode.js
const mongoose = require('mongoose');
const { MemoryInviteCode } = require('./inMemoryStore');

const InviteCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Invite code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    registrationType: {
      type: String,
      enum: ['ORGANIZER', 'ANCHOR', 'ATTENDEE', 'ADMIN'],
      default: 'ORGANIZER',
      required: true,
    },
    role: {
      type: String,
      enum: ['organizer', 'anchor', 'admin', 'attendee'],
      default: 'organizer',
      required: true,
    },
    workRole: {
      type: String,
      default: 'OPERATIONS',
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    maxUses: {
      type: Number,
      default: 1,
      min: 1,
    },
    currentUses: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const MongooseInviteCode = mongoose.models.InviteCode || mongoose.model('InviteCode', InviteCodeSchema);

const InviteCodeProxy = new Proxy(MongooseInviteCode, {
  get(target, prop) {
    if (process.env.NODE_ENV === 'test' || process.env.USE_IN_MEMORY_DB === 'true' || mongoose.connection.readyState === 0) {
      if (prop in MemoryInviteCode) {
        return MemoryInviteCode[prop];
      }
    }
    return target[prop];
  },
});

module.exports = InviteCodeProxy;
