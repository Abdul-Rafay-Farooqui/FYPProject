"use client";

import { useState } from "react";

interface MembersTabProps {
  members: any[];
  teachers: any[];
  students: any[];
  isAdmin: boolean;
  currentUserId?: string;
  onRemoveMember: (memberId: string) => void;
  onUpdateMemberRole: (memberId: string, role: "admin" | "teacher" | "student") => void;
}

export default function MembersTab({
  members,
  teachers,
  students,
  isAdmin,
  currentUserId,
  onRemoveMember,
  onUpdateMemberRole,
}: MembersTabProps) {
  const [filter, setFilter] = useState<"all" | "admin" | "teacher" | "student">("all");

  const filteredMembers = filter === "all" 
    ? members 
    : members.filter((m) => m.role === filter);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-[#e9edef] text-xl md:text-2xl font-semibold flex-shrink-0">Members</h2>
        {/* Filter buttons — scrollable row on mobile */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {(["all", "admin", "teacher", "student"] as const).map((f) => {
            const counts: Record<string, number> = {
              all: members.length,
              admin: members.filter((m) => m.role === "admin").length,
              teacher: teachers.length,
              student: students.length,
            };
            const labels: Record<string, string> = {
              all: "All",
              admin: "Admins",
              teacher: "Teachers",
              student: "Students",
            };
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded text-xs whitespace-nowrap flex-shrink-0 ${
                  filter === f
                    ? "bg-[#00a884] text-[#0b141a] font-medium"
                    : "bg-[#1e2a30] text-[#8696a0] hover:bg-[#2a3942]"
                }`}
              >
                {labels[f]} ({counts[f]})
              </button>
            );
          })}
        </div>
      </div>

      {filteredMembers.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#1e2a30] flex items-center justify-center">
            <svg className="w-10 h-10 text-[#8696a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <p className="text-[#8696a0]">No members found</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className="bg-[#111b21] rounded-lg p-3 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-[#222d34]"
            >
              {/* Left: avatar + info */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 flex-shrink-0 rounded-full bg-[#00a884]/20 flex items-center justify-center">
                  {member.user?.avatar_url ? (
                    <img
                      src={member.user.avatar_url}
                      alt={member.user.display_name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <svg className="w-6 h-6 text-[#00a884]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-[#e9edef] font-medium text-sm truncate">
                    {member.user?.display_name || "Unknown"}
                    {member.user_id === currentUserId && (
                      <span className="ml-2 text-xs text-[#00a884]">(You)</span>
                    )}
                  </h3>
                  <p className="text-[#8696a0] text-xs truncate">
                    {member.user?.email || "No email"}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        member.role === "admin"
                          ? "bg-purple-500/20 text-purple-400"
                          : member.role === "teacher"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-green-500/20 text-green-400"
                      }`}
                    >
                      {member.role}
                    </span>
                    {member.status && (
                      <span className="text-xs text-[#8696a0]">• {member.status}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: role selector + remove — only for admins */}
              {isAdmin && member.user_id !== currentUserId && (
                <div className="flex gap-2 flex-shrink-0 self-end sm:self-auto">
                  <select
                    value={member.role}
                    onChange={(e) => onUpdateMemberRole(member.id, e.target.value as any)}
                    className="px-2 py-1.5 text-xs rounded bg-[#1e2a30] text-[#e9edef] border border-[#222d34] focus:border-[#00a884] outline-none"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    onClick={() => onRemoveMember(member.id)}
                    className="px-2 py-1.5 text-xs rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors whitespace-nowrap"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
