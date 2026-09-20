// src/models/ChatMessage.js
const mongoose = require('mongoose');
const { MemoryChatMessage } = require('./inMemoryStore');

const ChatMessageSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    senderRole: {
      type: String,
      default: 'ORGANIZER',
    },
    senderWorkRole: {
      type: String,
      default: 'OPERATIONS',
    },
    message: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const MongooseChatMessage = mongoose.models.ChatMessage || mongoose.model('ChatMessage', ChatMessageSchema);

const ChatMessageProxy = new Proxy(MongooseChatMessage, {
  get(target, prop) {
    if (process.env.NODE_ENV === 'test' || process.env.USE_IN_MEMORY_DB === 'true' || mongoose.connection.readyState === 0) {
      if (prop in MemoryChatMessage) {
        return MemoryChatMessage[prop];
      }
    }
    return target[prop];
  },
});

module.exports = ChatMessageProxy;
