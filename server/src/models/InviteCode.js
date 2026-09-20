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
      default: null
    },
    currentUses: {
      type: Number,
      default: 0
    },
    workRole: {
      type: String,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Synchronize usageCount and currentUses
inviteCodeSchema.pre('save', function (next) {
  if (this.currentUses !== undefined && this.usageCount === 0 && this.currentUses > 0) {
    this.usageCount = this.currentUses;
  }
  if (this.usageCount !== undefined && this.currentUses === 0 && this.usageCount > 0) {
    this.currentUses = this.usageCount;
  }
  if (this.workRole && !this.roleTitle) {
    this.roleTitle = this.workRole;
  }
  if (this.roleTitle && !this.workRole) {
    this.workRole = this.roleTitle;
  }
  if (this.isActive === false && this.status === 'ACTIVE') {
    this.status = 'DISABLED';
  }
  next();
});

export const InviteCode = mongoose.models.InviteCode || mongoose.model('InviteCode', inviteCodeSchema);
