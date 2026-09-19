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
      trim: true
    },
    designation: {
      type: String,
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
    topic: {
      type: String,
      default: ''
    },
    bio: {
      type: String,
      default: ''
    },
    biography: {
      type: String,
      default: ''
    },
    pronunciationGuide: {
      type: String,
      default: '',
      help: 'Phonetic spelling for stage anchor (e.g., POH-vahn)'
    },
    phoneticName: {
      type: String,
      default: ''
    },
    keyAchievements: {
      type: [String],
      default: []
    },
    avatarUrl: {
      type: String,
      default: ''
    },
    profilePhoto: {
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

speakerSchema.pre('validate', function(next) {
  if (!this.title && this.designation) this.title = this.designation;
  if (!this.designation && this.title) this.designation = this.title;
  if (!this.company && this.organization) this.company = this.organization;
  if (!this.organization && this.company) this.organization = this.company;
  if (!this.bio && this.biography) this.bio = this.biography;
  if (!this.biography && this.bio) this.biography = this.bio;
  if (!this.avatarUrl && this.profilePhoto) this.avatarUrl = this.profilePhoto;
  if (!this.profilePhoto && this.avatarUrl) this.profilePhoto = this.avatarUrl;
  if (!this.title) {
    this.title = 'Speaker';
  }
  next();
});

speakerSchema.pre('save', function(next) {
  if (!this.phoneticName && this.pronunciationGuide) {
    this.phoneticName = this.pronunciationGuide;
  }
  if (!this.pronunciationGuide && this.phoneticName) {
    this.pronunciationGuide = this.phoneticName;
  }
  next();
});

export const Speaker = mongoose.model('Speaker', speakerSchema);
