'use client';

import { useState } from 'react';
import { Plus, Trash2, Activity } from 'lucide-react';

const ACTIVITY_TYPES = [
  'mention',
  'reply',
  'reaction',
  'file_shared',
  'task_created',
  'task_updated',
  'meeting_scheduled',
  'approval_request',
  'praise_sent',
];

interface ActivityItem {
  id: string;
  type: string;
  user: string;
  text: string;
  preview: string;
  time: string;
  unread?: boolean;
}

interface ActivityTabProps {
  activity?: ActivityItem[];
  isAdmin?: boolean;
  onAdd?: (payload: { activity_type: string; preview_text?: string }) => Promise<void>;
  onDelete?: (activityId: string) => Promise<void>;
}

const ActivityTab = ({ activity = [], isAdmin, onAdd, onDelete }: ActivityTabProps) => {
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState(ACTIVITY_TYPES[0]);
  const [preview, setPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [err, setErr] = useState('');

  const handleAdd = async () => {
    if (!onAdd) return;
    setSaving(true);
    setErr('');
    try {
      await onAdd({ activity_type: type, preview_text: preview.trim() || undefined });
      setPreview('');
      setType(ACTIVITY_TYPES[0]);
      setShowForm(false);
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || 'Failed to add activity');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!onDelete) return;
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* Add button — admin only */}
      {isAdmin && (
        <div className="mb-2">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[#00a884] border border-[#00a884]/30 hover:bg-[#00a884]/10 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Activity
            </button>
          ) : (
            <div className="bg-[#111b21] border border-[#222d34] rounded-xl p-4 space-y-3">
              <p className="text-[#e9edef] text-sm font-medium">New Activity</p>

              <div>
                <label className="block text-[#8696a0] text-xs uppercase tracking-wider mb-1">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-[#0b141a] border border-[#2a3942] text-[#e9edef] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#00a884] capitalize"
                >
                  {ACTIVITY_TYPES.map((t) => (
                    <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#8696a0] text-xs uppercase tracking-wider mb-1">Note (optional)</label>
                <input
                  type="text"
                  value={preview}
                  onChange={(e) => setPreview(e.target.value)}
                  placeholder="Add a short note…"
                  className="w-full bg-[#0b141a] border border-[#2a3942] text-[#e9edef] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#00a884] placeholder-[#4a5568]"
                />
              </div>

              {err && <p className="text-red-400 text-xs">{err}</p>}

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setShowForm(false); setErr(''); }}
                  className="px-4 py-1.5 rounded-lg text-sm text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={saving}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium bg-[#00a884] hover:bg-[#008069] text-[#0b141a] disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  {saving && (
                    <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  )}
                  Add
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Activity list */}
      {!activity.length ? (
        <div className="flex flex-col items-center justify-center h-40 gap-3">
          <div className="w-12 h-12 rounded-full bg-[#1e2a30] flex items-center justify-center">
            <Activity className="w-6 h-6 text-[#8696a0]" />
          </div>
          <p className="text-[#8696a0] text-sm">No recent activity.</p>
        </div>
      ) : (
        activity.map((item) => (
          <div key={item.id} className="bg-[#111b21] border border-[#222d34] rounded-xl p-3 flex items-start gap-3 group">
            {/* Icon */}
            <div className="w-8 h-8 rounded-full bg-[#1e2a30] flex items-center justify-center flex-shrink-0 mt-0.5">
              <Activity className="w-4 h-4 text-[#00a884]" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-[#e9edef] text-sm">
                <span className="font-medium">{item.user}</span>{' '}
                <span className="text-[#8696a0] capitalize">{item.type.replace(/_/g, ' ')}</span>
              </p>
              {item.preview && <p className="text-[#8696a0] text-xs mt-0.5 truncate">{item.preview}</p>}
              <p className="text-[#8696a0] text-xs mt-1">{item.time}</p>
            </div>

            {/* Delete — admin only */}
            {isAdmin && onDelete && (
              <button
                onClick={() => handleDelete(item.id)}
                disabled={deletingId === item.id}
                title="Delete activity"
                className="p-1.5 rounded-lg text-red-500/40 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50 flex-shrink-0"
              >
                {deletingId === item.id ? (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default ActivityTab;
