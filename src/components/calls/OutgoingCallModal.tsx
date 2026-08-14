'use client';

import { useEffect, useRef } from 'react';
import { CallsAPI, UsersAPI } from '@/lib/api/endpoints';
import { useCallStore } from '@/store/callStore';
import { useState } from 'react';
import { Phone, Video, PhoneOff } from 'lucide-react';

export default function OutgoingCallModal() {
  const { outgoingCall, setOutgoingCall } = useCallStore();
  const [calleeName, setCalleeName] = useState('');
  const [calleeAvatar, setCalleeAvatar] = useState<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ringtoneRef = useRef<NodeJS.Timeout | null>(null);

  const playRingtone = () => {
    try {
      if (!audioCtxRef.current)
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(480, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);
    } catch {}
  };

  const stopRingtone = () => {
    if (ringtoneRef.current) { clearInterval(ringtoneRef.current); ringtoneRef.current = null; }
  };

  useEffect(() => {
    if (!outgoingCall) return;

    // Fetch callee info — embedded as callee or fall back to API
    const embedded = (outgoingCall as any).callee;
    if (embedded?.display_name) {
      setCalleeName(embedded.display_name);
      setCalleeAvatar(embedded.avatar_url ?? null);
    } else if (outgoingCall.callee_id) {
      UsersAPI.getById(outgoingCall.callee_id)
        .then((u: any) => { setCalleeName(u.display_name || ''); setCalleeAvatar(u.avatar_url ?? null); })
        .catch(() => {});
    }

    // Play outgoing ringtone
    playRingtone();
    ringtoneRef.current = setInterval(playRingtone, 2000);

    // Auto-cancel after 30s (no answer)
    const timer = setTimeout(async () => {
      try { await CallsAPI.updateStatus(outgoingCall.id, 'missed'); } catch {}
      stopRingtone();
      setOutgoingCall(null);
    }, 30000);

    return () => { stopRingtone(); clearTimeout(timer); };
  }, [outgoingCall?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCancel = async () => {
    if (!outgoingCall) return;
    stopRingtone();
    try { await CallsAPI.updateStatus(outgoingCall.id, 'missed'); } catch {}
    setOutgoingCall(null);
  };

  if (!outgoingCall) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111b21] border-2 border-[#00a884] rounded-3xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-[#00a884] to-[#008069] p-8 text-center">
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute w-32 h-32 rounded-full bg-white/20 animate-ping" />
            <div className="absolute w-28 h-28 rounded-full bg-white/30 animate-pulse" />
            {calleeAvatar ? (
              <img src={calleeAvatar} alt={calleeName} className="relative w-24 h-24 rounded-full object-cover border-4 border-white/50 shadow-xl" />
            ) : (
              <div className="relative w-24 h-24 rounded-full bg-white/90 flex items-center justify-center shadow-xl">
                <span className="text-[#00a884] text-4xl font-bold">{calleeName?.[0]?.toUpperCase() || '?'}</span>
              </div>
            )}
          </div>
          <div className="mt-6 relative z-10">
            <h2 className="text-white text-2xl font-bold mb-1">{calleeName || 'Calling...'}</h2>
            <p className="text-white/90 text-sm flex items-center justify-center gap-2">
              {outgoingCall.type === 'video' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
              Calling...
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-center gap-2 text-[#8696a0] text-sm">
            <div className="flex gap-1">
              {[0, 150, 300].map((d) => (
                <span key={d} className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-bounce" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
            <span>Ringing...</span>
          </div>

          <div className="flex justify-center pt-2">
            <button
              onClick={handleCancel}
              className="group bg-red-600 hover:bg-red-700 text-white rounded-2xl px-10 py-4 transition-all active:scale-95"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <PhoneOff className="w-7 h-7" />
                </div>
                <span className="font-semibold">Cancel</span>
              </div>
            </button>
          </div>

          <p className="text-center text-[#8696a0] text-xs">Auto-cancel in 30 seconds</p>
        </div>
      </div>
    </div>
  );
}
