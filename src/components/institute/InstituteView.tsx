"use client";

import { useState, useEffect } from "react";
import { InstituteAPI } from "@/lib/api/institute";
import { useAuthStore } from "@/store/authStore";
import { useInstituteWorkspace } from "@/hooks/useInstituteWorkspace";
import { useInstituteRealtime } from "@/hooks/useInstituteRealtime";
import InstituteSidebar from "./InstituteSidebar";
import InstituteTabContent from "./InstituteTabContent";
import InstituteHeader from "./InstituteHeader";
import {
  CreateInstituteModal,
  EditInstituteModal,
  DeleteInstituteModal,
  AddMembersModal,
} from "./InstituteModals";

interface InstituteViewProps {
  onInstituteChange?: (instituteId: string | null) => void;
}

const InstituteView = ({ onInstituteChange }: InstituteViewProps) => {
  const currentUser = useAuthStore((s) => s.user);

  const {
    institutes,
    selectedInstitute,
    setSelectedInstitute,
    instituteData,
    isLoading,
    isDataLoading,
    error,
    setError,
    loadInstitutes,
    loadInstituteData,
  } = useInstituteWorkspace();

  const [activeTab, setActiveTab] = useState("overview");
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  // Modal states
  const [showCreateInstitute, setShowCreateInstitute] = useState(false);
  const [showEditInstitute, setShowEditInstitute] = useState(false);
  const [showDeleteInstitute, setShowDeleteInstitute] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);

  // Derived data
  const selectedInstituteObj =
    institutes.find((i) => i.id === selectedInstitute) ?? null;
  const uid = currentUser?.id ?? currentUser?.uid ?? currentUser?.userId;

  // Get user's role in the selected institute
  const userRole: "admin" | "teacher" | "student" = (() => {
    if (!uid || !selectedInstituteObj) return "student";
    const inst = selectedInstituteObj as any;
    if (inst.current_user_role) return inst.current_user_role;
    if (inst.created_by === uid) return "admin";
    return "student";
  })();

  const isAdmin = userRole === "admin";

  // Auto-select first course for teachers when institute data loads
  useEffect(() => {
    if (userRole === "teacher" && !selectedCourse && instituteData.subjectAssignments?.length > 0) {
      setSelectedCourse(instituteData.subjectAssignments[0].id);
    }
  }, [userRole, instituteData.subjectAssignments, selectedCourse]);

  // Real-time updates
  useInstituteRealtime({
    onMemberAdded: (data) => {
      console.log("[Institute] Member added:", data);
      loadInstitutes();
    },
    onMemberRemoved: (data) => {
      console.log("[Institute] Member removed:", data);
      loadInstitutes();
      if (data.institute_id === selectedInstitute) {
        setSelectedInstitute(null);
      }
    },
    onMembersAdded: (data) => {
      console.log("[Institute] Members added:", data);
      if (selectedInstitute && data.institute_id === selectedInstitute) {
        loadInstituteData(selectedInstitute);
      }
    },
    onAnnouncementCreated: (data) => {
      console.log("[Institute] Announcement created:", data);
      if (selectedInstitute && data.institute_id === selectedInstitute) {
        loadInstituteData(selectedInstitute);
      }
    },
    onAnnouncementDeleted: (data) => {
      console.log("[Institute] Announcement deleted:", data);
      if (selectedInstitute && data.institute_id === selectedInstitute) {
        loadInstituteData(selectedInstitute);
      }
    },
    onQuizCreated: (data) => {
      console.log("[Institute] Quiz created:", data);
      if (selectedInstitute && data.institute_id === selectedInstitute) {
        loadInstituteData(selectedInstitute);
      }
    },
    onQuizUpdated: (data) => {
      console.log("[Institute] Quiz updated:", data);
      if (selectedInstitute && data.institute_id === selectedInstitute) {
        loadInstituteData(selectedInstitute);
      }
    },
    onQuizDeleted: (data) => {
      console.log("[Institute] Quiz deleted:", data);
      if (selectedInstitute && data.institute_id === selectedInstitute) {
        loadInstituteData(selectedInstitute);
      }
    },
    onAssignmentCreated: (data) => {
      console.log("[Institute] Assignment created:", data);
      if (selectedInstitute && data.institute_id === selectedInstitute) {
        loadInstituteData(selectedInstitute);
      }
    },
    onAssignmentUpdated: (data) => {
      console.log("[Institute] Assignment updated:", data);
      if (selectedInstitute && data.institute_id === selectedInstitute) {
        loadInstituteData(selectedInstitute);
      }
    },
    onAssignmentDeleted: (data) => {
      console.log("[Institute] Assignment deleted:", data);
      if (selectedInstitute && data.institute_id === selectedInstitute) {
        loadInstituteData(selectedInstitute);
      }
    },
    onSubmissionCreated: (data) => {
      console.log("[Institute] Submission created:", data);
      if (selectedInstitute && data.institute_id === selectedInstitute) {
        loadInstituteData(selectedInstitute);
      }
    },
    onSubmissionUpdated: (data) => {
      console.log("[Institute] Submission updated:", data);
      if (selectedInstitute && data.institute_id === selectedInstitute) {
        loadInstituteData(selectedInstitute);
      }
    },
    onResultCreated: (data) => {
      console.log("[Institute] Result created:", data);
      if (selectedInstitute && data.institute_id === selectedInstitute) {
        loadInstituteData(selectedInstitute);
      }
    },
    onResultUpdated: (data) => {
      console.log("[Institute] Result updated:", data);
      if (selectedInstitute && data.institute_id === selectedInstitute) {
        loadInstituteData(selectedInstitute);
      }
    },
    onResultDeleted: (data) => {
      console.log("[Institute] Result deleted:", data);
      if (selectedInstitute && data.institute_id === selectedInstitute) {
        loadInstituteData(selectedInstitute);
      }
    },
    onDiscussionCreated: (data) => {
      console.log("[Institute] Discussion created:", data);
      if (selectedInstitute && data.institute_id === selectedInstitute) {
        loadInstituteData(selectedInstitute);
      }
    },
    onDiscussionReplied: (data) => {
      console.log("[Institute] Discussion replied:", data);
      if (selectedInstitute && data.institute_id === selectedInstitute) {
        loadInstituteData(selectedInstitute);
      }
    },
    onResourceCreated: (data) => {
      console.log("[Institute] Resource created:", data);
      if (selectedInstitute && data.institute_id === selectedInstitute) {
        loadInstituteData(selectedInstitute);
      }
    },
    onResourceDeleted: (data) => {
      console.log("[Institute] Resource deleted:", data);
      if (selectedInstitute && data.institute_id === selectedInstitute) {
        loadInstituteData(selectedInstitute);
      }
    },
    onLiveClassCreated: (data) => {
      console.log("[Institute] Live class created:", data);
      if (selectedInstitute && data.institute_id === selectedInstitute) {
        loadInstituteData(selectedInstitute);
      }
    },
    onLiveClassUpdated: (data) => {
      console.log("[Institute] Live class updated:", data);
      if (selectedInstitute && data.institute_id === selectedInstitute) {
        loadInstituteData(selectedInstitute);
      }
    },
    onLiveClassDeleted: (data) => {
      console.log("[Institute] Live class deleted:", data);
      if (selectedInstitute && data.institute_id === selectedInstitute) {
        loadInstituteData(selectedInstitute);
      }
    },
    onEnrollmentCreated: (data) => {
      console.log("[Institute] Enrollment created:", data);
      if (selectedInstitute && data.institute_id === selectedInstitute) {
        loadInstituteData(selectedInstitute);
      }
    },
    onEnrollmentDeleted: (data) => {
      console.log("[Institute] Enrollment deleted:", data);
      if (selectedInstitute && data.institute_id === selectedInstitute) {
        loadInstituteData(selectedInstitute);
      }
    },
  });

  // Notify parent when selected institute changes
  useEffect(() => {
    onInstituteChange?.(selectedInstitute);
  }, [selectedInstitute]);

  // Institute selection
  const handleSelectInstitute = (instituteId: string | null) => {
    if (selectedInstitute === instituteId) {
      setSelectedInstitute(null);
      return;
    }
    setSelectedInstitute(instituteId);
  };

  // Create institute
  const handleCreateInstitute = async (
    name: string,
    slug: string,
    description: string,
    logoUrl?: string,
  ) => {
    setError("");
    try {
      const created = await InstituteAPI.createInstitute({
        name,
        ...(slug ? { slug } : {}),
        ...(description ? { description } : {}),
        ...(logoUrl ? { logo_url: logoUrl } : {}),
      });
      await loadInstitutes();
      if (created?.id) {
        setSelectedInstitute(created.id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to create institute");
      throw err;
    }
  };

  // Update institute
  const handleUpdateInstitute = async (data: {
    name: string;
    slug: string;
    description: string;
    logo_url?: string;
    website_url?: string;
  }) => {
    if (!selectedInstitute) throw new Error("No institute selected");
    setError("");
    try {
      await InstituteAPI.updateInstitute(selectedInstitute, data);
      await loadInstitutes();
    } catch (err: any) {
      setError(err.message || "Failed to update institute");
      throw err;
    }
  };

  // Delete institute
  const handleDeleteInstitute = async () => {
    if (!selectedInstitute) throw new Error("No institute selected");
    setError("");
    try {
      await InstituteAPI.deleteInstitute(selectedInstitute);
      await loadInstitutes();
      setSelectedInstitute(null);
    } catch (err: any) {
      setError(err.message || "Failed to delete institute");
      throw err;
    }
  };

  // Add members
  const handleAddMembers = async (
    memberIds: string[],
    role: "admin" | "teacher" | "student",
  ) => {
    if (!selectedInstitute) throw new Error("Select an institute first");
    setError("");
    try {
      await InstituteAPI.addInstituteMembers(
        selectedInstitute,
        memberIds,
        role,
      );
      await loadInstituteData(selectedInstitute);
    } catch (err: any) {
      setError(err.message || "Failed to add members");
      throw err;
    }
  };

  // Remove member
  const handleRemoveMember = async (memberId: string) => {
    if (!selectedInstitute) throw new Error("No institute selected");
    setError("");
    try {
      await InstituteAPI.removeMember(selectedInstitute, memberId);
      await loadInstituteData(selectedInstitute);
    } catch (err: any) {
      setError(err.message || "Failed to remove member");
    }
  };

  // Update member role
  const handleUpdateMemberRole = async (
    memberId: string,
    newRole: "admin" | "teacher" | "student",
  ) => {
    if (!selectedInstitute) throw new Error("No institute selected");
    setError("");
    try {
      await InstituteAPI.updateMemberRole(selectedInstitute, memberId, newRole);
      await loadInstituteData(selectedInstitute);
    } catch (err: any) {
      setError(err.message || "Failed to update member role");
    }
  };

  return (
    <div className="flex h-full overflow-auto">
      <InstituteSidebar
        institutes={institutes}
        selectedInstitute={selectedInstitute}
        setSelectedInstitute={handleSelectInstitute}
        isLoading={isLoading}
        error={error}
        onRetry={loadInstitutes}
        onCreateInstitute={() => setShowCreateInstitute(true)}
        onEditInstitute={() => setShowEditInstitute(true)}
        onDeleteInstitute={() => setShowDeleteInstitute(true)}
        onAddMembers={() => setShowAddMembers(true)}
        isAdmin={isAdmin}
        selectedCourse={selectedCourse}
        setSelectedCourse={setSelectedCourse}
      />

      <div className="flex-1 flex flex-col bg-[#0b141a]">
        {error && (
          <div className="m-4 p-3 rounded border border-red-500/40 bg-red-500/10 text-red-200 text-sm">
            {error}
          </div>
        )}

        {selectedInstitute ? (
          <>
            <InstituteHeader
              instituteName={selectedInstituteObj?.name || ""}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              userRole={userRole}
              onAddMembers={() => setShowAddMembers(true)}
            />
            <div className="flex-1 overflow-auto custom-scrollbar p-6">
              {isDataLoading && (
                <p className="text-[#8696a0] text-sm mb-2">Loading data…</p>
              )}
              <InstituteTabContent
                activeTab={activeTab}
                instituteData={instituteData}
                selectedInstitute={selectedInstitute}
                userRole={userRole}
                currentUserId={uid}
                currentUserName={currentUser?.display_name}
                onRemoveMember={handleRemoveMember}
                onUpdateMemberRole={handleUpdateMemberRole}
                onRefresh={() => loadInstituteData(selectedInstitute)}
                selectedCourse={selectedCourse}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
            <div className="w-32 h-32 rounded-full bg-[#1e2a30] flex items-center justify-center">
              <svg
                className="w-16 h-16 text-[#00a884]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div className="text-center max-w-md">
              <h2 className="text-[#e9edef] text-2xl font-bold mb-2">
                Welcome to Institutes
              </h2>
              <p className="text-[#8696a0] text-sm mb-6">
                Manage your school or institute with teachers, students,
                quizzes, assignments, and more. Create your first institute to
                get started.
              </p>
              <button
                onClick={() => setShowCreateInstitute(true)}
                className="px-6 py-3 rounded-lg text-sm font-semibold bg-[#00a884] text-[#0b141a] hover:bg-[#00a884]/90 transition-all shadow-lg"
              >
                🏫 Create Institute
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-8 max-w-2xl">
              <div className="text-center p-4 bg-[#111b21] rounded-xl border border-[#222d34]">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#00a884]/20 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-[#00a884]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <p className="text-[#e9edef] text-sm font-semibold mb-1">
                  Members
                </p>
                <p className="text-[#8696a0] text-xs">
                  Manage teachers and students
                </p>
              </div>
              <div className="text-center p-4 bg-[#111b21] rounded-xl border border-[#222d34]">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#00a884]/20 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-[#00a884]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                </div>
                <p className="text-[#e9edef] text-sm font-semibold mb-1">
                  Quizzes
                </p>
                <p className="text-[#8696a0] text-xs">
                  Create and manage quizzes
                </p>
              </div>
              <div className="text-center p-4 bg-[#111b21] rounded-xl border border-[#222d34]">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#00a884]/20 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-[#00a884]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <p className="text-[#e9edef] text-sm font-semibold mb-1">
                  Reports
                </p>
                <p className="text-[#8696a0] text-xs">
                  View analytics and insights
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateInstituteModal
        open={showCreateInstitute}
        onClose={() => setShowCreateInstitute(false)}
        onSubmit={handleCreateInstitute}
      />
      <EditInstituteModal
        open={showEditInstitute}
        onClose={() => setShowEditInstitute(false)}
        onSubmit={handleUpdateInstitute}
        institute={selectedInstituteObj}
      />
      <DeleteInstituteModal
        open={showDeleteInstitute}
        onClose={() => setShowDeleteInstitute(false)}
        onConfirm={handleDeleteInstitute}
        instituteName={selectedInstituteObj?.name}
      />
      <AddMembersModal
        open={showAddMembers}
        onClose={() => setShowAddMembers(false)}
        onSubmit={handleAddMembers}
        instituteName={selectedInstituteObj?.name}
      />
    </div>
  );
};

export default InstituteView;
