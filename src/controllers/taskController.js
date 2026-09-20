// src/controllers/taskController.js
const Event = require('../models/Event');
const Task = require('../models/Task');
const taskService = require('../services/taskService');

/**
 * List tasks for an event with filter options.
 */
async function getTasks(req, res, next) {
  try {
    const { eventId } = req.params;
    const tasks = await taskService.getEventTasks(eventId, req.query, req.user);
    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new task.
 */
async function createTask(req, res, next) {
  try {
    const { eventId } = req.params;
    const task = await taskService.createEventTask(eventId, req.body, req.user);
    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Returns committee members eligible for a given work role.
 */
async function getEligibleAssignees(req, res, next) {
  try {
    const { eventId } = req.params;
    const { role, workRole } = req.query;
    const targetRole = role || workRole;

    const event = await Event.findById(eventId).populate('organizerId', 'name email role workRole');
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const committee = event.committee || [];
    let eligible = committee.filter(m => m.isActive !== false);

    if (targetRole) {
      eligible = eligible.filter(m => m.workRole === targetRole || m.role === targetRole);
    }

    res.status(200).json({
      success: true,
      count: eligible.length,
      data: eligible,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Returns suggested starter tasks derived from the event's enabled work types.
 */
async function getTaskSuggestions(req, res, next) {
  try {
    const { eventId } = req.params;
    const suggestions = await taskService.getSuggestionsForEvent(eventId);
    res.status(200).json({
      success: true,
      count: suggestions.length,
      data: suggestions,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Confirms and bulk-creates selected task suggestions.
 */
async function confirmTaskSuggestions(req, res, next) {
  try {
    const { eventId } = req.params;
    const { suggestions } = req.body;

    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'An array of task suggestions is required',
      });
    }

    const created = await taskService.applyTaskSuggestions(eventId, suggestions, req.user);
    res.status(201).json({
      success: true,
      message: `Successfully created ${created.length} tasks from suggestions`,
      count: created.length,
      data: created,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an existing task.
 */
async function updateTask(req, res, next) {
  try {
    const { taskId } = req.params;
    const updated = await taskService.updateEventTask(taskId, req.body);
    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a task.
 */
async function deleteTask(req, res, next) {
  try {
    const { taskId } = req.params;
    await taskService.deleteEventTask(taskId);
    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getTasks,
  createTask,
  getEligibleAssignees,
  getTaskSuggestions,
  confirmTaskSuggestions,
  updateTask,
  deleteTask,
};
