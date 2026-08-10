import { useState, useEffect } from "react";
import { InstituteNotificationsAPI } from "@/lib/api/institute-notifications";
import { getSocket } from "@/lib/socket";

export interface InstituteNotification {
  id: string;
  institute_id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  metadata: any;
  related_id: string | null;
  related_type: string | null;
  created_at: string;
  read_at: string | null;
}

export function useInstituteNotifications(instituteId?: string) {
  const [notifications, setNotifications] = useState<InstituteNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const socket = getSocket();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await InstituteNotificationsAPI.getNotifications(instituteId, 50);
      setNotifications(data);

      const count = await InstituteNotificationsAPI.getUnreadCount(instituteId);
      setUnreadCount(count);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (instituteId) {
      fetchNotifications();
    }
  }, [instituteId]);

  useEffect(() => {
    const handleNewNotification = (notification: InstituteNotification) => {
      if (!instituteId || notification.institute_id === instituteId) {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      }
    };

    const handleNotificationRead = ({ notificationId }: { notificationId: string }) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    };

    const handleAllRead = () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    };

    socket.on("institute-notification", handleNewNotification);
    socket.on("institute-notification-read", handleNotificationRead);
    socket.on("institute-notifications-all-read", handleAllRead);

    return () => {
      socket.off("institute-notification", handleNewNotification);
      socket.off("institute-notification-read", handleNotificationRead);
      socket.off("institute-notifications-all-read", handleAllRead);
    };
  }, [socket, instituteId]);

  const markAsRead = async (notificationId: string) => {
    try {
      await InstituteNotificationsAPI.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await InstituteNotificationsAPI.markAllAsRead(instituteId);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, read_at: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await InstituteNotificationsAPI.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      const deleted = notifications.find((n) => n.id === notificationId);
      if (deleted && !deleted.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications,
  };
}
