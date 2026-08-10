export type Profile = {
  id: string;
  phone: string;
  display_name: string;
  username?: string;
  avatar_url?: string;
  about?: string;
  last_seen: string;
  is_online: boolean;
  onboarding_complete: boolean;
  theme: 'dark' | 'light';
};

export type MessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'sticker'
  | 'location'
  | 'ai'
  | 'system';

export type MessageRead = {
  id: string;
  message_id: string;
  user_id: string;
  read_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  type: MessageType;
  content?: string;
  media_url?: string;
  media_mime_type?: string;
  media_size?: number;
  media_duration?: number;
  media_thumbnail?: string;
  media_filename?: string;
  media_width?: number;
  media_height?: number;
  reply_to_id?: string;
  is_forwarded: boolean;
  is_deleted_for_everyone: boolean;
  created_at: string;
  updated_at: string;
  reads?: MessageRead[];
};

export type Conversation = {
  id: string;
  type: '1on1' | 'group';
  name?: string | null;
  description?: string | null;
  avatar_url?: string | null;
  send_permission?: 'all' | 'admins';
  edit_permission?: 'all' | 'admins';
  community_id?: string | null;
  last_message_id?: string;
  last_message_at: string;
  last_message_preview?: string;
  disappearing_timer?: number;
  created_at: string;
  updated_at: string;
  participants?: Participant[];
  other_participant?: Profile;
};

export type Participant = {
  id: string;
  conversation_id: string;
  user_id: string;
  role?: 'admin' | 'member';
  is_muted: boolean;
  unread_count: number;
  last_read_at: string;
  user?: Profile;
  profile?: Profile;
};

export type CallStatus =
  | 'ringing'
  | 'active'
  | 'ended'
  | 'missed'
  | 'declined'
  | 'failed';

export type Call = {
  id: string;
  caller_id: string;
  callee_id: string;
  conversation_id?: string;
  type: 'voice' | 'video';
  status: CallStatus;
  channel_name: string;
  started_at: string;
  ended_at?: string;
  duration_seconds?: number;
};

// ---- Status ----------------------------------------------------------------
export type StatusUpdate = {
  id: string;
  user_id: string;
  type: 'text' | 'image' | 'video';
  content?: string | null;
  caption?: string | null;
  bg_color?: string | null;
  media_url?: string | null;
  media_thumbnail?: string | null;
  media_duration?: number | null;
  created_at: string;
  expires_at: string;
  viewed_by_me?: boolean;
};

export type StatusGroup = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  statuses: StatusUpdate[];
};

export type StatusFeed = {
  my_statuses: StatusUpdate[];
  recent: StatusGroup[];
};

// ---- Groups ----------------------------------------------------------------
export type GroupSummary = {
  id: string;
  name: string;
  description?: string | null;
  avatar_url?: string | null;
  created_by?: string | null;
  send_permission: 'all' | 'admins';
  edit_permission: 'all' | 'admins';
  community_id?: string | null;
  role: 'admin' | 'member';
  is_muted: boolean;
  is_pinned: boolean;
  unread_count: number;
  last_message_at: string;
  last_message_preview?: string | null;
  member_count: number;
};

export type GroupDetail = Conversation & {
  send_permission: 'all' | 'admins';
  edit_permission: 'all' | 'admins';
  members: Array<Participant & { user: Profile }>;
};

// ---- Community -------------------------------------------------------------
export type CommunitySummary = {
  id: string;
  name: string;
  description?: string | null;
  avatar_url?: string | null;
  created_by?: string | null;
  role: 'admin' | 'member';
  member_count: number;
  group_count: number;
  updated_at: string;
};

export type CommunityMemberRow = {
  id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  display_name: string;
  avatar_url?: string | null;
  phone?: string;
};

export type CommunityGroupRow = {
  id: string;
  conversation_id: string;
  is_announcement: boolean;
  name: string;
  avatar_url?: string | null;
  last_message_preview?: string | null;
  last_message_at: string;
};

export type CommunityDetail = {
  id: string;
  name: string;
  description?: string | null;
  avatar_url?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  members: CommunityMemberRow[];
  groups: CommunityGroupRow[];
};