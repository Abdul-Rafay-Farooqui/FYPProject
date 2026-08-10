"use client";

import { useState, useEffect, useRef } from "react";
import { CallsAPI } from "@/lib/api/endpoints";
import { UsersAPI } from "@/lib/api/endpoints";
import { useAuthStore } from "@/store/authStore";
import { useCallStore } from "@/store/callStore";
import { getSocket } from "@/lib/socket";
import { Phone, Video, Mic, MicOff, VideoOff, PhoneOff } from "lucide-react";

export default function CallModal() {
  const { activeCall, setActiveCall } = useCallStore();
  const { user } = useAuthStore();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [otherName, setOtherName] = useState<string>("");
  const [otherAvatar, setOtherAvatar] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  // Timer + media
  useEffect(() => {
    let timerInterval: ReturnType<typeof setInterval>;
    if (activeCall && user) {
      timerInterval = setInterval(() => setCallDuration((d) => d + 1), 1000);

      navigator.mediaDevices
        .getUserMedia({ video: activeCall.type === "video", audio: true })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) videoRef.current.srcObject = stream;
        })
        .catch((err) => console.error("Media device error:", err));
    }
    return () => {
      clearInterval(timerInterval);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [activeCall?.id, user]);

  // Listen for remote end/decline
  useEffect(() => {
    if (!activeCall) return;
    const socket = getSocket();
    const onUpdate = (call: any) => {
      if (
        call?.id === activeCall.id &&
        ["ended", "declined", "missed", "failed"].includes(call?.status)
      ) {
        setActiveCall(null);
      }
    };
    socket.on("call:update", onUpdate);
    return () => { socket.off("call:update", onUpdate); };
  }, [activeCall?.id, setActiveCall]);

  if (!activeCall) return null;

  const formatDuration = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleEndCall = async () => {
    try { await CallsAPI.end(activeCall.id, callDuration); } catch (e) { console.error(e); }
    setActiveCall(null);
  };

  const toggleMute = () => {
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = isMuted));
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    streamRef.current?.getVideoTracks().forEach((t) => (t.enabled = isVideoOff));
    setIsVideoOff(!isVideoOff);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0b141a] flex flex-col items-center justify-center overflow-y-auto">
      {/* Top: caller info */}
      <div className="absolute top-10 text-center z-10 flex flex-col items-center gap-3">
        {otherAvatar ? (
          <img src={otherAvatar} alt={otherName} className="w-20 h-20 rounded-full object-cover border-4 border-[#00a884]" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-[#2a3942] flex items-center justify-center border-4 border-[#00a884]">
            <span className="text-[#e9edef] text-3xl font-bold">{otherName?.[0]?.toUpperCase() || "?"}</span>
          </div>
        )}
        <div>
          <h2 className="text-[#e9edef] text-2xl font-bold">{otherName || "Calling..."}</h2>
          <p className="text-[#8696a0] text-base">{formatDuration(callDuration)}</p>
        </div>
      </div>

      <div className="relative w-full h-full sm:max-w-4xl sm:aspect-video sm:h-auto bg-black sm:rounded-xl overflow-hidden shadow-2xl">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${activeCall.type === "video" && !isVideoOff ? "block" : "hidden"}`}
        />
        {(!streamRef.current || activeCall.type === "voice" || (activeCall.type === "video" && isVideoOff)) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111b21]">
            <div className="w-48 h-48 bg-[#2a3942] rounded-full flex items-center justify-center animate-pulse mb-8">
              {activeCall.type === "video" ? (
                <Video className="w-24 h-24 text-[#00a884]" />
              ) : (
                <Phone className="w-24 h-24 text-[#00a884]" />
              )}
            </div>
            {!streamRef.current && (
              <p className="text-[#8696a0]">Requesting media access...</p>
            )}
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
        <button onClick={handleEndCall} className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors">
          <PhoneOff />
        </button>
      </div>
    </div>
  );
}