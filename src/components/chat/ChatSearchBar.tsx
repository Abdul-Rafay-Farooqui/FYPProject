'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronUp, ChevronDown, Search } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useChatStore } from '@/store/chatStore';

export default function ChatSearchBar({ onQueryChange }: { onQueryChange?: (q: string) => void }) {
  const { isChatSearchOpen, setChatSearchOpen } = useUIStore();
  const { messages } = useChatStore();
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<number[]>([]);
  const [currentMatch, setCurrentMatch] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isChatSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setMatches([]);
      setCurrentMatch(0);
      onQueryChange?.('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChatSearchOpen]);

  const doSearch = useCallback(
    (q: string) => {
      if (!q.trim()) {
        setMatches([]);
        setCurrentMatch(0);
        onQueryChange?.('');
        return;
      }
      const lower = q.toLowerCase();
      const found: number[] = [];
      messages.forEach((msg, idx) => {
        if (msg.content?.toLowerCase().includes(lower)) {
          found.push(idx);
        }
      });
      setMatches(found);
      setCurrentMatch(found.length > 0 ? found.length - 1 : 0);
      onQueryChange?.(q);

      // Scroll to the last match
      if (found.length > 0) {
        scrollToMessage(found[found.length - 1]);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [messages]
  );

  useEffect(() => {
    const timeout = setTimeout(() => doSearch(query), 200);
    return () => clearTimeout(timeout);
  }, [query, doSearch]);

  const scrollToMessage = (msgIndex: number) => {
    const msgEl = document.querySelector(`[data-msg-index="${msgIndex}"]`);
    if (msgEl) {
      msgEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Flash highlight
      msgEl.classList.add('search-flash');
      setTimeout(() => msgEl.classList.remove('search-flash'), 1500);
    }
  };

  const goUp = () => {
    if (matches.length === 0) return;
    const next = currentMatch > 0 ? currentMatch - 1 : matches.length - 1;
    setCurrentMatch(next);
    scrollToMessage(matches[next]);
  };

  const goDown = () => {
    if (matches.length === 0) return;
    const next = currentMatch < matches.length - 1 ? currentMatch + 1 : 0;
    setCurrentMatch(next);
    scrollToMessage(matches[next]);
  };

  const close = () => {
    setChatSearchOpen(false);
    setQuery('');
    setMatches([]);
    onQueryChange?.('');
  };

  if (!isChatSearchOpen) return null;

  return (
    <div className="bg-[#202c33] px-4 py-2 flex items-center gap-3 border-b border-[#222d34] slide-down relative z-10">
      <div className="flex-1 flex items-center bg-[#2a3942] rounded-lg px-3 py-1.5">
        <Search className="w-4 h-4 text-[#8696a0] mr-2 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') goDown();
            if (e.key === 'Escape') close();
          }}
          placeholder="Search messages..."
          className="bg-transparent text-[#e9edef] text-sm w-full outline-none placeholder:text-[#8696a0]"
        />
      </div>

      {query && (
        <span className="text-[#8696a0] text-xs whitespace-nowrap min-w-[60px] text-center">
          {matches.length > 0 ? `${currentMatch + 1} of ${matches.length}` : 'No results'}
        </span>
      )}

      <div className="flex items-center gap-1 text-[#aebac1]">
        <button onClick={goUp} className="p-1 hover:text-[#e9edef] transition-colors disabled:opacity-30" disabled={matches.length === 0}>
          <ChevronUp className="w-5 h-5" />
        </button>
        <button onClick={goDown} className="p-1 hover:text-[#e9edef] transition-colors disabled:opacity-30" disabled={matches.length === 0}>
          <ChevronDown className="w-5 h-5" />
        </button>
        <button onClick={close} className="p-1 hover:text-[#e9edef] transition-colors ml-1">
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
