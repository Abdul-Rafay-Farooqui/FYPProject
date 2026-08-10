'use client';

import { useEffect, useState } from 'react';
import { X, Search } from 'lucide-react';
import { CommunitiesAPI, ContactsAPI } from '@/lib/api/endpoints';

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
  const [contacts, setContacts] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const cs = await ContactsAPI.list();
        setContacts(cs || []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

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

  const filtered = contacts.filter((c: any) => {
    const u = c.contact || c;
    if (!u?.id || existingMemberIds.includes(u.id)) return false;
    if (!search) return true;
    return (u.display_name || '').toLowerCase().includes(search.toLowerCase());
  });

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
            <Search className="w-4 h-4 text-[#8696a0]" />
            <input
              placeholder="Search contacts"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent flex-1 outline-none text-[#e9edef] text-sm"
            />
          </div>
          {selected.length > 0 && (
            <div className="text-[#00a884] text-xs mt-2">{selected.length} selected</div>
          )}
          {error && <div className="text-red-400 text-xs mt-2">{error}</div>}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="text-[#8696a0] text-sm text-center p-6">No contacts to add</div>
          ) : (
            filtered.map((c: any) => {
              const u = c.contact || c;
              return (
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
                  <div className="w-10 h-10 rounded-full bg-[#2a3942] flex items-center justify-center overflow-hidden">
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
              );
            })
          )}
        </div>

        <div className="p-3 border-t border-[#222d34] flex justify-end">
          <button
            onClick={handleAdd}
            disabled={loading || selected.length === 0}
            className="px-4 py-2 bg-[#00a884] text-[#111b21] rounded font-medium hover:bg-[#008069] disabled:opacity-50"
          >
            {loading ? 'Adding…' : `Add ${selected.length || ''}`.trim()}
          </button>
        </div>
      </div>
    </div>
  );
}