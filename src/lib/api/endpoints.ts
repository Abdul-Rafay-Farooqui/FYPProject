'use client';

import { api } from './client';

// ---- Auth ------------------------------------------------------------------
export const AuthAPI = {
  register: (phone: string, email: string, password: string, display_name?: string) =>
    api.post('/auth/register', { phone, email, password, display_name }).then((r) => r.data),
  login: (phone: string, password: string) =>
    api.post('/auth/login', { phone, password }).then((r) => r.data),
  phoneCheck: (phone: string) =>
    api.post('/auth/phone-check', { phone }).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
};

// ---- Users -----------------------------------------------------------------
export const UsersAPI = {
  get: (id: string) => api.get(`/users/${id}`).then((r) => r.data),
  getById: (id: string) => api.get(`/users/${id}`).then((r) => r.data),
  byPhone: (phone: string) =>
    api.get('/users/by-phone', { params: { phone } }).then((r) => r.data),
  searchByPhone: (phone: string) =>
    api.get('/users/by-phone', { params: { phone } }).then((r) => r.data),
  search: (q: string) =>
    api.get('/users/search', { params: { q } }).then((r) => r.data),
  updateMe: (patch: any) => api.patch('/users/me', patch).then((r) => r.data),
  setPresence: (is_online: boolean) =>
    api.patch('/users/me/presence', { is_online }).then((r) => r.data),
};

// ---- Contacts --------------------------------------------------------------
export const ContactsAPI = {
  list: () => api.get('/contacts').then((r) => r.data),
  add: (contact_id: string, nickname?: string) =>
    api.post('/contacts', { contact_id, nickname }).then((r) => r.data),
  addByPhone: (phone: string, nickname?: string) =>
    api.post('/contacts', { phone, nickname }).then((r) => r.data),
  remove: (id: string) => api.delete(`/contacts/${id}`).then((r) => r.data),
  favourite: (id: string, fav: boolean) =>
    api.patch(`/contacts/${id}/favourite`, { is_favourite: fav }).then((r) => r.data),
};

// ---- Conversations ---------------------------------------------------------
export const ConversationsAPI = {
  list: () => api.get('/conversations').then((r) => r.data),
  listArchived: () =>
    api.get('/conversations', { params: { archived: true } }).then((r) => r.data),
  get: (id: string) => api.get(`/conversations/${id}`).then((r) => r.data),
  create1on1: (other_user_id: string) =>
    api.post('/conversations', { other_user_id }).then((r) => r.data),
  createGroup: (name: string, member_ids: string[], avatar_url?: string) =>
    api
      .post('/conversations/group', { name, member_ids, avatar_url })
      .then((r) => r.data),
  markRead: (id: string) =>
    api.post(`/conversations/${id}/read`).then((r) => r.data),
  pin: (id: string, pinned: boolean) =>
    api.post(`/conversations/${id}/pin`, { pinned }).then((r) => r.data),
  mute: (id: string, muted: boolean, until?: string) =>
    api.post(`/conversations/${id}/mute`, { muted, until }).then((r) => r.data),
  archive: (id: string, archived: boolean) =>
    api.post(`/conversations/${id}/archive`, { archived }).then((r) => r.data),
  clear: (id: string) =>
    api.post(`/conversations/${id}/clear`).then((r) => r.data),
  hide: (id: string) =>
    api.post(`/conversations/${id}/hide`).then((r) => r.data),
  lock: (id: string, pin: string) =>
    api.post(`/conversations/${id}/lock`, { pin }).then((r) => r.data),
  unlock: (id: string, pin: string) =>
    api.post(`/conversations/${id}/unlock`, { pin }).then((r) => r.data),
  removeLock: (id: string, pin: string) =>
    api.post(`/conversations/${id}/remove-lock`, { pin }).then((r) => r.data),
  setDisappearing: (id: string, seconds: number | null) =>
    api
      .post(`/conversations/${id}/disappearing`, { seconds })
      .then((r) => r.data),
};

// ---- Groups (full WhatsApp-style management) -------------------------------
export const GroupsAPI = {
  list: () => api.get('/groups').then((r) => r.data),
  get: (id: string) => api.get(`/groups/${id}`).then((r) => r.data),
  create: (payload: {
    name: string;
    description?: string;
    avatar_url?: string;
    member_ids: string[];
  }) => api.post('/groups', payload).then((r) => r.data),
  update: (id: string, patch: {
    name?: string;
    description?: string;
    avatar_url?: string;
    send_permission?: 'all' | 'admins';
    edit_permission?: 'all' | 'admins';
  }) => api.patch(`/groups/${id}`, patch).then((r) => r.data),
  addMembers: (id: string, member_ids: string[]) =>
    api.post(`/groups/${id}/members`, { member_ids }).then((r) => r.data),
  removeMember: (id: string, memberId: string) =>
    api.delete(`/groups/${id}/members/${memberId}`).then((r) => r.data),
  leave: (id: string) =>
    api.post(`/groups/${id}/leave`).then((r) => r.data),
  setRole: (id: string, memberId: string, role: 'admin' | 'member') =>
    api
      .post(`/groups/${id}/members/${memberId}/role`, { role })
      .then((r) => r.data),
};

// ---- Communities -----------------------------------------------------------
export const CommunitiesAPI = {
  list: () => api.get('/communities').then((r) => r.data),
  get: (id: string) => api.get(`/communities/${id}`).then((r) => r.data),
  create: (payload: {
    name: string;
    description?: string;
    avatar_url?: string;
    member_ids?: string[];
  }) => api.post('/communities', payload).then((r) => r.data),
  update: (id: string, patch: { name?: string; description?: string; avatar_url?: string }) =>
    api.patch(`/communities/${id}`, patch).then((r) => r.data),
  remove: (id: string) => api.delete(`/communities/${id}`).then((r) => r.data),
  addMembers: (id: string, member_ids: string[]) =>
    api.post(`/communities/${id}/members`, { member_ids }).then((r) => r.data),
  removeMember: (id: string, memberId: string) =>
    api.delete(`/communities/${id}/members/${memberId}`).then((r) => r.data),
  leave: (id: string) =>
    api.post(`/communities/${id}/leave`).then((r) => r.data),
  setRole: (id: string, memberId: string, role: 'admin' | 'member') =>
    api
      .post(`/communities/${id}/members/${memberId}/role`, { role })
      .then((r) => r.data),
  createGroup: (
    id: string,
    payload: {
      name: string;
      description?: string;
      avatar_url?: string;
      member_ids?: string[];
    },
  ) => api.post(`/communities/${id}/groups`, payload).then((r) => r.data),
  linkGroup: (id: string, groupId: string) =>
    api.post(`/communities/${id}/groups/${groupId}/link`).then((r) => r.data),
  unlinkGroup: (id: string, groupId: string) =>
    api.delete(`/communities/${id}/groups/${groupId}`).then((r) => r.data),
};

// ---- Messages --------------------------------------------------------------
export const MessagesAPI = {
  list: (conversationId: string, limit = 200) =>
    api
      .get('/messages', { params: { conversationId, limit } })
      .then((r) => r.data),
  send: (payload: any) => api.post('/messages', payload).then((r) => r.data),
  edit: (id: string, content: string) =>
    api.post(`/messages/${id}/edit`, { content }).then((r) => r.data),
  deleteForMe: (id: string) =>
    api.delete(`/messages/${id}/me`).then((r) => r.data),
  deleteForEveryone: (id: string) =>
    api.delete(`/messages/${id}/everyone`).then((r) => r.data),
  markRead: (ids: string[]) =>
    api.post('/messages/read', { ids }).then((r) => r.data),
  react: (id: string, emoji: string | null) =>
    api.post(`/messages/${id}/react`, { emoji }).then((r) => r.data),
  pin: (id: string) => api.post(`/messages/${id}/pin`).then((r) => r.data),
  unpin: (conversationId: string) =>
    api.post(`/messages/unpin/${conversationId}`).then((r) => r.data),
  getPinned: (conversationId: string) =>
    api.get(`/messages/pinned/${conversationId}`).then((r) => r.data),
  star: (id: string, starred: boolean) =>
    api.post(`/messages/${id}/star`, { starred }).then((r) => r.data),
  listStarred: () => api.get('/messages/starred/all').then((r) => r.data),
  listStarredIds: (conversationId?: string) =>
    api
      .get('/messages/starred/ids', { params: { conversationId } })
      .then((r) => r.data),
  forward: (ids: string[], conversation_ids: string[]) =>
    api
      .post(`/messages/${ids[0]}/forward`, { message_ids: ids, conversation_ids })
      .then((r) => r.data),
  search: (q: string, conversationId?: string) =>
    api
      .get('/messages/search', { params: { q, conversationId } })
      .then((r) => r.data),
};

// ---- Media -----------------------------------------------------------------
export const MediaAPI = {
  upload: async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const { data } = await api.post('/media/upload', fd);
    return data as {
      url: string;
      path: string;
      mime_type: string;
      size: number;
      original_name: string;
      bucket: string;
    };
  },
};

// ---- Calls -----------------------------------------------------------------
export const CallsAPI = {
  initiate: (payload: {
    callee_id: string;
    conversation_id?: string;
    type: 'voice' | 'video';
  }) => api.post('/calls', payload).then((r) => r.data),
  updateStatus: (
    id: string,
    status: 'ringing' | 'active' | 'ended' | 'missed' | 'declined' | 'failed',
  ) => api.post(`/calls/${id}/status`, { status }).then((r) => r.data),
  accept: (id: string) =>
    api.post(`/calls/${id}/status`, { status: 'active' }).then((r) => r.data),
  end: (id: string, duration_seconds?: number) =>
    api.post(`/calls/${id}/status`, { status: 'ended', duration_seconds }).then((r) => r.data),
  history: () => api.get('/calls').then((r) => r.data),
};

// ---- Status ----------------------------------------------------------------
export const StatusAPI = {
  feed: () => api.get('/status/feed').then((r) => r.data),
  create: (payload: {
    type: 'text' | 'image' | 'video';
    content?: string;
    caption?: string;
    bg_color?: string;
    media_url?: string;
    media_thumbnail?: string;
    media_duration?: number;
    hide_from?: string[];
  }) => api.post('/status', payload).then((r) => r.data),
  view: (id: string) => api.post(`/status/${id}/view`).then((r) => r.data),
  viewers: (id: string) =>
    api.get(`/status/${id}/viewers`).then((r) => r.data),
  setPrivacy: (id: string, hide_from: string[]) =>
    api.put(`/status/${id}/privacy`, { hide_from }).then((r) => r.data),
  remove: (id: string) => api.delete(`/status/${id}`).then((r) => r.data),
};

// ---- Blocks ----------------------------------------------------------------
export const BlocksAPI = {
  list: () => api.get('/blocks').then((r) => r.data),
  check: (targetId: string) =>
    api.get(`/blocks/check/${targetId}`).then((r) => r.data) as Promise<{
      i_blocked_them: boolean;
      they_blocked_me: boolean;
      is_blocked: boolean;
    }>,
  block: (targetId: string) =>
    api.post(`/blocks/${targetId}`).then((r) => r.data),
  unblock: (targetId: string) =>
    api.delete(`/blocks/${targetId}`).then((r) => r.data),
  report: (targetId: string, reason?: string) =>
    api.post(`/blocks/report/${targetId}`, { reason }).then((r) => r.data),
};

// ---- AI (OpenRouter auto) --------------------------------------------------
export const AiAPI = {
  chat: (messages: { role: 'user' | 'assistant' | 'system'; content: string }[]) =>
    api.post('/ai/chat', { messages }).then((r) => r.data),
};