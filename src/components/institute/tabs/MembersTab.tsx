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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[#e9edef] text-2xl font-semibold">Members</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded text-sm ${
              filter === "all"
                ? "bg-[#00a884] text-[#0b141a]"
                : "bg-[#1e2a30] text-[#8696a0] hover:bg-[#2a3942]"
            }`}
          >
            All ({members.length})
          </button>
          <button
            onClick={() => setFilter("admin")}
            className={`px-4 py-2 rounded text-sm ${
              filter === "admin"
                ? "bg-[#00a884] text-[#0b141a]"
                : "bg-[#1e2a30] text-[#8696a0] hover:bg-[#2a3942]"
            }`}
          >
            Admins ({members.filter((m) => m.role === "admin").length})
          </button>
          <button
            onClick={() => setFilter("teacher")}
            className={`px-4 py-2 rounded text-sm ${
              filter === "teacher"
                ? "bg-[#00a884] text-[#0b141a]"
                : "bg-[#1e2a30] text-[#8696a0] hover:bg-[#2a3942]"
            }`}
          >
            Teachers ({teachers.length})
          </button>
          <button
            onClick={() => setFilter("student")}
            className={`px-4 py-2 rounded text-sm ${
              filter === "student"
                ? "bg-[#00a884] text-[#0b141a]"
                : "bg-[#1e2a30] text-[#8696a0] hover:bg-[#2a3942]"
            }`}
          >
            Students ({students.length})
          </button>
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
        <div className="grid gap-4">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className="bg-[#111b21] rounded-lg p-4 flex items-center justify-between border border-[#222d34]"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#00a884]/20 flex items-center justify-center">
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
                <div>
                  <h3 className="text-[#e9edef] font-medium">
                    {member.user?.display_name || "Unknown"}
                    {member.user_id === currentUserId && (
                      <span className="ml-2 text-xs text-[#00a884]">(You)</span>
                    )}
                  </h3>
                  <p className="text-[#8696a0] text-sm">
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
                      <span className="text-xs text-[#8696a0]">
                        • {member.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {isAdmin && member.user_id !== currentUserId && (
                <div className="flex gap-2">
                  <select
                    value={member.role}
                    onChange={(e) =>
                      onUpdateMemberRole(member.id, e.target.value as any)
                    }
                    className="px-3 py-1.5 text-sm rounded bg-[#1e2a30] text-[#e9edef] border border-[#222d34] focus:border-[#00a884] outline-none"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    onClick={() => onRemoveMember(member.id)}
                    className="px-3 py-1.5 text-sm rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
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
