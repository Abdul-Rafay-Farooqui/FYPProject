"use client";

import { api } from "./client";

export const OrganizationAPI = {
  listOrganizations: () => api.get("/organizations").then((r) => r.data),
  getOrganization: (organizationId: string) =>
    api.get(`/organizations/${organizationId}`).then((r) => r.data),
  createOrganization: (payload: { name: string; slug?: string; description?: string; logo_url?: string }) =>
    api.post("/organizations", payload).then((r) => r.data),
  updateOrganization: (organizationId: string, payload: { name?: string; slug?: string; description?: string; logo_url?: string; website_url?: string }) =>
    api.patch(`/organizations/${organizationId}`, payload).then((r) => r.data),
  deleteOrganization: (organizationId: string) =>
    api.delete(`/organizations/${organizationId}`).then((r) => r.data),
  addOrganizationMembers: (organizationId: string, member_ids: string[]) =>
    api
      .post(`/organizations/${organizationId}/members`, { member_ids })
      .then((r) => r.data),
  createTeam: (
    organizationId: string,
    payload: { name: string; member_ids?: string[] },
  ) =>
    api
      .post(`/organizations/${organizationId}/teams`, payload)
      .then((r) => r.data),
  updateTeam: (
    organizationId: string,
    teamId: string,
    payload: { name?: string; description?: string; visibility?: 'organization' | 'private' },
  ) =>
    api
      .patch(`/organizations/${organizationId}/teams/${teamId}`, payload)
      .then((r) => r.data),
  addTeamMembers: (
    organizationId: string,
    teamId: string,
    member_ids: string[],
  ) =>
    api
      .post(`/organizations/${organizationId}/teams/${teamId}/members`, {
        member_ids,
      })
      .then((r) => r.data),
  deleteTeam: (organizationId: string, teamId: string) =>
    api
      .delete(`/organizations/${organizationId}/teams/${teamId}`)
      .then((r) => r.data),
  removeTeamMember: (
    organizationId: string,
    teamId: string,
    memberId: string,
  ) =>
    api
      .delete(
        `/organizations/${organizationId}/teams/${teamId}/members/${memberId}`,
      )
      .then((r) => r.data),
  removeOrgMember: (organizationId: string, memberId: string) =>
    api
      .delete(`/organizations/${organizationId}/members/${memberId}`)
      .then((r) => r.data),
  createActivity: (
    organizationId: string,
    teamId: string,
    payload: { activity_type: string; preview_text?: string },
  ) =>
    api
      .post(
        `/organizations/${organizationId}/teams/${teamId}/activities`,
        payload,
      )
      .then((r) => r.data),
  deleteActivity: (
    organizationId: string,
    teamId: string,
    activityId: string,
  ) =>
    api
      .delete(
        `/organizations/${organizationId}/teams/${teamId}/activities/${activityId}`,
      )
      .then((r) => r.data),
  createTask: (
    organizationId: string,
    teamId: string,
    payload: {
      title: string;
      description?: string;
      assignee_id?: string;
      priority?: string;
      due_date?: string;
    },
  ) =>
    api
      .post(`/organizations/${organizationId}/teams/${teamId}/tasks`, payload)
      .then((r) => r.data),
  scheduleMeeting: (
    organizationId: string,
    teamId: string,
    payload: {
      title: string;
      description?: string;
      starts_at: string;
      ends_at: string;
      location_type?: "online" | "onsite" | "hybrid";
      attendee_ids?: string[];
      meeting_link?: string;
      call_type?: "voice" | "video";
    },
  ) =>
    api
      .post(
        `/organizations/${organizationId}/teams/${teamId}/meetings/schedule`,
        payload,
      )
      .then((r) => r.data),
  startMeetingNow: (
    organizationId: string,
    teamId: string,
    payload: {
      title: string;
      description?: string;
      duration_minutes?: number;
      attendee_ids?: string[];
      call_type?: "voice" | "video";
    },
  ) =>
    api
      .post(
        `/organizations/${organizationId}/teams/${teamId}/meetings/start-now`,
        payload,
      )
      .then((r) => r.data),
  startMeeting: (
    organizationId: string,
    teamId: string,
    meetingId: string,
    payload?: { call_type?: "voice" | "video" },
  ) =>
    api
      .post(
        `/organizations/${organizationId}/teams/${teamId}/meetings/${meetingId}/start`,
        payload || {},
      )
      .then((r) => r.data),
  endMeeting: (organizationId: string, teamId: string, meetingId: string) =>
    api
      .post(
        `/organizations/${organizationId}/teams/${teamId}/meetings/${meetingId}/end`,
      )
      .then((r) => r.data),
  joinMeeting: (organizationId: string, teamId: string, meetingId: string) =>
    api
      .post(
        `/organizations/${organizationId}/teams/${teamId}/meetings/${meetingId}/join`,
      )
      .then((r) => r.data),
  leaveMeeting: (organizationId: string, teamId: string, meetingId: string) =>
    api
      .post(
        `/organizations/${organizationId}/teams/${teamId}/meetings/${meetingId}/leave`,
      )
      .then((r) => r.data),
  deleteTask: (organizationId: string, teamId: string, taskId: string) =>
    api
      .delete(
        `/organizations/${organizationId}/teams/${teamId}/tasks/${taskId}`,
      )
      .then((r) => r.data),
  updateTask: (
    organizationId: string,
    teamId: string,
    taskId: string,
    payload: { status: string },
  ) =>
    api
      .patch(
        `/organizations/${organizationId}/teams/${teamId}/tasks/${taskId}`,
        payload,
      )
      .then((r) => r.data),
  getTeamWorkspace: (organizationId: string, teamId: string) =>
    api
      .get(`/organizations/${organizationId}/teams/${teamId}/workspace`)
      .then((r) => r.data),
  createCalendarEvent: (
    organizationId: string,
    teamId: string,
    payload: {
      title: string;
      description?: string;
      date: string;
      start_time: string;
      end_time?: string;
      location?: string;
      attendee_ids?: string[];
      type?: string;
    },
  ) =>
    api
      .post(
        `/organizations/${organizationId}/teams/${teamId}/calendar`,
        payload,
      )
      .then((r) => r.data),
  deleteCalendarEvent: (
    organizationId: string,
    teamId: string,
    eventId: string,
  ) =>
    api
      .delete(
        `/organizations/${organizationId}/teams/${teamId}/calendar/${eventId}`,
      )
      .then((r) => r.data),
  clockIn: (organizationId: string, teamId: string) =>
    api
      .post(
        `/organizations/${organizationId}/teams/${teamId}/attendance/clock-in`,
      )
      .then((r) => r.data),
  clockOut: (organizationId: string, teamId: string) =>
    api
      .post(
        `/organizations/${organizationId}/teams/${teamId}/attendance/clock-out`,
      )
      .then((r) => r.data),
  createApproval: (
    organizationId: string,
    teamId: string,
    payload: {
      approval_type: string;
      title: string;
      description?: string;
      amount?: string;
    },
  ) =>
    api
      .post(
        `/organizations/${organizationId}/teams/${teamId}/approvals`,
        payload,
      )
      .then((r) => r.data),
  approveApproval: (
    organizationId: string,
    teamId: string,
    approvalId: string,
    note?: string,
  ) =>
    api
      .patch(
        `/organizations/${organizationId}/teams/${teamId}/approvals/${approvalId}/approve`,
        { note },
      )
      .then((r) => r.data),
  rejectApproval: (
    organizationId: string,
    teamId: string,
    approvalId: string,
    note: string,
  ) =>
    api
      .patch(
        `/organizations/${organizationId}/teams/${teamId}/approvals/${approvalId}/reject`,
        { note },
      )
      .then((r) => r.data),
  cancelApproval: (
    organizationId: string,
    teamId: string,
    approvalId: string,
  ) =>
    api
      .delete(
        `/organizations/${organizationId}/teams/${teamId}/approvals/${approvalId}`,
      )
      .then((r) => r.data),
  // Remove team-level praise API methods (now organization-level only)
  // Organization-level praise
  sendOrgPraise: (
    organizationId: string,
    payload: { to_user_id: string; badge: string; message?: string },
  ) =>
    api
      .post(`/organizations/${organizationId}/praise`, payload)
      .then((r) => r.data),
  getOrgPraise: (organizationId: string) =>
    api.get(`/organizations/${organizationId}/praise`).then((r) => r.data),
  
  // Role management
  updateOrgMemberRole: (
    organizationId: string,
    memberId: string,
    role: "owner" | "admin" | "manager" | "member" | "guest",
  ) =>
    api
      .patch(`/organizations/${organizationId}/members/${memberId}`, { role })
      .then((r) => r.data),
  updateTeamMemberRole: (
    organizationId: string,
    teamId: string,
    memberId: string,
    role: "lead" | "member" | "guest",
  ) =>
    api
      .patch(
        `/organizations/${organizationId}/teams/${teamId}/members/${memberId}`,
        { role },
      )
      .then((r) => r.data),

  // Notifications
  getNotifications: (organizationId: string) => {
    console.log('[API] Getting notifications for org:', organizationId);
    return api.get(`/organizations/${organizationId}/notifications`).then((r) => {
      console.log('[API] Notifications response:', r.data);
      return r.data;
    }).catch(err => {
      console.error('[API] Notifications error:', err);
      throw err;
    });
  },
  markNotificationAsRead: (organizationId: string, notificationId: string) =>
    api
      .patch(`/organizations/${organizationId}/notifications/${notificationId}/read`)
      .then((r) => r.data),
  markAllNotificationsAsRead: (organizationId: string) =>
    api
      .post(`/organizations/${organizationId}/notifications/mark-all-read`)
      .then((r) => r.data),
  deleteNotification: (organizationId: string, notificationId: string) =>
    api
      .delete(`/organizations/${organizationId}/notifications/${notificationId}`)
      .then((r) => r.data),
  
  // Organization-level attendance
  orgClockIn: (organizationId: string) =>
    api
      .post(`/organizations/${organizationId}/attendance/clock-in`)
      .then((r) => r.data),
  orgClockOut: (organizationId: string) =>
    api
      .post(`/organizations/${organizationId}/attendance/clock-out`)
      .then((r) => r.data),
  getOrgAttendance: (organizationId: string) =>
    api
      .get(`/organizations/${organizationId}/attendance`)
      .then((r) => r.data),
  
  // Organization-level calendar
  createOrgCalendarEvent: (
    organizationId: string,
    payload: {
      title: string;
      description?: string;
      date: string;
      start_time: string;
      end_time?: string;
      location?: string;
      attendee_ids?: string[];
      type?: string;
    },
  ) =>
    api
      .post(`/organizations/${organizationId}/calendar`, payload)
      .then((r) => r.data),
  deleteOrgCalendarEvent: (organizationId: string, eventId: string) =>
    api
      .delete(`/organizations/${organizationId}/calendar/${eventId}`)
      .then((r) => r.data),
  getOrgCalendar: (organizationId: string) =>
    api
      .get(`/organizations/${organizationId}/calendar`)
      .then((r) => r.data),
};
