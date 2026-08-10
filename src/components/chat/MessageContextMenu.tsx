'use client';

import { Message } from '@/types';
import { useUIStore } from '@/store/uiStore';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { MessagesAPI, BlocksAPI } from '@/lib/api/endpoints';
import {
  Reply, Forward, Star, Trash2, Copy, Bot, Pin,
  CheckSquare, Download, Share2, Flag,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface MessageContextMenuProps {
  x: number;
  y: number;
  message: Message;
  isOwn: boolean;
  onClose: () => void;
  onReply: () => void;
  onAskAI: () => void;
}

export default function MessageContextMenu({
  x,
  y,
  message,
  isOwn,
  onClose,
  onReply,
  onAskAI,
}: MessageContextMenuProps) {
  const { setForwardMessage, setDeleteMessage, setSelectionMode } = useUIStore();
  const { toggleStarredMessage, starredMessageIds, setPinnedMessageId, activeConversation } = useChatStore();
  const { user } = useAuthStore();
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: y, left: x });
  const isStarred = starredMessageIds.has(message.id);

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

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content || '');
    onClose();
  };

  const handleForward = () => {
    setForwardMessage(message);
    onClose();
  };

  const handleStar = async () => {
    if (!user?.id) return;
    try {
      await MessagesAPI.star(message.id, !isStarred);
      toggleStarredMessage(message.id);
    } catch (e) {
      console.error('Star error:', e);
    }
    onClose();
  };

  const handlePin = async () => {
    if (!user?.id || !activeConversation) return;
    try {
      await MessagesAPI.pin(message.id);
      setPinnedMessageId(message.id);
    } catch (e) {
      console.error('Pin error:', e);
    }
    onClose();
  };

  const handleSelect = () => {
    setSelectionMode(true);
    onClose();
  };

  const handleSaveAs = () => {
    if (message.media_url) {
      const a = document.createElement('a');
      a.href = message.media_url;
      a.download = message.media_filename || 'download';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    onClose();
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          text: message.content || '',
          url: message.media_url || undefined,
        });
      } else {
        await navigator.clipboard.writeText(message.content || message.media_url || '');
      }
    } catch {}
    onClose();
  };

  const handleReport = async () => {
    if (!user?.id) return;
    try {
      const otherUserId = message.sender_id;
      if (otherUserId !== user.id) {
        await BlocksAPI.report(otherUserId, 'Reported from message context');
      }
    } catch (e) {
      console.error('Report error:', e);
    }
    onClose();
  };

  const handleDelete = () => {
    setDeleteMessage(message);
    onClose();
  };

  const hasMedia = ['image', 'video', 'audio', 'document'].includes(message.type);

  return (
    <>
      <div className="fixed inset-0 z-[60]" onClick={onClose} />
      <div
        ref={menuRef}
        className="fixed z-[70] bg-[#233138] shadow-2xl rounded-md py-1.5 w-48 fade-in-scale"
        style={{ top: pos.top, left: pos.left }}
      >
        <MenuItem icon={<Reply className="w-4 h-4" />} label="Reply" onClick={() => { onReply(); onClose(); }} />
        <MenuItem icon={<Copy className="w-4 h-4" />} label="Copy" onClick={handleCopy} />
        <MenuItem icon={<Forward className="w-4 h-4" />} label="Forward" onClick={handleForward} />
        <MenuItem icon={<Pin className="w-4 h-4" />} label="Pin" onClick={handlePin} />
        <MenuItem icon={<CheckSquare className="w-4 h-4" />} label="Select" onClick={handleSelect} />

        {hasMedia && (
          <MenuItem icon={<Download className="w-4 h-4" />} label="Save as" onClick={handleSaveAs} />
        )}

        <MenuItem icon={<Share2 className="w-4 h-4" />} label="Share" onClick={handleShare} />

        <MenuItem icon={<Bot className="w-4 h-4" />} label="Ask AI" onClick={() => { onAskAI(); onClose(); }} accent />

        <div className="h-px bg-[#222d34] my-1" />

        <MenuItem icon={<Trash2 className="w-4 h-4" />} label="Delete" onClick={handleDelete} danger />
      </div>
    </>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-[#111b21] transition-colors
        ${danger ? 'text-red-400' : accent ? 'text-[#00a884] font-medium' : 'text-[#e9edef]'}`}
    >
      <span className={danger ? '' : accent ? '' : 'text-[#8696a0]'}>{icon}</span>
      {label}
    </button>
  );
}
