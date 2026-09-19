import mongoose from 'mongoose';

const scriptLogSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      default: null
    },
    scriptType: {
      type: String,
      enum: ['opening', 'introduction', 'transition', 'closing', 'delay', 'copilot'],
      required: true
    },
    prompt: {
      type: String,
      required: true
    },
    generatedScript: {
      type: String,
      required: true
    },
    tone: {
      type: String,
      default: 'professional'
    },
    provider: {
      type: String,
      default: 'fallback'
    }
  },
  { timestamps: true }
);

export const ScriptLog = mongoose.model('ScriptLog', scriptLogSchema);
