"use client";

import { Conversation } from "@/types";
import { Video, Phone, Search, MoreVertical } from "lucide-react";
import { ConversationsAPI, BlocksAPI, CallsAPI } from "@/lib/api/endpoints";
import { getSocket } from "@/lib/socket";
import { useAuthStore } from "@/store/authStore";
import { useCallStore } from "@/store/callStore";
import { useUIStore } from "@/store/uiStore";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Search as SearchIcon,
  CheckSquare,
  BellOff,
  Bell,
  Clock,
  XCircle,
  Flag,
  Ban,
  CheckCircle,
  MessageSquareOff,
  Trash2,
  Lock,
  LockOpen,
  Eye,
  EyeOff,
} from "lucide-react";

export default function ChatHeader({
  conversation,
}: {
  conversation: Conversation;
}) {
  const otherParticipant = conversation.other_participant;
  const { user } = useAuthStore();
  const { setActiveCall, setOutgoingCall } = useCallStore();
  const { isContactInfoOpen, setContactInfoOpen, setChatSearchOpen } =
    useUIStore();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [iBlockedThem, setIBlockedThem] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [lockPin, setLockPin] = useState('');
  const [lockPinConfirm, setLockPinConfirm] = useState('');
  const [unlockPin, setUnlockPin] = useState('');
  const [storedPin, setStoredPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [lockError, setLockError] = useState('');
  const [lockMode, setLockMode] = useState<'set' | 'unlock'>('set');
  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [, forceRender] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!user?.id || !otherParticipant?.id) return;
    const checkBlock = async () => {
      try {
        const status = await BlocksAPI.check(otherParticipant.id);
        setIBlockedThem(status.i_blocked_them);
      } catch {
        setIBlockedThem(false);
      }
    };
    checkBlock();
  }, [user?.id, otherParticipant?.id]);

  // Listen for typing indicator & presence via Socket.IO
  useEffect(() => {
    const socket = getSocket();
    const onTyping = (data: { conversationId: string; userId: string }) => {
      if (data.conversationId === conversation.id && data.userId !== user?.id) {
        setTypingUser(data.userId);
      }
    };
    const onTypingStop = (data: { conversationId: string; userId: string }) => {
      if (data.conversationId === conversation.id && data.userId !== user?.id) {
        setTypingUser(null);
      }
    };
    const onPresence = (data: {
      user_id: string;
      is_online: boolean;
      last_seen: string;
    }) => {
      if (data.user_id === otherParticipant?.id) {
        otherParticipant.is_online = data.is_online;
        otherParticipant.last_seen = data.last_seen;
        forceRender((x) => x + 1);
      }
    };

    const onBlockUpdate = async () => {
      if (otherParticipant?.id) {
        try {
          const status = await BlocksAPI.check(otherParticipant.id);
          setIBlockedThem(status.i_blocked_them);
        } catch {}
      }
    };

    socket.on("typing", onTyping);
    socket.on("typing:stop", onTypingStop);
    socket.on("presence:update", onPresence);
    socket.on("block:update", onBlockUpdate);
    return () => {
      socket.off("typing", onTyping);
      socket.off("typing:stop", onTypingStop);
      socket.off("presence:update", onPresence);
      socket.off("block:update", onBlockUpdate);
    };
  }, [conversation.id, user?.id, otherParticipant]);

  // Auto-clear typing after 3s
  useEffect(() => {
    if (!typingUser) return;
    const timer = setTimeout(() => setTypingUser(null), 3000);
    return () => clearTimeout(timer);
  }, [typingUser]);

  const initiateCall = async (type: "voice" | "video") => {
    if (!otherParticipant) return;
    try {
      const data = await CallsAPI.initiate({
        callee_id: otherParticipant.id,
        conversation_id: conversation.id,
        type,
      });
      if (data) setOutgoingCall(data);
    } catch (e: any) {
      console.error("Call error:", e);
      showToast("Call failed", "error");
    }
  };

  const handleMuteToggle = async () => {
    if (!user?.id) return;
    try {
      const newMuted = !isMuted;
      await ConversationsAPI.mute(conversation.id, newMuted);
      setIsMuted(newMuted);
      setIsMenuOpen(false);
      showToast(newMuted ? "Notifications muted" : "Notifications unmuted");
    } catch (e: any) {
      showToast("Failed to update", "error");
    }
  };

  const handleBlock = async () => {
    if (!user?.id || !otherParticipant) return;
    try {
      if (iBlockedThem) {
        await BlocksAPI.unblock(otherParticipant.id);
        showToast("User unblocked");
        setIBlockedThem(false);
      } else {
        await BlocksAPI.block(otherParticipant.id);
        showToast(`${otherParticipant.display_name} blocked`);
        setIBlockedThem(true);
      }
      setIsMenuOpen(false);
    } catch (e: any) {
      showToast("Action failed", "error");
    }
  };

  const handleReport = async () => {
    if (!user?.id || !otherParticipant) return;
    try {
      await BlocksAPI.report(otherParticipant.id);
      setIsMenuOpen(false);
      showToast(`${otherParticipant.display_name} reported`);
    } catch (e: any) {
      showToast("Report failed", "error");
    }
  };

  const handleClearChat = async () => {
    if (!user?.id) return;
    try {
      await ConversationsAPI.clear(conversation.id);
      setIsMenuOpen(false);
      showToast("Chat cleared");
    } catch (e: any) {
      showToast("Clear failed", "error");
    }
  };

  const handleDeleteChat = async () => {
    if (!user?.id) return;
    try {
      await ConversationsAPI.hide(conversation.id);
      setIsMenuOpen(false);
      window.location.href = "/";
    } catch (e: any) {
      showToast("Delete failed", "error");
    }
  };

  const getStatusText = () => {
    if (typingUser) return "typing...";
    if (otherParticipant?.is_online) return "online";
    if (otherParticipant?.last_seen) {
      const d = new Date(otherParticipant.last_seen);
      if (isNaN(d.getTime())) return "last seen recently";
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return "last seen just now";
      if (diffMin < 60) return `last seen ${diffMin} min ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `last seen ${diffHr}h ago`;
      return `last seen ${d.toLocaleDateString()}`;
    }
    return "last seen recently";
  };

  const handleLockChat = () => {
    setIsMenuOpen(false);
    setLockError('');
    setLockPin('');
    setLockPinConfirm('');
    setUnlockPin('');
    setShowPin(false);
    setLockMode(isLocked ? 'unlock' : 'set');
    setShowLockModal(true);
  };

  const handleLockSubmit = () => {
    if (lockMode === 'set') {
      if (lockPin.length < 4) { setLockError('PIN must be at least 4 digits.'); return; }
      if (lockPin !== lockPinConfirm) { setLockError('PINs do not match.'); return; }
      setStoredPin(lockPin);
      setIsLocked(true);
      setShowLockModal(false);
      showToast('Chat locked with PIN');
    } else {
      if (unlockPin !== storedPin) { setLockError('Incorrect PIN.'); return; }
      setIsLocked(false);
      setStoredPin('');
      setShowLockModal(false);
      showToast('Chat unlocked');
    }
  };

  const menuItems = [
    {
      icon: <User className="w-4 h-4" />,
      label: "Contact info",
      onClick: () => {
        setIsMenuOpen(false);
        setContactInfoOpen(true);
      },
    },
    {
      icon: <SearchIcon className="w-4 h-4" />,
      label: "Search",
      onClick: () => {
        setIsMenuOpen(false);
        setChatSearchOpen(true);
      },
    },
    {
      icon: <CheckSquare className="w-4 h-4" />,
      label: "Select messages",
      onClick: () => {
        setIsMenuOpen(false);
        useUIStore.getState().setSelectionMode(true);
      },
    },
    {
      icon: isMuted ? (
        <Bell className="w-4 h-4" />
      ) : (
        <BellOff className="w-4 h-4" />
      ),
      label: isMuted ? "Unmute notifications" : "Mute notifications",
      onClick: handleMuteToggle,
    },
    {
      icon: <Clock className="w-4 h-4" />,
      label: "Disappearing messages",
      onClick: () => {
        setIsMenuOpen(false);
        showToast("Disappearing messages coming soon");
      },
    },
    {
      icon: isLocked ? <LockOpen className="w-4 h-4" /> : <Lock className="w-4 h-4" />,
      label: isLocked ? "Unlock chat" : "Lock chat",
      onClick: handleLockChat,
    },
    "divider" as const,
    {
      icon: <XCircle className="w-4 h-4" />,
      label: "Close chat",
      onClick: () => {
        setIsMenuOpen(false);
        router.push("/");
      },
    },
    {
      icon: iBlockedThem ? (
        <CheckCircle className="w-4 h-4" />
      ) : (
        <Ban className="w-4 h-4" />
      ),
      label: iBlockedThem ? "Unblock" : "Block",
      onClick: handleBlock,
      danger: !iBlockedThem,
    },
    {
      icon: <MessageSquareOff className="w-4 h-4" />,
      label: "Clear chat",
      onClick: handleClearChat,
      danger: true,
    },
    {
      icon: <Trash2 className="w-4 h-4" />,
      label: "Delete chat",
      onClick: handleDeleteChat,
      danger: true,
    },
  ];

  return (
    <div
      className="bg-[#0B120D] px-4 py-2 flex items-center justify-between z-20 shadow-sm border-b border-[#222d34]"
      style={{ position: "sticky", top: 0 }}
    >
      <div
        className="flex items-center gap-3 cursor-pointer hover:bg-[#2a3942] rounded-2xl px-3 py-2 -ml-1 transition-all duration-200"
        onClick={() => setContactInfoOpen(!isContactInfoOpen)}
      >
        {conversation.type === "group" ? (
          conversation.avatar_url ? (
            <img
              src={conversation.avatar_url}
              alt="Avatar"
              className="w-10 h-10 rounded-full object-cover ring-1 ring-[#222d34] shadow-sm"
            />
          ) : (
            <div className="w-10 h-10 bg-[#2a3942] rounded-full flex items-center justify-center ring-1 ring-[#222d34] shadow-sm">
              <span className="text-[#e9edef] text-lg">
                {(conversation.name || "G")[0].toUpperCase()}
              </span>
            </div>
          )
        ) : otherParticipant?.avatar_url ? (
          <img
            src={otherParticipant.avatar_url}
            alt="Avatar"
            className="w-10 h-10 rounded-full object-cover ring-1 ring-[#222d34] shadow-sm"
          />
        ) : (
          <div className="w-10 h-10 bg-[#2a3942] rounded-full flex items-center justify-center ring-1 ring-[#222d34] shadow-sm">
            <span className="text-[#e9edef] text-lg">
              {otherParticipant?.display_name?.[0]?.toUpperCase()}
            </span>
          </div>
        )}
        <div>
          <h3 className="text-[#e9edef] font-semibold leading-tight flex items-center gap-1.5">
            {conversation.type === "group"
              ? conversation.name || "Group"
              : otherParticipant?.display_name}
            {isLocked && <Lock className="w-3 h-3 text-[#00a884] flex-shrink-0" />}
          </h3>
          <p
            className={`text-[11px] ${typingUser ? "text-[#00a884]" : "text-[#8696a0]"}`}
          >
            {conversation.type === "group"
              ? conversation.send_permission === "admins"
                ? "Admins only can send messages"
                : "Tap for group info"
              : getStatusText()}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-5 text-[#aebac1]">
        {conversation.type !== "group" && (
          <>
            <Video
              className="w-5 h-5 cursor-pointer hover:text-[#e9edef] transition-colors"
              onClick={() => initiateCall("video")}
            />
            <Phone
              className="w-5 h-5 cursor-pointer hover:text-[#e9edef] transition-colors"
              onClick={() => initiateCall("voice")}
            />
            <div className="w-px h-6 bg-[#222d34] mx-1"></div>
          </>
        )}
        <Search
          className="w-5 h-5 cursor-pointer hover:text-[#e9edef] transition-colors"
          onClick={() => setChatSearchOpen(true)}
        />

        {/* 3-dot menu */}
        <div className="relative">
          <MoreVertical
            className="w-5 h-5 cursor-pointer hover:text-[#e9edef] transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          />

          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsMenuOpen(false)}
              />
              <div
                ref={menuRef}
                className="absolute right-0 mt-2 w-56 bg-[#233138] shadow-2xl rounded-2xl py-1.5 z-50 fade-in-scale overflow-hidden"
              >
                {menuItems.map((item, i) => {
                  if (item === "divider") {
                    return <div key={i} className="h-px bg-[#222d34] my-1" />;
                  }
                  const it = item as {
                    icon: React.ReactNode;
                    label: string;
                    onClick: () => void;
                    danger?: boolean;
                  };
                  return (
                    <button
                      key={i}
                      onClick={it.onClick}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-[#111b21] transition-colors duration-150
                        ${it.danger ? "text-red-400" : "text-[#e9edef]"}`}
                    >
                      <span className={it.danger ? "" : "text-[#8696a0]"}>
                        {it.icon}
                      </span>
                      {it.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl shadow-2xl z-[200] whitespace-nowrap text-sm font-medium
          ${toastType === "error" ? "bg-red-500/90 text-white" : "bg-[#00a884] text-[#111b21]"}`}
        >
          {toast}
        </div>
      )}

      {/* Lock chat PIN modal */}
      {showLockModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#233138] rounded-2xl shadow-2xl p-6 w-80 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#00a884]/10 flex items-center justify-center">
                <Lock className="w-5 h-5 text-[#00a884]" />
              </div>
              <div>
                <p className="text-[#e9edef] font-semibold text-sm">
                  {lockMode === 'set' ? 'Lock Chat' : 'Unlock Chat'}
                </p>
                <p className="text-[#8696a0] text-xs">
                  {lockMode === 'set' ? 'Set a PIN to lock this chat' : 'Enter your PIN to unlock'}
                </p>
              </div>
            </div>

            {lockMode === 'set' ? (
              <>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    maxLength={8}
                    value={lockPin}
                    onChange={(e) => { setLockPin(e.target.value.replace(/\D/g, '')); setLockError(''); }}
                    placeholder="Enter PIN (4–8 digits)"
                    className="w-full bg-[#111b21] border border-[#2a3942] text-[#e9edef] text-sm rounded-xl px-3 py-2.5 pr-10 outline-none focus:border-[#00a884] placeholder-[#4a5568] tracking-widest"
                  />
                  <button onClick={() => setShowPin(!showPin)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8696a0] hover:text-[#e9edef]">
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={8}
                  value={lockPinConfirm}
                  onChange={(e) => { setLockPinConfirm(e.target.value.replace(/\D/g, '')); setLockError(''); }}
                  placeholder="Confirm PIN"
                  className="w-full bg-[#111b21] border border-[#2a3942] text-[#e9edef] text-sm rounded-xl px-3 py-2.5 outline-none focus:border-[#00a884] placeholder-[#4a5568] tracking-widest"
                />
              </>
            ) : (
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={8}
                  value={unlockPin}
                  onChange={(e) => { setUnlockPin(e.target.value.replace(/\D/g, '')); setLockError(''); }}
                  placeholder="Enter PIN"
                  className="w-full bg-[#111b21] border border-[#2a3942] text-[#e9edef] text-sm rounded-xl px-3 py-2.5 pr-10 outline-none focus:border-[#00a884] placeholder-[#4a5568] tracking-widest"
                />
                <button onClick={() => setShowPin(!showPin)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8696a0] hover:text-[#e9edef]">
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            )}

            {lockError && <p className="text-red-400 text-xs">{lockError}</p>}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowLockModal(false)}
                className="px-4 py-2 rounded-xl text-sm text-[#8696a0] hover:text-[#e9edef] hover:bg-[#111b21] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleLockSubmit}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-[#00a884] hover:bg-[#008069] text-[#0b141a] transition-all"
              >
                {lockMode === 'set' ? 'Lock' : 'Unlock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
