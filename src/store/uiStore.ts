import { create } from "zustand";
import { Message, Conversation } from "@/types";

interface UIState {
  // Existing
  isContactInfoOpen: boolean;
  isAddContactModalOpen: boolean;
  isForwardModalOpen: boolean;
  isMediaViewerOpen: boolean;
  currentMedia: string | null;

  // New: Chat search
  isChatSearchOpen: boolean;
  setChatSearchOpen: (isOpen: boolean) => void;

  // New: Forward message
  forwardMessage: Message | null;
  setForwardMessage: (message: Message | null) => void;

  // New: Delete message
  deleteMessage: Message | null;
  setDeleteMessage: (message: Message | null) => void;

  // New: Lock Chat
  lockChatConversation: Conversation | null;
  setLockChatConversation: (conv: Conversation | null) => void;

  // New: Selection mode
  isSelectionMode: boolean;
  selectedMessages: Set<string>;
  setSelectionMode: (isOn: boolean) => void;
  toggleSelectedMessage: (messageId: string) => void;
  clearSelectedMessages: () => void;

  // Existing setters
  toggleContactInfo: () => void;
  setContactInfoOpen: (isOpen: boolean) => void;
  setAddContactModalOpen: (isOpen: boolean) => void;
  setForwardModalOpen: (isOpen: boolean) => void;
  setMediaViewerOpen: (isOpen: boolean, url?: string | null) => void;

  // Global meeting notifications
  meetingNotifications: Array<{
    id: string;
    meeting_id: string;
    organization_id: string;
    team_id: string;
    title: string;
    type: 'scheduled' | 'starting_soon' | 'started' | 'ended' | 'cancelled';
    message: string;
    call_type?: "voice" | "video";
    starts_at?: string;
    created_at: string;
    read: boolean;
  }>;
  addMeetingNotification: (notification: UIState["meetingNotifications"][0]) => void;
  markNotificationRead: (id: string) => void;
  clearMeetingNotifications: () => void;
  
  meetingStartNotice: {
    organization_id?: string;
    team_id?: string;
    meeting_id?: string;
    title?: string;
    started_by?: string;
    started_by_name?: string;
    call_type?: "voice" | "video";
  } | null;
  setMeetingStartNotice: (notice: UIState["meetingStartNotice"]) => void;
  clearMeetingStartNotice: () => void;

  activeMeetingScreen: {
    organization_id: string;
    team_id: string;
    meeting_id: string;
    title?: string;
    call_type?: "voice" | "video";
  } | null;
  openMeetingScreen: (payload: {
    organization_id: string;
    team_id: string;
    meeting_id: string;
    title?: string;
    call_type?: "voice" | "video";
  }) => void;
  closeMeetingScreen: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Existing
  isContactInfoOpen: false,
  isAddContactModalOpen: false,
  isForwardModalOpen: false,
  isMediaViewerOpen: false,
  currentMedia: null,
  meetingNotifications: [],
  meetingStartNotice: null,
  activeMeetingScreen: null,

  // New
  isChatSearchOpen: false,
  setChatSearchOpen: (isChatSearchOpen) => set({ isChatSearchOpen }),

  forwardMessage: null,
  setForwardMessage: (forwardMessage) =>
    set({ forwardMessage, isForwardModalOpen: !!forwardMessage }),

  deleteMessage: null,
  setDeleteMessage: (deleteMessage) => set({ deleteMessage }),

  lockChatConversation: null,
  setLockChatConversation: (lockChatConversation) =>
    set({ lockChatConversation }),

  isSelectionMode: false,
  selectedMessages: new Set(),
  setSelectionMode: (isSelectionMode) =>
    set({ isSelectionMode, selectedMessages: new Set() }),
  toggleSelectedMessage: (messageId) =>
    set((state) => {
      const next = new Set(state.selectedMessages);
      if (next.has(messageId)) next.delete(messageId);
      else next.add(messageId);
      return { selectedMessages: next };
    }),
  clearSelectedMessages: () =>
    set({ selectedMessages: new Set(), isSelectionMode: false }),

  // Existing setters
  toggleContactInfo: () =>
    set((state) => ({ isContactInfoOpen: !state.isContactInfoOpen })),
  setContactInfoOpen: (isContactInfoOpen) => set({ isContactInfoOpen }),
  setAddContactModalOpen: (isAddContactModalOpen) =>
    set({ isAddContactModalOpen }),
  setForwardModalOpen: (isForwardModalOpen) => set({ isForwardModalOpen }),
  setMediaViewerOpen: (isMediaViewerOpen, currentMedia: string | null = null) =>
    set({ isMediaViewerOpen, currentMedia }),

  addMeetingNotification: (notification) =>
    set((state) => ({
      meetingNotifications: [notification, ...state.meetingNotifications],
    })),
  markNotificationRead: (id) =>
    set((state) => ({
      meetingNotifications: state.meetingNotifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),
  clearMeetingNotifications: () => set({ meetingNotifications: [] }),

  setMeetingStartNotice: (meetingStartNotice) => set({ meetingStartNotice }),
  clearMeetingStartNotice: () => set({ meetingStartNotice: null }),

  openMeetingScreen: (activeMeetingScreen) => set({ activeMeetingScreen }),
  closeMeetingScreen: () => set({ activeMeetingScreen: null }),
}));
