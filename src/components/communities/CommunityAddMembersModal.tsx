'use client';

import { useState } from 'react';
import { X, Search } from 'lucide-react';
import { CommunitiesAPI, UsersAPI } from '@/lib/api/endpoints';

interface Props {
  communityId: string;
  existingMemberIds: string[];
  onClose: () => void;
  onDone: () => void;
}

export default function CommunityAddMembersModal({
  communityId,
  existingMemberIds,
  onClose,
  onDone,
}: Props) {
  const [results, setResults] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (q: string) => {
    setSearch(q);
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const data = await UsersAPI.search(q);
      setResults((data || []).filter((u: any) => !existingMemberIds.includes(u.id)));
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleAdd = async () => {
    if (selected.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      await CommunitiesAPI.addMembers(communityId, selected);
      onDone();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to add members');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#202c33] rounded-lg w-full max-w-md shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[#222d34]">
          <h3 className="text-[#e9edef] font-medium">Add members</h3>
          <button onClick={onClose} className="text-[#8696a0] hover:text-[#e9edef]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 border-b border-[#222d34]">
          <div className="flex items-center gap-2 bg-[#2a3942] rounded px-3 py-2">
            <Search className="w-4 h-4 text-[#8696a0] flex-shrink-0" />
            <input
              placeholder="Search by name or phone"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="bg-transparent flex-1 outline-none text-[#e9edef] text-sm"
            />
          </div>
          {selected.length > 0 && (
            <div className="text-[#00a884] text-xs mt-2">{selected.length} selected</div>
          )}
          {error && <div className="text-red-400 text-xs mt-2">{error}</div>}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {searching ? (
            <div className="flex justify-center p-6">
              <div className="w-5 h-5 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !search.trim() ? (
            <div className="text-[#8696a0] text-sm text-center p-6">
              Type a name or phone number to search
            </div>
          ) : results.length === 0 ? (
            <div className="text-[#8696a0] text-sm text-center p-6">No users found</div>
          ) : (
            results.map((u: any) => (
              <label
                key={u.id}
                className="flex items-center gap-3 p-3 hover:bg-[#2a3942] cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(u.id)}
                  onChange={() => toggle(u.id)}
                  className="accent-[#00a884]"
                />
                <div className="w-10 h-10 rounded-full bg-[#2a3942] flex items-center justify-center overflow-hidden flex-shrink-0">
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt={u.display_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[#e9edef]">{u.display_name?.[0]?.toUpperCase() || '?'}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[#e9edef] text-sm truncate">{u.display_name}</div>
                  <div className="text-[#8696a0] text-xs truncate">{u.phone}</div>
                </div>
              </label>
            ))
          )}
        </div>

        <div className="p-3 border-t border-[#222d34] flex justify-end">
          <button
            onClick={handleAdd}
            disabled={loading || selected.length === 0}
            className="px-4 py-2 bg-[#00a884] text-[#111b21] rounded font-medium hover:bg-[#008069] disabled:opacity-50"
          >
            {loading ? 'Adding…' : `Add${selected.length ? ` (${selected.length})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
