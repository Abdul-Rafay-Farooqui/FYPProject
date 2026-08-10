'use client';

import { useState } from 'react';
import { Users, UserMinus } from 'lucide-react';
import RoleSelector from '../RoleSelector';

interface Member {
  id: string;
  name: string;
  avatar: string | null;
  phone?: string | null;
  role: string;
  is_online: boolean;
}

interface MembersTabProps {
  members?: Member[];
  isAdmin?: boolean;
  currentUserId?: string;
  onRemove?: (memberId: string) => Promise<void>;
  onUpdateRole?: (memberId: string, newRole: string) => Promise<void>;
}

const MembersTab = ({ members = [], isAdmin, currentUserId, onRemove, onUpdateRole }: MembersTabProps) => {
  const [removingId, setRemovingId] = useState<string | null>(null);

  const teamRoles = [
    { value: 'lead', label: 'Lead', color: 'bg-[#00a884]/15 text-[#00a884] border border-[#00a884]/30' },
    { value: 'member', label: 'Member', color: 'bg-[#2a3942] text-[#8696a0]' },
    { value: 'guest', label: 'Guest', color: 'bg-purple-500/15 text-purple-400 border border-purple-500/30' },
  ];

  const handleRemove = async (member: Member) => {
    if (!onRemove) return;
    setRemovingId(member.id);
    try {
      await onRemove(member.id);
    } finally {
      setRemovingId(null);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    if (!onUpdateRole) return;
    await onUpdateRole(memberId, newRole);
  };

  if (!members.length) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3">
        <div className="w-14 h-14 rounded-full bg-[#1e2a30] flex items-center justify-center">
          <Users className="w-7 h-7 text-[#8696a0]" />
        </div>
        <p className="text-[#8696a0] text-sm">No members in this team yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[#8696a0] text-xs mb-3">
        {members.length} member{members.length !== 1 ? 's' : ''}
      </p>
      {members.map((member) => {
        const isSelf = member.id === currentUserId;
        const canRemove = isAdmin && !isSelf;
        const isRemoving = removingId === member.id;

        return (
          <div
            key={member.id}
            className="flex items-center gap-3 bg-[#111b21] border border-[#222d34] rounded-xl px-4 py-3 group"
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {member.avatar ? (
                <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#2a3942] flex items-center justify-center text-[#00a884] font-bold text-sm">
                  {member.name[0]?.toUpperCase() ?? '?'}
                </div>
              )}
              <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#111b21] ${
                member.is_online ? 'bg-[#00a884]' : 'bg-[#8696a0]'
              }`} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-[#e9edef] text-sm font-medium truncate">
                {member.name}{isSelf ? ' (you)' : ''}
              </p>
              {member.phone && <p className="text-[#8696a0] text-xs truncate">{member.phone}</p>}
            </div>

            {/* Role selector */}
            <RoleSelector
              currentRole={member.role}
              availableRoles={teamRoles}
              onRoleChange={(newRole) => handleRoleChange(member.id, newRole)}
              disabled={isSelf}
              canEdit={isAdmin && !isSelf}
            />

            {/* Remove button — admin only, not self */}
            {canRemove && (
              <button
                onClick={() => handleRemove(member)}
                disabled={isRemoving}
                title="Remove from team"
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
  );
};

export default MembersTab;
