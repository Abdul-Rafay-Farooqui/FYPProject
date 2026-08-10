import { create } from 'zustand';
import { Conversation, Message } from '@/types';

interface ChatState {
  activeConversation: Conversation | null;
  messages: Message[];
  replyTo: Message | null;
  starredMessageIds: Set<string>;
  pinnedMessageId: string | null;
  setActiveConversation: (conversation: Conversation | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (message: Message) => void;
  removeMessage: (messageId: string) => void;
  setReplyTo: (message: Message | null) => void;
  setStarredMessageIds: (ids: Set<string>) => void;
  toggleStarredMessage: (messageId: string) => void;
  setPinnedMessageId: (id: string | null) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeConversation: null,
  messages: [],
  replyTo: null,
  starredMessageIds: new Set(),
  pinnedMessageId: null,
  setActiveConversation: (activeConversation) =>
    set((state) => {
      if (state.activeConversation?.id === activeConversation?.id) {
        return { activeConversation };
      }
      return { activeConversation, messages: [], replyTo: null, starredMessageIds: new Set(), pinnedMessageId: null };
    }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => {
      if (state.messages.some((m) => m.id === message.id)) return state;
      return { messages: [...state.messages, message] };
    }),
  updateMessage: (updatedMessage) =>
    set((state) => ({
      messages: state.messages.map((m) => (m.id === updatedMessage.id ? updatedMessage : m)),
    })),
  removeMessage: (messageId) =>
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== messageId),
    })),
  setReplyTo: (replyTo) => set({ replyTo }),
  setStarredMessageIds: (starredMessageIds) => set({ starredMessageIds }),
  toggleStarredMessage: (messageId) =>
    set((state) => {
      const next = new Set(state.starredMessageIds);
      if (next.has(messageId)) next.delete(messageId);
      else next.add(messageId);
      return { starredMessageIds: next };
    }),
  setPinnedMessageId: (pinnedMessageId) => set({ pinnedMessageId }),
}));
