'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, Users, UserPlus, LogOut, Pencil, Shield, Trash2, MessageSquareOff } from 'lucide-react';
import { GroupsAPI, ContactsAPI } from '@/lib/api/endpoints';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useRouter } from 'next/navigation';
import type { GroupDetail } from '@/types';

interface Props {
  groupId: string;
}

export default function GroupInfoPanel({ groupId }: Props) {
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const { user } = useAuthStore();
  const { setContactInfoOpen } = useUIStore();
  const router = useRouter();

  const fetchGroup = useCallback(async () => {
    try {
      const data = await GroupsAPI.get(groupId);
      setGroup(data);
      setName(data?.name || '');
      setDescription(data?.description || '');
    } catch (e) {
      console.error('Group fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  if (loading) {
    return (
      <aside className="w-[400px] flex-shrink-0 bg-[#111b21] border-l border-[#222d34] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin" />
      </aside>
    );
  }
  if (!group) return null;

  const isAdmin = group.members?.some(
    (m) => m.user_id === user?.id && m.role === 'admin',
  );

  const handleSave = async () => {
    try {
      await GroupsAPI.update(groupId, {
        name: name.trim(),
        description: description.trim(),
      });
      setEditing(false);
      fetchGroup();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to update');
    }
  };

  const handleTogglePermission = async (
    field: 'send_permission' | 'edit_permission',
    next: 'all' | 'admins',
  ) => {
    try {
      await GroupsAPI.update(groupId, { [field]: next });
      fetchGroup();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed');
    }
  };

  const handleToggleRole = async (userId: string, currentRole: 'admin' | 'member') => {
    try {
      const role = currentRole === 'admin' ? 'member' : 'admin';
      await GroupsAPI.setRole(groupId, userId, role);
      fetchGroup();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!window.confirm('Remove this member from the group?')) return;
    try {
      await GroupsAPI.removeMember(groupId, userId);
      fetchGroup();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed');
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('Leave this group?')) return;
    try {
      await GroupsAPI.leave(groupId);
      router.push('/');
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed');
    }
  };

  const openAddMembers = async () => {
    try {
      const cs = await ContactsAPI.list();
      setContacts(cs || []);
      setSelectedContacts([]);
      setShowAddMembers(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddMembers = async () => {
    if (selectedContacts.length === 0) return;
    try {
      await GroupsAPI.addMembers(groupId, selectedContacts);
      setShowAddMembers(false);
      fetchGroup();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed');
    }
  };

  const existingIds = new Set(group.members?.map((m) => m.user_id) || []);

  return (
    <aside className="w-[400px] flex-shrink-0 bg-[#111b21] border-l border-[#222d34] flex flex-col">
      {/* Header */}
      <div className="flex items-center px-4 py-3 bg-[#202c33] min-h-[60px] gap-4">
        <button
          onClick={() => setContactInfoOpen(false)}
          className="text-[#aebac1] hover:text-[#e9edef]"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-[#e9edef] font-medium">Group info</h2>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Avatar + Name */}
        <div className="flex flex-col items-center py-8 bg-[#0b141a] border-b-8 border-[#0b141a]">
          {group.avatar_url ? (
            <img src={group.avatar_url} alt={group.name} className="w-40 h-40 rounded-full object-cover" />
          ) : (
            <div className="w-40 h-40 rounded-full bg-[#2a3942] flex items-center justify-center">
              <Users className="w-20 h-20 text-[#8696a0]" />
            </div>
          )}
          {editing ? (
            <div className="mt-4 w-full px-6 space-y-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#2a3942] text-[#e9edef] text-center text-xl rounded px-3 py-2 outline-none"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Group description"
                className="w-full bg-[#2a3942] text-[#e9edef] text-sm rounded px-3 py-2 outline-none resize-none"
              />
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="px-3 py-1 text-sm text-[#8696a0]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-3 py-1 text-sm bg-[#00a884] text-[#111b21] rounded font-medium"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-4 flex items-center gap-2">
                <h3 className="text-[#e9edef] text-2xl">{group.name}</h3>
                {isAdmin && (
                  <button
                    onClick={() => setEditing(true)}
                    className="text-[#8696a0] hover:text-[#e9edef]"
                    aria-label="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-[#8696a0] text-sm mt-1">
                Group · {group.members?.length || 0} members
              </p>
              {group.description && (
                <p className="text-[#aebac1] text-sm mt-3 px-6 text-center">
                  {group.description}
                </p>
              )}
            </>
          )}
        </div>

        {/* Permissions (admin only) */}
        {isAdmin && (
          <div className="bg-[#111b21] border-b-8 border-[#0b141a] py-2">
            <div className="px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquareOff className="w-5 h-5 text-[#8696a0]" />
                <div>
                  <div className="text-[#e9edef] text-sm">Send messages</div>
                  <div className="text-[#8696a0] text-xs">
                    {group.send_permission === 'admins' ? 'Only admins' : 'All members'}
                  </div>
                </div>
              </div>
              <button
                onClick={() =>
                  handleTogglePermission(
                    'send_permission',
                    group.send_permission === 'admins' ? 'all' : 'admins',
                  )
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  group.send_permission === 'admins' ? 'bg-[#00a884]' : 'bg-[#2a3942]'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    group.send_permission === 'admins' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Pencil className="w-5 h-5 text-[#8696a0]" />
                <div>
                  <div className="text-[#e9edef] text-sm">Edit group info</div>
                  <div className="text-[#8696a0] text-xs">
                    {group.edit_permission === 'admins' ? 'Only admins' : 'All members'}
                  </div>
                </div>
              </div>
              <button
                onClick={() =>
                  handleTogglePermission(
                    'edit_permission',
                    group.edit_permission === 'admins' ? 'all' : 'admins',
                  )
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  group.edit_permission === 'admins' ? 'bg-[#00a884]' : 'bg-[#2a3942]'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    group.edit_permission === 'admins' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* Members */}
        <div className="bg-[#111b21] border-b-8 border-[#0b141a] py-2">
          <div className="px-6 py-3 flex items-center justify-between">
            <span className="text-[#8696a0] text-sm">
              {group.members?.length || 0} members
            </span>
            {isAdmin && (
              <button
                onClick={openAddMembers}
                className="text-[#00a884] text-sm flex items-center gap-1 hover:underline"
              >
                <UserPlus className="w-4 h-4" />
                Add
              </button>
            )}
          </div>
          {group.members?.map((m) => (
            <div
              key={m.user_id}
              className="flex items-center gap-3 px-6 py-2 hover:bg-[#202c33]"
            >
              <div className="w-10 h-10 rounded-full bg-[#2a3942] flex items-center justify-center overflow-hidden">
                {m.avatar_url ? (
                  <img src={m.avatar_url} alt={m.display_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[#e9edef]">{m.display_name?.[0]?.toUpperCase() || '?'}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[#e9edef] text-sm truncate">
                  {m.display_name}
                  {m.user_id === user?.id && <span className="text-[#8696a0] text-xs ml-1">(You)</span>}
                </div>
                {m.role === 'admin' && (
                  <div className="text-[#00a884] text-xs flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Group admin
                  </div>
                )}
              </div>
              {isAdmin && m.user_id !== user?.id && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleRole(m.user_id, m.role)}
                    className="text-xs text-[#00a884] hover:underline px-2"
                  >
                    {m.role === 'admin' ? 'Demote' : 'Promote'}
                  </button>
                  <button
                    onClick={() => handleRemoveMember(m.user_id)}
                    className="text-red-400 hover:text-red-300"
                    aria-label="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Exit */}
        <div className="bg-[#111b21] py-2">
          <button
            onClick={handleLeave}
            className="w-full text-left px-6 py-3 text-red-400 flex items-center gap-3 hover:bg-[#202c33]"
          >
            <LogOut className="w-5 h-5" />
            Exit group
          </button>
        </div>
      </div>

      {/* Add members modal */}
      {showAddMembers && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[#202c33] rounded-lg w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#222d34]">
              <h3 className="text-[#e9edef] font-medium">Add members</h3>
              <button
                onClick={() => setShowAddMembers(false)}
                className="text-[#8696a0] hover:text-[#e9edef]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
              {contacts
                .filter((c: any) => {
                  const u = c.contact || c;
                  return u?.id && !existingIds.has(u.id);
                })
                .map((c: any) => {
                  const u = c.contact || c;
                  return (
                    <label
                      key={u.id}
                      className="flex items-center gap-3 p-2 hover:bg-[#2a3942] rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedContacts.includes(u.id)}
                        onChange={() =>
                          setSelectedContacts((prev) =>
                            prev.includes(u.id)
                              ? prev.filter((x) => x !== u.id)
                              : [...prev, u.id],
                          )
                        }
                        className="accent-[#00a884]"
                      />
                      <div className="w-9 h-9 rounded-full bg-[#2a3942] flex items-center justify-center overflow-hidden">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt={u.display_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[#e9edef] text-sm">{u.display_name?.[0]?.toUpperCase()}</span>
                        )}
                      </div>
                      <span className="text-[#e9edef] text-sm">{u.display_name}</span>
                    </label>
                  );
                })}
            </div>
            <div className="p-3 border-t border-[#222d34] flex justify-end">
              <button
                onClick={handleAddMembers}
                disabled={selectedContacts.length === 0}
                className="px-4 py-2 bg-[#00a884] text-[#111b21] rounded font-medium disabled:opacity-50"
              >
                Add {selectedContacts.length || ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}