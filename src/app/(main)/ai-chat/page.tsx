'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { Send, Bot, ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { useAuthStore } from '@/store/authStore';

const STORAGE_KEY = 'weconnect_ai_messages';

type AIMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string; // ISO string — serializable for localStorage
};

function loadMessages(userId: string): AIMessage[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMessages(userId: string, msgs: AIMessage[]) {
  try {
    // Keep last 100 messages to avoid bloating storage
    const trimmed = msgs.slice(-100);
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(trimmed));
  } catch { /* storage full — ignore */ }
}

function AIChatContent() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const searchParams = useSearchParams();

  // Load persisted messages on mount
  useEffect(() => {
    if (user?.id) {
      setMessages(loadMessages(user.id));
    }
    setHydrated(true);
  }, [user?.id]);

  // Pre-fill from "Ask AI" context menu
  useEffect(() => {
    const q = searchParams.get('q');
    if (q && hydrated) setInput(`Regarding this message: "${q}" — `);
  }, [searchParams, hydrated]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const updateMessages = (msgs: AIMessage[]) => {
    setMessages(msgs);
    if (user?.id) saveMessages(user.id, msgs);
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: AIMessage = {
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };
    const history = [...messages, userMsg];
    updateMessages(history);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map(({ role, content }) => ({ role, content })),
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.detail || data.error || 'Something went wrong');
        return;
      }

      const assistantMsg: AIMessage = {
        role: 'assistant',
        content: data.content,
        timestamp: new Date().toISOString(),
      };
      updateMessages([...history, assistantMsg]);
    } catch {
      setError('Network error — could not reach AI service');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleClear = () => {
    updateMessages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!hydrated) {
    return (
      <div className="h-full w-full bg-[#0b141a] flex items-center justify-center">
        <Bot className="w-12 h-12 text-[#00a884] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0b141a]">
      {/* Header */}
      <div className="bg-[#202c33] px-4 py-2 flex items-center justify-between sticky top-0 z-20 shadow-md">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-[#aebac1] hover:text-[#e9edef] mr-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 bg-[#00a884] rounded-full flex items-center justify-center flex-shrink-0">
            <Bot className="w-6 h-6 text-[#111b21]" />
          </div>
          <div>
            <h3 className="text-[#e9edef] font-medium leading-tight">WeConnect AI</h3>
            <p className="text-[#00a884] text-xs">
              {loading ? 'typing...' : 'AI Assistant · OpenRouter Auto'}
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            className="text-[#8696a0] hover:text-red-400 transition-colors p-2"
            title="Clear chat history"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-2 custom-scrollbar"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-20">
            <div className="w-20 h-20 bg-[#00a884]/20 rounded-full flex items-center justify-center">
              <Bot className="w-10 h-10 text-[#00a884]" />
            </div>
            <div>
              <p className="text-[#e9edef] font-medium text-lg">WeConnect AI</p>
              <p className="text-[#8696a0] text-sm mt-1 max-w-xs">
                Ask me anything — summarize chats, draft replies, answer questions.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 bg-[#00a884] rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                <Bot className="w-4 h-4 text-[#111b21]" />
              </div>
            )}
            <div
              className={`max-w-[72%] px-3 py-2 rounded-lg shadow-sm ${
                msg.role === 'user'
                  ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none'
                  : 'bg-[#202c33] text-[#e9edef] rounded-tl-none border-l-2 border-[#00a884]'
              }`}
            >
              <p className="text-[14.2px] whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              <p className="text-[11px] text-[#8696a0] text-right mt-1">
                {format(new Date(msg.timestamp), 'HH:mm')}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start items-end gap-2">
            <div className="w-7 h-7 bg-[#00a884] rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-[#111b21]" />
            </div>
            <div className="bg-[#202c33] px-4 py-3 rounded-lg rounded-tl-none border-l-2 border-[#00a884]">
              <div className="flex gap-1 items-center">
                <span className="w-2 h-2 bg-[#8696a0] rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-[#8696a0] rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-[#8696a0] rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <p className="text-red-400 text-xs bg-red-400/10 px-3 py-1.5 rounded-full">{error}</p>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="bg-[#202c33] px-3 py-2 flex items-end gap-3">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask AI anything..."
          rows={1}
          className="flex-1 bg-[#2a3942] text-[#e9edef] text-sm py-2.5 px-4 rounded-lg outline-none placeholder:text-[#8696a0] resize-none max-h-32 custom-scrollbar"
          onInput={(e) => {
            const t = e.currentTarget;
            t.style.height = 'auto';
            t.style.height = Math.min(t.scrollHeight, 128) + 'px';
          }}
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          className="bg-[#00a884] p-2.5 rounded-full text-[#111b21] hover:bg-[#008069] transition-colors disabled:opacity-40 flex-shrink-0 mb-0.5"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default function AIChatPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full w-full bg-[#0b141a] flex items-center justify-center">
          <Bot className="w-12 h-12 text-[#00a884] animate-pulse" />
        </div>
      }
    >
      <AIChatContent />
    </Suspense>
  );
}
