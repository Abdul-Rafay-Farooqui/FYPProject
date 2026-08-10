"use client";

import { useState, useEffect, useCallback } from "react";
import { ConversationsAPI } from "@/lib/api/endpoints";
import { OrganizationAPI } from "@/lib/api/organization";
import { InstituteNotificationsAPI } from "@/lib/api/institute-notifications";
import { getSocket } from "@/lib/socket";

export function useModuleNotificationCounts(userId?: string) {
  const [chatUnread, setChatUnread] = useState(0);
  const [orgUnread, setOrgUnread] = useState(0);
  const [instituteUnread, setInstituteUnread] = useState(0);

  const refreshChat = useCallback(async () => {
    if (!userId) {
      setChatUnread(0);
      return;
    }

    try {
      const conversations = await ConversationsAPI.list();
      const total = (conversations || []).reduce((sum: number, conv: any) => {
        if (conv._is_archived) return sum;
        return sum + (conv.unread_count ?? 0);
      }, 0);
      setChatUnread(total);
    } catch (error) {
      console.error("[ModuleCounts] Failed to load chat unread:", error);
    }
  }, [userId]);

  const refreshOrg = useCallback(async () => {
    if (!userId) {
      setOrgUnread(0);
      return;
    }

    try {
      const orgs = await OrganizationAPI.listOrganizations();
      if (!orgs?.length) {
        setOrgUnread(0);
        return;
      }

      const counts = await Promise.all(
        orgs.map((org: { id: string }) =>
          OrganizationAPI.getNotifications(org.id)
            .then((data) => data?.unread_count ?? 0)
            .catch(() => 0),
        ),
      );

      setOrgUnread(counts.reduce((sum, count) => sum + count, 0));
    } catch (error) {
      console.error("[ModuleCounts] Failed to load organization unread:", error);
    }
  }, [userId]);

  const refreshInstitute = useCallback(async () => {
    if (!userId) {
      setInstituteUnread(0);
      return;
    }

    try {
      const count = await InstituteNotificationsAPI.getUnreadCount();
      setInstituteUnread(typeof count === "number" ? count : 0);
    } catch (error) {
      console.error("[ModuleCounts] Failed to load institute unread:", error);
    }
  }, [userId]);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshChat(), refreshOrg(), refreshInstitute()]);
  }, [refreshChat, refreshOrg, refreshInstitute]);

  useEffect(() => {
    if (!userId) return;

    refreshAll();

    const socket = getSocket();

    const onMessageNew = (msg: { sender_id?: string }) => {
      if (msg.sender_id !== userId) {
        refreshChat();
      }
    };

    const onConversationUpdate = () => refreshChat();
    const onOrgNotificationNew = () => refreshOrg();
    const onOrgNotificationRead = () => refreshOrg();
    const onOrgNotificationAllRead = () => refreshOrg();
    const onInstituteNotification = () => refreshInstitute();
    const onInstituteNotificationRead = () => refreshInstitute();
    const onInstituteNotificationsAllRead = () => refreshInstitute();

    socket.on("message:new", onMessageNew);
    socket.on("conversation:update", onConversationUpdate);
    socket.on("notification:new", onOrgNotificationNew);
    socket.on("notification:read", onOrgNotificationRead);
    socket.on("notification:all-read", onOrgNotificationAllRead);
    socket.on("institute-notification", onInstituteNotification);
    socket.on("institute-notification-read", onInstituteNotificationRead);
    socket.on("institute-notifications-all-read", onInstituteNotificationsAllRead);

    return () => {
      socket.off("message:new", onMessageNew);
      socket.off("conversation:update", onConversationUpdate);
      socket.off("notification:new", onOrgNotificationNew);
      socket.off("notification:read", onOrgNotificationRead);
      socket.off("notification:all-read", onOrgNotificationAllRead);
      socket.off("institute-notification", onInstituteNotification);
      socket.off("institute-notification-read", onInstituteNotificationRead);
      socket.off("institute-notifications-all-read", onInstituteNotificationsAllRead);
    };
  }, [userId, refreshAll, refreshChat, refreshOrg, refreshInstitute]);

  return {
    chatUnread,
    orgUnread,
    instituteUnread,
    refreshChat,
    refreshOrg,
    refreshInstitute,
    refreshAll,
  };
}
