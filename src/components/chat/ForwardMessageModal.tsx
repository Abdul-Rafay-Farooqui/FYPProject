'use client';

import { useState, useEffect } from 'react';
import { ConversationsAPI, MessagesAPI } from '@/lib/api/endpoints';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { X, Search, Send, Loader2, Check } from 'lucide-react';
import { Conversation } from '@/types';

export default function ForwardMessageModal() {
  const { forwardMessage, setForwardMessage, isForwardModalOpen, setForwardModalOpen } = useUIStore();
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<(Conversation & { _selected?: boolean })[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!isForwardModalOpen || !user?.id) return;
    setSelected(new Set());
    setSent(false);
    setSearchQuery('');

    const load = async () => {
      setLoading(true);
      try {
        const data = await ConversationsAPI.list();
        setConversations(data || []);
      } catch (e) {
        console.error('Failed to load conversations for forward:', e);
        setConversations([]);
      }
      setLoading(false);
    };

    load();
  }, [isForwardModalOpen, user?.id]);

  const close = () => {
    setForwardMessage(null);
    setForwardModalOpen(false);
  };

  const toggleSelect = (convId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(convId)) next.delete(convId);
      else next.add(convId);
      return next;
    });
  };

  const handleForward = async () => {
    if (!forwardMessage || selected.size === 0 || sending || !user?.id) return;
    setSending(true);

    const promises = Array.from(selected).map((convId) =>
      MessagesAPI.send({
        conversation_id: convId,
        content: forwardMessage.content,
        type: forwardMessage.type,
        media_url: forwardMessage.media_url,
        media_mime_type: forwardMessage.media_mime_type,
        media_filename: forwardMessage.media_filename,
        is_forwarded: true,
      })
    );

    try {
      await Promise.all(promises);
    } catch (e) {
      console.error('Forward failed:', e);
    }

    setSending(false);
    setSent(true);
    setTimeout(() => close(), 800);
  };

  const filtered = conversations.filter((c) =>
    c.other_participant?.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isForwardModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#202c33] w-full max-w-md rounded-lg shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#00a884] px-4 py-3 flex items-center justify-between flex-shrink-0">
          <h2 className="text-[#111b21] font-bold text-lg">Forward message</h2>
          <button onClick={close}>
            <X className="w-5 h-5 text-[#111b21]" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pt-3 pb-2 flex-shrink-0">
          <div className="flex items-center bg-[#2a3942] rounded-lg px-3 py-1.5">
            <Search className="w-4 h-4 text-[#8696a0] mr-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="bg-transparent text-[#e9edef] text-sm w-full outline-none placeholder:text-[#8696a0]"
            />
          </div>
        </div>

        {/* Preview of message being forwarded */}
        {forwardMessage && (
          <div className="mx-4 mb-2 px-3 py-2 bg-[#1e2a30] border-l-4 border-[#00a884] rounded text-xs text-[#8696a0] truncate">
            ↗ {forwardMessage.content || `📎 ${forwardMessage.type}`}
          </div>
        )}

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-[#00a884] animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-[#8696a0] text-sm py-8">No conversations found</p>
          ) : (
            filtered.map((conv) => {
              const isSelected = selected.has(conv.id);
              return (
                <button
                  key={conv.id}
                  onClick={() => toggleSelect(conv.id)}
                  className={`w-full flex items-center px-4 py-3 gap-3 hover:bg-[#2a3942] transition-colors ${
                    isSelected ? 'bg-[#2a3942]/50' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-[#2a3942] flex-shrink-0">
                    {conv.other_participant?.avatar_url ? (
                      <img
                        src={conv.other_participant.avatar_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#e9edef] text-sm">
                        {conv.other_participant?.display_name?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  <span className="text-[#e9edef] text-sm flex-1 text-left truncate">
                    {conv.other_participant?.display_name || 'Unknown'}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-[#00a884] border-[#00a884]' : 'border-[#8696a0]'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-[#111b21]" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Forward button */}
        {selected.size > 0 && (
          <div className="p-4 border-t border-[#222d34] flex-shrink-0">
            <button
              onClick={handleForward}
              disabled={sending || sent}
              className="w-full bg-[#00a884] text-[#111b21] font-bold py-3 rounded-lg hover:bg-[#008069] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {sent ? (
                <>
                  <Check className="w-5 h-5" /> Sent!
                </>
              ) : sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" /> Forward to {selected.size} chat{selected.size > 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
