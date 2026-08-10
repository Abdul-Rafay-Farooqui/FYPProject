'use client';

import { useEffect, useState } from 'react';
import { CallsAPI } from '@/lib/api/endpoints';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { useAuthStore } from '@/store/authStore';

export default function CallsPanel() {
  const { user } = useAuthStore();
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    CallsAPI.history()
      .then(setCalls)
      .catch(() => setCalls([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="w-6 h-6 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : calls.length === 0 ? (
          <div className="p-8 text-center text-[#8696a0] text-sm">
            No call history
          </div>
        ) : (
          calls.map((c: any) => {
            const outgoing = c.caller_id === user?.id;
            const other = outgoing ? c.callee : c.caller;
            const Icon = c.type === 'video' ? Video : Phone;
            const DirIcon =
              c.status === 'missed'
                ? PhoneMissed
                : outgoing
                  ? PhoneOutgoing
                  : PhoneIncoming;
            const missed = c.status === 'missed' || c.status === 'declined';
            return (
              <div
                key={c.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-[#202c33] border-b border-[#222d34]"
              >
                {other?.avatar_url ? (
                  <img
                    src={other.avatar_url}
                    className="w-[49px] h-[49px] rounded-full object-cover"
                    alt={other.display_name}
                  />
                ) : (
                  <div className="w-[49px] h-[49px] rounded-full bg-[#2a3942] flex items-center justify-center">
                    <span className="text-[#e9edef] text-xl">
                      {other?.display_name?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3
                    className={`text-[15px] font-medium truncate ${
                      missed ? 'text-red-400' : 'text-[#e9edef]'
                    }`}
                  >
                    {other?.display_name || 'Unknown'}
                  </h3>
                  <div className="flex items-center gap-1 text-[#8696a0] text-xs">
                    <DirIcon className="w-3 h-3" />
                    <span>
                      {formatDistanceToNowStrict(new Date(c.started_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
                <Icon className="w-5 h-5 text-[#00a884]" />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}