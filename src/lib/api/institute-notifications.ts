import { api } from "./client";

export const InstituteNotificationsAPI = {
  // Get all notifications
  getNotifications: (instituteId?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (instituteId) params.append("institute_id", instituteId);
    if (limit) params.append("limit", limit.toString());
    return api
      .get(`/institute-notifications?${params.toString()}`)
      .then((r) => r.data);
  },

  // Get unread notifications
  getUnreadNotifications: (instituteId?: string) => {
    const params = new URLSearchParams();
    if (instituteId) params.append("institute_id", instituteId);
    return api
      .get(`/institute-notifications/unread?${params.toString()}`)
      .then((r) => r.data);
  },

  // Get unread count
  getUnreadCount: (instituteId?: string) => {
    const params = new URLSearchParams();
    if (instituteId) params.append("institute_id", instituteId);
    return api
      .get(`/institute-notifications/unread-count?${params.toString()}`)
      .then((r) => r.data);
  },

  // Mark as read
  markAsRead: (notificationId: string) =>
    api
      .patch(`/institute-notifications/${notificationId}/read`)
      .then((r) => r.data),

  // Mark all as read
  markAllAsRead: (instituteId?: string) => {
    const params = new URLSearchParams();
    if (instituteId) params.append("institute_id", instituteId);
    return api
      .patch(`/institute-notifications/mark-all-read?${params.toString()}`)
      .then((r) => r.data);
  },

  // Delete notification
  deleteNotification: (notificationId: string) =>
    api.delete(`/institute-notifications/${notificationId}`).then((r) => r.data),

  // Delete all notifications
  deleteAllNotifications: (instituteId?: string) => {
    const params = new URLSearchParams();
    if (instituteId) params.append("institute_id", instituteId);
    return api
      .delete(`/institute-notifications?${params.toString()}`)
      .then((r) => r.data);
  },
};
