"use client";

import { useEffect, useRef, useState } from "react";
import { X, Loader2 } from "lucide-react";

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

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
  organizationId,
  teamId,
  currentUserId,
  currentUserName,
  onClose,
  onRefresh,
  onEndMeeting,
}: JitsiMeetingRoomProps) {
  const jitsiApiRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLeft, setHasLeft] = useState(false);
  const [useIframe, setUseIframe] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Debug: Log the user name
  useEffect(() => {
    console.log('[JitsiMeetingRoom] currentUserName:', currentUserName);
    console.log('[JitsiMeetingRoom] meeting:', meeting);
    console.log('[JitsiMeetingRoom] useIframe:', useIframe);
  }, [currentUserName, meeting, useIframe]);

  useEffect(() => {
    if (!open || !meeting || hasLeft || isInitialized) return;

    // Try to use External API, fallback to iframe if it fails
    const loadJitsiScript = () => {
      return new Promise<void>((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Jitsi script'));
        document.body.appendChild(script);
      });
    };

    const initJitsi = async () => {
      try {
        await loadJitsiScript();

        if (!containerRef.current) {
          console.log('[Jitsi] Container not available, using iframe');
          setUseIframe(true);
          setIsLoading(false);
          setIsInitialized(true);
          return;
        }

        console.log('[Jitsi] Initializing External API');
        const domain = 'meet.jit.si';
        const options = {
          roomName: meeting.id,
          width: '100%',
          height: '100%',
          parentNode: containerRef.current,
          configOverwrite: {
            prejoinPageEnabled: false, // Skip the prejoin page
            prejoinConfig: {
              enabled: false, // Also disable in prejoin config
            },
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            requireDisplayName: false, // Don't require display name
            disableProfile: true, // Disable profile editing
            enableWelcomePage: false, // Disable welcome page
            enableClosePage: false, // Disable close page
            disableDeepLinking: true, // Disable deep linking
          },
          interfaceConfigOverwrite: {
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
            SHOW_JITSI_WATERMARK: false,
            MOBILE_APP_PROMO: false,
            HIDE_INVITE_MORE_HEADER: true,
          },
          userInfo: {
            displayName: currentUserName || 'User',
            email: '', // Optional: can add user email
          },
          // JWT token would go here if using authenticated Jitsi
          // jwt: 'your-jwt-token',
        };

        const api = new window.JitsiMeetExternalAPI(domain, options);
        jitsiApiRef.current = api;
        setIsInitialized(true);
        console.log('[Jitsi] External API initialized successfully');

        // Hide loading when ready
        api.addEventListener('videoConferenceJoined', () => {
          console.log('[Jitsi] User joined conference');
          setIsLoading(false);
        });

        // Fallback: Hide loading after 5 seconds if event doesn't fire
        setTimeout(() => {
          setIsLoading(false);
        }, 5000);

        // Handle when user leaves the meeting
        api.addEventListener('readyToClose', async () => {
          console.log('[Jitsi] User left the meeting');
          setHasLeft(true);
          
          // End the meeting in the backend
          if (onEndMeeting && meeting?.id) {
            try {
              await onEndMeeting(meeting.id);
            } catch (error) {
              console.error('[Jitsi] Failed to end meeting:', error);
            }
          }
          
          // Refresh meeting list
          await onRefresh?.();
          
          // Close the meeting room
          onClose();
        });

        // Handle errors
        api.addEventListener('errorOccurred', (error: any) => {
          console.error('[Jitsi] Error:', error);
        });

      } catch (error) {
        console.error('[Jitsi] Failed to initialize External API, falling back to iframe:', error);
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
          console.warn('[Jitsi] Error disposing API:', e);
        }
        jitsiApiRef.current = null;
      }
    };
  }, [open, meeting, currentUserName, hasLeft, isInitialized, onClose, onRefresh, onEndMeeting]);

  const handleManualClose = async () => {
    setHasLeft(true);
    setIsInitialized(false); // Reset for next time
    
    // Dispose Jitsi API
    if (jitsiApiRef.current) {
      try {
        jitsiApiRef.current.dispose();
      } catch (e) {
        console.warn('[Jitsi] Error disposing API:', e);
      }
      jitsiApiRef.current = null;
    }
    
    // End the meeting in the backend
    if (onEndMeeting && meeting?.id) {
      try {
        await onEndMeeting(meeting.id);
      } catch (error) {
        console.error('[Meeting] Failed to end meeting:', error);
      }
    }
    
    // Refresh meeting list
    await onRefresh?.();
    
    // Close the meeting room
    onClose();
  };

  if (!open) return null;

  const roomUrl = `https://meet.jit.si/${meeting?.id || 'test'}#config.prejoinPageEnabled=false&config.requireDisplayName=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&userInfo.displayName="${encodeURIComponent(currentUserName || 'User')}"&userInfo.email=""`;

  return (
    <div className="fixed inset-0 z-[100] bg-[#0b141a] flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white text-lg font-semibold">
              {meeting?.title || "Meeting"}
            </h2>
            <p className="text-gray-300 text-sm">
              Powered by Jitsi Meet
            </p>
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
      {isLoading && !useIframe && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0b141a] z-10">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-[#00a884] animate-spin mx-auto mb-4" />
            <p className="text-white text-lg font-medium">Joining meeting...</p>
            <p className="text-gray-400 text-sm mt-2">Please wait</p>
          </div>
        </div>
      )}

      {/* Jitsi container (External API) */}
      {!useIframe && (
        <div 
          ref={containerRef}
          className="flex-1 mt-[60px]"
          style={{ width: '100%', height: 'calc(100% - 60px)' }}
        />
      )}

      {/* Fallback: Jitsi iframe */}
      {useIframe && (
        <iframe
          ref={iframeRef}
          src={roomUrl}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="flex-1 mt-[60px] w-full border-none"
          style={{ height: 'calc(100% - 60px)' }}
        />
      )}
    </div>
  );
}
