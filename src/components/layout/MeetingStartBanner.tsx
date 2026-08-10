"use client";

import { useEffect } from "react";
import { useUIStore } from "@/store/uiStore";

type MeetingStartBannerProps = {
  onOpenMeeting?: (payload: {
    organization_id: string;
    team_id: string;
    meeting_id: string;
    title?: string;
    call_type?: "voice" | "video";
  }) => void;
};

export default function MeetingStartBanner({
  onOpenMeeting,
}: MeetingStartBannerProps) {
  const notice = useUIStore((s) => s.meetingStartNotice);
  const clearNotice = useUIStore((s) => s.clearMeetingStartNotice);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => clearNotice(), 10000);
    return () => clearTimeout(timer);
  }, [notice, clearNotice]);

  if (!notice) return null;

  return (
    <div className="fixed top-4 right-4 z-[220] max-w-sm w-[calc(100vw-2rem)] rounded-xl border border-[#00a884]/40 bg-[#0f1f22] shadow-2xl p-3">
      <p className="text-[#d8fff6] text-sm">
        <span className="font-semibold">A teammate</span> started "
        {notice.title || "Meeting"}".
      </p>
      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          onClick={() => {
            if (
              notice?.organization_id &&
              notice?.team_id &&
              notice?.meeting_id
            ) {
              onOpenMeeting?.({
                organization_id: notice.organization_id,
                team_id: notice.team_id,
                meeting_id: notice.meeting_id,
                title: notice.title,
                call_type: notice.call_type || "video",
              });
            }
            clearNotice();
          }}
          className="px-3 py-1.5 rounded-md bg-[#00a884] text-[#0b141a] text-xs font-semibold hover:bg-[#00ba95]"
        >
          Open
        </button>
        <button
          onClick={clearNotice}
          className="px-3 py-1.5 rounded-md bg-[#202c33] text-[#e9edef] text-xs"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
