import mongoose from 'mongoose';

const inviteCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    registrationType: {
      type: String,
      enum: ['ORGANIZER', 'ANCHOR', 'ATTENDEE', 'ADMIN'],
      default: 'ORGANIZER',
    },
    role: {
      type: String,
      default: 'organizer',
    },
    roleTitle: {
      type: String,
      default: 'Organizer',
    },
    responsibility: {
      type: String,
      default: 'Event Operations & Coordination',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED', 'DISABLED', 'EXHAUSTED'],
      default: 'ACTIVE',
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    maxUses: {
      type: Number,
      default: 100,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export const InviteCode = mongoose.models.InviteCode || mongoose.model('InviteCode', inviteCodeSchema);
