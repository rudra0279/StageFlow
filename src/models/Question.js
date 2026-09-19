// src/models/Question.js
const mongoose = require('mongoose');
const { MemoryQuestion } = require('./inMemoryStore');

const QuestionSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agenda',
      default: null,
    },
    trackId: {
      type: String,
      default: null,
    },
    question: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
      maxlength: 500,
    },
    authorName: {
      type: String,
      default: 'Anonymous',
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'ANSWERED'],
      default: 'PENDING',
    },
    upvotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    upvotedBy: {
      type: [String],
      default: [],
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    moderatedAt: {
      type: Date,
      default: null,
    },
    aiAnswerSuggestion: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

QuestionSchema.virtual('text').get(function () {
  return this.question;
});

const MongooseQuestion = mongoose.models.Question || mongoose.model('Question', QuestionSchema);

const QuestionProxy = new Proxy(MongooseQuestion, {
  get(target, prop) {
    if (
      process.env.NODE_ENV === 'test' ||
      process.env.USE_IN_MEMORY_DB === 'true' ||
      mongoose.connection.readyState === 0
    ) {
      if (prop in MemoryQuestion) {
        return MemoryQuestion[prop];
      }
    }
    return target[prop];
  },
});

module.exports = QuestionProxy;
