"use client";

import { useEffect, useRef, useState } from "react";
import { Video, Phone, X, Check, User } from "lucide-react";

type IncomingMeetingModalProps = {
  open: boolean;
  meeting: {
    id: string;
    title: string;
    call_type: "video" | "voice";
    started_by_name: string;
    organization_id: string;
    team_id: string;
  } | null;
  onAccept: () => void;
  onReject: () => void;
};

export default function IncomingMeetingModal({
  open,
  meeting,
  onAccept,
  onReject,
}: IncomingMeetingModalProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const ringtoneIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Play ringtone using Web Audio API (no file needed)
  const playRingtone = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Create a pleasant ringtone pattern (two-tone)
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      oscillator.frequency.setValueAtTime(1000, ctx.currentTime + 0.2);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.4);
    } catch (err) {
      console.warn("Could not play ringtone:", err);
    }
  };

  useEffect(() => {
    console.log('[IncomingMeetingModal] open:', open, 'meeting:', meeting);
    
    if (open && meeting) {
      setIsPlaying(true);

      // Play ringtone immediately
      playRingtone();

      // Play ringtone every 1.5 seconds
      ringtoneIntervalRef.current = setInterval(() => {
        playRingtone();
      }, 1500);

      // Auto-reject after 60 seconds
      const timeout = setTimeout(() => {
        onReject();
      }, 60000);

      return () => {
        clearTimeout(timeout);
        if (ringtoneIntervalRef.current) {
          clearInterval(ringtoneIntervalRef.current);
          ringtoneIntervalRef.current = null;
        }
        setIsPlaying(false);
      };
    }
  }, [open, meeting, onReject]);

  const handleAccept = () => {
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
    setIsPlaying(false);
    onAccept();
  };

  const handleReject = () => {
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
    setIsPlaying(false);
    onReject();
  };

  if (!open || !meeting) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#111b21] border-2 border-[#00a884] rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header with pulsing animation */}
        <div className="relative bg-gradient-to-br from-[#00a884] to-[#008069] p-8 text-center">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          
          {/* Pulsing rings */}
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute w-32 h-32 rounded-full bg-white/20 animate-ping" />
            <div className="absolute w-28 h-28 rounded-full bg-white/30 animate-pulse" />
            
            {/* Avatar/Icon */}
            <div className="relative w-24 h-24 rounded-full bg-white/90 flex items-center justify-center shadow-xl">
              {meeting.call_type === "video" ? (
                <Video className="w-12 h-12 text-[#00a884]" />
              ) : (
                <Phone className="w-12 h-12 text-[#00a884]" />
              )}
            </div>
          </div>

          {/* Caller info */}
          <div className="mt-6 relative z-10">
            <h2 className="text-white text-2xl font-bold mb-1">
              {meeting.started_by_name}
            </h2>
            <p className="text-white/90 text-sm">
              Incoming {meeting.call_type === "video" ? "Video" : "Voice"} Call
            </p>
          </div>
        </div>

        {/* Meeting details */}
        <div className="p-6 space-y-4">
          <div className="bg-[#0b141a] rounded-xl p-4 border border-[#2a3942]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#00a884]/20 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-[#00a884]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#e9edef] font-medium truncate">
                  {meeting.title}
                </p>
                <p className="text-[#8696a0] text-sm">Team Meeting</p>
              </div>
            </div>
          </div>

          {/* Ringing indicator */}
          <div className="flex items-center justify-center gap-2 text-[#8696a0] text-sm">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span>Ringing...</span>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            {/* Reject button */}
            <button
              onClick={handleReject}
              className="group relative overflow-hidden bg-red-600 hover:bg-red-700 text-white rounded-2xl p-4 transition-all active:scale-95 shadow-lg hover:shadow-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              <div className="relative flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <X className="w-7 h-7" />
                </div>
                <span className="font-semibold">Decline</span>
              </div>
            </button>

            {/* Accept button */}
            <button
              onClick={handleAccept}
              className="group relative overflow-hidden bg-[#00a884] hover:bg-[#00ba95] text-white rounded-2xl p-4 transition-all active:scale-95 shadow-lg hover:shadow-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              <div className="relative flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Check className="w-7 h-7" />
                </div>
                <span className="font-semibold">Accept</span>
              </div>
            </button>
          </div>

          {/* Auto-reject timer */}
          <p className="text-center text-[#8696a0] text-xs">
            Call will be declined automatically in 60 seconds
          </p>
        </div>
      </div>
    </div>
  );
}
