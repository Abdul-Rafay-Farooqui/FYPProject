export const PRESENCE_MAP: Record<string, string> = {
  available: '🟢 Available',
  busy: '🔴 Busy',
  dnd: '🔕 Do not disturb',
  brb: '🟡 Be right back',
  away: '⚪ Away',
};

export const TEAM_TABS = [
  'chat',
  'members',
  'activity',
  'files',
  'meetings',
  'tasks',
  'approvals',
  // 'calendar' removed - now organization-level only
  // 'praise' removed - now organization-level only
];

export const teamData = {
  chat: [],
  members: [],
  files: [],
  meetings: [],
  attendance: [],
  tasks: [],
  activity: [],
  approvals: [],
  praise: [], // Keep for backward compatibility but not displayed
};
