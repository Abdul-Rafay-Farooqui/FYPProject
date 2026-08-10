"use client";

import { useState, useEffect } from "react";
import { Institute } from "@/hooks/useInstituteWorkspace";
import { InstituteAPI } from "@/lib/api/institute";
import { useAuthStore } from "@/store/authStore";

interface InstituteSidebarProps {
  institutes: Institute[];
  selectedInstitute: string | null;
  setSelectedInstitute: (id: string | null) => void;
  isLoading: boolean;
  error: string;
  onRetry: () => void;
  onCreateInstitute: () => void;
  onEditInstitute: () => void;
  onDeleteInstitute: () => void;
  onAddMembers: () => void;
  isAdmin: boolean;
  selectedCourse?: string | null;
  setSelectedCourse?: (courseId: string | null) => void;
}

export default function InstituteSidebar({
  institutes,
  selectedInstitute,
  setSelectedInstitute,
  isLoading,
  error,
  onRetry,
  onCreateInstitute,
  onEditInstitute,
  onDeleteInstitute,
  onAddMembers,
  isAdmin,
  selectedCourse,
  setSelectedCourse,
}: InstituteSidebarProps) {
  const currentUser = useAuthStore((s) => s.user);
  const uid = currentUser?.id ?? currentUser?.uid ?? currentUser?.userId;
  const [assignedSubjects, setAssignedSubjects] = useState<any[]>([]);
  const [showSubjects, setShowSubjects] = useState(false);

  // Get user role for selected institute
  const selectedInstituteObj = institutes.find(
    (i) => i.id === selectedInstitute,
  );
  const userRole = selectedInstituteObj?.current_user_role || "student";
  const isTeacher = userRole === "teacher";

  // Load assigned subjects for teachers
  useEffect(() => {
    if (isTeacher && selectedInstitute && uid) {
      loadAssignedSubjects();
    }
  }, [isTeacher, selectedInstitute, uid]);

  const loadAssignedSubjects = async () => {
    if (!uid || !selectedInstitute) return;
    try {
      const subjects = await InstituteAPI.getTeacherSubjects(
        uid,
        selectedInstitute,
      );
      setAssignedSubjects(subjects);
      // Auto-expand subjects if teacher has courses
      if (subjects.length > 0) {
        setShowSubjects(true);
      }
    } catch (error) {
      console.error("Failed to load assigned subjects:", error);
    }
  };

  return (
    <div className="w-72 h-full bg-[#111b21] border-r border-[#222d34] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#222d34]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[#e9edef] text-lg font-semibold">Institutes</h2>
          <button
            onClick={onCreateInstitute}
            className="p-2 rounded-lg hover:bg-[#1e2a30] text-[#00a884] transition-colors"
            title="Create Institute"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Institute List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading && (
          <div className="p-4 text-center text-[#8696a0] text-sm">
            Loading institutes...
          </div>
        )}

        {error && !isLoading && (
          <div className="p-4">
            <div className="text-red-400 text-sm mb-2">{error}</div>
            <button
              onClick={onRetry}
              className="text-[#00a884] text-sm hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !error && institutes.length === 0 && (
          <div className="p-4 text-center text-[#8696a0] text-sm">
            No institutes yet. Create one to get started.
          </div>
        )}

        {!isLoading &&
          institutes.map((institute) => (
            <div
              key={institute.id}
              className={`group relative ${
                selectedInstitute === institute.id
                  ? "bg-[#1e2a30]"
                  : "hover:bg-[#1e2a30]/50"
              } transition-colors cursor-pointer`}
            >
              <div
                onClick={() => setSelectedInstitute(institute.id)}
                className="p-4 flex items-center gap-3"
              >
                <div className="w-12 h-12 rounded-full bg-[#00a884]/20 flex items-center justify-center flex-shrink-0">
                  {institute.logo_url ? (
                    <img
                      src={institute.logo_url}
                      alt={institute.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl">🏫</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[#e9edef] font-medium truncate">
                    {institute.name}
                  </h3>
                  <p className="text-[#8696a0] text-xs truncate">
                    {institute.current_user_role === "admin" && "Admin"}
                    {institute.current_user_role === "teacher" && "Teacher"}
                    {institute.current_user_role === "student" && "Student"}
                    {institute.members &&
                      ` • ${institute.members.length} members`}
                  </p>
                </div>
              </div>

              {/* Actions for selected institute */}
              {selectedInstitute === institute.id && isAdmin && (
                <div className="px-4 pb-3 flex gap-2">
                  <button
                    onClick={onAddMembers}
                    className="flex-1 px-3 py-1.5 text-xs rounded bg-[#00a884]/20 text-[#00a884] hover:bg-[#00a884]/30 transition-colors"
                  >
                    Add Members
                  </button>
                  <button
                    onClick={onEditInstitute}
                    className="px-3 py-1.5 text-xs rounded bg-[#1e2a30] text-[#8696a0] hover:bg-[#2a3942] transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={onDeleteInstitute}
                    className="px-3 py-1.5 text-xs rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              )}

              {/* Assigned Subjects for Teachers */}
              {selectedInstitute === institute.id &&
                isTeacher &&
                assignedSubjects.length > 0 && (
                  <div className="px-4 pb-3">
                    <button
                      onClick={() => setShowSubjects(!showSubjects)}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm rounded bg-[#1e2a30] text-[#e9edef] hover:bg-[#2a3942] transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-[#00a884]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                          />
                        </svg>
                        My Courses ({assignedSubjects.length})
                      </span>
                      <svg
                        className={`w-4 h-4 transition-transform ${showSubjects ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {showSubjects && (
                      <div className="mt-2 space-y-1">
                        {assignedSubjects.map((assignment: any) => (
                          <button
                            key={assignment.id}
                            onClick={() =>
                              setSelectedCourse &&
                              setSelectedCourse(assignment.id)
                            }
                            className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                              selectedCourse === assignment.id
                                ? "bg-[#00a884]/20 text-[#00a884] border border-[#00a884]/40"
                                : "text-[#8696a0] hover:bg-[#1e2a30] hover:text-[#e9edef]"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-2 h-2 rounded-full ${selectedCourse === assignment.id ? "bg-[#00a884]" : "bg-[#8696a0]"}`}
                              ></div>
                              <span className="font-medium">
                                {assignment.subject?.name}
                              </span>
                              {assignment.subject?.code && (
                                <span className="text-xs opacity-60">
                                  ({assignment.subject.code})
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
            </div>
          ))}
      </div>
    </div>
  );
}
