import mongoose from 'mongoose';
import { QUESTION_STATUS } from '../constants/eventStatus.js';

const questionSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
      index: true
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      default: null,
      index: true
    },
    trackId: {
      type: String,
      default: null,
      trim: true,
      index: true
    },
    question: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
      minlength: [3, 'Question must be at least 3 characters'],
      maxlength: [500, 'Question cannot exceed 500 characters']
    },
    authorName: {
      type: String,
      trim: true,
      default: 'Anonymous',
      maxlength: [100, 'Author name cannot exceed 100 characters']
    },
    status: {
      type: String,
      enum: Object.values(QUESTION_STATUS),
      default: QUESTION_STATUS.PENDING,
      uppercase: true,
      index: true
    },
    upvotes: {
      type: Number,
      default: 0,
      min: 0,
      index: true
    },
    upvotedBy: {
      type: [String],
      default: [],
      select: false
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    moderatedAt: {
      type: Date,
      default: null
    },
    aiAnswerSuggestion: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual alias 'text' -> 'question'
questionSchema.virtual('text').get(function () {
  return this.question;
});

// Virtual alias 'track' -> 'trackId'
questionSchema.virtual('track').get(function () {
  return this.trackId;
});

// Virtual alias 'isAnswered'
questionSchema.virtual('isAnswered').get(function () {
  return this.status === QUESTION_STATUS.ANSWERED;
});

// Pre-validate hook for aliases and uppercase normalization
questionSchema.pre('validate', function (next) {
  if (this.status) {
    this.status = this.status.toUpperCase();
  }
  if (!this.question && this.text) {
    this.question = this.text;
  }
  if (!this.authorName || this.authorName.trim() === '') {
    this.authorName = 'Anonymous';
  }
  next();
});

export const Question = mongoose.model('Question', questionSchema);
