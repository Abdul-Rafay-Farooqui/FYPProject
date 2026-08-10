'use client';

import { useState, useEffect, useCallback } from 'react';
import ChatListItem from '../ChatListItem';
import { ConversationsAPI } from '@/lib/api/endpoints';
import { getSocket } from '@/lib/socket';
import { Conversation } from '@/types';
import { Search, Archive, ArrowLeft, Lock } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

type ExtendedConv = Conversation & {
  _unread_count: number;
  _is_muted: boolean;
  _is_pinned: boolean;
  _is_archived: boolean;
  _is_locked: boolean;
};

type View = 'main' | 'archived' | 'locked';

export default function ChatsPanel() {
  const [conversations, setConversations] = useState<ExtendedConv[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('main');
  const { user } = useAuthStore();

  const fetchConversations = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await ConversationsAPI.list();
      const formatted: ExtendedConv[] = (data || []).map((conv: any) => ({
        ...conv,
        _unread_count: conv.unread_count ?? 0,
        _is_muted: conv.is_muted ?? false,
        _is_pinned: conv.is_pinned ?? false,
        _is_archived: conv._is_archived ?? false,
        _is_locked: !!conv.is_locked,
      }));
      formatted.sort((a, b) => {
        if (a._is_pinned && !b._is_pinned) return -1;
        if (!a._is_pinned && b._is_pinned) return 1;
        return (
          new Date(b.last_message_at).getTime() -
          new Date(a.last_message_at).getTime()
        );
      });
      setConversations(formatted);
    } catch (e) {
      console.error('ChatsPanel fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    fetchConversations();

    const socket = getSocket();
    const refetch = () => fetchConversations();
    const onNewMessage = (msg: any) => {
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === msg.conversation_id);
        if (!exists) {
          refetch();
          return prev;
        }
        return prev
          .map((c) =>
            c.id === msg.conversation_id
              ? {
                  ...c,
                  last_message_preview:
                    msg.type === 'text'
                      ? msg.content?.substring(0, 100)
                      : `📎 ${msg.type}`,
                  last_message_at: msg.created_at,
                  _unread_count:
                    msg.sender_id !== user.id
                      ? (c._unread_count ?? 0) + 1
                      : c._unread_count,
                }
              : c,
          )
          .sort((a, b) => {
            if (a._is_pinned && !b._is_pinned) return -1;
            if (!a._is_pinned && b._is_pinned) return 1;
            return (
              new Date(b.last_message_at).getTime() -
              new Date(a.last_message_at).getTime()
            );
          });
      });
    };
    const onPresenceUpdate = (data: { user_id: string; is_online: boolean }) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.other_participant?.id === data.user_id
            ? {
                ...c,
                other_participant: {
                  ...c.other_participant,
                  is_online: data.is_online,
                },
              }
            : c,
        ),
      );
    };

    socket.on('message:new', onNewMessage);
    socket.on('conversation:update', refetch);
    socket.on('presence:update', onPresenceUpdate);
    socket.on('block:update', refetch);

    return () => {
      socket.off('message:new', onNewMessage);
      socket.off('conversation:update', refetch);
      socket.off('presence:update', onPresenceUpdate);
      socket.off('block:update', refetch);
    };
  }, [user?.id, fetchConversations]);

  const mainList = conversations.filter(
    (c) => !c._is_archived && !c._is_locked,
  );
  const archivedList = conversations.filter((c) => c._is_archived);
  const lockedList = conversations.filter((c) => c._is_locked);

  const list =
    view === 'archived'
      ? archivedList
      : view === 'locked'
        ? lockedList
        : mainList;

  const filtered = !searchQuery
    ? list
    : list.filter((c: any) => {
        const name =
          c.type === 'group'
            ? c.name
            : c.other_participant?.display_name || '';
        return (
          name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.last_message_preview
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
        );
      });

  return (
    <div className="flex flex-col h-full">
      <div className="px-2 pt-2 pb-1">
        <div className="relative flex items-center bg-[#202c33] rounded-lg px-3 py-1.5 focus-within:bg-[#2a3942]">
          <Search className="w-4 h-4 text-[#8696a0] mr-3 flex-shrink-0" />
          <input
            type="text"
            placeholder={
              view === 'locked'
                ? 'Locked chats'
                : view === 'archived'
                  ? 'Search archived'
                  : 'Search or start new chat'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-[#e9edef] text-sm w-full outline-none placeholder:text-[#8696a0]"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {view === 'main' && archivedList.length > 0 && !searchQuery && (
          <button
            onClick={() => setView('archived')}
            className="w-full px-4 py-3 flex items-center gap-4 hover:bg-[#202c33] border-b border-[#222d34] transition-colors"
          >
            <Archive className="w-5 h-5 text-[#00a884]" />
            <span className="text-[#e9edef] text-sm font-medium flex-1 text-left">
              Archived
            </span>
            <span className="text-[#00a884] text-xs">
              {archivedList.length}
            </span>
          </button>
        )}

        {view === 'main' && lockedList.length > 0 && !searchQuery && (
          <button
            onClick={() => setView('locked')}
            className="w-full px-4 py-3 flex items-center gap-4 hover:bg-[#202c33] border-b border-[#222d34] transition-colors"
          >
            <Lock className="w-5 h-5 text-[#00a884]" />
            <span className="text-[#e9edef] text-sm font-medium flex-1 text-left">
              Locked chats
            </span>
            <span className="text-[#00a884] text-xs">
              {lockedList.length}
            </span>
          </button>
        )}

        {view !== 'main' && (
          <button
            onClick={() => setView('main')}
            className="w-full px-4 py-3 flex items-center gap-4 hover:bg-[#2ca58e]/10 border-b border-[#222d34] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#00a884]" />
            <span className="text-[#00a884] text-sm font-medium">
              Back to chats
            </span>
          </button>
        )}

        {loading ? (
          <div className="flex justify-center p-8">
            <div className="w-6 h-6 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((conv) => (
            <ChatListItem
              key={conv.id}
              conversation={conv as any}
              onRefresh={fetchConversations}
            />
          ))
        ) : (
          <div className="p-8 text-center text-[#8696a0] text-sm">
            {searchQuery
              ? 'No chats found'
              : view === 'archived'
                ? 'No archived chats'
                : view === 'locked'
                  ? 'No locked chats'
                  : 'No chats yet. Add a contact to start chatting!'}
          </div>
        )}
      </div>
    </div>
  );
}