"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { CallsAPI } from "@/lib/api/endpoints";
import { UsersAPI } from "@/lib/api/endpoints";
import { useAuthStore } from "@/store/authStore";
import { useCallStore } from "@/store/callStore";
import { getSocket } from "@/lib/socket";
import { Phone, Video, Mic, MicOff, VideoOff, PhoneOff } from "lucide-react";

const rtcConfig: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    // Free TURN servers for NAT traversal in production
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
  iceCandidatePoolSize: 10,
};

export default function CallModal() {
  const { activeCall, setActiveCall } = useCallStore();
  const { user } = useAuthStore();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [otherName, setOtherName] = useState<string>("");
  const [otherAvatar, setOtherAvatar] = useState<string | null>(null);
  const [localStreamReady, setLocalStreamReady] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const pendingOfferRef = useRef<any | null>(null);
  const offerSentRef = useRef(false);

  // Resolve the other party's display name
  useEffect(() => {
    if (!activeCall || !user) return;

    const isCallee = activeCall.callee_id === user.id;
    const otherId = isCallee ? activeCall.caller_id : activeCall.callee_id;

    // Try embedded data first
    const embedded = isCallee
      ? (activeCall as any).caller
      : (activeCall as any).callee;

    if (embedded?.display_name) {
      setOtherName(embedded.display_name);
      setOtherAvatar(embedded.avatar_url ?? null);
      return;
    }

    // Fall back to API fetch
    if (otherId) {
      UsersAPI.getById(otherId)
        .then((u: any) => {
          setOtherName(u.display_name || "");
          setOtherAvatar(u.avatar_url ?? null);
        })
        .catch(() => {});
    }
  }, [activeCall?.id, user?.id]);

  const getOtherUserId = useCallback(() => {
    if (!activeCall || !user) return null;
    return activeCall.callee_id === user.id
      ? activeCall.caller_id
      : activeCall.callee_id;
  }, [activeCall, user]);

  const closePeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.onicecandidate = null;
        peerConnectionRef.current.ontrack = null;
        peerConnectionRef.current.onconnectionstatechange = null;
        peerConnectionRef.current.close();
      } catch {}
      peerConnectionRef.current = null;
    }
    pendingOfferRef.current = null;
    offerSentRef.current = false;
    setLocalStreamReady(false);
    setRemoteStream(null);
  }, []);

  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) return peerConnectionRef.current;

    const pc = new RTCPeerConnection(rtcConfig);
    peerConnectionRef.current = pc;

    pc.onicecandidate = (event) => {
      if (!event.candidate || !activeCall || !user) return;
      const otherUserId = getOtherUserId();
      if (!otherUserId) return;

      getSocket().emit("call:signal", {
        to: otherUserId,
        payload: {
          call_id: activeCall.id,
          type: "ice-candidate",
          candidate: event.candidate,
        },
      });
    };

    pc.ontrack = (event) => {
      if (event.streams?.[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      if (["failed", "disconnected", "closed"].includes(pc.connectionState)) {
        setActiveCall(null);
      }
    };

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, streamRef.current as MediaStream);
      });
    }

    return pc;
  }, [activeCall, getOtherUserId, setActiveCall, user]);

  const sendOffer = useCallback(async () => {
    if (!activeCall || !user || offerSentRef.current) return;
    const otherUserId = getOtherUserId();
    if (!otherUserId) return;

    const pc = createPeerConnection();
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    getSocket().emit("call:signal", {
      to: otherUserId,
      payload: {
        call_id: activeCall.id,
        type: "offer",
        sdp: pc.localDescription,
      },
    });

    offerSentRef.current = true;
  }, [activeCall, createPeerConnection, getOtherUserId, user]);

  const handleOffer = useCallback(
    async (offer: any) => {
      if (!activeCall || !user) return;
      const otherUserId = getOtherUserId();
      if (!otherUserId) return;

      const pc = createPeerConnection();
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      getSocket().emit("call:signal", {
        to: otherUserId,
        payload: {
          call_id: activeCall.id,
          type: "answer",
          sdp: pc.localDescription,
        },
      });
    },
    [activeCall, createPeerConnection, getOtherUserId, user],
  );

  // Timer + media
  useEffect(() => {
    let timerInterval: ReturnType<typeof setInterval>;
    let mounted = true;
    closePeerConnection();

    if (activeCall && user) {
      timerInterval = setInterval(() => setCallDuration((d) => d + 1), 1000);

      const isVideo = activeCall.type === "video";

      // Try to get media with graceful fallbacks:
      // 1. video + audio  2. audio only  3. no media (proceed anyway)
      const acquireStream = async (): Promise<MediaStream | null> => {
        if (isVideo) {
          try {
            return await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          } catch {
            // camera unavailable or denied — fall through to audio only
          }
        }
        try {
          return await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        } catch {
          // mic also unavailable — proceed with no local media
          return null;
        }
      };

      acquireStream().then((stream) => {
        if (!mounted) {
          stream?.getTracks().forEach((track) => track.stop());
          return;
        }

        if (stream) {
          streamRef.current = stream;
          if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        }
        // Mark ready regardless — even with no stream we can receive remote media
        setLocalStreamReady(true);

        createPeerConnection();

        if (pendingOfferRef.current) {
          const pendingOffer = pendingOfferRef.current;
          pendingOfferRef.current = null;
          handleOffer(pendingOffer).catch((err) => {
            console.error("Call answer error:", err);
          });
        } else if (user.id === activeCall.caller_id) {
          sendOffer().catch((err) => {
            console.error("Call offer error:", err);
          });
        }
      });
    }
    return () => {
      mounted = false;
      clearInterval(timerInterval);
      closePeerConnection();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setLocalStreamReady(false);
      if (localVideoRef.current) localVideoRef.current.srcObject = null;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    };
  }, [
    activeCall?.id,
    activeCall?.type,
    activeCall?.caller_id,
    closePeerConnection,
    createPeerConnection,
    handleOffer,
    sendOffer,
    user,
  ]);

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (localVideoRef.current && streamRef.current) {
      localVideoRef.current.srcObject = streamRef.current;
    }
  }, [localStreamReady]);

  useEffect(() => {
    if (!activeCall) return;

    const socket = getSocket();
    const onSignal = (data: any) => {
      if (!data || data.from === user?.id) return;
      const payload = data.payload;
      if (!payload || payload.call_id !== activeCall.id) return;

      if (payload.type === "offer") {
        if (!streamRef.current) {
          pendingOfferRef.current = payload.sdp;
          return;
        }
        handleOffer(payload.sdp).catch((err) => {
          console.error("Call offer handling error:", err);
        });
      }

      if (payload.type === "answer") {
        const pc = peerConnectionRef.current;
        if (pc && payload.sdp) {
          pc.setRemoteDescription(new RTCSessionDescription(payload.sdp)).catch(
            (err) => console.error("Call answer handling error:", err),
          );
        }
      }

      if (payload.type === "ice-candidate") {
        const pc = peerConnectionRef.current;
        if (pc && payload.candidate) {
          pc.addIceCandidate(new RTCIceCandidate(payload.candidate)).catch(
            (err) => console.error("ICE candidate error:", err),
          );
        }
      }
    };

    socket.on("call:signal", onSignal);
    return () => {
      socket.off("call:signal", onSignal);
    };
  }, [activeCall, handleOffer, user?.id]);

  // Listen for remote end/decline
  useEffect(() => {
    if (!activeCall) return;
    const socket = getSocket();
    const onUpdate = (call: any) => {
      if (
        call?.id === activeCall.id &&
        ["ended", "declined", "missed", "failed"].includes(call?.status)
      ) {
        closePeerConnection();
        setActiveCall(null);
      }
    };
    socket.on("call:update", onUpdate);
    return () => {
      socket.off("call:update", onUpdate);
    };
  }, [activeCall?.id, closePeerConnection, setActiveCall]);

  if (!activeCall) return null;

  const formatDuration = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleEndCall = async () => {
    try {
      await CallsAPI.end(activeCall.id, callDuration);
    } catch (e) {
      console.error(e);
    }
    closePeerConnection();
    setActiveCall(null);
  };

  const toggleMute = () => {
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = isMuted));
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    streamRef.current
      ?.getVideoTracks()
      .forEach((t) => (t.enabled = isVideoOff));
    setIsVideoOff(!isVideoOff);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0b141a] flex flex-col items-center justify-center overflow-y-auto">
      {/* Top: caller info */}
      <div className="absolute top-10 text-center z-10 flex flex-col items-center gap-3">
        {otherAvatar ? (
          <img
            src={otherAvatar}
            alt={otherName}
            className="w-20 h-20 rounded-full object-cover border-4 border-[#00a884]"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-[#2a3942] flex items-center justify-center border-4 border-[#00a884]">
            <span className="text-[#e9edef] text-3xl font-bold">
              {otherName?.[0]?.toUpperCase() || "?"}
            </span>
          </div>
        )}
        <div>
          <h2 className="text-[#e9edef] text-2xl font-bold">
            {otherName || "Calling..."}
          </h2>
          <p className="text-[#8696a0] text-base">
            {formatDuration(callDuration)}
          </p>
        </div>
      </div>

      <div className="relative w-full h-full sm:max-w-4xl sm:aspect-video sm:h-auto bg-black sm:rounded-xl overflow-hidden shadow-2xl">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={`w-full h-full object-cover ${activeCall.type === "video" && remoteStream && !isVideoOff ? "block" : "hidden"}`}
        />
        {activeCall.type === "video" && localStreamReady && (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute right-4 bottom-4 w-40 h-56 sm:w-56 sm:h-80 rounded-2xl object-cover border-2 border-[#00a884] shadow-2xl"
          />
        )}
        {(!remoteStream ||
          activeCall.type === "voice" ||
          (activeCall.type === "video" && isVideoOff)) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111b21]">
            <div className="w-48 h-48 bg-[#2a3942] rounded-full flex items-center justify-center animate-pulse mb-8">
              {activeCall.type === "video" ? (
                <Video className="w-24 h-24 text-[#00a884]" />
              ) : (
                <Phone className="w-24 h-24 text-[#00a884]" />
              )}
            </div>
            {!localStreamReady ? (
              <p className="text-[#8696a0]">Connecting...</p>
            ) : !remoteStream ? (
              <p className="text-[#8696a0]">Waiting for other party...</p>
            ) : null}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-10 flex items-center gap-6">
        <button
          onClick={toggleMute}
          className={`p-4 rounded-full transition-colors ${isMuted ? "bg-red-500 text-white" : "bg-[#2a3942] text-[#e9edef] hover:bg-[#374045]"}`}
        >
          {isMuted ? <MicOff /> : <Mic />}
        </button>
        {activeCall.type === "video" && (
          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full transition-colors ${isVideoOff ? "bg-red-500 text-white" : "bg-[#2a3942] text-[#e9edef] hover:bg-[#374045]"}`}
          >
            {isVideoOff ? <VideoOff /> : <Video />}
          </button>
        )}
        <button
          onClick={handleEndCall}
          className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
        >
          <PhoneOff />
        </button>
      </div>
    </div>
  );
}
