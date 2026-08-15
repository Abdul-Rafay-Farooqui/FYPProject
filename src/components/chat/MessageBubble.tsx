"use client";

import { Message } from "@/types";
import { format } from "date-fns";
import {
  Check,
  ChevronDown,
  Play,
  Download,
  FileText,
  Mic,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import MessageContextMenu from "./MessageContextMenu";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/store/chatStore";
import { useUIStore } from "@/store/uiStore";

function SeenEyeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M3 12c2.8-4.2 6.5-6 9-6s6.2 1.8 9 6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M3 12c2.8 4.2 6.5 6 9 6s6.2-1.8 9-6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
      <circle cx="13" cy="11" r="0.9" fill="white" fillOpacity="0.5" />
      <path
        d="M4.8 9.6L3.6 7.8M8 8.2L7.4 6.2M12 7.4V5.4M16 8.2L16.6 6.2M19.2 9.6L20.4 7.8"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
      />
      <path
        d="M6.2 14.8L5.6 16.4M9.6 15.6L9.3 17.2M12 16.2V17.8M14.4 15.6L14.7 17.2M17.8 14.8L18.4 16.4"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UnseenEyeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M3 12.2c2.8-2.4 6.5-3.8 9-3.8s6.2 1.4 9 3.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M4.8 10.2L3.6 8.2M8 9.4L7.2 7.2M12 9V6.6M16 9.4L16.8 7.2M19.2 10.2L20.4 8.2"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M6.5 13.6L6 15M12 14.2V15.6M17.5 13.6L18 15"
        stroke="currentColor"
        strokeWidth="0.95"
        strokeLinecap="round"
        opacity="0.65"
      />
    </svg>
  );
}

export default function MessageBubble({
  message,
  isOwn,
  isRead,
  msgIndex,
  searchQuery,
}: {
  message: Message;
  isOwn: boolean;
  isRead: boolean;
  msgIndex?: number;
  searchQuery?: string;
}) {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const time = format(new Date(message.created_at), "HH:mm");
  const router = useRouter();
  const { setReplyTo, starredMessageIds, messages } = useChatStore();
  const { isSelectionMode, selectedMessages, toggleSelectedMessage } =
    useUIStore();
  const isStarred = starredMessageIds.has(message.id);
  const isSelected = selectedMessages.has(message.id);
  const repliedMsg = message.reply_to_id
    ? messages.find((m) => m.id === message.reply_to_id)
    : null;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isSelectionMode) {
      toggleSelectedMessage(message.id);
      return;
    }
    const x = Math.min(e.clientX, window.innerWidth - 200);
    const y = Math.min(e.clientY, window.innerHeight - 300);
    setContextMenu({ x, y });
  };

  const handleClick = () => {
    if (isSelectionMode) {
      toggleSelectedMessage(message.id);
    }
  };

  const handleAskAI = () => {
    router.push(`/ai-chat?q=${encodeURIComponent(message.content || "")}`);
  };

  const handleReply = () => {
    setReplyTo(message);
  };

  // Audio player logic
  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;

    const onTimeUpdate = () => {
      if (audio.duration)
        setAudioProgress((audio.currentTime / audio.duration) * 100);
    };
    const onEnded = () => {
      setAudioPlaying(false);
      setAudioProgress(0);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (audioPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setAudioPlaying(!audioPlaying);
  };

  const renderReadReceipt = () => {
    if (!isOwn) return null;
    if (isRead) {
      return (
        <div className="flex items-center gap-1 mt-0.5 mr-1">
          <SeenEyeIcon className="w-5 h-5 text-[#53bdeb]" />
          <span className="text-[12px] font-medium text-[#53bdeb] leading-none">
            Seen
          </span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 mt-0.5 mr-1">
        <UnseenEyeIcon className="w-5 h-5 text-[#8696a0]" />
        <span className="text-[12px] font-medium text-[#8696a0] leading-none">
          Unseen
        </span>
      </div>
    );
  };

  // Highlight search matches in text
  const highlightText = (text: string) => {
    if (!searchQuery || !searchQuery.trim()) return text;
    const query = searchQuery.toLowerCase();
    const idx = text.toLowerCase().indexOf(query);
    if (idx === -1) return text;

    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-[#00a884]/40 text-[#e9edef] rounded px-0.5">
          {text.slice(idx, idx + searchQuery.length)}
        </mark>
        {text.slice(idx + searchQuery.length)}
      </>
    );
  };

  // Handle deleted messages
  if (message.is_deleted_for_everyone) {
    return (
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2`}>
        <div className="max-w-[65%] px-3 py-2 rounded-2xl bg-[#202c33]/50 border border-[#222d34] shadow-sm">
          <p className="text-[#8696a0] text-sm italic">
            🚫 This message was deleted
          </p>
        </div>
      </div>
    );
  }

  // ─── Render media content by type ───
  const renderContent = () => {
    switch (message.type) {
      case "image":
        return (
          <div className="relative">
            {message.media_url && (
              <>
                {!imgLoaded && (
                  <div className="w-full max-w-[280px] h-[200px] bg-[#1e2a30] rounded-2xl animate-pulse flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <img
                  src={message.media_url}
                  alt="Photo"
                  className={`w-full max-w-[280px] rounded-2xl cursor-pointer hover:opacity-90 transition-opacity ${
                    imgLoaded ? "" : "hidden"
                  }`}
                  onLoad={() => setImgLoaded(true)}
                  onClick={() => window.open(message.media_url!, "_blank")}
                />
              </>
            )}
            {message.content && (
              <p className="text-[14.2px] leading-[19px] whitespace-pre-wrap mt-1 pb-[18px] pr-[52px]">
                {highlightText(message.content)}
              </p>
            )}
          </div>
        );

      case "video":
        return (
          <div className="relative">
            {message.media_url && (
              <div className="relative w-full max-w-[280px] rounded-2xl overflow-hidden">
                <video
                  src={message.media_url}
                  className="w-full rounded-2xl"
                  controls
                  preload="metadata"
                />
              </div>
            )}
            {message.content && (
              <p className="text-[14.2px] leading-[19px] whitespace-pre-wrap mt-1 pb-[18px] pr-[52px]">
                {highlightText(message.content)}
              </p>
            )}
          </div>
        );

      case "audio":
        return (
          <div className="flex items-center gap-3 w-full max-w-[240px] min-w-[180px] pb-[18px] pr-[52px]">
            <audio
              ref={audioRef}
              src={message.media_url || ""}
              preload="metadata"
            />
            <button
              onClick={toggleAudio}
              className="w-9 h-9 rounded-full bg-[#00a884] flex items-center justify-center flex-shrink-0 hover:bg-[#008069] transition-colors shadow-sm"
            >
              {audioPlaying ? (
                <div className="flex gap-0.5">
                  <div className="w-0.5 h-3 bg-white rounded" />
                  <div className="w-0.5 h-3 bg-white rounded" />
                </div>
              ) : (
                <Play className="w-4 h-4 text-white ml-0.5" />
              )}
            </button>
            <div className="flex-1 flex flex-col gap-1">
              <div className="h-1 bg-[#374045] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#00a884] rounded-full transition-all duration-200"
                  style={{ width: `${audioProgress}%` }}
                />
              </div>
              <span className="text-[11px] text-[#8696a0]">
                {message.media_duration
                  ? `${Math.floor(message.media_duration / 60)}:${(
                      message.media_duration % 60
                    )
                      .toString()
                      .padStart(2, "0")}`
                  : "0:00"}
              </span>
            </div>
            <Mic className="w-4 h-4 text-[#8696a0]" />
          </div>
        );

      case "document":
        return (
          <a
            href={message.media_url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-[#1e2a30] px-3 py-2.5 rounded-2xl w-full min-w-0 hover:bg-[#253640] transition-colors shadow-sm"
          >
            <div className="w-10 h-10 bg-[#374045] rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-[#8696a0]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#e9edef] text-sm truncate">
                {message.media_filename || "Document"}
              </p>
              <p className="text-[#8696a0] text-xs">
                {message.media_size
                  ? `${(message.media_size / 1024).toFixed(1)} KB`
                  : "Document"}
              </p>
            </div>
            <Download className="w-4 h-4 text-[#8696a0] flex-shrink-0" />
          </a>
        );

      default:
        return (
          <>
            {message.content && (
              <p className="text-[14.2px] leading-[19px] whitespace-pre-wrap pb-[18px] pr-[52px]">
                {highlightText(message.content)}
              </p>
            )}
          </>
        );
    }
  };

  return (
    <div
      className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-[2px] group ${
        isSelected ? "bg-[#00a884]/10" : ""
      }`}
      onContextMenu={handleContextMenu}
      onClick={handleClick}
      data-msg-index={msgIndex}
    >
      {/* Selection checkbox */}
      {isSelectionMode && (
        <div className="flex items-center px-2">
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
              isSelected ? "bg-[#00a884] border-[#00a884]" : "border-[#8696a0]"
            }`}
          >
            {isSelected && <Check className="w-3 h-3 text-white" />}
          </div>
        </div>
      )}

      <div
        className={`flex flex-col ${isOwn ? "items-end" : "items-start"} max-w-[85%] sm:max-w-[65%]`}
      >
        <div
          className={`min-w-[60px] w-fit px-[16px] py-[6px] rounded-2xl relative shadow-sm
          ${
            isOwn
              ? "bg-[#424139] text-[#e9edef] rounded-tr-none"
              : "bg-[#000000] text-[#e9edef] rounded-tl-none"
          }`}
          style={{ animation: "messageIn 0.15s ease-out" }}
        >
        {/* Forwarded label */}
        {message.is_forwarded && (
          <p className="text-[#8696a0] text-[11px] italic mb-1 flex items-center gap-1">
            ↗ Forwarded
          </p>
        )}

        {/* Replied Message Box */}
        {repliedMsg && (
          <div
            className="bg-[#1e2a30] border-l-[3px] border-[#00a884] p-1.5 rounded-xl mb-1 text-sm opacity-90 cursor-pointer overflow-hidden max-w-full"
            onClick={(e) => {
              e.stopPropagation();
              const idx = messages.findIndex((m) => m.id === repliedMsg.id);
              if (idx !== -1) {
                const msgEl = document.querySelector(
                  `[data-msg-index="${idx}"]`,
                );
                if (msgEl) {
                  msgEl.scrollIntoView({ behavior: "smooth", block: "center" });
                  msgEl.classList.add("search-highlight");
                  setTimeout(
                    () => msgEl.classList.remove("search-highlight"),
                    1500,
                  );
                }
              }
            }}
          >
            <p className="text-[#00a884] font-medium text-[11px] mb-0.5">
              {repliedMsg.sender_id === message.sender_id ? "You" : "Someone"}
            </p>
            <p className="text-[#8696a0] truncate text-[11px]">
              {repliedMsg.content || `📎 ${repliedMsg.type}`}
            </p>
          </div>
        )}

        {/* Star indicator */}
        {isStarred && (
          <span className="text-[10px] text-yellow-400 absolute top-1 left-2">
            ★
          </span>
        )}

        {/* Message content */}
        {renderContent()}

        {/* Dropdown arrow for context menu */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            const x = Math.min(e.clientX, window.innerWidth - 200);
            const y = Math.min(e.clientY, window.innerHeight - 300);
            setContextMenu({ x, y });
          }}
          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-[#8696a0] hover:text-[#e9edef]"
        >
          <ChevronDown className="w-4 h-4" />
        </button>

        {/* Timestamp */}
        <div className="absolute bottom-[4px] right-[7px] flex items-center gap-[3px]">
          <span className="text-[11px] text-[#ffffff99] leading-none">
            {time}
          </span>
        </div>
        </div>

        {renderReadReceipt()}
      </div>

      {contextMenu && (
        <MessageContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          message={message}
          isOwn={isOwn}
          onClose={() => setContextMenu(null)}
          onReply={handleReply}
          onAskAI={handleAskAI}
        />
      )}
    </div>
  );
}
