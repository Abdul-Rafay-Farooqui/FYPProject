"use client";

import { Conversation } from "@/types";
import { useChatStore } from "@/store/chatStore";
import { format, isToday, isYesterday, isThisWeek } from "date-fns";
import { Pin, BellOff, Users, Volume2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ConversationsAPI } from "@/lib/api/endpoints";
import { useAuthStore } from "@/store/authStore";
import { useState } from "react";
import ChatListContextMenu from "./ChatListContextMenu";

type ExtendedConversation = Conversation & {
  _unread_count?: number;
  _is_muted?: boolean;
  _is_pinned?: boolean;
};

export default function ChatListItem({
  conversation,
  onRefresh,
}: {
  conversation: ExtendedConversation;
  onRefresh?: () => void;
}) {
  const { activeConversation, setActiveConversation } = useChatStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const isActive = activeConversation?.id === conversation.id;
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const handleClick = async () => {
    setActiveConversation(conversation);
    router.push(`/chat/${conversation.id}`);

    // Reset unread count when clicking on a conversation
    if (user?.id && (conversation._unread_count ?? 0) > 0) {
      try {
        await ConversationsAPI.markRead(conversation.id);
        onRefresh?.();
      } catch {}
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const x = Math.min(e.clientX, window.innerWidth - 220);
    const y = Math.min(e.clientY, window.innerHeight - 400);
    setContextMenu({ x, y });
  };

  const isGroup = conversation.type === "group";
  const otherParticipant = conversation.other_participant;

  // Display values (group or 1on1)
  const displayName = isGroup
    ? conversation.name || "Group"
    : otherParticipant?.display_name || "Unknown User";
  const avatarUrl = isGroup
    ? conversation.avatar_url
    : otherParticipant?.avatar_url;
  const avatarInitial = displayName?.[0]?.toUpperCase() || "?";

  // Format timestamp like WhatsApp
  const formatTime = (dateStr: string | null | undefined): string => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";

    if (isToday(date)) return format(date, "HH:mm");
    if (isYesterday(date)) return "Yesterday";
    if (isThisWeek(date)) return format(date, "EEEE");
    return format(date, "dd/MM/yyyy");
  };

  const lastMessageTime = formatTime(conversation.last_message_at);
  const unreadCount = conversation._unread_count ?? 0;
  const isMuted = conversation._is_muted ?? false;
  const isPinned = conversation._is_pinned ?? false;

  return (
    <>
      <div
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className={`flex items-center px-3 py-3 cursor-pointer transition-all duration-200 border-b border-[#222d34] ${
          isActive ? "bg-[#2a3942] shadow-sm" : "hover:bg-[#202c33]"
        }`}
      >
        <div className="relative flex-shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-[49px] h-[49px] rounded-full object-cover ring-1 ring-[#222d34] shadow-sm"
            />
          ) : (
            <div className="w-[49px] h-[49px] bg-[#2a3942] rounded-full flex items-center justify-center ring-1 ring-[#222d34] shadow-sm">
              {isGroup ? (
                <Users className="w-6 h-6 text-[#8696a0]" />
              ) : (
                <span className="text-[#e9edef] text-xl">{avatarInitial}</span>
              )}
            </div>
          )}
          {!isGroup && otherParticipant?.is_online && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00a884] border-2 border-[#111b21] rounded-full"></div>
          )}
        </div>

        <div className="ml-3 flex-1 min-w-0">
          <div className="flex justify-between items-baseline gap-2">
            <h3 className="text-[#e9edef] font-semibold text-[16px] truncate leading-tight">
              {displayName}
            </h3>
            <span
              className={`text-xs ml-2 whitespace-nowrap ${unreadCount > 0 ? "text-[#00a884]" : "text-[#8696a0]"}`}
            >
              {lastMessageTime}
            </span>
          </div>
          <div className="flex justify-between items-center mt-0.5 gap-2">
            <p className="text-[#8696a0] text-[13px] truncate flex-1 leading-tight">
              {conversation.last_message_preview ||
                (isGroup ? "Group created" : "No messages yet")}
            </p>
            <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
              {isMuted && <BellOff className="w-3.5 h-3.5 text-[#8696a0]" />}
              {isPinned && <Pin className="w-3.5 h-3.5 text-[#8696a0]" />}
              {unreadCount > 0 && (
                <div className="bg-[#00a884] text-[#111b21] text-[11px] font-bold min-w-[20px] h-[20px] rounded-full flex items-center justify-center px-1 shadow-sm">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right-click context menu */}
      {contextMenu && (
        <ChatListContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          conversation={conversation}
          onClose={() => setContextMenu(null)}
          onRefresh={onRefresh || (() => {})}
        />
      )}
    </>
  );
}
