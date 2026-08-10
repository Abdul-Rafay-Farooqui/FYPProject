"use client";

import { useState, useEffect, useRef } from "react";
import { CallsAPI } from "@/lib/api/endpoints";
import { useAuthStore } from "@/store/authStore";
import { useCallStore } from "@/store/callStore";
import { Phone, Video, Mic, MicOff, VideoOff, PhoneOff } from "lucide-react";

export default function CallModal() {
  const { activeCall, setActiveCall } = useCallStore();
  const { user } = useAuthStore();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let timerInterval: ReturnType<typeof setInterval>;
    if (activeCall && user) {
      timerInterval = setInterval(
        () => setCallDuration((d: number) => d + 1),
        1000,
      );

      // Request camera and microphone access
      navigator.mediaDevices
        .getUserMedia({
          video: activeCall.type === "video",
          audio: true,
        })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.error("Failed to get media devices:", err);
        });
    }

    return () => {
      clearInterval(timerInterval);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [activeCall?.id, user]);

  if (!activeCall) return null;

  const formatDuration = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleEndCall = async () => {
    try {
      await CallsAPI.end(activeCall.id, callDuration);
    } catch (e) {
      console.error("End call error:", e);
    }
    setActiveCall(null);
  };

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((t) => (t.enabled = isMuted));
    }
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      streamRef.current
        .getVideoTracks()
        .forEach((t) => (t.enabled = isVideoOff));
    }
    setIsVideoOff(!isVideoOff);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0b141a] flex flex-col items-center justify-center overflow-y-auto custom-scrollbar">
      <div className="absolute top-10 text-center z-10">
        <h2 className="text-[#e9edef] text-2xl font-bold mb-1">
          {activeCall.type === "video" ? "Video Call" : "Voice Call"}
        </h2>
        <p className="text-[#8696a0] text-lg">{formatDuration(callDuration)}</p>
      </div>

      <div className="relative w-full h-full sm:max-w-4xl sm:aspect-video sm:h-auto bg-black sm:rounded-xl overflow-hidden shadow-2xl">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${activeCall.type === "video" && !isVideoOff ? "block" : "hidden"}`}
        />

        {(!streamRef.current ||
          (activeCall.type === "video" && isVideoOff) ||
          activeCall.type === "voice") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111b21]">
            <div className="w-48 h-48 bg-[#2a3942] rounded-full flex items-center justify-center animate-pulse mb-8">
              {activeCall.type === "video" ? (
                <Video className="w-24 h-24 text-[#00a884]" />
              ) : (
                <Phone className="w-24 h-24 text-[#00a884]" />
              )}
            </div>
            {!streamRef.current && (
              <p className="text-[#8696a0]">
                Requesting camera and microphone access...
              </p>
            )}
          </div>
        )}
      </div>

      <div className="absolute bottom-10 flex items-center gap-6">
        <button
          onClick={toggleMute}
          className={`p-4 rounded-full transition-colors ${
            isMuted
              ? "bg-red-500 text-white"
              : "bg-[#2a3942] text-[#e9edef] hover:bg-[#374045]"
          }`}
        >
          {isMuted ? <MicOff /> : <Mic />}
        </button>

        {activeCall.type === "video" && (
          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full transition-colors ${
              isVideoOff
                ? "bg-red-500 text-white"
                : "bg-[#2a3942] text-[#e9edef] hover:bg-[#374045]"
            }`}
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
