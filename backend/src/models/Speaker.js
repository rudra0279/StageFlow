import mongoose from 'mongoose';

const speakerSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Speaker name is required'],
      trim: true
    },
    title: {
      type: String,
      required: [true, 'Speaker title / role is required'],
      trim: true
    },
    organization: {
      type: String,
      default: ''
    },
    bio: {
      type: String,
      default: ''
    },
    pronunciationGuide: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

export const Speaker = mongoose.model('Speaker', speakerSchema);
