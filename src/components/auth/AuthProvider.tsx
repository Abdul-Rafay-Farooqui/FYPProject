"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useCallStore } from "@/store/callStore";
import { useUIStore } from "@/store/uiStore";
import { AuthAPI, UsersAPI } from "@/lib/api/endpoints";
import { clearToken, getToken } from "@/lib/api/client";
import { disconnectSocket, getSocket } from "@/lib/socket";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setUser, setProfile, setAuthLoaded, profile, user } = useAuthStore();
  const setIncomingCall = useCallStore((s) => s.setIncomingCall);
  const setMeetingStartNotice = useUIStore((s) => s.setMeetingStartNotice);
  const router = useRouter();
  const pathname = usePathname();
  const initializedRef = useRef(false);

  // ── 1. Bootstrap session from JWT cookie / localStorage ───────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const token = getToken();
        if (!token) {
          setUser(null);
          setProfile(null);
          setAuthLoaded(true);
          initializedRef.current = true;
          if (!pathname.startsWith("/auth")) router.push("/auth/login");
          return;
        }
        const me = await AuthAPI.me();
        setUser({ id: me.id });
        setProfile(me);
        setAuthLoaded(true);
        initializedRef.current = true;

        if (!me.onboarding_complete && pathname !== "/auth/onboarding") {
          router.push("/auth/onboarding");
        }
      } catch {
        clearToken();
        setUser(null);
        setProfile(null);
        setAuthLoaded(true);
        initializedRef.current = true;
        if (!pathname.startsWith("/auth")) router.push("/auth/login");
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 2. Manage socket & incoming-call listener ─────────────────────────────
  useEffect(() => {
    if (!user?.id) {
      disconnectSocket();
      return;
    }
    const socket = getSocket();

    const onIncoming = (call: any) => {
      if (call?.status === "ringing") setIncomingCall(call);
    };
    const onUpdate = (call: any) => {
      if (["ended", "declined", "failed", "missed"].includes(call?.status)) {
        setIncomingCall(null);
      }
    };
    const onMeetingStarted = (payload: any) => {
      if (!payload || payload.started_by === user?.id) return;
      setMeetingStartNotice({
        organization_id: payload.organization_id,
        team_id: payload.team_id,
        meeting_id: payload.meeting_id,
        title: payload.title || "Meeting",
        started_by: payload.started_by,
        call_type: payload.call_type || "video",
      });
    };

    socket.on("call:incoming", onIncoming);
    socket.on("call:update", onUpdate);
    socket.on("meeting:started", onMeetingStarted);

    return () => {
      socket.off("call:incoming", onIncoming);
      socket.off("call:update", onUpdate);
      socket.off("meeting:started", onMeetingStarted);
    };
  }, [user?.id, setIncomingCall, setMeetingStartNotice]);

  // ── 3. Presence: mark online / offline via backend ────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    UsersAPI.setPresence(true).catch(() => {});

    const onVisibility = () => {
      UsersAPI.setPresence(!document.hidden).catch(() => {});
    };
    const onUnload = () => {
      try {
        UsersAPI.setPresence(false).catch(() => {});
      } catch {}
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onUnload);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onUnload);
      UsersAPI.setPresence(false).catch(() => {});
    };
  }, [user?.id]);

  return <>{children}</>;
}
