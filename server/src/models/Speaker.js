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
      required: [true, 'Speaker title / designation is required'],
      trim: true
    },
    company: {
      type: String,
      default: ''
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
      default: '',
      help: 'Phonetic spelling for stage anchor (e.g., POH-vahn)'
    },
    keyAchievements: {
      type: [String],
      default: []
    },
    avatarUrl: {
      type: String,
      default: ''
    },
    socialLinks: {
      twitter: String,
      linkedin: String,
      website: String
    }
  },
  { timestamps: true }
);

export const Speaker = mongoose.model('Speaker', speakerSchema);
