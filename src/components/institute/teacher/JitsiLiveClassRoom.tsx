"use client";

import { useEffect, useRef, useState } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [useIframe, setUseIframe] = useState(false);
  const [hasLeft, setHasLeft] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!open || !liveClass || hasLeft || isInitialized) return;

    // Load Jitsi script if needed
    const loadJitsiScript = () => {
      return new Promise<void>((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) {
          resolve();
          return;
        }

        const script = document.createElement("script");
        script.src = "https://meet.jit.si/external_api.js";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Jitsi script"));
        document.body.appendChild(script);
      });
    };

    const initJitsi = async () => {
      try {
        await loadJitsiScript();

        if (!containerRef.current) {
          console.log(
            "[Jitsi-LiveClass] Container not available, using iframe",
          );
          setUseIframe(true);
          setIsLoading(false);
          setIsInitialized(true);
          return;
        }

        console.log("[Jitsi-LiveClass] Initializing External API");
        const domain = "meet.jit.si";
        const options = {
          roomName: liveClass.meeting_id,
          width: "100%",
          height: "100%",
          parentNode: containerRef.current,
          configOverwrite: {
            prejoinPageEnabled: false,
            prejoinConfig: {
              enabled: false,
            },
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            requireDisplayName: false,
            disableProfile: true,
            enableWelcomePage: false,
            enableClosePage: false,
            disableDeepLinking: true,
          },
          interfaceConfigOverwrite: {
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
            SHOW_JITSI_WATERMARK: false,
            MOBILE_APP_PROMO: false,
            HIDE_INVITE_MORE_HEADER: true,
          },
          userInfo: {
            displayName: currentUserName || "User",
            email: "",
          },
        };

        const api = new window.JitsiMeetExternalAPI(domain, options);
        jitsiApiRef.current = api;
        setIsInitialized(true);
        console.log("[Jitsi-LiveClass] External API initialized successfully");

        // Hide loading when video conference joined
        api.addEventListener("videoConferenceJoined", () => {
          console.log("[Jitsi-LiveClass] User joined conference");
          setIsLoading(false);
        });

        // Hide loading after timeout as fallback
        setTimeout(() => {
          setIsLoading(false);
        }, 5000);

        // Handle when user leaves the meeting
        api.addEventListener("readyToClose", async () => {
          console.log("[Jitsi-LiveClass] User left the meeting");
          setHasLeft(true);

          // End the class if teacher
          if (isTeacher && onEndClass && liveClass?.id) {
            try {
              await onEndClass(liveClass.id);
            } catch (error) {
              console.error("[Jitsi-LiveClass] Failed to end class:", error);
            }
          }

          // Refresh class list
          await onRefresh?.();

          // Close the meeting room
          onClose();
        });

        // Handle errors
        api.addEventListener("errorOccurred", (error: any) => {
          console.error("[Jitsi-LiveClass] Error:", error);
        });
      } catch (error) {
        console.error(
          "[Jitsi-LiveClass] Failed to initialize External API, falling back to iframe:",
          error,
        );
        setUseIframe(true);
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    initJitsi();

    return () => {
      if (jitsiApiRef.current) {
        try {
          jitsiApiRef.current.dispose();
        } catch (e) {
          console.warn("[Jitsi-LiveClass] Error disposing API:", e);
        }
        jitsiApiRef.current = null;
      }
    };
  }, [
    open,
    liveClass,
    currentUserName,
    hasLeft,
    isInitialized,
    onClose,
    onRefresh,
    onEndClass,
    isTeacher,
  ]);

  const handleManualClose = async () => {
    setHasLeft(true);
    setIsInitialized(false);

    // Dispose Jitsi API
    if (jitsiApiRef.current) {
      try {
        jitsiApiRef.current.dispose();
      } catch (e) {
        console.warn("[Jitsi-LiveClass] Error disposing API:", e);
      }
      jitsiApiRef.current = null;
    }

    // End the class if teacher
    if (isTeacher && onEndClass && liveClass?.id) {
      try {
        await onEndClass(liveClass.id);
      } catch (error) {
        console.error("[Jitsi-LiveClass] Failed to end class:", error);
      }
    }

    // Refresh class list
    await onRefresh?.();

    // Close the meeting room
    onClose();
  };

  const roomUrl = `https://meet.jit.si/${liveClass?.meeting_id || "test"}#config.prejoinPageEnabled=false&config.requireDisplayName=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&userInfo.displayName="${encodeURIComponent(
    currentUserName || "User",
  )}"&userInfo.email=""`;

  if (!open) return null;

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

      {/* Jitsi Container */}
      {useIframe ? (
        <iframe
          src={roomUrl}
          allow="camera; microphone; display-capture"
          className="w-full h-full"
          style={{
            border: "none",
            borderRadius: 0,
          }}
        />
      ) : (
        <div
          ref={containerRef}
          className="w-full h-full"
          style={{ backgroundColor: "#0b141a" }}
        />
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
            <p className="text-white text-sm">Joining meeting...</p>
          </div>
        </div>
      )}

      {/* Footer Controls */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex justify-center gap-4">
        {isTeacher && (
          <button
            onClick={handleManualClose}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Phone className="w-5 h-5" />
            End Class
          </button>
        )}
      </div>
    </div>
  );
}
