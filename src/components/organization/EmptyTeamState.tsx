'use client';

import { useState } from 'react';
import { UserMinus, UserPlus, Users } from 'lucide-react';

interface OrgMember {
  id: string;
  user_id: string;
  display_name?: string;
  avatar_url?: string;
  phone?: string;
  role: string;
  is_online?: boolean;
}

interface EmptyTeamStateProps {
  orgName?: string;
  orgMembers?: OrgMember[];
  isOrgAdmin?: boolean;
  currentUserId?: string;
  onAddMembers?: () => void;
  onRemoveMember?: (userId: string) => Promise<void>;
}

const EmptyTeamState = ({
  orgName,
  orgMembers = [],
  isOrgAdmin,
  currentUserId,
  onAddMembers,
  onRemoveMember,
}: EmptyTeamStateProps) => {
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemove = async (userId: string) => {
    if (!onRemoveMember) return;
    setRemovingId(userId);
    try {
      await onRemoveMember(userId);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-[#222d34]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[#e9edef] text-lg font-semibold">
              {orgName ? `${orgName} — Members` : 'Organization Members'}
            </h3>
            <p className="text-[#8696a0] text-sm mt-0.5">
              Select a team from the sidebar to get started
            </p>
          </div>
          {isOrgAdmin && (
            <button
              onClick={onAddMembers}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[#00a884] border border-[#00a884]/30 hover:bg-[#00a884]/10 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              Add Member
            </button>
          )}
        </div>
      </div>

      {/* Members list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        {orgMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div className="w-16 h-16 rounded-full bg-[#1e2a30] flex items-center justify-center">
              <Users className="w-8 h-8 text-[#8696a0]" />
            </div>
            <p className="text-[#8696a0] text-sm">No members yet.</p>
            {isOrgAdmin && (
              <button
                onClick={onAddMembers}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[#00a884] border border-[#00a884]/30 hover:bg-[#00a884]/10 transition-all"
              >
                <UserPlus className="w-4 h-4" /> Add first member
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[#8696a0] text-xs mb-3">
              {orgMembers.length} member{orgMembers.length !== 1 ? 's' : ''}
            </p>
            {orgMembers.map((m) => {
              const isSelf = m.user_id === currentUserId;
              const canRemove = isOrgAdmin && !isSelf && m.role !== 'owner';
              const isRemoving = removingId === m.user_id;

              return (
                <div
                  key={m.user_id}
                  className="flex items-center gap-3 bg-[#111b21] border border-[#222d34] rounded-xl px-4 py-3 group"
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {m.avatar_url ? (
                      <img src={m.avatar_url} alt={m.display_name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#2a3942] flex items-center justify-center text-[#00a884] font-bold text-sm">
                        {(m.display_name?.[0] || '?').toUpperCase()}
                      </div>
                    )}
                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#111b21] ${
                      m.is_online ? 'bg-[#00a884]' : 'bg-[#8696a0]'
                    }`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[#e9edef] text-sm font-medium truncate">
                      {m.display_name || '(no name)'}{isSelf ? ' (you)' : ''}
                    </p>
                    {m.phone && <p className="text-[#8696a0] text-xs">{m.phone}</p>}
                  </div>

                  {/* Role badge */}
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 capitalize ${
                    m.role === 'owner'
                      ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
                      : m.role === 'admin'
                      ? 'bg-[#00a884]/15 text-[#00a884] border border-[#00a884]/30'
                      : 'bg-[#2a3942] text-[#8696a0]'
                  }`}>
                    {m.role}
                  </span>

                  {/* Remove button — admin only, not self, not owner */}
                  {canRemove && (
                    <button
                      onClick={() => handleRemove(m.user_id)}
                      disabled={isRemoving}
                      title="Remove from organization"
                      className="ml-1 p-1.5 rounded-lg text-red-500/40 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    >
                      {isRemoving ? (
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                      ) : (
                        <UserMinus className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmptyTeamState;
