import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    workArea: {
      type: String,
      default: 'General',
      trim: true,
    },
    assignType: {
      type: String,
      enum: ['ROLE', 'PERSON'],
      default: 'ROLE',
    },
    assignedRole: {
      type: String,
      default: 'Event Lead',
      trim: true,
    },
    assignedPerson: {
      type: String,
      default: '',
      trim: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },
    dueDate: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['TODO', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'],
      default: 'TODO',
    },
  },
  { timestamps: true }
);

export const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);
