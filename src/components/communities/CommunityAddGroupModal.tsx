'use client';

import { useEffect, useState } from 'react';
import { X, Users, Plus } from 'lucide-react';
import { CommunitiesAPI, GroupsAPI, ContactsAPI } from '@/lib/api/endpoints';
import type { GroupSummary } from '@/types';

interface Props {
  communityId: string;
  existingGroupIds: string[];
  onClose: () => void;
  onDone: () => void;
}

export default function CommunityAddGroupModal({
  communityId,
  existingGroupIds,
  onClose,
  onDone,
}: Props) {
  const [mode, setMode] = useState<'pick' | 'create'>('pick');
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [gs, cs] = await Promise.all([GroupsAPI.list(), ContactsAPI.list()]);
        setGroups((gs || []).filter((g: GroupSummary) => !existingGroupIds.includes(g.id)));
        setContacts(cs || []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [existingGroupIds]);

  const handleLink = async (groupId: string) => {
    setLoading(true);
    setError(null);
    try {
      await CommunitiesAPI.linkGroup(communityId, groupId);
      onDone();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to link group');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await CommunitiesAPI.createGroup(communityId, {
        name: name.trim(),
        description: description.trim() || undefined,
        member_ids: selectedMembers,
      });
      onDone();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#202c33] rounded-lg w-full max-w-md shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[#222d34]">
          <h3 className="text-[#e9edef] font-medium">
            {mode === 'pick' ? 'Add group to community' : 'Create new group'}
          </h3>
          <button onClick={onClose} className="text-[#8696a0] hover:text-[#e9edef]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-[#222d34]">
          <button
            onClick={() => setMode('pick')}
            className={`flex-1 py-2 text-sm ${mode === 'pick' ? 'text-[#00a884] border-b-2 border-[#00a884]' : 'text-[#8696a0]'}`}
          >
            Existing group
          </button>
          <button
            onClick={() => setMode('create')}
            className={`flex-1 py-2 text-sm ${mode === 'create' ? 'text-[#00a884] border-b-2 border-[#00a884]' : 'text-[#8696a0]'}`}
          >
            Create new
          </button>
        </div>

        {error && <div className="text-red-400 text-xs px-4 pt-2">{error}</div>}

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {mode === 'pick' ? (
            groups.length === 0 ? (
              <div className="text-[#8696a0] text-sm text-center p-6">
                No groups available to link
              </div>
            ) : (
              groups.map((g) => (
                <button
                  key={g.id}
                  disabled={loading}
                  onClick={() => handleLink(g.id)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-[#2a3942] rounded transition-colors disabled:opacity-50"
                >
                  <div className="w-10 h-10 rounded-full bg-[#2a3942] flex items-center justify-center overflow-hidden">
                    {g.avatar_url ? (
                      <img src={g.avatar_url} alt={g.name} className="w-full h-full object-cover" />
                    ) : (
                      <Users className="w-5 h-5 text-[#8696a0]" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-[#e9edef] text-sm font-medium">{g.name}</div>
                    <div className="text-[#8696a0] text-xs">{g.member_count || 0} members</div>
                  </div>
                  <Plus className="w-4 h-4 text-[#00a884]" />
                </button>
              ))
            )
          ) : (
            <div className="p-2 space-y-3">
              <input
                placeholder="Group name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#2a3942] text-[#e9edef] rounded px-3 py-2 outline-none"
              />
              <textarea
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full bg-[#2a3942] text-[#e9edef] rounded px-3 py-2 outline-none resize-none"
              />
              <div>
                <div className="text-[#8696a0] text-xs uppercase mb-1">
                  Select members ({selectedMembers.length})
                </div>
                <div className="max-h-48 overflow-y-auto custom-scrollbar bg-[#111b21] rounded p-1">
                  {contacts.length === 0 ? (
                    <div className="text-[#8696a0] text-xs p-3 text-center">No contacts</div>
                  ) : (
                    contacts.map((c: any) => {
                      const u = c.contact || c;
                      const id = u?.id;
                      if (!id) return null;
                      return (
                        <label
                          key={id}
                          className="flex items-center gap-2 p-2 hover:bg-[#2a3942] rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedMembers.includes(id)}
                            onChange={() => toggleMember(id)}
                            className="accent-[#00a884]"
                          />
                          <span className="text-[#e9edef] text-sm">{u.display_name}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {mode === 'create' && (
          <div className="p-3 border-t border-[#222d34] flex justify-end">
            <button
              onClick={handleCreate}
              disabled={loading || !name.trim()}
              className="px-4 py-2 bg-[#00a884] text-[#111b21] rounded font-medium hover:bg-[#008069] disabled:opacity-50"
            >
              {loading ? 'Creating…' : 'Create group'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}