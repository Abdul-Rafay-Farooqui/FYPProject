'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import ChatHeader from './ChatHeader';
import ChatSearchBar from './ChatSearchBar';
import ContactInfoPanel from './ContactInfoPanel';
import GroupInfoPanel from './GroupInfoPanel';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { ConversationsAPI, MessagesAPI, BlocksAPI } from '@/lib/api/endpoints';
import { getSocket } from '@/lib/socket';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Message } from '@/types';
import { format, isToday, isYesterday } from 'date-fns';
import { Pin, X, Trash2, Forward, XCircle } from 'lucide-react';

function collectReadReceiptIds(messages: Message[], userId?: string) {
  const readIds = new Set<string>();
  if (!userId) return readIds;

  for (const message of messages) {
    if (
      message.sender_id === userId &&
      message.reads?.some((read) => read.user_id !== userId)
    ) {
      readIds.add(message.id);
    }
  }

  return readIds;
}

export default function ChatWindow({ conversationId }: { conversationId: string }) {
  const {
    activeConversation, setActiveConversation,
    messages, setMessages, addMessage, updateMessage, removeMessage,
    setStarredMessageIds, setPinnedMessageId, pinnedMessageId,
  } = useChatStore();
  const { user } = useAuthStore();
  const {
    isContactInfoOpen, isChatSearchOpen, 
    isSelectionMode, selectedMessages, clearSelectedMessages,
    setForwardMessage, setDeleteMessage, setSelectionMode,
  } = useUIStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readMessageIds, setReadMessageIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const isBlockedRef = useRef(false);
  const loadedConvRef = useRef<string | null>(null);

  useEffect(() => {
    isBlockedRef.current = isBlocked;
  }, [isBlocked]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  // Ref to hold the latest load function (avoids stale closures)
  const loadRef = useRef<() => Promise<void>>();

  useEffect(() => {
    setReadMessageIds(new Set());
    loadedConvRef.current = null;
  }, [conversationId]);

  loadRef.current = async () => {
    if (loadedConvRef.current !== conversationId) {
      setLoading(true);
    }
    setError(null);

    try {
      const conv = await ConversationsAPI.get(conversationId);
      setActiveConversation(conv);

      // Check blocked status (bidirectional)
      try {
        const otherUserId = conv.other_participant?.id;
        if (otherUserId) {
          const blockStatus = await BlocksAPI.check(otherUserId);
          setIsBlocked(blockStatus.is_blocked);
        }
      } catch {
        setIsBlocked(false);
      }

      const msgs = await MessagesAPI.list(conversationId);
      setMessages(msgs || []);
      setReadMessageIds(collectReadReceiptIds(msgs || [], user?.id));
      loadedConvRef.current = conversationId;

      if ((conv.unread_count ?? 0) > 0) {
        ConversationsAPI.markRead(conversationId).catch(() => {});
      }

      // Mark messages as read for read receipts
      if (msgs && msgs.length > 0) {
        const unreadIds = msgs
          .filter((m: Message) => m.sender_id !== user?.id && !m.is_deleted_for_everyone)
          .map((m: Message) => m.id);
        if (unreadIds.length > 0) {
          MessagesAPI.markRead(unreadIds).catch(() => {});
        }
      }

      try {
        const starredIds = await MessagesAPI.listStarredIds(conversationId);
        if (starredIds) setStarredMessageIds(new Set(starredIds));
      } catch {}

      try {
        const pinned = await MessagesAPI.getPinned(conversationId);
        setPinnedMessageId(pinned?.message_id || null);
      } catch {
        setPinnedMessageId(null);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    // Initial load
    loadRef.current?.();

    // ── Socket.IO realtime listeners ──
    const socket = getSocket();
    socket.emit('conversation:join', { conversation_id: conversationId });

    const onNewMessage = (msg: Message) => {
      if (msg.conversation_id !== conversationId) return;
      if (isBlockedRef.current && msg.sender_id !== user.id) return;
      addMessage(msg);
      if (msg.sender_id !== user.id) {
        MessagesAPI.markRead([msg.id]).catch(() => {});
        ConversationsAPI.markRead(conversationId).catch(() => {});
      }
    };

    const onMessageUpdate = (msg: Message) => {
      if (msg.conversation_id !== conversationId) return;
      updateMessage(msg);
    };

    const onMessageRead = (data: { message_ids: string[]; user_id: string }) => {
      if (data.user_id === user.id) return;

      setReadMessageIds((prev) => {
        const next = new Set(prev);
        for (const id of data.message_ids || []) {
          next.add(id);
        }
        return next;
      });
    };

    const onMessagePinned = (data: { conversation_id: string; message_id: string | null }) => {
      if (data.conversation_id === conversationId) {
        setPinnedMessageId(data.message_id);
      }
    };

    const onConversationUpdate = (data: { conversation_id: string }) => {
      if (data.conversation_id === conversationId) {
        loadRef.current?.();
      }
    };

    const onBlockUpdate = () => {
      loadRef.current?.();
    };

    socket.on('message:new', onNewMessage);
    socket.on('message:update', onMessageUpdate);
    socket.on('message:read', onMessageRead);
    socket.on('message:pinned', onMessagePinned);
    socket.on('conversation:update', onConversationUpdate);
    socket.on('block:update', onBlockUpdate);

    return () => {
      socket.emit('conversation:leave', { conversation_id: conversationId });
      socket.off('message:new', onNewMessage);
      socket.off('message:update', onMessageUpdate);
      socket.off('message:read', onMessageRead);
      socket.off('message:pinned', onMessagePinned);
      socket.off('conversation:update', onConversationUpdate);
      socket.off('block:update', onBlockUpdate);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, user?.id]);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // Reset search query when search closes
  useEffect(() => {
    if (!isChatSearchOpen) setSearchQuery('');
  }, [isChatSearchOpen]);

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };

  const pinnedMsg = pinnedMessageId ? messages.find((m) => m.id === pinnedMessageId) : null;

  // ─── Selection Actions ───
  const handleDeleteSelected = async () => {
    if (selectedMessages.size === 0 || !user?.id) return;
    const ids = Array.from(selectedMessages);
    for (const id of ids) {
      try {
        await MessagesAPI.deleteForMe(id);
        removeMessage(id);
      } catch (e) {
        console.error('Delete failed for', id, e);
      }
    }
    clearSelectedMessages();
  };

  const handleForwardSelected = () => {
    if (selectedMessages.size === 0) return;
    const firstId = Array.from(selectedMessages)[0];
    const msg = messages.find((m) => m.id === firstId);
    if (msg) {
      setForwardMessage(msg);
    }
    clearSelectedMessages();
  };

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-3 bg-[#0b141a]">
        <div className="w-10 h-10 border-4 border-[#00a884] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#8696a0] text-sm">Loading messages...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-3 bg-[#0b141a]">
        <p className="text-red-400 text-sm text-center px-4">{error}</p>
        <button onClick={() => window.location.reload()} className="text-[#00a884] text-sm underline mt-2">
          Retry
        </button>
      </div>
    );
  }

  let lastDate = '';

  return (
    <div className="h-full flex bg-[#0b141a] relative">
      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {activeConversation && <ChatHeader conversation={activeConversation} />}

        {/* Chat search bar */}
        <ChatSearchBar onQueryChange={setSearchQuery} />

        {/* Pinned message banner */}
        {pinnedMsg && (
          <div className="bg-[#1e2a30] border-b border-[#222d34] px-4 py-2 flex items-center gap-3 relative z-10">
            <Pin className="w-4 h-4 text-[#00a884] flex-shrink-0" />
            <p className="text-[#e9edef] text-sm truncate flex-1">
              {pinnedMsg.content || `📎 ${pinnedMsg.type}`}
            </p>
            <button
              onClick={async () => {
                try {
                  await MessagesAPI.unpin(conversationId);
                  setPinnedMessageId(null);
                } catch (e) {
                  console.error('Unpin failed', e);
                }
              }}
              className="text-[#8696a0] hover:text-[#e9edef] transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Selection mode toolbar */}
        {isSelectionMode && (
          <div className="bg-[#202c33] border-b border-[#222d34] px-4 py-2 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <button
                onClick={() => clearSelectedMessages()}
                className="text-[#8696a0] hover:text-[#e9edef] transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
              <span className="text-[#e9edef] text-sm">
                {selectedMessages.size} selected
              </span>
            </div>
            <div className="flex items-center gap-4">
              {selectedMessages.size > 0 && (
                <>
                  <button
                    onClick={handleForwardSelected}
                    className="text-[#aebac1] hover:text-[#e9edef] transition-colors flex items-center gap-1.5 text-sm"
                    title="Forward selected"
                  >
                    <Forward className="w-4 h-4" /> Forward
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-1.5 text-sm"
                    title="Delete selected"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </>
              )}
              <button
                onClick={() => clearSelectedMessages()}
                className="text-[#00a884] text-sm hover:text-[#00c49a] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Messages area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-1 custom-scrollbar relative z-10">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <p className="text-[#8696a0] text-sm bg-[#182229] px-4 py-2 rounded-full">
                No messages yet. Say hello!
              </p>
            </div>
          )}
          {messages.map((msg, idx) => {
            const msgDate = getDateLabel(msg.created_at);
            const showDateSep = msgDate !== lastDate;
            lastDate = msgDate;
            return (
              <div key={msg.id}>
                {showDateSep && (
                  <div className="flex justify-center my-3">
                    <span className="bg-[#182229] text-[#8696a0] text-[11px] px-3 py-1 rounded-md shadow-sm">
                      {msgDate}
                    </span>
                  </div>
                )}
                <MessageBubble
                  message={msg}
                  isOwn={msg.sender_id === user!.id}
                  isRead={
                    readMessageIds.has(msg.id) ||
                    !!msg.reads?.some((read) => read.user_id !== user!.id)
                  }
                  msgIndex={idx}
                  searchQuery={searchQuery}
                />
              </div>
            );
          })}
        </div>

        {(() => {
          // Determine if current user can send in a group
          const isGroup = activeConversation?.type === 'group';
          const adminsOnly = isGroup && (activeConversation as any)?.send_permission === 'admins';
          const myRole = (activeConversation as any)?.participants?.find((p: any) => p.user_id === user?.id)?.role;
          const isAdmin = myRole === 'admin';
          const cantPostInAdminsOnly = adminsOnly && !isAdmin;

          if (isBlocked) {
            return (
              <div className="bg-[#202c33] px-4 py-4 text-center border-t border-[#222d34]">
                <p className="text-[#8696a0] text-sm">
                  You cannot reply to this conversation. Unblock to send a message.
                </p>
              </div>
            );
          }
          if (cantPostInAdminsOnly) {
            return (
              <div className="bg-[#202c33] px-4 py-4 text-center border-t border-[#222d34]">
                <p className="text-[#8696a0] text-sm">
                  Only admins can send messages in this group.
                </p>
              </div>
            );
          }
          return <MessageInput conversationId={conversationId} />;
        })()}
      </div>

      {/* Info panel (right side): group or contact depending on conversation type */}
      {isContactInfoOpen &&
        (activeConversation?.type === 'group' ? (
          <GroupInfoPanel groupId={conversationId} />
        ) : (
          <ContactInfoPanel />
        ))}
    </div>
  );
}
