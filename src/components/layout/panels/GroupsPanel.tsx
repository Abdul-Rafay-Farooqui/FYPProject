'use client';

import { useEffect, useState, useCallback } from 'react';
import { GroupsAPI } from '@/lib/api/endpoints';
import { GroupSummary } from '@/types';
import { Search, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNowStrict } from 'date-fns';
import GroupCreateModal from '../../groups/GroupCreateModal';
import { useChatStore } from '@/store/chatStore';

export default function GroupsPanel() {
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [creatorOpen, setCreatorOpen] = useState(false);
  const router = useRouter();
  const { setActiveConversation } = useChatStore();

  const load = useCallback(async () => {
    try {
      const data = await GroupsAPI.list();
      setGroups(data);
    } catch (e) {
      console.error('Groups load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = !query
    ? groups
    : groups.filter((g) =>
        g.name?.toLowerCase().includes(query.toLowerCase()),
      );

  const openGroup = (g: GroupSummary) => {
    setActiveConversation({
      id: g.id,
      type: 'group',
      name: g.name,
      avatar_url: g.avatar_url,
      last_message_at: g.last_message_at,
      last_message_preview: g.last_message_preview || undefined,
      send_permission: g.send_permission,
      edit_permission: g.edit_permission,
      community_id: g.community_id,
      created_at: g.last_message_at,
      updated_at: g.last_message_at,
    } as any);
    router.push(`/chat/${g.id}`);
  };

  return (
    <>
      <button
        data-new-group
        className="hidden"
        onClick={() => setCreatorOpen(true)}
      />

      <div className="flex flex-col h-full">
        <div className="px-2 pt-2 pb-1">
          <div className="relative flex items-center bg-[#202c33] rounded-lg px-3 py-1.5 focus-within:bg-[#2a3942]">
            <Search className="w-4 h-4 text-[#8696a0] mr-3 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search groups"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-transparent text-[#e9edef] text-sm w-full outline-none placeholder:text-[#8696a0]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <button
            onClick={() => setCreatorOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#202c33] border-b border-[#222d34]"
          >
            <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-[#111b21]" />
            </div>
            <span className="text-[#00a884] font-medium text-sm">
              New group
            </span>
          </button>

          {loading ? (
            <div className="flex justify-center p-8">
              <div className="w-6 h-6 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-[#8696a0] text-sm">
              {query ? 'No groups found' : 'No groups yet. Create one!'}
            </div>
          ) : (
            filtered.map((g) => (
              <div
                key={g.id}
                onClick={() => openGroup(g)}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#202c33] border-b border-[#222d34]"
              >
                {g.avatar_url ? (
                  <img
                    src={g.avatar_url}
                    alt={g.name}
                    className="w-[49px] h-[49px] rounded-full object-cover"
                  />
                ) : (
                  <div className="w-[49px] h-[49px] rounded-full bg-[#2a3942] flex items-center justify-center">
                    <Users className="w-6 h-6 text-[#8696a0]" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-[#e9edef] font-medium text-[15px] truncate">
                      {g.name}
                    </h3>
                    <span className="text-[#8696a0] text-xs ml-2 whitespace-nowrap">
                      {g.last_message_at
                        ? formatDistanceToNowStrict(
                            new Date(g.last_message_at),
                            { addSuffix: false },
                          )
                        : ''}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-0.5">
                    <p className="text-[#8696a0] text-[13px] truncate flex-1">
                      {g.last_message_preview ||
                        `${g.member_count} members${
                          g.role === 'admin' ? ' • Admin' : ''
                        }${
                          g.send_permission === 'admins'
                            ? ' • View only'
                            : ''
                        }`}
                    </p>
                    {g.unread_count > 0 && (
                      <div className="bg-[#00a884] text-[#111b21] text-[11px] font-bold min-w-[20px] h-[20px] rounded-full flex items-center justify-center px-1 ml-2">
                        {g.unread_count > 99 ? '99+' : g.unread_count}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <GroupCreateModal
        open={creatorOpen}
        onClose={() => setCreatorOpen(false)}
        onCreated={(g) => {
          setCreatorOpen(false);
          load();
          openGroup({
            id: g.id,
            name: g.name,
            description: g.description,
            avatar_url: g.avatar_url,
            role: 'admin',
            is_muted: false,
            is_pinned: false,
            unread_count: 0,
            last_message_at: g.last_message_at || g.updated_at,
            last_message_preview: '',
            member_count: g.members?.length || 1,
            send_permission: g.send_permission || 'all',
            edit_permission: g.edit_permission || 'all',
            community_id: g.community_id,
          } as any);
        }}
      />
    </>
  );
}