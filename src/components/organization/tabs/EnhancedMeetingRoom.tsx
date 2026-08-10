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
  MonitorOff,
  Users,
  Grid3x3,
  User,
  Settings,
  MessageSquare,
  MoreVertical,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
} from "lucide-react";

type EnhancedMeetingRoomProps = {
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
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export default function EnhancedMeetingRoom({
  open,
  meeting,
  organizationId,
  teamId,
  currentUserId,
  members = [],
  onClose,
  onRefresh,
}: EnhancedMeetingRoomProps) {
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
  const [showChat, setShowChat] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);

  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const socketRef = useRef<any>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const leftRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Grid layout calculation
  const gridCols = useMemo(() => {
    if (viewMode === "speaker") return 1;
    if (totalParticipants <= 1) return 1;
    if (totalParticipants <= 4) return 2;
    if (totalParticipants <= 9) return 3;
    return 4;
  }, [totalParticipants, viewMode]);

  useEffect(() => {
    if (!open || !meeting?.id || !organizationId || !teamId || !currentUserId)
      return;

    leftRef.current = false;
    let mounted = true;

    const removePeer = (userId: string) => {
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
      if (peersRef.current.has(userId)) return peersRef.current.get(userId)!;

      const pc = new RTCPeerConnection(rtcConfig);
      peersRef.current.set(userId, pc);

      pc.onicecandidate = (e) => {
        if (e.candidate && socketRef.current) {
          socketRef.current.emit("meeting:ice-candidate", {
            meeting_id: meeting.id,
            target_user_id: userId,
            candidate: e.candidate,
          });
        }
      };

      pc.ontrack = (e) => {
        if (e.streams && e.streams[0]) {
          setRemoteStreams((prev) => ({ ...prev, [userId]: e.streams[0] }));
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "closed") {
          removePeer(userId);
        }
      };

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      if (initiator) {
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer))
          .then(() => {
            if (socketRef.current && pc.localDescription) {
              socketRef.current.emit("meeting:offer", {
                meeting_id: meeting.id,
                target_user_id: userId,
                offer: pc.localDescription,
              });
            }
          })
          .catch((err) => console.error("Create offer error:", err));
      }

      return pc;
    };

    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: isVideo ? { width: 1280, height: 720 } : false,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        if (!mounted || leftRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        setLocalStream(stream);
      } catch (err: any) {
        console.error("Media error:", err);
        setError(err?.message || "Failed to access camera/microphone");
      }
    };

    const socket = getSocket();
    socketRef.current = socket;

    socket.emit("meeting:join", {
      meeting_id: meeting.id,
      organization_id: organizationId,
      team_id: teamId,
    });

    socket.on("meeting:user-joined", ({ user_id, participants: parts }: any) => {
      if (user_id !== currentUserId) {
        createPeer(user_id, true);
      }
      if (parts) setParticipants(parts);
    });

    socket.on("meeting:user-left", ({ user_id }: any) => {
      removePeer(user_id);
    });

    socket.on(
      "meeting:offer",
      async ({ from_user_id, offer }: any) => {
        const pc = createPeer(from_user_id, false);
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("meeting:answer", {
            meeting_id: meeting.id,
            target_user_id: from_user_id,
            answer: pc.localDescription,
          });
        } catch (err) {
          console.error("Handle offer error:", err);
        }
      },
    );

    socket.on(
      "meeting:answer",
      async ({ from_user_id, answer }: any) => {
        const pc = peersRef.current.get(from_user_id);
        if (pc) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
          } catch (err) {
            console.error("Handle answer error:", err);
          }
        }
      },
    );

    socket.on(
      "meeting:ice-candidate",
      async ({ from_user_id, candidate }: any) => {
        const pc = peersRef.current.get(from_user_id);
        if (pc) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error("Add ICE candidate error:", err);
          }
        }
      },
    );

    socket.on("meeting:ended", () => {
      handleLeave();
    });

    initMedia();

    return () => {
      mounted = false;
      leftRef.current = true;
      socket.off("meeting:user-joined");
      socket.off("meeting:user-left");
      socket.off("meeting:offer");
      socket.off("meeting:answer");
      socket.off("meeting:ice-candidate");
      socket.off("meeting:ended");

      peersRef.current.forEach((pc) => {
        try {
          pc.close();
        } catch {}
      });
      peersRef.current.clear();

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      if (screenStreamRef.current) {
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
          video: { cursor: "always" },
          audio: false,
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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (!open) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-[#0b141a] flex flex-col"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-4">
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
              onClick={() => setViewMode(viewMode === "grid" ? "speaker" : "grid")}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
              title={viewMode === "grid" ? "Speaker View" : "Grid View"}
            >
              {viewMode === "grid" ? (
                <User className="w-5 h-5" />
              ) : (
                <Grid3x3 className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5" />
              ) : (
                <Maximize className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 relative overflow-hidden">
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-500/10 z-10">
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 max-w-md">
              <p className="text-red-200 text-center">{error}</p>
            </div>
          </div>
        )}

        <div
          className={`h-full p-4 grid gap-4 ${
            viewMode === "grid"
              ? `grid-cols-${gridCols}`
              : "grid-cols-1 grid-rows-[1fr_auto]"
          }`}
        >
          {/* Local Video */}
          <div
            className={`relative bg-[#1a252c] rounded-xl overflow-hidden ${
              viewMode === "speaker" && remoteEntries.length > 0
                ? "row-start-2 h-32"
                : ""
            }`}
          >
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
              className={`relative bg-[#1a252c] rounded-xl overflow-hidden ${
                viewMode === "speaker" && remoteEntries.length > 0
                  ? "row-start-1"
                  : ""
              }`}
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

        {/* Screen Share Overlay */}
        {isScreenSharing && screenStreamRef.current && (
          <div className="absolute inset-0 bg-black/95 flex items-center justify-center z-30">
            <video
              autoPlay
              playsInline
              ref={(el) => {
                if (el && screenStreamRef.current)
                  el.srcObject = screenStreamRef.current;
              }}
              className="max-w-full max-h-full"
            />
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#00a884] px-4 py-2 rounded-lg">
              <span className="text-white font-medium">You're presenting</span>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent p-6">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full transition-all ${
              isMuted
                ? "bg-red-500 hover:bg-red-600"
                : "bg-[#2a3942] hover:bg-[#374045]"
            } text-white`}
            title={isMuted ? "Unmute" : "Mute"}
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
              title={isCameraOff ? "Turn on camera" : "Turn off camera"}
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
            title={isScreenSharing ? "Stop sharing" : "Share screen"}
          >
            {isScreenSharing ? (
              <MonitorOff className="w-6 h-6" />
            ) : (
              <Monitor className="w-6 h-6" />
            )}
          </button>

          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="p-4 rounded-full bg-[#2a3942] hover:bg-[#374045] text-white transition-all relative"
            title="Participants"
          >
            <Users className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 bg-[#00a884] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {totalParticipants}
            </span>
          </button>

          <button
            onClick={() => setShowChat(!showChat)}
            className="p-4 rounded-full bg-[#2a3942] hover:bg-[#374045] text-white transition-all"
            title="Chat"
          >
            <MessageSquare className="w-6 h-6" />
          </button>

          <button
            onClick={handleLeave}
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all ml-4"
            title="Leave meeting"
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
