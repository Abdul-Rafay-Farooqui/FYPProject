'use client';

import { useState } from 'react';
import { Plus, Trash2, ClipboardList } from 'lucide-react';

const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-blue-400 bg-blue-400/10',
  medium: 'text-yellow-400 bg-yellow-400/10',
  high: 'text-orange-400 bg-orange-400/10',
  critical: 'text-red-400 bg-red-400/10',
};
const STATUS_COLORS: Record<string, string> = {
  todo: 'text-[#8696a0]',
  in_progress: 'text-blue-400',
  blocked: 'text-red-400',
  completed: 'text-[#00a884]',
  cancelled: 'text-[#8696a0] line-through',
};

interface Task {
  id: string;
  title: string;
  description?: string;
  assignee: string;
  assignee_id: string | null;
  created_by: string | null;
  dueDate: string;
  priority: string;
  status: string;
}

interface TasksTabProps {
  tasks?: Task[];
  teamMembers?: { id: string; name: string }[];
  currentUserId?: string;
  isAdmin?: boolean;
  onAdd?: (payload: { title: string; description?: string; assignee_id?: string; priority?: string; due_date?: string }) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
  onUpdate?: (taskId: string, status: string) => Promise<void>;
}

const TasksTab = ({ tasks = [], teamMembers = [], currentUserId, isAdmin, onAdd, onDelete, onUpdate }: TasksTabProps) => {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [err, setErr] = useState('');

  const resetForm = () => {
    setTitle(''); setDescription(''); setPriority('medium'); setDueDate(''); setAssigneeId(''); setErr('');
  };

  const handleAdd = async () => {
    if (!title.trim()) { setErr('Title is required.'); return; }
    setSaving(true); setErr('');
    try {
      await onAdd?.({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        due_date: dueDate || undefined,
        assignee_id: assigneeId || undefined,
      });
      resetForm();
      setShowForm(false);
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || 'Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try { await onDelete?.(id); }
    finally { setDeletingId(null); }
  };

  const handleToggle = async (task: Task) => {
    if (!onUpdate) return;
    setTogglingId(task.id);
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    try { await onUpdate(task.id, newStatus); }
    finally { setTogglingId(null); }
  };

  const activeTasks = tasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled');

  const Spinner = () => (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );

  return (
    <div className="space-y-3">
      {/* Add button */}
      <div className="mb-2">
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[#00a884] border border-[#00a884]/30 hover:bg-[#00a884]/10 transition-all"
          >
            <Plus className="w-4 h-4" /> Create Task
          </button>
        ) : (
          <div className="bg-[#111b21] border border-[#222d34] rounded-xl p-4 space-y-3">
            <p className="text-[#e9edef] text-sm font-medium">New Task</p>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title *"
              className="w-full bg-[#0b141a] border border-[#2a3942] text-[#e9edef] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#00a884] placeholder-[#4a5568]"
            />

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              rows={2}
              className="w-full bg-[#0b141a] border border-[#2a3942] text-[#e9edef] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#00a884] placeholder-[#4a5568] resize-none"
            />

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-[#8696a0] text-xs uppercase tracking-wider mb-1">Assign To</label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full bg-[#0b141a] border border-[#2a3942] text-[#e9edef] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#00a884]"
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-[#8696a0] text-xs uppercase tracking-wider mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-[#0b141a] border border-[#2a3942] text-[#e9edef] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#00a884] capitalize"
                >
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-[#8696a0] text-xs uppercase tracking-wider mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-[#0b141a] border border-[#2a3942] text-[#e9edef] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#00a884]"
                />
              </div>
            </div>

            {err && <p className="text-red-400 text-xs">{err}</p>}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowForm(false); resetForm(); }}
                className="px-4 py-1.5 rounded-lg text-sm text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={saving}
                className="px-4 py-1.5 rounded-lg text-sm font-medium bg-[#00a884] hover:bg-[#008069] text-[#0b141a] disabled:opacity-50 transition-all flex items-center gap-1.5"
              >
                {saving && <Spinner />} Create
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Task list */}
      {!activeTasks.length ? (
        <div className="flex flex-col items-center justify-center h-40 gap-3">
          <div className="w-12 h-12 rounded-full bg-[#1e2a30] flex items-center justify-center">
            <ClipboardList className="w-6 h-6 text-[#8696a0]" />
          </div>
          <p className="text-[#8696a0] text-sm">No tasks yet.</p>
        </div>
      ) : (
        activeTasks.map((task) => {
          const canToggle = isAdmin || task.assignee_id === currentUserId;
          return (
          <div key={task.id} className="bg-[#111b21] border border-[#222d34] rounded-xl p-3 flex items-start gap-3 group">
            {/* Complete toggle — only assignee or admin */}
            <button
              onClick={() => canToggle && handleToggle(task)}
              disabled={togglingId === task.id || !canToggle}
              title={
                !canToggle
                  ? 'Only the assigned person can complete this task'
                  : task.status === 'completed' ? 'Mark as todo' : 'Mark as completed'
              }
              className={`mt-0.5 flex-shrink-0 transition-all ${!canToggle ? 'opacity-30 cursor-not-allowed' : 'disabled:opacity-50'}`}
            >
              {togglingId === task.id ? (
                <Spinner />
              ) : (
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  task.status === 'completed'
                    ? 'bg-[#00a884] border-[#00a884]'
                    : canToggle ? 'border-[#2a3942] hover:border-[#00a884]' : 'border-[#2a3942]'
                }`}>
                  {task.status === 'completed' && (
                    <svg className="w-3 h-3 text-[#0b141a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              )}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-[#8696a0]' : 'text-[#e9edef]'}`}>
                  {task.title}
                </p>
                <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${PRIORITY_COLORS[task.priority] || 'text-[#8696a0]'}`}>
                  {task.priority}
                </span>
              </div>
              {task.description && (
                <p className="text-[#8696a0] text-xs mt-0.5 truncate">{task.description}</p>
              )}
              <p className="text-[#8696a0] text-xs mt-1">
                {task.assignee !== 'Unassigned' ? `Assigned to ${task.assignee}` : 'Unassigned'}
                {task.dueDate !== '-' ? ` · Due ${task.dueDate}` : ''}
              </p>
              <p className={`text-xs mt-1 capitalize font-medium ${STATUS_COLORS[task.status] || 'text-[#8696a0]'}`}>
                {task.status.replace(/_/g, ' ')}
              </p>
            </div>

            {onDelete && (
              <button
                onClick={() => handleDelete(task.id)}
                disabled={deletingId === task.id}
                title="Delete task"
                className="p-1.5 rounded-lg text-red-500/40 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50 flex-shrink-0"
              >
                {deletingId === task.id ? <Spinner /> : <Trash2 className="w-4 h-4" />}
              </button>
            )}
          </div>
          );
        })
      )}
    </div>
  );
};

export default TasksTab;
