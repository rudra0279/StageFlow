import { Task } from '../models/Task.js';
import { ChatMessage } from '../models/ChatMessage.js';
import { User } from '../models/User.js';
import { socketService } from '../services/socketService.js';

const DEFAULT_COMMITTEE = [
  {
    _id: 'comm-1',
    name: 'Rahul Sharma',
    roleTitle: 'Event Lead',
    role: 'organizer',
    email: 'rahul@example.com',
    contactPhone: '+1 (555) 349-1102',
    responsibility: 'Operations + Coordination',
    status: 'ACTIVE',
    avatarUrl: '',
  },
  {
    _id: 'comm-2',
    name: 'Priya Patel',
    roleTitle: 'Technical Lead',
    role: 'organizer',
    email: 'priya@example.com',
    contactPhone: '+1 (555) 782-9931',
    responsibility: 'AV + Stage Technology',
    status: 'ACTIVE',
    avatarUrl: '',
  },
  {
    _id: 'comm-3',
    name: 'Marcus Vance',
    roleTitle: 'Stage Manager',
    role: 'organizer',
    email: 'marcus@example.com',
    contactPhone: '+1 (555) 891-2345',
    responsibility: 'Presentation systems & Timing',
    status: 'ACTIVE',
    avatarUrl: '',
  },
  {
    _id: 'comm-4',
    name: 'Sarah Jenkins',
    roleTitle: 'Registration Lead',
    role: 'organizer',
    email: 'sarah.j@example.com',
    contactPhone: '+1 (555) 123-9087',
    responsibility: 'Attendee Check-In & Badge Ops',
    status: 'ACTIVE',
    avatarUrl: '',
  },
  {
    _id: 'comm-5',
    name: 'David Chen',
    roleTitle: 'Logistics Lead',
    role: 'organizer',
    email: 'david@example.com',
    contactPhone: '+1 (555) 674-8812',
    responsibility: 'Venue Operations & Hospitality',
    status: 'ACTIVE',
    avatarUrl: '',
  },
];

export const getCommittee = async (req, res, next) => {
  try {
    const { id: eventId } = req.params;
    const users = await User.find({ role: { $in: ['organizer', 'admin'] } }).select('-password');

    const committeeMap = new Map();
    DEFAULT_COMMITTEE.forEach((m) => committeeMap.set(m.email.toLowerCase(), { ...m }));

    users.forEach((u) => {
      const emailKey = u.email.toLowerCase();
      committeeMap.set(emailKey, {
        _id: u._id,
        name: u.name,
        roleTitle: u.roleTitle || (u.role === 'admin' ? 'Executive Director' : 'Event Organizer'),
        role: u.role,
        email: u.email,
        contactPhone: u.contactPhone || '+1 (555) 234-5678',
        responsibility: u.responsibility || 'Live Stage Coordination',
        status: u.status || 'ACTIVE',
        avatarUrl: u.avatarUrl || '',
      });
    });

    let members = Array.from(committeeMap.values());
    const isAuthorized = req.user && (req.user.role === 'organizer' || req.user.role === 'admin');
    if (!isAuthorized) {
      members = members.map((m) => ({
        ...m,
        email: m.email.replace(/(.{2})(.*)(?=@)/, '$1***'),
        contactPhone: '***-***-****',
      }));
    }

    res.status(200).json({
      success: true,
      count: members.length,
      data: members,
    });
  } catch (error) {
    next(error);
  }
};

export const getTasks = async (req, res, next) => {
  try {
    const { id: eventId } = req.params;
    let tasks = await Task.find({ eventId }).sort({ createdAt: -1 });

    if (tasks.length === 0) {
      const initialTasks = [
        {
          eventId,
          title: 'Confirm keynote speakers arrival',
          description: 'Ensure Dr. Garcia and Dr. Chen are briefed in the green room.',
          workArea: 'Speaker Management',
          assignType: 'ROLE',
          assignedRole: 'Event Lead',
          assignedPerson: 'Rahul Sharma',
          priority: 'HIGH',
          dueDate: '08:30 AM',
          status: 'COMPLETED',
        },
        {
          eventId,
          title: 'Test stage microphones and podium audio',
          description: 'Run frequency sweeps across lapel, handheld, and podium mics.',
          workArea: 'Technical / AV',
          assignType: 'PERSON',
          assignedRole: 'Technical Lead',
          assignedPerson: 'Priya Patel',
          priority: 'URGENT',
          dueDate: '08:45 AM',
          status: 'IN_PROGRESS',
        },
        {
          eventId,
          title: 'Calibrate teleprompter and glass reflection',
          description: 'Verify brightness and beam-splitter angle for morning lighting.',
          workArea: 'Stage Management',
          assignType: 'ROLE',
          assignedRole: 'Stage Manager',
          assignedPerson: 'Marcus Vance',
          priority: 'MEDIUM',
          dueDate: '09:00 AM',
          status: 'TODO',
        },
        {
          eventId,
          title: 'Setup attendee check-in desks and badges',
          description: 'Ensure all QR terminals have active connectivity.',
          workArea: 'Registration',
          assignType: 'ROLE',
          assignedRole: 'Registration Lead',
          assignedPerson: 'Sarah Jenkins',
          priority: 'MEDIUM',
          dueDate: '08:15 AM',
          status: 'COMPLETED',
        },
      ];

      for (const t of initialTasks) {
        const created = await Task.create(t);
        tasks.push(created);
      }
    }

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const { id: eventId } = req.params;
    const {
      title,
      description,
      workArea,
      assignType,
      assignedRole,
      assignedPerson,
      priority,
      dueDate,
      status,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Task title is required' });
    }

    const task = await Task.create({
      eventId,
      title: title.trim(),
      description: description ? description.trim() : '',
      workArea: workArea || 'Stage Management',
      assignType: assignType || 'ROLE',
      assignedRole: assignedRole || 'Event Lead',
      assignedPerson: assignedPerson || '',
      priority: priority || 'MEDIUM',
      dueDate: dueDate || '',
      status: status || 'TODO',
    });

    socketService.emitToEvent(eventId, 'taskCreated', { eventId, task });
    socketService.emitToRoom(`event_${eventId}_organizers`, 'taskCreated', { eventId, task });

    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const { id: eventId, taskId } = req.params;
    const updatedTask = await Task.findByIdAndUpdate(taskId, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedTask) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    socketService.emitToEvent(eventId, 'taskUpdated', { eventId, task: updatedTask });
    socketService.emitToRoom(`event_${eventId}_organizers`, 'taskUpdated', { eventId, task: updatedTask });

    res.status(200).json({
      success: true,
      data: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const { id: eventId, taskId } = req.params;
    const task = await Task.findByIdAndDelete(taskId);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    socketService.emitToEvent(eventId, 'taskDeleted', { eventId, taskId });
    socketService.emitToRoom(`event_${eventId}_organizers`, 'taskDeleted', { eventId, taskId });

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      data: { taskId },
    });
  } catch (error) {
    next(error);
  }
};

export const batchCreateTasks = async (req, res, next) => {
  try {
    const { id: eventId } = req.params;
    const { tasks } = req.body;

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ success: false, message: 'Tasks array is required' });
    }

    const createdTasks = [];
    for (const item of tasks) {
      if (item && item.title) {
        const task = await Task.create({
          eventId,
          title: item.title,
          description: item.description || '',
          workArea: item.workArea || 'General',
          assignType: item.assignType || 'ROLE',
          assignedRole: item.assignedRole || 'Event Lead',
          assignedPerson: item.assignedPerson || '',
          priority: item.priority || 'MEDIUM',
          dueDate: item.dueDate || '',
          status: item.status || 'TODO',
        });
        createdTasks.push(task);
        socketService.emitToEvent(eventId, 'taskCreated', { eventId, task });
      }
    }

    res.status(201).json({
      success: true,
      count: createdTasks.length,
      data: createdTasks,
    });
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const { id: eventId } = req.params;
    let messages = await ChatMessage.find({ eventId }).sort({ createdAt: 1 });

    if (messages.length === 0) {
      const initialMessages = [
        {
          eventId,
          senderId: 'comm-1',
          senderName: 'Rahul Sharma',
          senderRole: 'Event Lead',
          message: 'Welcome to the Event Command Center. All stages initialized.',
          createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
        },
        {
          eventId,
          senderId: 'comm-2',
          senderName: 'Priya Patel',
          senderRole: 'Technical Lead',
          message: 'Stage microphones and teleprompter networks tested.',
          createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
        },
        {
          eventId,
          senderId: 'comm-3',
          senderName: 'Marcus Vance',
          senderRole: 'Stage Manager',
          message: 'Track A & Track B ready for live broadcast.',
          createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
        },
      ];

      for (const m of initialMessages) {
        const doc = await ChatMessage.create(m);
        messages.push(doc);
      }
    }

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { id: eventId } = req.params;
    const { message, senderName, senderRole } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    const sender = req.user || {};
    const name = senderName || sender.name || 'Organizer';
    const role = senderRole || sender.roleTitle || (sender.role === 'admin' ? 'Event Director' : 'Organizer');
    const senderId = sender._id ? sender._id.toString() : 'org-user';

    const chatDoc = await ChatMessage.create({
      eventId,
      senderId,
      senderName: name,
      senderRole: role,
      message: message.trim(),
      timestamp: new Date(),
    });

    socketService.emitToEvent(eventId, 'commandChatMessage', { eventId, message: chatDoc });
    socketService.emitToRoom(`event_${eventId}_organizers`, 'commandChatMessage', { eventId, message: chatDoc });

    res.status(201).json({
      success: true,
      data: chatDoc,
    });
  } catch (error) {
    next(error);
  }
};
