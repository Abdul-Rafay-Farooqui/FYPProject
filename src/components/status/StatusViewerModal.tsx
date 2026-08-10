'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Eye, Trash2 } from 'lucide-react';
import { StatusAPI } from '@/lib/api/endpoints';
import { formatDistanceToNowStrict } from 'date-fns';

interface Props {
  isOwner: boolean;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  statuses: any[];
  startIndex: number;
  onClose: () => void;
}

export default function StatusViewerModal({
  isOwner,
  displayName,
  avatarUrl,
  statuses,
  startIndex,
  onClose,
}: Props) {
  const [index, setIndex] = useState(startIndex);
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState<any[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const status = statuses[index];

  useEffect(() => {
    if (!status) return;
    // Mark as viewed (non-owners)
    if (!isOwner) {
      StatusAPI.view(status.id).catch(() => {});
    }
    // Auto-advance 5s (if not video)
    if (timerRef.current) clearTimeout(timerRef.current);
    if (status.type !== 'video') {
      timerRef.current = setTimeout(() => {
        if (index < statuses.length - 1) setIndex(index + 1);
        else onClose();
      }, 5000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const openViewers = async () => {
    setShowViewers(true);
    try {
      const data = await StatusAPI.viewers(status.id);
      setViewers(data);
    } catch {
      setViewers([]);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this status?')) return;
    try {
      await StatusAPI.remove(status.id);
      onClose();
    } catch {}
  };

  const next = () => {
    if (index < statuses.length - 1) setIndex(index + 1);
    else onClose();
  };
  const prev = () => {
    if (index > 0) setIndex(index - 1);
  };

  if (!status) return null;

  return (
    <div className="fixed inset-0 z-[400] bg-black flex flex-col">
      {/* Progress bars */}
      <div className="flex gap-1 px-3 pt-3">
        {statuses.map((_, i) => (
          <div
            key={i}
            className="flex-1 h-0.5 bg-white/30 rounded overflow-hidden"
          >
            <div
              className={`h-full bg-white transition-all ${
                i < index ? 'w-full' : i === index ? 'animate-progress' : 'w-0'
              }`}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            className="w-9 h-9 rounded-full object-cover"
            alt={displayName}
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white">
              {displayName[0]?.toUpperCase() || '?'}
            </span>
          </div>
        )}
        <div className="flex-1">
          <p className="text-white font-medium text-sm">{displayName}</p>
          <p className="text-white/70 text-xs">
            {formatDistanceToNowStrict(new Date(status.created_at), {
              addSuffix: true,
            })}
          </p>
        </div>
        {isOwner && (
          <button
            onClick={handleDelete}
            className="text-white/80 hover:text-red-400"
            title="Delete"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white"
          title="Close"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Prev / Next tap zones */}
        <button
          onClick={prev}
          className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
          aria-label="Previous"
        />
        <button
          onClick={next}
          className="absolute right-0 top-0 bottom-0 w-1/3 z-10"
          aria-label="Next"
        />

        <div
          className="w-full max-w-lg h-full flex items-center justify-center"
          style={
            status.type === 'text'
              ? { backgroundColor: status.bg_color || '#075e54' }
              : {}
          }
        >
          {status.type === 'text' && (
            <p className="text-white text-3xl text-center px-6 font-semibold whitespace-pre-wrap">
              {status.content}
            </p>
          )}
          {status.type === 'image' && status.media_url && (
            <img
              src={status.media_url}
              alt=""
              className="max-h-full max-w-full object-contain"
            />
          )}
          {status.type === 'video' && status.media_url && (
            <video
              src={status.media_url}
              controls
              autoPlay
              onEnded={next}
              className="max-h-full max-w-full"
            />
          )}
        </div>

        {(status.caption || status.content) && status.type !== 'text' && (
          <div className="absolute bottom-20 left-0 right-0 px-6">
            <p className="text-white text-center text-base bg-black/40 rounded-lg px-3 py-2 inline-block w-full">
              {status.caption || status.content}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      {isOwner && (
        <div className="bg-black/60 px-4 py-3">
          <button
            onClick={openViewers}
            className="flex items-center gap-2 text-white/90 text-sm hover:text-white"
          >
            <Eye className="w-4 h-4" /> Viewers
          </button>
        </div>
      )}

      {showViewers && (
        <div className="absolute inset-0 bg-black/90 z-[500] flex flex-col">
          <div className="px-4 py-3 flex items-center gap-3 border-b border-white/10">
            <button
              onClick={() => setShowViewers(false)}
              className="text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-white font-semibold">
              Viewed by {viewers.length}
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {viewers.length === 0 ? (
              <div className="p-8 text-center text-white/60">No views yet</div>
            ) : (
              viewers.map((v) => (
                <div
                  key={v.viewer_id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/5"
                >
                  {v.avatar_url ? (
                    <img
                      src={v.avatar_url}
                      className="w-9 h-9 rounded-full object-cover"
                      alt={v.display_name}
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                      <span className="text-white">
                        {v.display_name?.[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-white text-sm">{v.display_name}</p>
                    <p className="text-white/50 text-xs">
                      {formatDistanceToNowStrict(new Date(v.viewed_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}