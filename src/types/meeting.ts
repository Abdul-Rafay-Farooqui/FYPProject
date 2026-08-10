// Enhanced meeting types
export type MeetingStatus = 'scheduled' | 'ongoing' | 'ended' | 'cancelled';

export type Meeting = {
  id: string;
  organization_id: string;
  team_id: string;
  title: string;
  description?: string;
  call_type: 'voice' | 'video';
  status: MeetingStatus;
  starts_at?: string;
  ends_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  attendees?: number;
  attendee_ids?: string[];
  meeting_link?: string;
  recording_enabled?: boolean;
};

export type MeetingNotification = {
  id: string;
  meeting_id: string;
  meeting: Meeting;
  type: 'scheduled' | 'starting_soon' | 'started' | 'ended' | 'cancelled';
  message: string;
  created_at: string;
  read: boolean;
};

export type MeetingParticipant = {
  id: string;
  user_id: string;
  meeting_id: string;
  display_name: string;
  avatar_url?: string;
  joined_at?: string;
  left_at?: string;
  is_muted: boolean;
  is_video_off: boolean;
  is_screen_sharing: boolean;
  is_speaking: boolean;
};
