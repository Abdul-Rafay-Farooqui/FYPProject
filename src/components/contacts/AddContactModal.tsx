'use client';

import { useState } from 'react';
import { UsersAPI, ContactsAPI, ConversationsAPI } from '@/lib/api/endpoints';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { X, Search, MessageCircle, Loader2 } from 'lucide-react';
import { Profile } from '@/types';
import { useRouter } from 'next/navigation';

export default function AddContactModal() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { isAddContactModalOpen, setAddContactModalOpen } = useUIStore();
  const { user } = useAuthStore();
  const { setActiveConversation } = useChatStore();
  const router = useRouter();

  if (!isAddContactModalOpen) return null;

  const close = () => {
    setAddContactModalOpen(false);
    setPhone('');
    setResult(null);
    setError(null);
  };

  const handleSearch = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const trimmed = phone.trim();
    if (!trimmed || !user?.id) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await UsersAPI.searchByPhone(trimmed);
      if (!data) {
        setError('No WeConnect user found with that number.');
        return;
      }
      if (data.id === user.id) {
        setError("That's your own number.");
        return;
      }
      setResult(data as Profile);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Search failed';
      if (err?.response?.status === 404) {
        setError('No WeConnect user found with that number.');
      } else {
        setError(`Search error: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async () => {
    if (!result || !user?.id) return;
    setLoading(true);
    setError(null);

    try {
      // Add to contacts
      try {
        await ContactsAPI.add(result.id);
      } catch {}

      // Get or create conversation
      const conv = await ConversationsAPI.create1on1(result.id);

      if (!conv?.id) {
        setError('Could not create chat');
        return;
      }

      setActiveConversation({ ...conv, other_participant: result });
      close();
      router.push(`/chat/${conv.id}`);
    } catch (err: any) {
      setError(`Error: ${err?.response?.data?.message || err?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[#202c33] w-full max-w-md rounded-lg shadow-2xl overflow-hidden">
        <div className="bg-[#00a884] p-4 flex items-center justify-between">
          <h2 className="text-[#111b21] font-bold text-lg">New Chat</h2>
          <button onClick={close}>
            <X className="w-6 h-6 text-[#111b21]" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <form onSubmit={handleSearch} className="space-y-2">
            <label className="block text-[#8696a0] text-sm">
              Enter phone number to find a WeConnect user
            </label>
            <div className="flex gap-2">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1234567890"
                className="flex-1 bg-[#2a3942] text-[#e9edef] p-3 rounded-md outline-none focus:ring-2 focus:ring-[#00a884] placeholder:text-[#8696a0]"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-[#00a884] p-3 rounded-md text-[#111b21] hover:bg-[#008069] transition-colors disabled:opacity-50"
              >
                {loading && !result
                  ? <Loader2 className="w-6 h-6 animate-spin" />
                  : <Search className="w-6 h-6" />
                }
              </button>
            </div>
          </form>

          {error && (
            <p className="text-red-400 text-sm text-center bg-red-400/10 py-2 px-3 rounded-md">
              {error}
            </p>
          )}

          {result && (
            <div className="bg-[#2a3942] p-4 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                {result.avatar_url ? (
                  <img src={result.avatar_url} alt="Avatar" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 bg-[#374045] rounded-full flex items-center justify-center">
                    <span className="text-[#e9edef] text-xl font-medium">
                      {result.display_name[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-[#e9edef] font-medium">{result.display_name}</p>
                  <p className="text-[#8696a0] text-xs">{result.phone}</p>
                  {result.about && (
                    <p className="text-[#8696a0] text-xs italic truncate max-w-[160px]">{result.about}</p>
                  )}
                </div>
              </div>
              <button
                onClick={handleStartChat}
                disabled={loading}
                className="bg-[#00a884] text-[#111b21] px-4 py-2 rounded-md font-bold hover:bg-[#008069] transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {loading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <><MessageCircle className="w-4 h-4" /> Chat</>
                }
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
