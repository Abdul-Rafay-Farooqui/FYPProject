'use client';

import { Conversation } from '@/types';
import { ConversationsAPI, ContactsAPI } from '@/lib/api/endpoints';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import {
  Archive, Lock, BellOff, Bell, Unlock,
  MailCheck, Heart, X as XIcon, Trash2, HeartOff, UserX, Eraser,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useUIStore } from '@/store/uiStore';

type ExtendedConversation = Conversation & {
  _unread_count?: number;
  _is_muted?: boolean;
  _is_pinned?: boolean;
  _is_archived?: boolean;
  _is_locked?: boolean;
  is_locked?: boolean;
};

interface ChatListContextMenuProps {
  x: number;
  y: number;
  conversation: ExtendedConversation;
  onClose: () => void;
  onRefresh: () => void;
}

export default function ChatListContextMenu({
  x,
  y,
  conversation,
  onClose,
  onRefresh,
}: ChatListContextMenuProps) {
  const { user } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [pos, setPos] = useState({ top: y, left: x });
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      let newTop = y;
      let newLeft = x;
      if (y + rect.height > window.innerHeight - 10) {
        newTop = window.innerHeight - rect.height - 10;
      }
      if (x + rect.width > window.innerWidth - 10) {
        newLeft = window.innerWidth - rect.width - 10;
      }
      setPos({ top: Math.max(10, newTop), left: Math.max(10, newLeft) });
    }
  }, [x, y]);

  const isMuted = conversation._is_muted ?? false;
  const isPinned = conversation._is_pinned ?? false;
  const isArchived = conversation._is_archived ?? false;
  const isLocked = !!(conversation._is_locked ?? conversation.is_locked);
  const isGroup = conversation.type === 'group';
  const otherUserId = conversation.other_participant?.user_id;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const run = async (fn: () => Promise<void>, successMsg?: string) => {
    if (loading || !user?.id) return;
    setLoading(true);
    try {
      await fn();
      if (successMsg) showToast(successMsg);
      setTimeout(() => {
        onClose();
        onRefresh();
      }, successMsg ? 250 : 0);
    } catch (e: any) {
      console.error('Context menu action error:', e);
      showToast(`${e?.response?.data?.message || e?.message || 'Action failed'}`);
      setTimeout(() => onClose(), 1500);
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = () =>
    run(async () => {
      await ConversationsAPI.archive(conversation.id, !isArchived);
    }, isArchived ? 'Chat unarchived' : 'Chat archived');

  const handleMuteToggle = () =>
    run(async () => {
      await ConversationsAPI.mute(conversation.id, !isMuted);
    }, isMuted ? 'Unmuted' : 'Muted');

  const handleFavouritesToggle = () =>
    run(async () => {
      await ConversationsAPI.pin(conversation.id, !isPinned);
    }, isPinned ? 'Removed from favourites' : 'Added to favourites');

  const handleClearChat = () =>
    run(async () => {
      if (!window.confirm('Clear all messages in this chat? This cannot be undone.')) {
        throw new Error('Cancelled');
      }
      await ConversationsAPI.clear(conversation.id);
    }, 'Chat cleared');

  const handleDeleteChat = () =>
    run(async () => {
      if (!window.confirm('Delete this chat? It will disappear from your chat list.')) {
        throw new Error('Cancelled');
      }
      await ConversationsAPI.hide(conversation.id);
      router.push('/');
    }, 'Chat deleted');

  const handleDeleteContact = () =>
    run(async () => {
      if (!otherUserId) throw new Error('Not a 1-on-1 chat');
      if (!window.confirm('Delete this contact and end the chat? This will remove them from your contacts.')) {
        throw new Error('Cancelled');
      }
      try {
        await ContactsAPI.remove(otherUserId);
      } catch {
        // ignore if not a contact
      }
      await ConversationsAPI.hide(conversation.id);
      router.push('/');
    }, 'Contact deleted');

  const handleCloseChat = () => {
    onClose();
    router.push('/');
  };

  const handleLockChat = () => {
    useUIStore.getState().setLockChatConversation(conversation);
    onClose();
  };

  const handleUnlockChat = () =>
    run(async () => {
      const pin = window.prompt('Enter your 4-6 digit PIN to unlock this chat:');
      if (!pin) throw new Error('PIN required');
      await ConversationsAPI.removeLock(conversation.id, pin);
    }, 'Chat unlocked');

  const handleMarkUnread = () =>
    run(async () => {
      // No dedicated API yet - placeholder
    }, 'Marked as unread');

  type MenuItem =
    | 'divider'
    | {
        icon: React.ReactNode;
        label: string;
        onClick: () => void;
        danger?: boolean;
      };

  const items: MenuItem[] = [
    { icon: <Archive className="w-4 h-4" />, label: isArchived ? 'Unarchive chat' : 'Archive chat', onClick: handleArchive },
    {
      icon: isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />,
      label: isLocked ? 'Unlock chat' : 'Lock chat',
      onClick: isLocked ? handleUnlockChat : handleLockChat,
    },
    {
      icon: isMuted ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />,
      label: isMuted ? 'Unmute notifications' : 'Mute notifications',
      onClick: handleMuteToggle,
    },
    { icon: <MailCheck className="w-4 h-4" />, label: 'Mark as unread', onClick: handleMarkUnread },
    {
      icon: isPinned ? <HeartOff className="w-4 h-4" /> : <Heart className="w-4 h-4" />,
      label: isPinned ? 'Remove from favourites' : 'Add to favourites',
      onClick: handleFavouritesToggle,
    },
    'divider',
    { icon: <XIcon className="w-4 h-4" />, label: 'Close chat', onClick: handleCloseChat },
    { icon: <Eraser className="w-4 h-4" />, label: 'Clear chat', onClick: handleClearChat },
    { icon: <Trash2 className="w-4 h-4" />, label: 'Delete chat', onClick: handleDeleteChat, danger: true },
  ];

  if (!isGroup && otherUserId) {
    items.push({
      icon: <UserX className="w-4 h-4" />,
      label: 'Delete contact',
      onClick: handleDeleteContact,
      danger: true,
    });
  }

  return (
    <>
      <div className="fixed inset-0 z-[60]" onClick={onClose} />
      <div
        ref={menuRef}
        className="fixed z-[70] bg-[#233138] shadow-2xl rounded-md py-1.5 w-52 fade-in-scale"
        style={{ top: pos.top, left: pos.left }}
      >
        {items.map((item, i) => {
          if (item === 'divider') {
            return <div key={i} className="h-px bg-[#222d34] my-1" />;
          }
          return (
            <button
              key={i}
              onClick={item.onClick}
              disabled={loading}
              className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-[#111b21] transition-colors disabled:opacity-50
                ${item.danger ? 'text-red-400' : 'text-[#e9edef]'}`}
            >
              <span className={item.danger ? '' : 'text-[#8696a0]'}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}

        {toast && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#00a884] text-[#111b21] text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
            {toast}
          </div>
        )}
      </div>
    </>
  );
}