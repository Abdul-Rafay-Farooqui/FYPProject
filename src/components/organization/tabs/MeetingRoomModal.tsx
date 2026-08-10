"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { OrganizationAPI } from "@/lib/api/organization";
import { getSocket } from "@/lib/socket";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Monitor,
  Users,
  Grid3x3,
  User,
} from "lucide-react";

type MeetingRoomModalProps = {
  open: boolean;
  meeting: any;
  organizationId: string;
  teamId: string;
  currentUserId?: string;
  members?: any[];
  onClose: () => void;
  onRefresh?: () => Promise<void> | void;
};

const rtcConfig: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function MeetingRoomModal({
  open,
  meeting,
  organizationId,
  teamId,
  currentUserId,
  members = [],
  onClose,
  onRefresh,
}: MeetingRoomModalProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<
    Record<string, MediaStream>
  >({});
  const [error, setError] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "speaker">("grid");
  const [showParticipants, setShowParticipants] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const socketRef = useRef<any>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const leftRef = useRef(false);
  const initMediaRef = useRef<(() => Promise<void>) | null>(null);

  const isVideo = (meeting?.call_type || "video") === "video";
  const remoteEntries = useMemo(
    () => Object.entries(remoteStreams),
    [remoteStreams],
  );

  const memberNameById = useMemo(() => {
    const map = new Map<string, string>();
    members.forEach((m: any) => map.set(m.id, m.name || "Member"));
    return map;
  }, [members]);

  const totalParticipants = remoteEntries.length + 1;

  useEffect(() => {
    if (!open || !meeting?.id || !organizationId || !teamId || !currentUserId)
      return;

    leftRef.current = false;
    let mounted = true;

    console.log('[Meeting] Initializing meeting room:', {
      meetingId: meeting.id,
      currentUserId,
      organizationId,
      teamId,
    });

    const removePeer = (userId: string) => {
      console.log('[Meeting] Removing peer:', userId);
      const pc = peersRef.current.get(userId);
      if (pc) {
        try {
          pc.close();
        } catch {}
        peersRef.current.delete(userId);
      }
      setRemoteStreams((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    };

    const createPeer = (userId: string, initiator: boolean) => {
      console.log('[Meeting] Creating peer connection:', { userId, initiator });
      
      if (peersRef.current.has(userId)) {
        console.log('[Meeting] Peer already exists:', userId);
        return peersRef.current.get(userId)!;
      }

      const pc = new RTCPeerConnection(rtcConfig);
      peersRef.current.set(userId, pc);

      pc.onicecandidate = (e) => {
        if (e.candidate && socketRef.current) {
          console.log('[Meeting] Sending ICE candidate to:', userId);
          socketRef.current.emit("meeting:ice-candidate", {
            meeting_id: meeting.id,
            target_user_id: userId,
            candidate: e.candidate,
          });
        }
      };

      pc.ontrack = (e) => {
        console.log('[Meeting] Received track from:', userId, e.streams);
        if (e.streams && e.streams[0]) {
          setRemoteStreams((prev) => {
            console.log('[Meeting] Adding remote stream for:', userId);
            return { ...prev, [userId]: e.streams[0] };
          });
        }
      };

      pc.onconnectionstatechange = () => {
        console.log('[Meeting] Connection state changed:', userId, pc.connectionState);
        if (pc.connectionState === "failed" || pc.connectionState === "closed") {
          removePeer(userId);
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log('[Meeting] ICE connection state:', userId, pc.iceConnectionState);
      };

      // Add local stream tracks to peer connection
      if (localStreamRef.current) {
        console.log('[Meeting] Adding local tracks to peer:', userId);
        localStreamRef.current.getTracks().forEach((track) => {
          if (localStreamRef.current) {
            pc.addTrack(track, localStreamRef.current);
            console.log('[Meeting] Added track:', track.kind);
          }
        });
      } else {
        console.warn('[Meeting] No local stream available when creating peer');
      }

      if (initiator) {
        console.log('[Meeting] Creating offer for:', userId);
        pc.createOffer()
          .then((offer) => {
            console.log('[Meeting] Setting local description for:', userId);
            return pc.setLocalDescription(offer);
          })
          .then(() => {
            if (socketRef.current && pc.localDescription) {
              console.log('[Meeting] Sending offer to:', userId);
              socketRef.current.emit("meeting:offer", {
                meeting_id: meeting.id,
                target_user_id: userId,
                offer: pc.localDescription,
              });
            }
          })
          .catch((err) => console.error('[Meeting] Create offer error:', err));
      }

      return pc;
    };

    const initMedia = async () => {
      try {
        // Try with video and audio first
        let stream: MediaStream | null = null;
        
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: isVideo ? {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user"
            } : false,
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
        } catch (videoErr: any) {
          console.warn("Failed to get video, trying audio only:", videoErr);
          
          // If video fails, try audio only
          if (isVideo) {
            try {
              stream = await navigator.mediaDevices.getUserMedia({
                video: false,
                audio: {
                  echoCancellation: true,
                  noiseSuppression: true,
                  autoGainControl: true,
                },
              });
              setIsCameraOff(true);
              console.log("Audio-only mode enabled");
            } catch (audioErr: any) {
              console.error("Failed to get audio:", audioErr);
              throw audioErr;
            }
          } else {
            throw videoErr;
          }
        }
        
        if (!mounted || leftRef.current) {
          stream?.getTracks().forEach((t) => t.stop());
          return;
        }
        
        if (stream) {
          localStreamRef.current = stream;
          setLocalStream(stream);
          setError(""); // Clear any previous errors
        }
      } catch (err: any) {
        console.error("Media error:", err);
        let errorMessage = "Failed to access camera/microphone";
        
        if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          errorMessage = "No camera or microphone found. Please connect a device and refresh.";
        } else if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          errorMessage = "Camera/microphone access denied. Please allow permissions in your browser settings.";
        } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
          errorMessage = "Camera/microphone is already in use by another application.";
        } else if (err.name === "OverconstrainedError") {
          errorMessage = "Camera/microphone doesn't meet requirements. Trying with default settings...";
          
          // Try again with minimal constraints
          try {
            const fallbackStream = await navigator.mediaDevices.getUserMedia({
              video: isVideo ? true : false,
              audio: true,
            });
            
            if (!mounted || leftRef.current) {
              fallbackStream.getTracks().forEach((t) => t.stop());
              return;
            }
            
            localStreamRef.current = fallbackStream;
            setLocalStream(fallbackStream);
            setError("");
            return;
          } catch (fallbackErr) {
            console.error("Fallback also failed:", fallbackErr);
          }
        } else if (err.name === "TypeError") {
          errorMessage = "Browser doesn't support camera/microphone access. Please use a modern browser.";
        }
        
        setError(errorMessage);
      }
    };

    // Store initMedia in ref for retry button
    initMediaRef.current = initMedia;

    const socket = getSocket();
    socketRef.current = socket;

    console.log('[Meeting] Socket connected:', socket.connected);
    console.log('[Meeting] Joining meeting:', meeting.id);

    socket.emit("meeting:join", {
      meeting_id: meeting.id,
      organization_id: organizationId,
      team_id: teamId,
    });

    socket.on("meeting:user-joined", ({ user_id, participants }: any) => {
      console.log('[Meeting] User joined:', user_id, 'Current user:', currentUserId);
      console.log('[Meeting] All participants:', participants);
      
      if (user_id !== currentUserId) {
        // Wait a bit for the other user to set up their stream
        setTimeout(() => {
          createPeer(user_id, true);
        }, 1000);
      }
    });

    socket.on("meeting:user-left", ({ user_id }: any) => {
      console.log('[Meeting] User left:', user_id);
      removePeer(user_id);
    });

    socket.on(
      "meeting:offer",
      async ({ from_user_id, offer }: any) => {
        console.log('[Meeting] Received offer from:', from_user_id);
        const pc = createPeer(from_user_id, false);
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          console.log('[Meeting] Set remote description, creating answer');
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          console.log('[Meeting] Sending answer to:', from_user_id);
          socket.emit("meeting:answer", {
            meeting_id: meeting.id,
            target_user_id: from_user_id,
            answer: pc.localDescription,
          });
        } catch (err) {
          console.error('[Meeting] Handle offer error:', err);
        }
      },
    );

    socket.on(
      "meeting:answer",
      async ({ from_user_id, answer }: any) => {
        console.log('[Meeting] Received answer from:', from_user_id);
        const pc = peersRef.current.get(from_user_id);
        if (pc) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            console.log('[Meeting] Set remote description from answer');
          } catch (err) {
            console.error('[Meeting] Handle answer error:', err);
          }
        } else {
          console.warn('[Meeting] No peer connection found for:', from_user_id);
        }
      },
    );

    socket.on(
      "meeting:ice-candidate",
      async ({ from_user_id, candidate }: any) => {
        console.log('[Meeting] Received ICE candidate from:', from_user_id);
        const pc = peersRef.current.get(from_user_id);
        if (pc) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
            console.log('[Meeting] Added ICE candidate');
          } catch (err) {
            console.error('[Meeting] Add ICE candidate error:', err);
          }
        } else {
          console.warn('[Meeting] No peer connection for ICE candidate from:', from_user_id);
        }
      },
    );

    socket.on("meeting:ended", () => {
      console.log('[Meeting] Meeting ended by host');
      handleLeave();
    });

    // Request existing participants
    socket.emit("meeting:get-participants", {
      meeting_id: meeting.id,
    });

    socket.on("meeting:participants", ({ participants }: any) => {
      console.log('[Meeting] Received participants list:', participants);
      if (participants && Array.isArray(participants)) {
        participants.forEach((participant: any) => {
          if (participant.user_id !== currentUserId) {
            console.log('[Meeting] Creating peer for existing participant:', participant.user_id);
            setTimeout(() => {
              createPeer(participant.user_id, true);
            }, 1000);
          }
        });
      }
    });

    initMedia();

    return () => {
      mounted = false;
      leftRef.current = true;
      console.log('[Meeting] Cleaning up meeting room');
      
      socket.off("meeting:user-joined");
      socket.off("meeting:user-left");
      socket.off("meeting:offer");
      socket.off("meeting:answer");
      socket.off("meeting:ice-candidate");
      socket.off("meeting:ended");
      socket.off("meeting:participants");

      peersRef.current.forEach((pc, userId) => {
        console.log('[Meeting] Closing peer connection:', userId);
        try {
          pc.close();
        } catch {}
      });
      peersRef.current.clear();

      if (localStreamRef.current) {
        console.log('[Meeting] Stopping local stream');
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      if (screenStreamRef.current) {
        console.log('[Meeting] Stopping screen stream');
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
    };
  }, [open, meeting?.id, organizationId, teamId, currentUserId, isVideo]);

  const handleLeave = () => {
    leftRef.current = true;
    if (socketRef.current) {
      socketRef.current.emit("meeting:leave", { meeting_id: meeting?.id });
    }
    onClose();
    onRefresh?.();
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
      });
    }
    setIsMuted(!isMuted);
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = isCameraOff;
      });
    }
    setIsCameraOff(!isCameraOff);
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        screenStreamRef.current = screenStream;
        setIsScreenSharing(true);

        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          screenStreamRef.current = null;
        };
      } catch (err) {
        console.error("Screen share error:", err);
      }
    }
  };

  if (!open) return null;

  const gridCols =
    viewMode === "speaker"
      ? 1
      : totalParticipants <= 1
      ? 1
      : totalParticipants <= 4
      ? 2
      : totalParticipants <= 9
      ? 3
      : 4;

  return (
    <div className="fixed inset-0 z-[100] bg-[#0b141a] flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/60 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white text-lg font-semibold">
              {meeting?.title || "Meeting"}
            </h2>
            <p className="text-gray-300 text-sm">
              {totalParticipants} participant{totalParticipants !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs transition-all"
            >
              Debug
            </button>
            <button
              onClick={() => setViewMode(viewMode === "grid" ? "speaker" : "grid")}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
            >
              {viewMode === "grid" ? (
                <User className="w-5 h-5" />
              ) : (
                <Grid3x3 className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Debug Panel */}
      {showDebug && (
        <div className="absolute top-20 right-4 bg-black/90 border border-white/20 rounded-lg p-4 max-w-md z-30 text-xs text-white font-mono">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold">Debug Info</h3>
            <button onClick={() => setShowDebug(false)} className="text-white/60 hover:text-white">×</button>
          </div>
          <div className="space-y-1">
            <div>Meeting ID: {meeting?.id}</div>
            <div>Current User: {currentUserId}</div>
            <div>Local Stream: {localStream ? '✅' : '❌'}</div>
            <div>Socket Connected: {socketRef.current?.connected ? '✅' : '❌'}</div>
            <div>Peers: {peersRef.current.size}</div>
            <div>Remote Streams: {Object.keys(remoteStreams).length}</div>
            <div className="mt-2 pt-2 border-t border-white/20">
              <div className="font-bold mb-1">Peer Connections:</div>
              {Array.from(peersRef.current.entries()).map(([userId, pc]) => (
                <div key={userId} className="ml-2">
                  {userId.substring(0, 8)}...: {pc.connectionState}
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-white/20">
              <div className="font-bold mb-1">Remote Streams:</div>
              {Object.keys(remoteStreams).map((userId) => (
                <div key={userId} className="ml-2">
                  {userId.substring(0, 8)}...: ✅
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Video Area */}
      <div className="flex-1 relative overflow-hidden">
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0b141a]/95 z-10 p-4">
            <div className="bg-red-500/20 border-2 border-red-500 rounded-xl p-6 max-w-md text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <VideoOff className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-red-200 font-semibold text-lg mb-2">Media Access Error</h3>
              <p className="text-red-200/80 text-sm mb-4">{error}</p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => {
                    setError("");
                    initMediaRef.current?.();
                  }}
                  className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-all"
                >
                  Retry
                </button>
                <button
                  onClick={handleLeave}
                  className="px-4 py-2 rounded-lg bg-[#2a3942] hover:bg-[#374045] text-[#e9edef] font-medium transition-all"
                >
                  Leave Meeting
                </button>
              </div>
              <p className="text-red-200/60 text-xs mt-4">
                💡 Tip: Check browser permissions, close other apps using camera/mic, or try refreshing the page
              </p>
            </div>
          </div>
        )}

        <div
          className={`h-full p-4 grid gap-4`}
          style={{
            gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
          }}
        >
          {/* Local Video */}
          <div className="relative bg-[#1a252c] rounded-xl overflow-hidden">
            {localStream && !isCameraOff && isVideo ? (
              <video
                autoPlay
                playsInline
                muted
                ref={(el) => {
                  if (el && localStream) el.srcObject = localStream;
                }}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-[#00a884] flex items-center justify-center">
                  <span className="text-white text-3xl font-bold">
                    {currentUserId?.[0]?.toUpperCase() || "Y"}
                  </span>
                </div>
              </div>
            )}
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg">
              <span className="text-white text-sm font-medium">You</span>
            </div>
            {isMuted && (
              <div className="absolute top-3 right-3 bg-red-500 p-2 rounded-full">
                <MicOff className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          {/* Remote Videos */}
          {remoteEntries.map(([userId, stream]) => (
            <div
              key={userId}
              className="relative bg-[#1a252c] rounded-xl overflow-hidden"
            >
              <video
                autoPlay
                playsInline
                ref={(el) => {
                  if (el && stream) el.srcObject = stream;
                }}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                <span className="text-white text-sm font-medium">
                  {memberNameById.get(userId) || "Participant"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/60 to-transparent p-6">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full transition-all ${
              isMuted
                ? "bg-red-500 hover:bg-red-600"
                : "bg-[#2a3942] hover:bg-[#374045]"
            } text-white`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          {isVideo && (
            <button
              onClick={toggleCamera}
              className={`p-4 rounded-full transition-all ${
                isCameraOff
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-[#2a3942] hover:bg-[#374045]"
              } text-white`}
            >
              {isCameraOff ? (
                <VideoOff className="w-6 h-6" />
              ) : (
                <Video className="w-6 h-6" />
              )}
            </button>
          )}

          <button
            onClick={toggleScreenShare}
            className={`p-4 rounded-full transition-all ${
              isScreenSharing
                ? "bg-[#00a884] hover:bg-[#00ba95]"
                : "bg-[#2a3942] hover:bg-[#374045]"
            } text-white`}
          >
            <Monitor className="w-6 h-6" />
          </button>

          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="p-4 rounded-full bg-[#2a3942] hover:bg-[#374045] text-white transition-all relative"
          >
            <Users className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 bg-[#00a884] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {totalParticipants}
            </span>
          </button>

          <button
            onClick={handleLeave}
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all ml-4"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Participants Panel */}
      {showParticipants && (
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-[#111b21] border-l border-[#222d34] z-30 flex flex-col">
          <div className="p-4 border-b border-[#222d34] flex items-center justify-between">
            <h3 className="text-[#e9edef] font-semibold">
              Participants ({totalParticipants})
            </h3>
            <button
              onClick={() => setShowParticipants(false)}
              className="p-1 rounded hover:bg-[#202c33] text-[#8696a0]"
            >
              ×
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-[#202c33]">
              <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center">
                <span className="text-white font-semibold">
                  {currentUserId?.[0]?.toUpperCase() || "Y"}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-[#e9edef] font-medium">You</p>
                <p className="text-[#8696a0] text-xs">Host</p>
              </div>
              {isMuted && <MicOff className="w-4 h-4 text-red-500" />}
            </div>
            {remoteEntries.map(([userId]) => (
              <div
                key={userId}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#202c33]"
              >
                <div className="w-10 h-10 rounded-full bg-[#2a3942] flex items-center justify-center">
                  <span className="text-[#e9edef] font-semibold">
                    {memberNameById.get(userId)?.[0]?.toUpperCase() || "P"}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-[#e9edef] font-medium">
                    {memberNameById.get(userId) || "Participant"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
