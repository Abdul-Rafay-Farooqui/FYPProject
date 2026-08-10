'use client';

import { useEffect, useState, useCallback } from 'react';
import { CommunitiesAPI, GroupsAPI } from '@/lib/api/endpoints';
import type { CommunityDetail, GroupSummary } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { useRouter } from 'next/navigation';
import {
  Users, ChevronRight, Plus, Megaphone, UserPlus, Settings,
  LogOut, Trash2, Pencil, UsersRound, X,
} from 'lucide-react';
import CommunityAddGroupModal from './CommunityAddGroupModal';
import CommunityAddMembersModal from './CommunityAddMembersModal';

export default function CommunityView({ communityId }: { communityId: string }) {
  const [community, setCommunity] = useState<CommunityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const { user } = useAuthStore();
  const { setActiveConversation } = useChatStore();
  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      const data = await CommunitiesAPI.get(communityId);
      setCommunity(data);
      setEditName(data?.name || '');
      setEditDesc(data?.description || '');
    } catch (e) {
      console.error('Community fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0b141a]">
        <div className="w-6 h-6 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0b141a] text-[#8696a0]">
        Community not found
      </div>
    );
  }

  const isAdmin = community.members?.some(
    (m) => m.user_id === user?.id && m.role === 'admin',
  );

  const handleOpenGroup = (g: GroupSummary) => {
    const conv: any = {
      id: g.id,
      type: 'group',
      name: g.name,
      avatar_url: g.avatar_url,
      last_message_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setActiveConversation(conv);
    router.push(`/chat/${g.id}`);
  };

  const handleUpdateCommunity = async () => {
    try {
      await CommunitiesAPI.update(communityId, {
        name: editName.trim(),
        description: editDesc.trim(),
      });
      setShowSettings(false);
      fetchData();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Update failed');
    }
  };

  const handleDeleteCommunity = async () => {
    if (!window.confirm('Delete this community? All members will be removed.')) return;
    try {
      await CommunitiesAPI.remove(communityId);
      router.push('/');
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Delete failed');
    }
  };

  const handleLeaveCommunity = async () => {
    if (!window.confirm('Leave this community?')) return;
    try {
      await CommunitiesAPI.leave(communityId);
      router.push('/');
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Leave failed');
    }
  };

  const handleRemoveMember = async (memberUserId: string) => {
    if (!window.confirm('Remove this member from the community?')) return;
    try {
      await CommunitiesAPI.removeMember(communityId, memberUserId);
      fetchData();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Remove failed');
    }
  };

  const handleToggleRole = async (memberUserId: string, currentRole: 'admin' | 'member') => {
    try {
      const newRole = currentRole === 'admin' ? 'member' : 'admin';
      await CommunitiesAPI.setRole(communityId, memberUserId, newRole);
      fetchData();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed');
    }
  };

  const announcement = community.groups?.find((g) => g.is_announcement);
  const otherGroups = community.groups?.filter((g) => !g.is_announcement) || [];

  return (
    <div className="flex-1 flex flex-col bg-[#0b141a] overflow-hidden">
      {/* Header banner */}
      <div className="bg-gradient-to-b from-[#005c4b] to-[#0b141a] px-8 py-10 relative">
        <button
          onClick={() => router.push('/')}
          className="absolute top-4 right-4 text-white/70 hover:text-white"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-5">
          {community.avatar_url ? (
            <img src={community.avatar_url} alt={community.name} className="w-24 h-24 rounded-xl object-cover" />
          ) : (
            <div className="w-24 h-24 rounded-xl bg-[#00a884] flex items-center justify-center">
              <UsersRound className="w-12 h-12 text-white" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-white text-2xl font-medium truncate">{community.name}</h1>
            {community.description && (
              <p className="text-white/80 text-sm mt-1 line-clamp-2">{community.description}</p>
            )}
            <p className="text-white/60 text-xs mt-2">
              {community.members?.length || 0} members · {community.groups?.length || 0} groups
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-full hover:bg-white/10 text-white"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5">
        {/* Announcements group */}
        {announcement && (
          <section className="mb-6">
            <h2 className="text-[#00a884] text-sm font-medium uppercase tracking-wide mb-2">
              Announcements
            </h2>
            <button
              onClick={() => handleOpenGroup(announcement as any)}
              className="w-full flex items-center gap-3 bg-[#202c33] hover:bg-[#2a3942] rounded-lg p-3 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-[#00a884]/20 flex items-center justify-center">
                <Megaphone className="w-6 h-6 text-[#00a884]" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="text-[#e9edef] font-medium truncate">{announcement.name}</div>
                <div className="text-[#8696a0] text-xs truncate">
                  Only admins can send messages
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#8696a0]" />
            </button>
          </section>
        )}

        {/* Groups */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[#00a884] text-sm font-medium uppercase tracking-wide">
              Groups in this community
            </h2>
            {isAdmin && (
              <button
                onClick={() => setShowAddGroup(true)}
                className="text-[#00a884] text-xs font-medium hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                New group
              </button>
            )}
          </div>
          {otherGroups.length === 0 ? (
            <div className="text-[#8696a0] text-sm py-4 text-center">No groups yet</div>
          ) : (
            <div className="space-y-1">
              {otherGroups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => handleOpenGroup(g as any)}
                  className="w-full flex items-center gap-3 bg-[#202c33] hover:bg-[#2a3942] rounded-lg p-3 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-[#2a3942] flex items-center justify-center overflow-hidden">
                    {g.avatar_url ? (
                      <img src={g.avatar_url} alt={g.name} className="w-full h-full object-cover" />
                    ) : (
                      <Users className="w-6 h-6 text-[#8696a0]" />
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-[#e9edef] font-medium truncate">{g.name}</div>
                    <div className="text-[#8696a0] text-xs truncate">
                      {g.member_count || 0} members
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#8696a0]" />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Members */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[#00a884] text-sm font-medium uppercase tracking-wide">
              Members · {community.members?.length || 0}
            </h2>
            {isAdmin && (
              <button
                onClick={() => setShowAddMembers(true)}
                className="text-[#00a884] text-xs font-medium hover:underline flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add members
              </button>
            )}
          </div>
          <div className="bg-[#202c33] rounded-lg divide-y divide-[#222d34]">
            {community.members?.map((m) => (
              <div key={m.user_id} className="flex items-center gap-3 p-3">
                <div className="w-10 h-10 rounded-full bg-[#2a3942] flex items-center justify-center overflow-hidden">
                  {m.avatar_url ? (
                    <img src={m.avatar_url} alt={m.display_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[#e9edef]">{m.display_name?.[0]?.toUpperCase() || '?'}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[#e9edef] font-medium truncate">
                    {m.display_name} {m.user_id === user?.id && <span className="text-[#8696a0] text-xs">(You)</span>}
                  </div>
                  <div className="text-[#8696a0] text-xs">{m.role}</div>
                </div>
                {isAdmin && m.user_id !== user?.id && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleRole(m.user_id, m.role)}
                      className="text-xs text-[#00a884] hover:underline"
                    >
                      {m.role === 'admin' ? 'Demote' : 'Promote'}
                    </button>
                    <button
                      onClick={() => handleRemoveMember(m.user_id)}
                      className="text-xs text-red-400 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Danger zone */}
        <section className="flex flex-col gap-2 mt-6">
          <button
            onClick={handleLeaveCommunity}
            className="w-full bg-[#202c33] hover:bg-[#2a3942] text-red-400 rounded-lg p-3 flex items-center gap-3 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Exit community
          </button>
          {isAdmin && (
            <button
              onClick={handleDeleteCommunity}
              className="w-full bg-[#202c33] hover:bg-[#2a3942] text-red-400 rounded-lg p-3 flex items-center gap-3 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
              Delete community
            </button>
          )}
        </section>
      </div>

      {/* Settings modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#202c33] rounded-lg w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-[#222d34]">
              <h3 className="text-[#e9edef] font-medium flex items-center gap-2">
                <Pencil className="w-4 h-4" /> Edit community
              </h3>
              <button onClick={() => setShowSettings(false)} className="text-[#8696a0] hover:text-[#e9edef]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-[#8696a0] text-xs uppercase">Name</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#2a3942] text-[#e9edef] rounded px-3 py-2 mt-1 outline-none"
                />
              </div>
              <div>
                <label className="text-[#8696a0] text-xs uppercase">Description</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-[#2a3942] text-[#e9edef] rounded px-3 py-2 mt-1 outline-none resize-none"
                />
              </div>
            </div>
            <div className="p-4 flex justify-end gap-2 border-t border-[#222d34]">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-[#8696a0] hover:text-[#e9edef]"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateCommunity}
                className="px-4 py-2 bg-[#00a884] text-[#111b21] rounded font-medium hover:bg-[#008069]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddGroup && (
        <CommunityAddGroupModal
          communityId={communityId}
          existingGroupIds={community.groups?.map((g) => g.id) || []}
          onClose={() => setShowAddGroup(false)}
          onDone={fetchData}
        />
      )}
      {showAddMembers && (
        <CommunityAddMembersModal
          communityId={communityId}
          existingMemberIds={community.members?.map((m) => m.user_id) || []}
          onClose={() => setShowAddMembers(false)}
          onDone={fetchData}
        />
      )}
    </div>
  );
}