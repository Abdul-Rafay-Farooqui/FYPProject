"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import AddContactModal from "@/components/contacts/AddContactModal";
import IncomingCallModal from "@/components/calls/IncomingCallModal";
import ForwardMessageModal from "@/components/chat/ForwardMessageModal";
import DeleteMessageModal from "@/components/chat/DeleteMessageModal";
import InstituteView from "@/components/institute/InstituteView";
import InstituteNotificationBell from "@/components/institute/InstituteNotificationBell";
import LockChatModal from "@/components/layout/LockChatModal";
import MeetingStartBanner from "@/components/layout/MeetingStartBanner";
import JitsiMeetingRoom from "@/components/organization/tabs/JitsiMeetingRoom";
import OrgView from "@/components/organization/OrgView";
import NotificationCenter from "@/components/organization/NotificationCenter";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { useRouter } from "next/navigation";
import { MessageCircle, Building2, Bell, GraduationCap } from "lucide-react";
import dynamic from "next/dynamic";
import { OrganizationAPI } from "@/lib/api/organization";
import { getSocket } from "@/lib/socket";
import { useModuleNotificationCounts } from "@/hooks/useModuleNotificationCounts";

const CallModal = dynamic(() => import("@/components/calls/CallModal"), {
  ssr: false,
});

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, isAuthLoaded } = useAuthStore();
  const activeMeetingScreen = useUIStore((s) => s.activeMeetingScreen);
  const openMeetingScreen = useUIStore((s) => s.openMeetingScreen);
  const closeMeetingScreen = useUIStore((s) => s.closeMeetingScreen);
  const router = useRouter();
  const pathname = usePathname();
  
  // All state hooks must be called unconditionally
  const [mainTab, setMainTab] = useState<"chat" | "organization" | "institute">("chat");
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedInstituteId, setSelectedInstituteId] = useState<string | null>(null);
  const [selectedOrgUnread, setSelectedOrgUnread] = useState(0);
  const [bellAnimation, setBellAnimation] = useState(false);
  const {
    chatUnread,
    orgUnread,
    instituteUnread,
    refreshOrg,
  } = useModuleNotificationCounts(user?.id);

  const refreshSelectedOrgUnread = useCallback(async () => {
    if (!selectedOrgId) {
      setSelectedOrgUnread(0);
      return;
    }

    try {
      const data = await OrganizationAPI.getNotifications(selectedOrgId);
      setSelectedOrgUnread(data?.unread_count ?? 0);
    } catch (error) {
      console.error("[Layout] Failed to load selected org unread:", error);
    }
  }, [selectedOrgId]);

  // All effect hooks must be called unconditionally
  useEffect(() => {
    if (!isAuthLoaded) return;
    if (!user) {
      router.push("/auth/login");
    } else if (profile && !profile.onboarding_complete) {
      router.push("/auth/onboarding");
    }
  }, [user, profile, isAuthLoaded, router]);

  // Institute module uses WeConnect auth, no separate school tracking needed

  // Refresh org counts when switching to organization tab
  useEffect(() => {
    if (mainTab === "organization") {
      refreshOrg();
      refreshSelectedOrgUnread();
    }
  }, [mainTab, refreshOrg, refreshSelectedOrgUnread]);

  useEffect(() => {
    refreshSelectedOrgUnread();
  }, [selectedOrgId, orgUnread, refreshSelectedOrgUnread]);

  // WebSocket listener for organization bell animation
  useEffect(() => {
    if (!user?.id) return;

    const socket = getSocket();
    
    const handleNewNotification = () => {
      setBellAnimation(true);
      setTimeout(() => setBellAnimation(false), 1000);
      refreshOrg();
      refreshSelectedOrgUnread();
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [user?.id, refreshOrg, refreshSelectedOrgUnread]);

  // Conditional rendering after all hooks
  if (!isAuthLoaded) {
    return (
      <div className="h-screen w-screen bg-[#111b21] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-[#00a884] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#8696a0] text-sm">Loading WeConnect...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;
  if (profile && !profile.onboarding_complete) return null;

  // Pages that bypass the tab layout (auth, ai-chat, etc.)
  const isAiChat = pathname === "/ai-chat";

  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  // On mobile chat tab: if we're on a chat route (not root), hide sidebar; if on root, hide main content
  const isOnChatRoute = mainTab === "chat" && pathname !== "/" && !isAiChat;

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0b141a] overflow-hidden">
      {/* Tab bar — always visible at top */}
      <div className="flex items-center justify-between bg-[#111b21] border-b border-[#222d34] px-2 md:px-4 flex-shrink-0">
        {/* Mobile back button when inside a chat conversation or AI chat */}
        {(isOnChatRoute || isAiChat) ? (
          <button
            onClick={() => router.push("/")}
            className="md:hidden flex items-center gap-1 text-[#00a884] py-3 px-2 text-sm font-medium"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        ) : null}

        {/* Tabs — always shown on desktop; on mobile shown unless inside a chat or AI chat */}
        <div className={`flex items-center gap-0 md:gap-1 overflow-x-auto no-scrollbar ${(isOnChatRoute || isAiChat) ? 'hidden md:flex' : 'flex'}`}>
          <TabBtn
            icon={<MessageCircle className="w-4 h-4" />}
            label="Chat"
            active={mainTab === "chat"}
            badgeCount={chatUnread}
            onClick={() => { setMainTab("chat"); router.push("/"); }}
          />
          <TabBtn
            icon={<Building2 className="w-4 h-4" />}
            label="Organization"
            active={mainTab === "organization"}
            badgeCount={orgUnread}
            onClick={() => { setMainTab("organization"); router.push("/"); }}
          />
          <TabBtn
            icon={<GraduationCap className="w-4 h-4" />}
            label="Institute"
            active={mainTab === "institute"}
            badgeCount={instituteUnread}
            onClick={() => { setMainTab("institute"); }}
          />
        </div>

        {/* Notification Bell */}
        {mainTab === "organization" && !isOnChatRoute && (
          <button
            onClick={() => { if (selectedOrgId) setShowNotifications(!showNotifications); }}
            disabled={!selectedOrgId}
            className={`relative p-2 rounded-lg transition-all flex-shrink-0 ${
              selectedOrgId
                ? 'text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33] cursor-pointer'
                : 'text-[#8696a0]/40 cursor-not-allowed'
            } ${bellAnimation ? 'animate-bounce' : ''}`}
            title={selectedOrgId ? "Notifications" : "Select an organization first"}
          >
            <Bell className={`w-5 h-5 ${bellAnimation ? 'text-[#00a884]' : ''}`} />
            {selectedOrgId && selectedOrgUnread > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold bg-[#00a884] text-[#0b141a] rounded-full animate-pulse">
                {selectedOrgUnread > 99 ? '99+' : selectedOrgUnread}
              </span>
            )}
          </button>
        )}
        {mainTab === "institute" && selectedInstituteId && !isOnChatRoute && (
          <InstituteNotificationBell instituteId={selectedInstituteId} />
        )}
      </div>

      {/* Body — sidebar + content side by side on desktop; stacked on mobile */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar — chat tab only */}
        {mainTab === "chat" && (
          <div className={`
            md:w-[355px] md:flex-shrink-0 md:border-r md:border-[#222d34]
            ${isOnChatRoute || isAiChat ? 'hidden md:block' : 'w-full md:w-[355px]'}
          `}>
            <Sidebar />
          </div>
        )}

        {/* Right content area */}
        <div className={`
          flex-1 flex flex-col overflow-hidden
          ${mainTab === "chat" && !isOnChatRoute && !isAiChat ? 'hidden md:flex' : 'flex'}
        `}>
          {/* Content */}
          <div className="flex-1 overflow-hidden relative">
            {mainTab === "chat" && (
              <main className="h-full w-full">{children}</main>
            )}
            {mainTab === "institute" && (
              <div className="h-full w-full overflow-hidden" style={{ background: '#0b141a' }}>
                <InstituteView onInstituteChange={setSelectedInstituteId} />
              </div>
            )}
            {mainTab === "organization" && (
              <div className="h-full w-full">
                <OrgView onOrgChange={setSelectedOrgId} />
              </div>
            )}
          </div>
        </div>
      </div>

      <AddContactModal />
      <CallModal />
      <IncomingCallModal />
      <ForwardMessageModal />
      <DeleteMessageModal />
      <LockChatModal />

      {/* Notification Center Modal */}
      {showNotifications && selectedOrgId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-[#0b141a] rounded-xl w-full max-w-2xl h-[600px] shadow-2xl border border-[#222d34] overflow-hidden">
            <NotificationCenter
              organizationId={selectedOrgId}
              currentUserId={user?.id}
              onClose={() => {
                setShowNotifications(false);
                refreshOrg();
                refreshSelectedOrgUnread();
              }}
              onNotificationRead={() => {
                refreshOrg();
                refreshSelectedOrgUnread();
              }}
            />
          </div>
        </div>
      )}

      <MeetingStartBanner
        onOpenMeeting={(payload) => {
          openMeetingScreen(payload);
        }}
      />

      {activeMeetingScreen && user?.id && (
        <JitsiMeetingRoom
          open={!!activeMeetingScreen}
          meeting={{
            id: activeMeetingScreen.meeting_id,
            title: activeMeetingScreen.title || "Meeting",
            call_type: activeMeetingScreen.call_type || "video",
          }}
          organizationId={activeMeetingScreen.organization_id}
          teamId={activeMeetingScreen.team_id}
          currentUserId={user.id}
          currentUserName={profile?.display_name || user?.email || "User"}
          onClose={closeMeetingScreen}
          onEndMeeting={async (meetingId: string) => {
            try {
              await OrganizationAPI.endMeeting(
                activeMeetingScreen.organization_id,
                activeMeetingScreen.team_id,
                meetingId
              );
            } catch (error) {
              console.error('[Meeting] Failed to end meeting:', error);
            }
          }}
        />
      )}
    </div>
  );
}

function TabBtn({
  icon,
  label,
  active,
  onClick,
  badgeCount = 0,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  badgeCount?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-1.5 px-3 md:px-4 py-3 text-xs md:text-sm font-medium border-b-2 transition-all whitespace-nowrap flex-shrink-0 ${
        active
          ? "text-[#00a884] border-[#00a884]"
          : "text-[#8696a0] border-transparent hover:text-[#e9edef]"
      }`}
    >
      {icon}
      {label}
      {badgeCount > 0 && (
        <span className="absolute top-1 right-0.5 min-w-[16px] h-[16px] flex items-center justify-center px-1 text-[9px] font-bold bg-[#00a884] text-[#0b141a] rounded-full">
          {badgeCount > 99 ? "99+" : badgeCount}
        </span>
      )}
    </button>
  );
}
