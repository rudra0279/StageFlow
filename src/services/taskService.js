// src/services/taskService.js
const Task = require('../models/Task');
const Event = require('../models/Event');
const socketEmitter = require('../socket/socketEmitter');
const { getSuggestedTasksForWorkTypes } = require('../constants/workTypes');

/**
 * Retrieves tasks for an event with flexible filtering.
 */
async function getEventTasks(eventId, filters = {}, user = null) {
  const query = { eventId };

  if (filters.status) {
    query.status = filters.status.toUpperCase();
  }
  if (filters.priority) {
    query.priority = filters.priority.toUpperCase();
  }
  if (filters.workType) {
    query.workType = filters.workType;
  }
  if (filters.assignedRole) {
    query.assignedRole = filters.assignedRole;
  }
  if (filters.assignedTo) {
    query.assignedTo = filters.assignedTo;
  }

  let tasks = await Task.find(query)
    .populate('assignedTo', 'name email role workRole')
    .populate('assignedBy', 'name email role')
    .sort({ createdAt: -1 });

  // If user requested "myTasks", filter tasks assigned to this user OR matching user's work role
  if (filters.myTasks === 'true' && user) {
    const userId = (user._id || user.id).toString();
    const userWorkRole = user.workRole || user.role;
    tasks = tasks.filter(t => {
      const assignedId = t.assignedTo ? (t.assignedTo._id || t.assignedTo.id || t.assignedTo).toString() : null;
      if (assignedId === userId) return true;
      if (t.assignedRole && t.assignedRole === userWorkRole) return true;
      return false;
    });
  }

  return tasks;
}

/**
 * Creates a new task for an event and emits a Socket.IO event.
 */
async function createEventTask(eventId, data, creator) {
  const event = await Event.findById(eventId);
  if (!event) {
    throw new Error('Event not found');
  }

  if (!data.title) {
    throw new Error('Task title is required');
  }

  const task = await Task.create({
    title: data.title.trim(),
    description: data.description || '',
    eventId,
    workType: data.workType || 'OPERATIONS',
    assignedTo: data.assignedTo || null,
    assignedRole: data.assignedRole || null,
    assignedBy: creator ? (creator._id || creator.id) : null,
    priority: data.priority ? data.priority.toUpperCase() : 'MEDIUM',
    status: data.status ? data.status.toUpperCase() : 'TODO',
    dueDate: data.dueDate ? new Date(data.dueDate) : null,
  });

  socketEmitter.emitTaskCreated(eventId, task);

  if (task.assignedTo || task.assignedRole) {
    socketEmitter.emitTaskAssigned(eventId, task);
  }

  return task;
}

/**
 * Updates an existing task and triggers appropriate Socket.IO lifecycle events.
 */
async function updateEventTask(taskId, updateData) {
  const currentTask = await Task.findById(taskId);
  if (!currentTask) {
    throw new Error('Task not found');
  }

  const prevStatus = currentTask.status;
  const prevAssignee = currentTask.assignedTo;
  const prevAssignedRole = currentTask.assignedRole;

  if (updateData.title !== undefined) currentTask.title = updateData.title.trim();
  if (updateData.description !== undefined) currentTask.description = updateData.description;
  if (updateData.workType !== undefined) currentTask.workType = updateData.workType;
  if (updateData.assignedTo !== undefined) currentTask.assignedTo = updateData.assignedTo;
  if (updateData.assignedRole !== undefined) currentTask.assignedRole = updateData.assignedRole;
  if (updateData.priority !== undefined) currentTask.priority = updateData.priority.toUpperCase();
  if (updateData.status !== undefined) {
    currentTask.status = updateData.status.toUpperCase();
    if (currentTask.status === 'COMPLETED') {
      currentTask.completedAt = new Date().toISOString();
    }
  }
  if (updateData.dueDate !== undefined) {
    currentTask.dueDate = updateData.dueDate ? new Date(updateData.dueDate) : null;
  }

  await currentTask.save();

  const eventId = currentTask.eventId ? currentTask.eventId.toString() : null;
  if (eventId) {
    socketEmitter.emitTaskUpdated(eventId, currentTask);

    if (
      (updateData.assignedTo !== undefined && String(updateData.assignedTo) !== String(prevAssignee)) ||
      (updateData.assignedRole !== undefined && updateData.assignedRole !== prevAssignedRole)
    ) {
      socketEmitter.emitTaskAssigned(eventId, currentTask);
    }

    if (currentTask.status === 'COMPLETED' && prevStatus !== 'COMPLETED') {
      socketEmitter.emitTaskCompleted(eventId, currentTask);
    }
  }

  return currentTask;
}

/**
 * Deletes a task and emits task_deleted.
 */
async function deleteEventTask(taskId) {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new Error('Task not found');
  }

  const eventId = task.eventId ? task.eventId.toString() : null;
  await Task.findByIdAndDelete(taskId);

  if (eventId) {
    socketEmitter.emitTaskDeleted(eventId, { taskId, eventId });
  }

  return true;
}

/**
 * Generates suggested tasks based on active event work types.
 */
async function getSuggestionsForEvent(eventId) {
  const event = await Event.findById(eventId);
  if (!event) {
    throw new Error('Event not found');
  }

  const workTypes = event.workTypes || [];
  const enabledIds = workTypes
    .filter(wt => wt.enabled !== false)
    .map(wt => wt.id || wt);

  return getSuggestedTasksForWorkTypes(enabledIds);
}

/**
 * Bulk-creates confirmed task suggestions.
 */
async function applyTaskSuggestions(eventId, suggestions, creator) {
  const event = await Event.findById(eventId);
  if (!event) {
    throw new Error('Event not found');
  }

  const createdTasks = [];
  for (const s of suggestions) {
    const task = await Task.create({
      title: s.title,
      description: s.description || '',
      eventId,
      workType: s.workType || 'OPERATIONS',
      assignedRole: s.suggestedRole || s.assignedRole || null,
      assignedBy: creator ? (creator._id || creator.id) : null,
      priority: s.priority || 'MEDIUM',
      status: 'TODO',
    });
    createdTasks.push(task);
    socketEmitter.emitTaskCreated(eventId, task);
  }

  return createdTasks;
}

module.exports = {
  getEventTasks,
  createEventTask,
  updateEventTask,
  deleteEventTask,
  getSuggestionsForEvent,
  applyTaskSuggestions,
};
