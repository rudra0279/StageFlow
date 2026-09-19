import mongoose from 'mongoose';

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
      required: [true, 'Announcement message is required'],
      trim: true
    },
    type: {
      type: String,
      enum: ['delay', 'emergency', 'stage_direction', 'general'],
      default: 'general'
    },
    urgency: {
      type: String,
      enum: ['low', 'medium', 'critical'],
      default: 'medium'
    },
    isDismissed: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export const Announcement = mongoose.model('Announcement', announcementSchema);
