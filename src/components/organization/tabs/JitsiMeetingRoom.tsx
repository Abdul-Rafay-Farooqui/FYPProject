"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";

type JitsiMeetingRoomProps = {
  open: boolean;
  meeting: any;
  organizationId: string;
  teamId: string;
  currentUserId?: string;
  currentUserName?: string;
  onClose: () => void;
  onRefresh?: () => Promise<void> | void;
  onEndMeeting?: (meetingId: string) => Promise<void> | void;
};

export default function JitsiMeetingRoom({
  open,
  meeting,
  currentUserName,
  onClose,
  onRefresh,
  onEndMeeting,
}: JitsiMeetingRoomProps) {
  const [isLoading, setIsLoading] = useState(true);

  const handleManualClose = async () => {
    if (onEndMeeting && meeting?.id) {
      try {
        await onEndMeeting(meeting.id);
      } catch (error) {
        console.error('[Meeting] Failed to end meeting:', error);
      }
    }
    await onRefresh?.();
    onClose();
  };

  if (!open) return null;

  const displayName = encodeURIComponent(currentUserName || 'User');
  const roomUrl = `https://meet.jit.si/${meeting?.id || 'meeting'}#userInfo.displayName="${displayName}"&config.prejoinPageEnabled=false&config.requireDisplayName=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.disableDeepLinking=true&interfaceConfig.SHOW_JITSI_WATERMARK=false&interfaceConfig.MOBILE_APP_PROMO=false`;

  return (
    <div className="fixed inset-0 z-[100] bg-[#0b141a] flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white text-lg font-semibold">
              {meeting?.title || "Meeting"}
            </h2>
            <p className="text-gray-300 text-sm">Powered by Jitsi Meet</p>
          </div>
          <button
            onClick={handleManualClose}
            className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all flex items-center gap-2"
          >
            <X className="w-5 h-5" />
            <span>Leave Meeting</span>
          </button>
        </div>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0b141a] z-10 pointer-events-none">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-[#00a884] animate-spin mx-auto mb-4" />
            <p className="text-white text-lg font-medium">Joining meeting...</p>
            <p className="text-gray-400 text-sm mt-2">Please wait</p>
          </div>
        </div>
      )}

      {/* Jitsi iframe */}
      <iframe
        src={roomUrl}
        allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write; speaker-selection"
        allowFullScreen
        className="flex-1 w-full border-none"
        style={{ marginTop: 60, height: 'calc(100% - 60px)' }}
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
}
