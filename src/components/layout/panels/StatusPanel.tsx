'use client';

import { useEffect, useState, useCallback } from 'react';
import { StatusAPI } from '@/lib/api/endpoints';
import { StatusFeed, StatusGroup } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { Plus, Camera, Pencil } from 'lucide-react';
import StatusCreatorModal from '../../status/StatusCreatorModal';
import StatusViewerModal from '../../status/StatusViewerModal';
import { formatDistanceToNowStrict } from 'date-fns';

export default function StatusPanel() {
  const { profile } = useAuthStore();
  const [feed, setFeed] = useState<StatusFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [creatorType, setCreatorType] = useState<'text' | 'image' | 'video'>(
    'text',
  );
  const [viewing, setViewing] = useState<{
    statuses: any[];
    user_id: string;
    display_name: string;
    avatar_url: string | null;
    startIndex: number;
  } | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await StatusAPI.feed();
      setFeed(data);
    } catch (e) {
      console.error('Status feed error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const myStatuses = feed?.my_statuses || [];
  const hasMy = myStatuses.length > 0;
  const latestMy = myStatuses[0];

  const openCreator = (type: 'text' | 'image' | 'video') => {
    setCreatorType(type);
    setCreatorOpen(true);
  };

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Hidden button for SidebarHeader + button to trigger */}
        <button
          data-new-status
          className="hidden"
          onClick={() => openCreator('text')}
        />

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* My status */}
          <div className="px-4 pt-4 pb-2">
            <h3 className="text-[#8696a0] text-xs font-medium uppercase tracking-wider mb-2">
              My status
            </h3>
            <div
              className="flex items-center gap-3 px-2 py-2 hover:bg-[#202c33] rounded cursor-pointer"
              onClick={() => {
                if (hasMy) {
                  setViewing({
                    statuses: myStatuses,
                    user_id: profile!.id,
                    display_name: profile!.display_name,
                    avatar_url: profile!.avatar_url || null,
                    startIndex: 0,
                  });
                } else {
                  openCreator('text');
                }
              }}
            >
              <div className="relative">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Me"
                    className={`w-14 h-14 rounded-full object-cover ${
                      hasMy ? 'ring-2 ring-[#00a884]' : ''
                    }`}
                  />
                ) : (
                  <div
                    className={`w-14 h-14 rounded-full bg-[#2a3942] flex items-center justify-center ${
                      hasMy ? 'ring-2 ring-[#00a884]' : ''
                    }`}
                  >
                    <span className="text-[#e9edef] text-xl">
                      {profile?.display_name?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openCreator('text');
                  }}
                  className="absolute -bottom-1 -right-1 bg-[#00a884] text-[#111b21] rounded-full p-1 shadow hover:bg-[#008069]"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[#e9edef] text-[15px] font-medium">
                  My status
                </h4>
                <p className="text-[#8696a0] text-xs truncate">
                  {hasMy
                    ? formatDistanceToNowStrict(new Date(latestMy.created_at), {
                        addSuffix: true,
                      })
                    : 'Tap to add status update'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick new status buttons */}
          <div className="px-4 pb-4 flex gap-2">
            <button
              onClick={() => openCreator('text')}
              className="flex items-center gap-2 px-3 py-2 bg-[#202c33] rounded-full text-[#e9edef] text-xs hover:bg-[#2a3942]"
            >
              <Pencil className="w-3.5 h-3.5" /> Text
            </button>
            <button
              onClick={() => openCreator('image')}
              className="flex items-center gap-2 px-3 py-2 bg-[#202c33] rounded-full text-[#e9edef] text-xs hover:bg-[#2a3942]"
            >
              <Camera className="w-3.5 h-3.5" /> Photo
            </button>
          </div>

          {/* Recent updates */}
          <div className="border-t border-[#222d34] pt-2">
            <h3 className="text-[#8696a0] text-xs font-medium uppercase tracking-wider mb-1 px-4">
              Recent updates
            </h3>
            {loading ? (
              <div className="p-8 flex justify-center">
                <div className="w-6 h-6 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : feed && feed.recent.length > 0 ? (
              feed.recent.map((g) => (
                <RecentStatusRow
                  key={g.user_id}
                  group={g}
                  onClick={() =>
                    setViewing({
                      statuses: g.statuses,
                      user_id: g.user_id,
                      display_name: g.display_name,
                      avatar_url: g.avatar_url,
                      startIndex: 0,
                    })
                  }
                />
              ))
            ) : (
              <div className="p-8 text-center text-[#8696a0] text-sm">
                No recent status updates from your contacts
              </div>
            )}
          </div>
        </div>
      </div>

      <StatusCreatorModal
        open={creatorOpen}
        initialType={creatorType}
        onClose={() => setCreatorOpen(false)}
        onCreated={() => {
          setCreatorOpen(false);
          load();
        }}
      />

      {viewing && (
        <StatusViewerModal
          isOwner={viewing.user_id === profile?.id}
          userId={viewing.user_id}
          displayName={viewing.display_name}
          avatarUrl={viewing.avatar_url}
          statuses={viewing.statuses}
          startIndex={viewing.startIndex}
          onClose={() => {
            setViewing(null);
            load();
          }}
        />
      )}
    </>
  );
}

function RecentStatusRow({
  group,
  onClick,
}: {
  group: StatusGroup;
  onClick: () => void;
}) {
  const unseenCount = group.statuses.filter((s) => !s.viewed_by_me).length;
  const totalCount = group.statuses.length;
  const latest = group.statuses[0];
  const seen = unseenCount === 0;

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-[#202c33] transition-colors"
    >
      <div className="relative flex-shrink-0">
        <div
          className={`w-14 h-14 rounded-full p-[3px] ${
            seen
              ? 'bg-[#2a3942]'
              : 'bg-gradient-to-tr from-[#00a884] to-[#25d366]'
          }`}
        >
          {group.avatar_url ? (
            <img
              src={group.avatar_url}
              alt={group.display_name}
              className="w-full h-full rounded-full object-cover border-2 border-[#111b21]"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-[#2a3942] flex items-center justify-center border-2 border-[#111b21]">
              <span className="text-[#e9edef] text-lg">
                {group.display_name[0]?.toUpperCase() || '?'}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-[#e9edef] text-[15px] font-medium truncate">
          {group.display_name}
        </h4>
        <p className="text-[#8696a0] text-xs">
          {totalCount} update{totalCount === 1 ? '' : 's'} •{' '}
          {formatDistanceToNowStrict(new Date(latest.created_at), {
            addSuffix: true,
          })}
        </p>
      </div>
    </div>
  );
}