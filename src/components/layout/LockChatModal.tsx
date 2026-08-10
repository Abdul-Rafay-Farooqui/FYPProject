'use client';

import { useState } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { ConversationsAPI } from '@/lib/api/endpoints';
import { X, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LockChatModal() {
  const { lockChatConversation, setLockChatConversation } = useUIStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!lockChatConversation) return null;

  const handleLock = async () => {
    if (pin.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      await ConversationsAPI.lock(lockChatConversation.id, pin);
      setLockChatConversation(null);
      router.push('/');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Lock failed');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#202c33] w-full max-w-sm rounded-lg shadow-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3 text-[#e9edef]">
            <Lock className="w-5 h-5 text-[#00a884]" />
            <h2 className="text-lg font-medium">Lock Chat</h2>
          </div>
          <button
            onClick={() => setLockChatConversation(null)}
            className="text-[#8696a0] hover:text-[#e9edef] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-[#8696a0] text-sm mb-4">
          Enter a 4-digit PIN to lock this chat. It will be moved to the <span className="text-[#e9edef] font-medium">Locked chats</span> section and require your PIN to open.
        </p>

        <div className="mb-6">
          <input
            type="password"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="4-digit PIN"
            className="w-full bg-[#111b21] text-[#e9edef] text-center text-2xl tracking-[0.5em] font-medium p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a884]"
            autoFocus
          />
          {error && <p className="text-red-400 text-xs mt-2 text-center">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 rounded-lg">
          <button
            onClick={() => setLockChatConversation(null)}
            className="px-6 py-2.5 text-sm font-medium text-[#8696a0] hover:bg-[#2a3942] rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleLock}
            disabled={loading || pin.length !== 4}
            className="px-6 py-2.5 text-sm font-medium bg-[#00a884] text-[#111b21] rounded-lg hover:bg-[#008069] transition-colors disabled:opacity-50"
          >
            {loading ? 'Locking...' : 'Lock Chat'}
          </button>
        </div>
      </div>
    </div>
  );
}
