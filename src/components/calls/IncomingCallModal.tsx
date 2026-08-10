'use client';

import { useState, useEffect, useCallback } from 'react';
import { CallsAPI, UsersAPI } from '@/lib/api/endpoints';
import { useAuthStore } from '@/store/authStore';
import { useCallStore } from '@/store/callStore';
import { Phone, Video, X, Check, PhoneOff } from 'lucide-react';

export default function IncomingCallModal() {
  const { incomingCall, setIncomingCall, setActiveCall } = useCallStore();
  const { user } = useAuthStore();
  const [caller, setCaller] = useState<any>(null);

  const handleDecline = useCallback(async () => {
    if (!incomingCall) return;
    try {
      await CallsAPI.end(incomingCall.id, 0);
    } catch {}
    setIncomingCall(null);
  }, [incomingCall, setIncomingCall]);

  useEffect(() => {
    if (!incomingCall) return;

    const fetchCaller = async () => {
      try {
        const data = await UsersAPI.getById(incomingCall.caller_id);
        setCaller(data);
      } catch {}
    };

    fetchCaller();

    // Auto-decline after 30s
    const timer = setTimeout(() => {
      handleDecline();
    }, 30000);

    return () => clearTimeout(timer);
  }, [incomingCall, handleDecline]);

  const handleAccept = async () => {
    if (!incomingCall) return;
    try {
      await CallsAPI.accept(incomingCall.id);
    } catch {}
    setActiveCall(incomingCall);
    setIncomingCall(null);
  };

  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="bg-[#202c33] w-full max-w-sm rounded-2xl shadow-2xl p-8 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-200">
        <div className="relative">
          {caller?.avatar_url ? (
            <img src={caller.avatar_url} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-[#00a884]" />
          ) : (
            <div className="w-24 h-24 bg-[#2a3942] rounded-full flex items-center justify-center border-4 border-[#00a884]">
              <span className="text-[#e9edef] text-4xl">{caller?.display_name?.[0]?.toUpperCase()}</span>
            </div>
          )}
          <div className="absolute -bottom-2 -right-2 bg-[#00a884] p-2 rounded-full animate-pulse">
            {incomingCall.type === 'video' ? <Video className="w-5 h-5 text-[#111b21]" /> : <Phone className="w-5 h-5 text-[#111b21]" />}
          </div>
        </div>

        <div>
          <h2 className="text-[#e9edef] text-2xl font-bold">{caller?.display_name || 'Unknown Caller'}</h2>
          <p className="text-[#8696a0]">Incoming {incomingCall.type} call...</p>
        </div>

        <div className="flex gap-8 w-full">
          <button 
            onClick={handleDecline}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white p-4 rounded-full flex items-center justify-center transition-colors"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
          <button 
            onClick={handleAccept}
            className="flex-1 bg-[#00a884] hover:bg-[#008069] text-[#111b21] p-4 rounded-full flex items-center justify-center transition-colors shadow-lg shadow-[#00a884]/20"
          >
            <Check className="w-8 h-8 font-bold" />
          </button>
        </div>
      </div>
    </div>
  );
}
