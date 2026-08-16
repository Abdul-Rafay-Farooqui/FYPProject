"use client";

import { useState } from "react";
import { X, Phone } from "lucide-react";

interface JitsiLiveClassRoomProps {
  open: boolean;
  liveClass: any;
  instituteId: string;
  currentUserId: string;
  currentUserName: string;
  isTeacher?: boolean;
  onClose: () => void;
  onRefresh?: () => void;
  onEndClass?: (classId: string) => void;
}

export default function JitsiLiveClassRoom({
  open,
  liveClass,
  instituteId,
  currentUserId,
  currentUserName,
  isTeacher = false,
  onClose,
  onRefresh,
  onEndClass,
}: JitsiLiveClassRoomProps) {
  const [isLoading, setIsLoading] = useState(true);

  const handleManualClose = async () => {
    if (isTeacher && onEndClass && liveClass?.id) {
      try {
        await onEndClass(liveClass.id);
      } catch (error) {
        console.error("[Jitsi-LiveClass] Failed to end class:", error);
      }
    }
    await onRefresh?.();
    onClose();
  };

  if (!open) return null;

  const displayName = encodeURIComponent(currentUserName || "User");
  const roomUrl = `https://meet.jit.si/${liveClass?.meeting_id || "class"}#userInfo.displayName="${displayName}"&config.prejoinPageEnabled=false&config.requireDisplayName=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.disableDeepLinking=true&interfaceConfig.SHOW_JITSI_WATERMARK=false&interfaceConfig.MOBILE_APP_PROMO=false`;

  return (
    <div className="fixed inset-0 z-[100] bg-[#0b141a] flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white text-lg font-semibold">
              {liveClass?.title || "Live Class"}
            </h2>
            {liveClass?.subject?.name && (
              <p className="text-[#8696a0] text-sm mt-1">
                {liveClass.subject.name}
              </p>
            )}
          </div>
          <button
            onClick={handleManualClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="End class and leave"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-[#0b141a] flex items-center justify-center z-10 pointer-events-none">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
            <p className="text-white text-sm">Joining class...</p>
          </div>
        </div>
      )}

      {/* Jitsi iframe — direct embed, works on all domains */}
      <iframe
        src={roomUrl}
        allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write; speaker-selection"
        allowFullScreen
        className="w-full border-none"
        style={{ marginTop: 60, height: 'calc(100% - 60px)' }}
        onLoad={() => setIsLoading(false)}
      />

      {/* Footer Controls */}
      {isTeacher && (
        <div className="absolute bottom-4 left-4 right-4 z-20 flex justify-center">
          <button
            onClick={handleManualClose}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Phone className="w-5 h-5" />
            End Class
          </button>
        </div>
      )}
    </div>
  );
}
