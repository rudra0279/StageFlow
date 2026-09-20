import React, { useState, useEffect } from 'react';
import { eventApi } from '../../api/eventApi';
import {
  CheckCircle2,
  Clock,
  Plus,
  Filter,
  User,
  Shield,
  AlertCircle,
  Sparkles,
  Check,
  ChevronDown,
  Trash2,
  Layers,
  ArrowRight,
  ListTodo
} from 'lucide-react';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';

const DEFAULT_SUGGESTED_TASKS = {
  'Technical / AV': [
    { title: 'Test stage microphones & frequency channels', priority: 'URGENT', assignRole: 'Technical Lead' },
    { title: 'Test presentation clickers & main screen switcher', priority: 'HIGH', assignRole: 'Technical Lead' },
    { title: 'Verify audio monitor feedback in anchor earpiece', priority: 'HIGH', assignRole: 'Technical Lead' },
    { title: 'Calibrate teleprompter beam-splitter glass lighting', priority: 'MEDIUM', assignRole: 'Technical Lead' }
  ],
  'Speaker Management': [
    { title: 'Confirm speaker arrival & briefing in Green Room', priority: 'HIGH', assignRole: 'Event Lead' },
    { title: 'Collect & verify keynote presentation deck', priority: 'HIGH', assignRole: 'Event Lead' },
    { title: 'Perform 2-minute audio & lapel mic check with MC', priority: 'MEDIUM', assignRole: 'Stage Manager' }
  ],
  'Stage Management': [
    { title: 'Verify stage lectern water & timer monitors', priority: 'MEDIUM', assignRole: 'Stage Manager' },
    { title: 'Test emergency stage flash alert broadcast', priority: 'HIGH', assignRole: 'Stage Manager' },
    { title: 'Dry run Track A to Track B transition cues', priority: 'MEDIUM', assignRole: 'Stage Manager' }
  ],
  'Registration': [
    { title: 'Setup attendee check-in desks & QR scanners', priority: 'HIGH', assignRole: 'Registration Lead' },
    { title: 'Verify VIP lanyard & speaker badge distribution', priority: 'MEDIUM', assignRole: 'Registration Lead' }
  ],
  'Logistics': [
    { title: 'Confirm catering & lunch breaks operational timing', priority: 'MEDIUM', assignRole: 'Logistics Lead' },
    { title: 'Inspect backup stage power generation lines', priority: 'HIGH', assignRole: 'Logistics Lead' }
  ],
  'Hospitality': [
    { title: 'Stock Green Room with refreshments & coffee', priority: 'LOW', assignRole: 'Logistics Lead' }
  ],
  'Security': [
    { title: 'Position guards at backstage & press entrance', priority: 'HIGH', assignRole: 'Event Lead' }
  ]
};

export const TaskBoard = ({ eventId, event, currentUser, socket }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, TODO, IN_PROGRESS, COMPLETED, BLOCKED
  const [roleFilter, setRoleFilter] = useState('ALL'); // ALL, MY_TASKS, MY_ROLE
  const [workAreaFilter, setWorkAreaFilter] = useState('ALL');

  // Assign Task Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskWorkArea, setNewTaskWorkArea] = useState('Technical / AV');
  const [assignType, setAssignType] = useState('ROLE'); // 'ROLE' or 'PERSON'
  const [assignedRole, setAssignedRole] = useState('Technical Lead');
  const [assignedPerson, setAssignedPerson] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('MEDIUM');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [submittingTask, setSubmittingTask] = useState(false);

  // Suggestions Modal
  const [isSuggestionsModalOpen, setIsSuggestionsModalOpen] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState([]);

  const userRoleTitle = currentUser?.roleTitle || (currentUser?.role === 'anchor' ? 'Stage Anchor / MC' : 'Event Lead');
  const userResponsibility = currentUser?.responsibility || 'Live Stage Production & Operations';
  const userName = currentUser?.name || 'Organizer';

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await eventApi.getTasks(eventId);
      if (res.success && res.data) {
        setTasks(res.data);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
      setError('Could not load task list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      loadTasks();
    }
  }, [eventId]);

  // Socket.IO Real-Time Task Synchronization
  useEffect(() => {
    if (!socket || !eventId) return;

    const handleTaskCreated = (data) => {
      if (data && data.task && (data.eventId === eventId || data.task.eventId === eventId)) {
        setTasks((prev) => {
          if (prev.some((t) => t._id === data.task._id)) return prev;
          return [data.task, ...prev];
        });
      }
    };

    const handleTaskUpdated = (data) => {
      if (data && data.task) {
        setTasks((prev) =>
          prev.map((t) => (t._id === data.task._id ? data.task : t))
        );
      }
    };

    const handleTaskDeleted = (data) => {
      if (data && data.taskId) {
        setTasks((prev) => prev.filter((t) => t._id !== data.taskId));
      }
    };

    socket.on('taskCreated', handleTaskCreated);
    socket.on('taskUpdated', handleTaskUpdated);
    socket.on('taskDeleted', handleTaskDeleted);

    return () => {
      socket.off('taskCreated', handleTaskCreated);
      socket.off('taskUpdated', handleTaskUpdated);
      socket.off('taskDeleted', handleTaskDeleted);
    };
  }, [socket, eventId]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setSubmittingTask(true);
    try {
      const payload = {
        title: newTaskTitle.trim(),
        description: newTaskDesc.trim(),
        workArea: newTaskWorkArea,
        assignType,
        assignedRole: assignType === 'ROLE' ? assignedRole : '',
        assignedPerson: assignType === 'PERSON' ? assignedPerson : '',
        priority: newTaskPriority,
        dueDate: newTaskDueDate,
        status: 'TODO'
      };

      const res = await eventApi.createTask(eventId, payload);
      if (res.success && res.data) {
        setTasks((prev) => [res.data, ...prev]);
        setIsCreateModalOpen(false);
        setNewTaskTitle('');
        setNewTaskDesc('');
      }
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setSubmittingTask(false);
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
      );
      await eventApi.updateTask(eventId, taskId, { status: newStatus });
    } catch (err) {
      console.error('Failed to update task status:', err);
      loadTasks();
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      await eventApi.deleteTask(eventId, taskId);
    } catch (err) {
      console.error('Failed to delete task:', err);
      loadTasks();
    }
  };

  // Open Suggestions Modal populated with tasks based on active event work areas
  const handleOpenSuggestions = () => {
    const activeAreas = event?.workAreas || [
      'Technical / AV',
      'Speaker Management',
      'Stage Management',
      'Registration'
    ];

    const suggestionsList = [];
    activeAreas.forEach((area) => {
      if (DEFAULT_SUGGESTED_TASKS[area]) {
        DEFAULT_SUGGESTED_TASKS[area].forEach((taskTemplate) => {
          suggestionsList.push({
            ...taskTemplate,
            workArea: area,
            assignType: 'ROLE',
            dueDate: 'Before Show',
            id: `${area}-${taskTemplate.title}`
          });
        });
      }
    });

    setSelectedSuggestions(suggestionsList);
    setIsSuggestionsModalOpen(true);
  };

  const handleAddBatchTasks = async () => {
    if (selectedSuggestions.length === 0) return;
    try {
      const res = await eventApi.batchCreateTasks(eventId, selectedSuggestions);
      if (res.success && res.data) {
        setTasks((prev) => [...res.data, ...prev]);
        setIsSuggestionsModalOpen(false);
      }
    } catch (err) {
      console.error('Failed to batch add tasks:', err);
    }
  };

  // Filter Tasks
  const filteredTasks = tasks.filter((t) => {
    // Status filter
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;

    // Role / Person filter
    if (roleFilter === 'MY_TASKS') {
      const isAssignedToMe =
        (t.assignType === 'PERSON' && t.assignedPerson?.toLowerCase() === userName.toLowerCase()) ||
        (t.assignType === 'ROLE' && t.assignedRole?.toLowerCase() === userRoleTitle.toLowerCase());
      if (!isAssignedToMe) return false;
    }
    if (roleFilter === 'MY_ROLE') {
      if (t.assignedRole?.toLowerCase() !== userRoleTitle.toLowerCase()) return false;
    }

    // Work area filter
    if (workAreaFilter !== 'ALL' && t.workArea !== workAreaFilter) return false;

    return true;
  });

  const todoTasks = filteredTasks.filter((t) => t.status === 'TODO');
  const inProgressTasks = filteredTasks.filter((t) => t.status === 'IN_PROGRESS');
  const completedTasks = filteredTasks.filter((t) => t.status === 'COMPLETED');
  const blockedTasks = filteredTasks.filter((t) => t.status === 'BLOCKED');

  const activeWorkAreas = event?.workAreas || [
    'Stage Management',
    'Speaker Management',
    'Registration',
    'Technical / AV',
    'Logistics'
  ];

  const renderTaskCard = (task) => {
    return (
      <div
        key={task._id}
        className="p-4 rounded-2xl bg-stage-900 border border-stage-800 hover:border-stage-700 transition-all shadow-md space-y-3"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
            {task.workArea || 'General'}
          </span>

          <span
            className={`text-[9px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-full ${
              task.priority === 'URGENT'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : task.priority === 'HIGH'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-stage-800 text-slate-300'
            }`}
          >
            {task.priority || 'MEDIUM'}
          </span>
        </div>

        <h4 className="text-xs font-bold text-white leading-snug">{task.title}</h4>

        {task.description && (
          <p className="text-[11px] text-slate-400 line-clamp-2">{task.description}</p>
        )}

        {/* Assignee pill */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-300 bg-stage-950 p-2 rounded-xl border border-stage-800/80">
          {task.assignType === 'PERSON' ? (
            <User className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          ) : (
            <Shield className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          )}
          <span className="truncate">
            {task.assignType === 'PERSON'
              ? `Person: ${task.assignedPerson || 'Unassigned'}`
              : `Role: ${task.assignedRole || 'Organizer'}`}
          </span>
        </div>

        {/* Footer with Due Date & Status Controller */}
        <div className="pt-2 border-t border-stage-800/80 flex items-center justify-between gap-2 text-[11px]">
          <span className="text-[10px] font-mono text-slate-400">
            {task.dueDate ? `Due: ${task.dueDate}` : 'Standard'}
          </span>

          <div className="flex items-center gap-1.5">
            <select
              value={task.status}
              onChange={(e) => handleUpdateStatus(task._id, e.target.value)}
              className="text-[10px] font-mono font-bold bg-stage-950 border border-stage-700 text-slate-200 rounded-lg px-2 py-1 focus:ring-1 focus:ring-cyan-400 cursor-pointer"
            >
              <option value="TODO">TODO</option>
              <option value="IN_PROGRESS">IN PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="BLOCKED">BLOCKED</option>
            </select>

            <button
              onClick={() => handleDeleteTask(task._id)}
              className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
              title="Delete task"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 10. ROLE-BASED ORGANIZER VIEW (Prominent Banner) */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-stage-900 via-stage-900/90 to-stage-950 border border-cyan-500/40 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest">
              ORGANIZER IDENTITY & CLEARANCE
            </span>
          </div>
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-black text-white tracking-tight">
              YOU ARE: <span className="text-cyan-300 uppercase">{userRoleTitle}</span>
            </h3>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
              {userName}
            </span>
          </div>
          <p className="text-xs text-slate-300">
            <strong className="text-slate-400 uppercase font-mono text-[10px]">RESPONSIBILITIES: </strong>
            {userResponsibility}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            icon={Sparkles}
            onClick={handleOpenSuggestions}
            className="border-purple-500/40 text-purple-300 hover:border-purple-400"
          >
            Suggested Tasks
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setIsCreateModalOpen(true)}
            className="shadow-lg shadow-cyan-500/20"
          >
            Assign Task
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-stage-900/70 border border-stage-800 flex flex-wrap items-center justify-between gap-4">
        {/* Role Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono font-bold text-slate-400 uppercase mr-1">
            Focus:
          </span>
          {[
            { id: 'ALL', label: 'ALL TASKS' },
            { id: 'MY_TASKS', label: 'MY TASKS' },
            { id: 'MY_ROLE', label: `ROLE: ${userRoleTitle}` }
          ].map((rf) => (
            <button
              key={rf.id}
              onClick={() => setRoleFilter(rf.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all border ${
                roleFilter === rf.id
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-sm'
                  : 'bg-stage-950/80 border-stage-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {rf.label}
            </button>
          ))}
        </div>

        {/* Status and Work Area Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono text-slate-400">Area:</span>
            <select
              value={workAreaFilter}
              onChange={(e) => setWorkAreaFilter(e.target.value)}
              className="text-xs font-mono bg-stage-950 border border-stage-800 rounded-xl px-2.5 py-1 text-slate-200 focus:ring-1 focus:ring-cyan-400 cursor-pointer"
            >
              <option value="ALL">All Work Areas</option>
              {activeWorkAreas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-mono bg-stage-950 border border-stage-800 rounded-xl px-2.5 py-1 text-slate-200 focus:ring-1 focus:ring-cyan-400 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="TODO">TODO</option>
              <option value="IN_PROGRESS">IN PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="BLOCKED">BLOCKED</option>
            </select>
          </div>
        </div>
      </div>

      {/* 12. TASK BOARD KANBAN COLUMNS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: TODO */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-stage-900 border border-stage-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <h4 className="text-xs font-mono font-extrabold uppercase tracking-wider text-slate-200">
                TODO
              </h4>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
              {todoTasks.length}
            </span>
          </div>

          <div className="space-y-3 min-h-[200px]">
            {todoTasks.map(renderTaskCard)}
            {todoTasks.length === 0 && (
              <div className="p-6 text-center rounded-2xl border border-dashed border-stage-800 text-xs text-slate-500">
                No tasks in TODO
              </div>
            )}
          </div>
        </div>

        {/* Column 2: IN PROGRESS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-stage-900 border border-stage-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <h4 className="text-xs font-mono font-extrabold uppercase tracking-wider text-slate-200">
                IN PROGRESS
              </h4>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">
              {inProgressTasks.length}
            </span>
          </div>

          <div className="space-y-3 min-h-[200px]">
            {inProgressTasks.map(renderTaskCard)}
            {inProgressTasks.length === 0 && (
              <div className="p-6 text-center rounded-2xl border border-dashed border-stage-800 text-xs text-slate-500">
                No active tasks
              </div>
            )}
          </div>
        </div>

        {/* Column 3: COMPLETED */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-stage-900 border border-stage-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <h4 className="text-xs font-mono font-extrabold uppercase tracking-wider text-slate-200">
                COMPLETED
              </h4>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              {completedTasks.length}
            </span>
          </div>

          <div className="space-y-3 min-h-[200px]">
            {completedTasks.map(renderTaskCard)}
            {completedTasks.length === 0 && (
              <div className="p-6 text-center rounded-2xl border border-dashed border-stage-800 text-xs text-slate-500">
                No completed tasks yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 13. ASSIGN TASK MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Assign Event Production Task"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <Input
            label="Task Title"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="e.g. Test stage microphones & earpieces"
            required
          />

          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={newTaskDesc}
              onChange={(e) => setNewTaskDesc(e.target.value)}
              placeholder="Operational details and specific location..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-stage-950 border border-stage-800 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1">
              Work Type / Area
            </label>
            <select
              value={newTaskWorkArea}
              onChange={(e) => setNewTaskWorkArea(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-stage-950 border border-stage-800 text-white focus:border-cyan-400"
            >
              {activeWorkAreas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle: Assign to Role vs Assign to Person */}
          <div className="p-3 rounded-xl bg-stage-950 border border-stage-800 space-y-2.5">
            <span className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Assignment Target (Role vs Person)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAssignType('ROLE')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                  assignType === 'ROLE'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/60 shadow-sm'
                    : 'bg-stage-900 text-slate-400 border-stage-800'
                }`}
              >
                Assign to Role
              </button>
              <button
                type="button"
                onClick={() => setAssignType('PERSON')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                  assignType === 'PERSON'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-sm'
                    : 'bg-stage-900 text-slate-400 border-stage-800'
                }`}
              >
                Assign to Person
              </button>
            </div>

            {assignType === 'ROLE' ? (
              <Input
                label="Assign to Role"
                value={assignedRole}
                onChange={(e) => setAssignedRole(e.target.value)}
                placeholder="e.g. Technical Lead, Stage Manager, Event Lead"
                required
              />
            ) : (
              <Input
                label="Assign to Specific Person"
                value={assignedPerson}
                onChange={(e) => setAssignedPerson(e.target.value)}
                placeholder="e.g. Priya Patel, Rahul Sharma"
                required
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-stage-950 border border-stage-800 text-white focus:border-cyan-400"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </select>
            </div>

            <Input
              label="Due Time"
              value={newTaskDueDate}
              onChange={(e) => setNewTaskDueDate(e.target.value)}
              placeholder="e.g. 09:15 AM"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-stage-800">
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submittingTask}>
              Create Task
            </Button>
          </div>
        </form>
      </Modal>

      {/* 15. AUTOMATIC TASK SUGGESTIONS MODAL */}
      <Modal
        isOpen={isSuggestionsModalOpen}
        onClose={() => setIsSuggestionsModalOpen(false)}
        title="Automated Event Task Suggestions"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Based on this event's active work areas ({activeWorkAreas.join(', ')}), here are standard operational checklist tasks:
          </p>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {selectedSuggestions.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-stage-950 border border-stage-800 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300">
                      {item.workArea}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-300">
                      {item.assignRole}
                    </span>
                  </div>
                  <h5 className="font-bold text-white">{item.title}</h5>
                </div>

                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-stage-800">
            <Button variant="secondary" onClick={() => setIsSuggestionsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddBatchTasks} icon={Plus}>
              Add Selected Tasks ({selectedSuggestions.length})
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
