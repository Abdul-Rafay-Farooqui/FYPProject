'use client';

import { useEffect, useState, useCallback } from 'react';
import { CommunitiesAPI } from '@/lib/api/endpoints';
import { CommunitySummary } from '@/types';
import { Search, UsersRound } from 'lucide-react';
import CommunityCreateModal from '../../communities/CommunityCreateModal';
import { useRouter } from 'next/navigation';

export default function CommunitiesPanel() {
  const [communities, setCommunities] = useState<CommunitySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [creatorOpen, setCreatorOpen] = useState(false);
  const router = useRouter();

  const load = useCallback(async () => {
    try {
      const data = await CommunitiesAPI.list();
      setCommunities(data);
    } catch (e) {
      console.error('Communities load:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = !query
    ? communities
    : communities.filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase()),
      );

  return (
    <>
      <button
        data-new-community
        className="hidden"
        onClick={() => setCreatorOpen(true)}
      />

      <div className="flex flex-col h-full">
        <div className="px-2 pt-2 pb-1">
          <div className="relative flex items-center bg-[#202c33] rounded-lg px-3 py-1.5 focus-within:bg-[#2a3942]">
            <Search className="w-4 h-4 text-[#8696a0] mr-3 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search communities"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-transparent text-[#e9edef] text-sm w-full outline-none placeholder:text-[#8696a0]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <button
            onClick={() => setCreatorOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#202c33] border-b border-[#222d34]"
          >
            <div className="w-10 h-10 rounded-lg bg-[#00a884] flex items-center justify-center flex-shrink-0">
              <UsersRound className="w-5 h-5 text-[#111b21]" />
            </div>
            <span className="text-[#00a884] font-medium text-sm">
              New community
            </span>
          </button>

          {loading ? (
            <div className="flex justify-center p-8">
              <div className="w-6 h-6 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-[#8696a0] text-sm">
              {query
                ? 'No communities found'
                : 'No communities yet. Create one to bring your groups together.'}
            </div>
          ) : (
            filtered.map((c) => (
              <div
                key={c.id}
                onClick={() => router.push(`/community/${c.id}`)}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#202c33] border-b border-[#222d34]"
              >
                {c.avatar_url ? (
                  <img
                    src={c.avatar_url}
                    alt={c.name}
                    className="w-[49px] h-[49px] rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-[49px] h-[49px] rounded-lg bg-[#2a3942] flex items-center justify-center">
                    <UsersRound className="w-6 h-6 text-[#8696a0]" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-[#e9edef] font-medium text-[15px] truncate">
                    {c.name}
                  </h3>
                  <p className="text-[#8696a0] text-[13px] truncate">
                    {c.member_count} member{c.member_count === 1 ? '' : 's'} •{' '}
                    {c.group_count} group{c.group_count === 1 ? '' : 's'}
                    {c.role === 'admin' && ' • Admin'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <CommunityCreateModal
        open={creatorOpen}
        onClose={() => setCreatorOpen(false)}
        onCreated={(c) => {
          setCreatorOpen(false);
          load();
          router.push(`/community/${c.id}`);
        }}
      />
    </>
  );
}