import mongoose from 'mongoose';
import { ANNOUNCEMENT_TYPE, URGENCY_LEVEL } from '../constants/eventStatus.js';

const announcementSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: Object.values(ANNOUNCEMENT_TYPE),
      default: ANNOUNCEMENT_TYPE.GENERAL
    },
    urgency: {
      type: String,
      enum: Object.values(URGENCY_LEVEL),
      default: URGENCY_LEVEL.MEDIUM
    },
    senderRole: {
      type: String,
      default: 'ORGANIZER'
    },
    isDismissed: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export const Announcement = mongoose.model('Announcement', announcementSchema);
