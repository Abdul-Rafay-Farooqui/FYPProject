'use client';

import { useState, useRef } from 'react';
import { Plus, Trash2, ClipboardList, GripVertical } from 'lucide-react';

const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-blue-400 bg-blue-400/10',
  medium: 'text-yellow-400 bg-yellow-400/10',
  high: 'text-orange-400 bg-orange-400/10',
  critical: 'text-red-400 bg-red-400/10',
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

const Spinner = () => (
  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
  </svg>
);

interface TaskCardProps {
  task: Task;
  canToggle: boolean;
  togglingId: string | null;
  deletingId: string | null;
  onDelete?: (id: string) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onStatusChange: (task: Task, status: string) => void;
}

const TaskCard = ({ task, canToggle, togglingId, deletingId, onDelete, onDragStart, onStatusChange }: TaskCardProps) => (
  <div
    draggable
    onDragStart={(e) => onDragStart(e, task.id)}
    className="bg-[#0b141a] border border-[#222d34] rounded-xl p-3 flex items-start gap-2 group cursor-grab active:cursor-grabbing hover:border-[#2a3942] transition-all"
  >
    <GripVertical className="w-4 h-4 text-[#2a3942] group-hover:text-[#4a5568] mt-0.5 flex-shrink-0 transition-colors" />

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
        {task.assignee !== 'Unassigned' ? `${task.assignee}` : 'Unassigned'}
        {task.dueDate !== '-' ? ` · Due ${task.dueDate}` : ''}
      </p>
    </div>

    {/* Quick status toggle button */}
    <div className="flex items-center gap-1 flex-shrink-0">
      {task.status !== 'completed' ? (
        <button
          onClick={() => canToggle && onStatusChange(task, 'completed')}
          disabled={togglingId === task.id || !canToggle}
          title={!canToggle ? 'Only the assigned person can complete this task' : 'Mark as done'}
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
            !canToggle ? 'opacity-30 cursor-not-allowed border-[#2a3942]' : 'border-[#2a3942] hover:border-[#00a884] disabled:opacity-50'
          }`}
        >
          {togglingId === task.id && <Spinner />}
        </button>
      ) : (
        <button
          onClick={() => canToggle && onStatusChange(task, 'in_progress')}
          disabled={togglingId === task.id || !canToggle}
          title="Move back to In Progress"
          className="w-5 h-5 rounded-full bg-[#00a884] border-2 border-[#00a884] flex items-center justify-center disabled:opacity-50 flex-shrink-0"
        >
          {togglingId === task.id ? (
            <Spinner />
          ) : (
            <svg className="w-3 h-3 text-[#0b141a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      )}

      {onDelete && (
        <button
          onClick={() => onDelete(task.id)}
          disabled={deletingId === task.id}
          title="Delete task"
          className="p-1 rounded-lg text-red-500/40 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
        >
          {deletingId === task.id ? <Spinner /> : <Trash2 className="w-3.5 h-3.5" />}
        </button>
      )}
    </div>
  </div>
);

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
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const dragTaskId = useRef<string | null>(null);

  const resetForm = () => {
    setTitle(''); setDescription(''); setPriority('medium'); setDueDate(''); setAssigneeId(''); setErr('');
  };

  const handleAdd = async () => {
    if (!title.trim()) { setErr('Title is required.'); return; }
    setSaving(true); setErr('');
    try {
      await onAdd?.({ title: title.trim(), description: description.trim() || undefined, priority, due_date: dueDate || undefined, assignee_id: assigneeId || undefined });
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
    try { await onDelete?.(id); } finally { setDeletingId(null); }
  };

  const handleStatusChange = async (task: Task, newStatus: string) => {
    if (!onUpdate) return;
    setTogglingId(task.id);
    try { await onUpdate(task.id, newStatus); } finally { setTogglingId(null); }
  };

  // Drag handlers
  const onDragStart = (e: React.DragEvent, taskId: string) => {
    dragTaskId.current = taskId;
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e: React.DragEvent, col: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(col);
  };

  const onDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    setDragOverCol(null);
    const id = dragTaskId.current;
    if (!id) return;
    const task = tasks.find((t) => t.id === id);
    if (!task || task.status === targetStatus) return;
    await handleStatusChange(task, targetStatus);
  };

  const inProgress = tasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled');
  const done = tasks.filter((t) => t.status === 'completed');

  const columns = [
    { key: 'in_progress', label: 'In Progress', tasks: inProgress, accent: 'border-blue-500/40', badge: 'bg-blue-500/10 text-blue-400' },
    { key: 'completed', label: 'Done', tasks: done, accent: 'border-[#00a884]/40', badge: 'bg-[#00a884]/10 text-[#00a884]' },
  ];

  return (
    <div className="space-y-3">
      {/* Create Task button / form */}
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
                <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full bg-[#0b141a] border border-[#2a3942] text-[#e9edef] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#00a884]">
                  <option value="">Unassigned</option>
                  {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-[#8696a0] text-xs uppercase tracking-wider mb-1">Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-[#0b141a] border border-[#2a3942] text-[#e9edef] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#00a884] capitalize">
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-[#8696a0] text-xs uppercase tracking-wider mb-1">Due Date</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-[#0b141a] border border-[#2a3942] text-[#e9edef] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#00a884]" />
              </div>
            </div>
            {err && <p className="text-red-400 text-xs">{err}</p>}
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setShowForm(false); resetForm(); }}
                className="px-4 py-1.5 rounded-lg text-sm text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33] transition-all">
                Cancel
              </button>
              <button onClick={handleAdd} disabled={saving}
                className="px-4 py-1.5 rounded-lg text-sm font-medium bg-[#00a884] hover:bg-[#008069] text-[#0b141a] disabled:opacity-50 transition-all flex items-center gap-1.5">
                {saving && <Spinner />} Create
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-2 gap-3">
        {columns.map((col) => (
          <div
            key={col.key}
            onDragOver={(e) => onDragOver(e, col.key)}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={(e) => onDrop(e, col.key)}
            className={`rounded-xl border-2 transition-all min-h-[200px] ${
              dragOverCol === col.key
                ? col.key === 'completed' ? 'border-[#00a884]/60 bg-[#00a884]/5' : 'border-blue-500/60 bg-blue-500/5'
                : col.accent + ' bg-[#111b21]/50'
            }`}
          >
            {/* Column header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#222d34]">
              <span className="text-[#e9edef] text-sm font-semibold">{col.label}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.badge}`}>
                {col.tasks.length}
              </span>
            </div>

            {/* Cards */}
            <div className="p-2 space-y-2">
              {col.tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-24 gap-2">
                  <ClipboardList className="w-5 h-5 text-[#2a3942]" />
                  <p className="text-[#4a5568] text-xs">
                    {dragOverCol === col.key ? 'Drop here' : 'No tasks'}
                  </p>
                </div>
              ) : (
                col.tasks.map((task) => {
                  const canToggle = isAdmin || task.assignee_id === currentUserId || !task.assignee_id;
                  return (
                    <TaskCard
                      key={task.id}
                      task={task}
                      canToggle={canToggle}
                      togglingId={togglingId}
                      deletingId={deletingId}
                      onDelete={onDelete ? handleDelete : undefined}
                      onDragStart={onDragStart}
                      onStatusChange={handleStatusChange}
                    />
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TasksTab;
