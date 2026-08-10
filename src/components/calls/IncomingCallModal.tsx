'use client';

import { useEffect, useRef, useCallback } from 'react';
import { CallsAPI } from '@/lib/api/endpoints';
import { useCallStore } from '@/store/callStore';
import { Phone, Video, PhoneOff, Check } from 'lucide-react';

export default function IncomingCallModal() {
  const { incomingCall, setIncomingCall, setActiveCall } = useCallStore();
  const ringtoneRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const stopRingtone = () => {
    if (ringtoneRef.current) {
      clearInterval(ringtoneRef.current);
      ringtoneRef.current = null;
    }
  };

  const playRingtone = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.2);
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
  };

  const handleDecline = useCallback(async () => {
    if (!incomingCall) return;
    stopRingtone();
    try { await CallsAPI.updateStatus(incomingCall.id, 'declined'); } catch {}
    setIncomingCall(null);
  }, [incomingCall, setIncomingCall]);

  const handleAccept = async () => {
    if (!incomingCall) return;
    stopRingtone();
    try { await CallsAPI.accept(incomingCall.id); } catch {}
    setActiveCall(incomingCall);
    setIncomingCall(null);
  };

  useEffect(() => {
    if (!incomingCall) return;
    playRingtone();
    ringtoneRef.current = setInterval(playRingtone, 1500);
    const timer = setTimeout(() => handleDecline(), 30000);
    return () => { stopRingtone(); clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingCall?.id]);

  if (!incomingCall) return null;

  const caller = (incomingCall as any).caller;
  const callerName = caller?.display_name || 'Unknown Caller';
  const callerAvatar = caller?.avatar_url;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111b21] border-2 border-[#00a884] rounded-3xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="relative bg-gradient-to-br from-[#00a884] to-[#008069] p-8 text-center">
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute w-32 h-32 rounded-full bg-white/20 animate-ping" />
            <div className="absolute w-28 h-28 rounded-full bg-white/30 animate-pulse" />
            {callerAvatar ? (
              <img src={callerAvatar} alt={callerName} className="relative w-24 h-24 rounded-full object-cover border-4 border-white/50 shadow-xl" />
            ) : (
              <div className="relative w-24 h-24 rounded-full bg-white/90 flex items-center justify-center shadow-xl">
                <span className="text-[#00a884] text-4xl font-bold">{callerName[0]?.toUpperCase()}</span>
              </div>
            )}
          </div>
          <div className="mt-6 relative z-10">
            <h2 className="text-white text-2xl font-bold mb-1">{callerName}</h2>
            <p className="text-white/90 text-sm flex items-center justify-center gap-2">
              {incomingCall.type === 'video' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
              Incoming {incomingCall.type === 'video' ? 'Video' : 'Voice'} Call
            </p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-center gap-2 text-[#8696a0] text-sm">
            <div className="flex gap-1">
              {[0, 150, 300].map((d) => (
                <span key={d} className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-bounce" style={{ animationDelay: d + 'ms' }} />
              ))}
            </div>
            <span>Ringing...</span>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <button onClick={handleDecline} className="group bg-red-600 hover:bg-red-700 text-white rounded-2xl p-4 transition-all active:scale-95">
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <PhoneOff className="w-7 h-7" />
                </div>
                <span className="font-semibold">Decline</span>
              </div>
            </button>
            <button onClick={handleAccept} className="group bg-[#00a884] hover:bg-[#00ba95] text-white rounded-2xl p-4 transition-all active:scale-95">
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Check className="w-7 h-7" />
                </div>
                <span className="font-semibold">Accept</span>
              </div>
            </button>
          </div>
          <p className="text-center text-[#8696a0] text-xs">Auto-decline in 30 seconds</p>
        </div>
      </div>
    </div>
  );
}