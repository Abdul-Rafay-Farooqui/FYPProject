"use client";

import { useState, useEffect } from "react";
import { OrganizationAPI } from "@/lib/api/organization";
import { useAuthStore } from "@/store/authStore";
import { useOrganizationWorkspace } from "@/hooks/useOrganizationWorkspace";
import { useOrganizationRealtime } from "@/hooks/useOrganizationRealtime";
import OrganizationMembersView from "./OrganizationMembersView";
import {
  AddOrgMembersModal,
  AddTeamMembersModal,
  CreateOrgModal,
  CreateTeamModal,
  DeleteOrgModal,
  DeleteTeamModal,
  EditOrgModal,
  EditTeamModal,
} from "./OrgModals";
import OrganizationSidebar from "./OrganizationSidebar";
import TeamModals from "./TeamModals";
import TeamTabContent from "./TeamTabContent";
import TeamWorkspaceHeader from "./TeamWorkspaceHeader";
import { teamData as defaultTeamData } from "./constants";

const OrgView = ({ 
  onOrgChange,
}: {
  onOrgChange?: (orgId: string | null) => void;
}) => {
  const currentUser = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  const {
    organizationsWithTeams,
    selectedOrg,
    setSelectedOrg,
    selectedTeam,
    setSelectedTeam,
    teamData,
    teamConversationId,
    isOrgsLoading,
    isWorkspaceLoading,
    error,
    setError,
    loadOrganizations,
    loadOrganizationTeams,
    loadTeamWorkspace,
    setTeamData,
  } = useOrganizationWorkspace();

  const [activeTab, setActiveTab] = useState("chat");
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [orgAttendance, setOrgAttendance] = useState<any[]>([]);
  const [orgPraise, setOrgPraise] = useState<any[]>([]);
  const [orgCalendar, setOrgCalendar] = useState<any[]>([]);
  const [orgMeetings, setOrgMeetings] = useState<any[]>([]);

  // ── Modal visibility ──────────────────────────────────────────────────────
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [showEditOrg, setShowEditOrg] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showEditTeam, setShowEditTeam] = useState(false);
  const [showAddOrgMembers, setShowAddOrgMembers] = useState(false);
  const [showAddTeamMembers, setShowAddTeamMembers] = useState(false);
  const [showDeleteTeam, setShowDeleteTeam] = useState(false);
  const [showDeleteOrg, setShowDeleteOrg] = useState(false);

  // ── Derived helpers ───────────────────────────────────────────────────────
  const selectedOrgObj =
    organizationsWithTeams.find((o) => o.id === selectedOrg) ?? null;

  /** Current user's id — handle various field names the backend may use */
  const uid: string | undefined =
    currentUser?.id ?? currentUser?.uid ?? currentUser?.userId;

  /**
   * True if the current user is the admin/creator of the SELECTED ORGANIZATION.
   * We check the current_user_role from the organization membership data.
   */
  const isOrgAdmin = (() => {
    if (!uid || !selectedOrgObj) return false;
    const o = selectedOrgObj as any;
    
    // Check current_user_role from membership
    if (o.current_user_role) {
      return ['owner', 'admin', 'manager'].includes(o.current_user_role);
    }
    
    // Fallback to checking creator fields
    if (o.created_by) return o.created_by === uid;
    if (o.owner_id) return o.owner_id === uid;
    if (o.admin_id) return o.admin_id === uid;
    
    // No creator field → grant delete to all for now (backend will enforce)
    return true;
  })();

  /**
   * True if the current user is the admin/creator of the SELECTED TEAM.
   * selectedTeam stores the full team object from the sidebar.
   */
  const isTeamAdmin = (() => {
    if (!uid || !selectedTeam) return false;
    const t = selectedTeam as any;
    
    // Check current_user_role from team membership (added by backend)
    if (t.current_user_role === 'lead') return true;
    
    // Check if user is team lead from team summary
    if (t.lead_user_id === uid) return true;
    
    // Check current user's role in team members data (from workspace)
    const currentMember = teamData?.members?.find((m: any) => m.id === uid);
    if (currentMember?.role === 'lead') return true;
    
    // Fallback to checking creator fields
    if (t.created_by === uid) return true;
    if (t.owner_id === uid) return true;
    if (t.admin_id === uid) return true;
    if (t.creator_id === uid) return true;
    
    // Fall back to org-admin check (org admins can manage all teams)
    return isOrgAdmin;
  })();

  // ── Org selection ─────────────────────────────────────────────────────────
  const handleSelectOrg = (organizationId: string | null) => {
    if (selectedOrg === organizationId) {
      setSelectedOrg(null);
      setSelectedTeam(null);
      setTeamData(defaultTeamData);
      setOrgAttendance([]);
      setOrgPraise([]);
      return;
    }
    setSelectedOrg(organizationId);
    setSelectedTeam(null);
    setTeamData(defaultTeamData);
    setOrgAttendance([]);
    setOrgPraise([]);
    setOrgCalendar([]);
    setOrgMeetings([]);
    
    // Load organization attendance, praise, and calendar
    if (organizationId) {
      loadOrgAttendance(organizationId);
      loadOrgPraise(organizationId);
      loadOrgCalendar(organizationId);
    }
  };

  // Load organization attendance
  const loadOrgAttendance = async (organizationId: string) => {
    try {
      const data = await OrganizationAPI.getOrgAttendance(organizationId);
      setOrgAttendance(data?.attendance || []);
    } catch (err) {
      console.error('Failed to load org attendance:', err);
      setOrgAttendance([]);
    }
  };

  // Load organization praise
  const loadOrgPraise = async (organizationId: string) => {
    try {
      const data = await OrganizationAPI.getOrgPraise(organizationId);
      setOrgPraise(data?.praise || []);
    } catch (err) {
      console.error('Failed to load org praise:', err);
      setOrgPraise([]);
    }
  };

  // Load organization calendar
  const loadOrgCalendar = async (organizationId: string) => {
    try {
      const data = await OrganizationAPI.getOrgCalendar(organizationId);
      setOrgCalendar(data?.calendar || []);
      setOrgMeetings(data?.meetings || []);
    } catch (err) {
      console.error('Failed to load org calendar:', err);
      setOrgCalendar([]);
      setOrgMeetings([]);
    }
  };

  // Real-time updates for organization
  useOrganizationRealtime({
    organizationId: selectedOrg,
    onCalendarCreated: (data) => {
      console.log('[Realtime] Calendar event created:', data);
      if (selectedOrg) loadOrgCalendar(selectedOrg);
    },
    onCalendarDeleted: (data) => {
      console.log('[Realtime] Calendar event deleted:', data);
      if (selectedOrg) loadOrgCalendar(selectedOrg);
    },
    onTaskCreated: (data) => {
      console.log('[Realtime] Task created:', data);
      if (selectedOrg && selectedTeam?.id) {
        loadTeamWorkspace(selectedOrg, selectedTeam.id);
      }
    },
    onTaskUpdated: (data) => {
      console.log('[Realtime] Task updated:', data);
      if (selectedOrg && selectedTeam?.id) {
        loadTeamWorkspace(selectedOrg, selectedTeam.id);
      }
    },
    onTaskDeleted: (data) => {
      console.log('[Realtime] Task deleted:', data);
      if (selectedOrg && selectedTeam?.id) {
        loadTeamWorkspace(selectedOrg, selectedTeam.id);
      }
    },
    onPraiseCreated: (data) => {
      console.log('[Realtime] Praise created:', data);
      if (selectedOrg) loadOrgPraise(selectedOrg);
    },
    onAttendanceUpdated: (data) => {
      console.log('[Realtime] Attendance updated:', data);
      if (selectedOrg) loadOrgAttendance(selectedOrg);
    },
    onApprovalCreated: (data) => {
      console.log('[Realtime] Approval created:', data);
      if (selectedOrg && selectedTeam?.id) {
        loadTeamWorkspace(selectedOrg, selectedTeam.id);
      }
    },
    onApprovalUpdated: (data) => {
      console.log('[Realtime] Approval updated:', data);
      if (selectedOrg && selectedTeam?.id) {
        loadTeamWorkspace(selectedOrg, selectedTeam.id);
      }
    },
    onMemberAdded: (data) => {
      console.log('[Realtime] Member added:', data);
      if (selectedOrg) loadOrganizationTeams(selectedOrg, true);
    },
    onMemberRemoved: (data) => {
      console.log('[Realtime] Member removed:', data);
      if (selectedOrg) loadOrganizationTeams(selectedOrg, true);
    },
    onTeamCreated: (data) => {
      console.log('[Realtime] Team created:', data);
      if (selectedOrg) loadOrganizationTeams(selectedOrg, true);
    },
    onTeamDeleted: (data) => {
      console.log('[Realtime] Team deleted:', data);
      if (selectedOrg) loadOrganizationTeams(selectedOrg, true);
    },
  });

  // Reload attendance, praise, and calendar when org changes
  useEffect(() => {
    if (selectedOrg) {
      loadOrgAttendance(selectedOrg);
      loadOrgPraise(selectedOrg);
    }
    // Notify parent component about org change
    if (onOrgChange) {
      onOrgChange(selectedOrg);
    }
  }, [selectedOrg, onOrgChange]);

  // ── Create Organization ───────────────────────────────────────────────────
  const handleCreateOrganization = async (name: string, slug: string, description: string, logoUrl?: string) => {
    setError("");
    const created = await OrganizationAPI.createOrganization({
      name,
      ...(slug ? { slug } : {}),
      ...(description ? { description } : {}),
      ...(logoUrl ? { logo_url: logoUrl } : {}),
    });
    await loadOrganizations();
    if (created?.id) {
      setSelectedOrg(created.id);
      await loadOrganizationTeams(created.id, true);
    }
  };

  // ── Update Organization ───────────────────────────────────────────────────
  const handleUpdateOrganization = async (data: { name: string; slug: string; description: string; logo_url?: string; website_url?: string }) => {
    if (!selectedOrg) throw new Error("No organization selected");
    setError("");
    await OrganizationAPI.updateOrganization(selectedOrg, data);
    await loadOrganizations();
    await loadOrganizationTeams(selectedOrg, true);
  };

  // ── Delete Organization ───────────────────────────────────────────────────
  const handleDeleteOrganization = async () => {
    if (!selectedOrg) throw new Error("No organization selected");
    setError("");
    await OrganizationAPI.deleteOrganization(selectedOrg);
    await loadOrganizations();
    setSelectedOrg(null);
    setSelectedTeam(null);
    setTeamData(defaultTeamData);
  };

  // ── Create Team ───────────────────────────────────────────────────────────
  const handleCreateTeam = async (name: string, memberIds: string[]) => {
    if (!selectedOrg) throw new Error("Select an organization first");
    setError("");
    const created = await OrganizationAPI.createTeam(selectedOrg, {
      name,
      member_ids: memberIds,
    });
    await loadOrganizationTeams(selectedOrg, true);
    if (created?.id)
      setSelectedTeam({
        ...created,
        id: created.id,
        name: created.name || name,
      });
  };

  // ── Update Team ───────────────────────────────────────────────────────────
  const handleUpdateTeam = async (data: { name: string; description: string; visibility: 'organization' | 'private' }) => {
    if (!selectedOrg || !selectedTeam?.id) throw new Error("No team selected");
    setError("");
    await OrganizationAPI.updateTeam(selectedOrg, selectedTeam.id, data);
    await loadOrganizationTeams(selectedOrg, true);
    await loadTeamWorkspace(selectedOrg, selectedTeam.id);
  };

  // ── Delete Team ───────────────────────────────────────────────────────────
  const handleDeleteTeam = async () => {
    if (!selectedOrg || !selectedTeam?.id) throw new Error("No team selected");
    setError("");
    await OrganizationAPI.deleteTeam(selectedOrg, selectedTeam.id);
    await loadOrganizationTeams(selectedOrg, true);
    setSelectedTeam(null);
    setTeamData(defaultTeamData);
  };

  // ── Remove Org Member ─────────────────────────────────────────────────────
  const handleRemoveOrgMember = async (userId: string) => {
    if (!selectedOrg) throw new Error("No organization selected");
    setError("");
    await OrganizationAPI.removeOrgMember(selectedOrg, userId);
    await loadOrganizationTeams(selectedOrg, true);
  };

  // ── Update Org Member Role ────────────────────────────────────────────────
  const handleUpdateOrgMemberRole = async (userId: string, newRole: string) => {
    if (!selectedOrg) throw new Error("No organization selected");
    setError("");
    await OrganizationAPI.updateOrgMemberRole(
      selectedOrg,
      userId,
      newRole as "owner" | "admin" | "manager" | "member" | "guest",
    );
    await loadOrganizationTeams(selectedOrg, true);
  };

  // ── Add Org Members ───────────────────────────────────────────────────────
  const handleAddOrgMembers = async (memberIds: string[]) => {
    if (!selectedOrg) throw new Error("Select an organization first");
    setError("");
    await OrganizationAPI.addOrganizationMembers(selectedOrg, memberIds);
    await loadOrganizationTeams(selectedOrg, true);
  };

  // ── Tasks ─────────────────────────────────────────────────────────────────
  const handleAddTask = async (payload: {
    title: string;
    description?: string;
    priority?: string;
    due_date?: string;
  }) => {
    if (!selectedOrg || !selectedTeam?.id) throw new Error("No team selected");
    await OrganizationAPI.createTask(selectedOrg, selectedTeam.id, payload);
    await OrganizationAPI.createActivity(selectedOrg, selectedTeam.id, {
      activity_type: "task_created",
      preview_text: `${profile?.display_name || "Someone"} created task "${payload.title}"`,
    }).catch(() => {});
    await loadTeamWorkspace(selectedOrg, selectedTeam.id);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!selectedOrg || !selectedTeam?.id) throw new Error("No team selected");
    await OrganizationAPI.deleteTask(selectedOrg, selectedTeam.id, taskId);
    await loadTeamWorkspace(selectedOrg, selectedTeam.id);
  };

  const handleUpdateTask = async (taskId: string, status: string) => {
    if (!selectedOrg || !selectedTeam?.id) throw new Error("No team selected");
    await OrganizationAPI.updateTask(selectedOrg, selectedTeam.id, taskId, {
      status,
    });
    if (status === "completed") {
      // find task title from teamData for the activity log
      const task = (teamData.tasks ?? []).find((t: any) => t.id === taskId);
      await OrganizationAPI.createActivity(selectedOrg, selectedTeam.id, {
        activity_type: "task_updated",
        preview_text: `${profile?.display_name || "Someone"} completed task "${task?.title || ""}"`,
      }).catch(() => {});
    }
    await loadTeamWorkspace(selectedOrg, selectedTeam.id);
  };

  // ── Activity ──────────────────────────────────────────────────────────────
  const handleAddActivity = async (payload: {
    activity_type: string;
    preview_text?: string;
  }) => {
    if (!selectedOrg || !selectedTeam?.id) throw new Error("No team selected");
    await OrganizationAPI.createActivity(selectedOrg, selectedTeam.id, payload);
    await loadTeamWorkspace(selectedOrg, selectedTeam.id);
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!selectedOrg || !selectedTeam?.id) throw new Error("No team selected");
    await OrganizationAPI.deleteActivity(
      selectedOrg,
      selectedTeam.id,
      activityId,
    );
    await loadTeamWorkspace(selectedOrg, selectedTeam.id);
  };

  // ── Calendar Events ───────────────────────────────────────────────────────
  const handleAddCalendarEvent = async (payload: {
    title: string;
    description?: string;
    date: string;
    start_time: string;
    end_time?: string;
    location?: string;
    attendee_ids?: string[];
    type?: string;
  }) => {
    if (!selectedOrg) throw new Error("No organization selected");
    await OrganizationAPI.createOrgCalendarEvent(selectedOrg, payload);
    await loadOrgCalendar(selectedOrg);
  };

  const handleDeleteCalendarEvent = async (eventId: string) => {
    if (!selectedOrg) throw new Error("No organization selected");
    await OrganizationAPI.deleteOrgCalendarEvent(selectedOrg, eventId);
    await loadOrgCalendar(selectedOrg);
  };

  // Team-level calendar removed - now organization-level only

  // ── Meetings ──────────────────────────────────────────────────────────────
  const handleScheduleMeeting = async (payload: {
    title: string;
    description?: string;
    starts_at: string;
    ends_at: string;
    location_type?: "online" | "onsite" | "hybrid";
    attendee_ids?: string[];
    meeting_link?: string;
    call_type?: "voice" | "video";
  }) => {
    if (!selectedOrg || !selectedTeam?.id) throw new Error("No team selected");
    await OrganizationAPI.scheduleMeeting(
      selectedOrg,
      selectedTeam.id,
      payload,
    );
    await loadTeamWorkspace(selectedOrg, selectedTeam.id);
  };

  const handleStartMeetingNow = async (payload: {
    title: string;
    description?: string;
    duration_minutes?: number;
    attendee_ids?: string[];
    call_type?: "voice" | "video";
  }) => {
    if (!selectedOrg || !selectedTeam?.id) throw new Error("No team selected");
    const result = await OrganizationAPI.startMeetingNow(
      selectedOrg,
      selectedTeam.id,
      payload,
    );
    await loadTeamWorkspace(selectedOrg, selectedTeam.id);
    return result;
  };

  const handleStartMeeting = async (
    meetingId: string,
    call_type?: "voice" | "video",
  ) => {
    if (!selectedOrg || !selectedTeam?.id) throw new Error("No team selected");
    const result = await OrganizationAPI.startMeeting(
      selectedOrg,
      selectedTeam.id,
      meetingId,
      { call_type },
    );
    await loadTeamWorkspace(selectedOrg, selectedTeam.id);
    return result;
  };

  const handleEndMeeting = async (meetingId: string) => {
    if (!selectedOrg || !selectedTeam?.id) throw new Error("No team selected");
    await OrganizationAPI.endMeeting(selectedOrg, selectedTeam.id, meetingId);
    await loadTeamWorkspace(selectedOrg, selectedTeam.id);
  };

  // ── Attendance ────────────────────────────────────────────────────────────
  const handleClockIn = async () => {
    if (!selectedOrg || !selectedTeam?.id) throw new Error("No team selected");
    await OrganizationAPI.clockIn(selectedOrg, selectedTeam.id);
    await loadTeamWorkspace(selectedOrg, selectedTeam.id);
  };

  const handleClockOut = async () => {
    if (!selectedOrg || !selectedTeam?.id) throw new Error("No team selected");
    await OrganizationAPI.clockOut(selectedOrg, selectedTeam.id);
    await loadTeamWorkspace(selectedOrg, selectedTeam.id);
  };

  // Organization-level attendance
  const handleOrgClockIn = async () => {
    if (!selectedOrg) throw new Error("No organization selected");
    await OrganizationAPI.orgClockIn(selectedOrg);
    await loadOrgAttendance(selectedOrg);
  };

  const handleOrgClockOut = async () => {
    if (!selectedOrg) throw new Error("No organization selected");
    await OrganizationAPI.orgClockOut(selectedOrg);
    await loadOrgAttendance(selectedOrg);
  };

  // ── Approvals ─────────────────────────────────────────────────────────────
  const handleRequestApproval = async (payload: {
    approval_type: string;
    title: string;
    description?: string;
    amount?: string;
  }) => {
    if (!selectedOrg || !selectedTeam?.id) throw new Error("No team selected");
    await OrganizationAPI.createApproval(selectedOrg, selectedTeam.id, payload);
    await loadTeamWorkspace(selectedOrg, selectedTeam.id);
  };

  const handleApproveApproval = async (approvalId: string, note?: string) => {
    if (!selectedOrg || !selectedTeam?.id) throw new Error("No team selected");
    await OrganizationAPI.approveApproval(
      selectedOrg,
      selectedTeam.id,
      approvalId,
      note,
    );
    await loadTeamWorkspace(selectedOrg, selectedTeam.id);
  };

  const handleRejectApproval = async (approvalId: string, note: string) => {
    if (!selectedOrg || !selectedTeam?.id) throw new Error("No team selected");
    await OrganizationAPI.rejectApproval(
      selectedOrg,
      selectedTeam.id,
      approvalId,
      note,
    );
    await loadTeamWorkspace(selectedOrg, selectedTeam.id);
  };

  const handleCancelApproval = async (approvalId: string) => {
    if (!selectedOrg || !selectedTeam?.id) throw new Error("No team selected");
    await OrganizationAPI.cancelApproval(
      selectedOrg,
      selectedTeam.id,
      approvalId,
    );
    await loadTeamWorkspace(selectedOrg, selectedTeam.id);
  };

  // ── Praise ────────────────────────────────────────────────────────────────
  // Team-level praise removed - now organization-level only

  // Organization-level praise
  const handleSendOrgPraise = async (payload: {
    to_user_id: string;
    badge: string;
    message?: string;
  }) => {
    if (!selectedOrg) throw new Error("No organization selected");
    await OrganizationAPI.sendOrgPraise(selectedOrg, payload);
    await loadOrgPraise(selectedOrg);
  };

  // ── Remove Team Member ────────────────────────────────────────────────────
  const handleRemoveTeamMember = async (memberId: string) => {
    if (!selectedOrg || !selectedTeam?.id) throw new Error("No team selected");
    setError("");
    await OrganizationAPI.removeTeamMember(
      selectedOrg,
      selectedTeam.id,
      memberId,
    );
    await loadTeamWorkspace(selectedOrg, selectedTeam.id);
  };

  // ── Update Team Member Role ───────────────────────────────────────────────
  const handleUpdateTeamMemberRole = async (memberId: string, newRole: string) => {
    if (!selectedOrg || !selectedTeam?.id) throw new Error("No team selected");
    setError("");
    await OrganizationAPI.updateTeamMemberRole(
      selectedOrg,
      selectedTeam.id,
      memberId,
      newRole as "lead" | "member" | "guest",
    );
    await loadTeamWorkspace(selectedOrg, selectedTeam.id);
  };

  const handleAddTeamMembers = async (memberIds: string[]) => {
    if (!selectedOrg || !selectedTeam?.id)
      throw new Error("Select a team first");
    setError("");
    const result = await OrganizationAPI.addTeamMembers(
      selectedOrg,
      selectedTeam.id,
      memberIds,
    );
    if (result?.added === 0) {
      throw new Error(
        "These users are not members of this organization. Add them to the org first.",
      );
    }
    // Refresh workspace so members tab updates immediately
    await loadTeamWorkspace(selectedOrg, selectedTeam.id);
    setActiveTab("members");
  };

  return (
    <div className="flex h-full">
      <OrganizationSidebar
        organizations={organizationsWithTeams}
        selectedOrg={selectedOrg}
        setSelectedOrg={handleSelectOrg}
        selectedTeam={selectedTeam}
        setSelectedTeam={setSelectedTeam}
        isLoading={isOrgsLoading}
        error={error}
        onRetry={loadOrganizations}
        onCreateOrganization={() => setShowCreateOrg(true)}
        onEditOrganization={() => setShowEditOrg(true)}
        onCreateTeam={() => {
          if (!selectedOrg) {
            setError("Select an organization first");
            return;
          }
          setShowCreateTeam(true);
        }}
        onAddOrgMembers={() => {
          if (!selectedOrg) {
            setError("Select an organization first");
            return;
          }
          setShowAddOrgMembers(true);
        }}
        onDeleteOrg={() => setShowDeleteOrg(true)}
        onEditTeam={(team: any) => {
          setSelectedTeam(team);
          setShowEditTeam(true);
        }}
        onAddTeamMembers={(team: any) => {
          setSelectedTeam(team);
          setShowAddTeamMembers(true);
        }}
        isOrgAdmin={isOrgAdmin}
        isTeamAdmin={isTeamAdmin}
        isOrgAdmin={isOrgAdmin}
      />

      <div className="flex-1 flex flex-col bg-[#0b141a]">
        {error && (
          <div className="m-4 p-3 rounded border border-red-500/40 bg-red-500/10 text-red-200 text-sm">
            {error}
          </div>
        )}

        {selectedTeam ? (
          <>
            <TeamWorkspaceHeader
              selectedTeam={selectedTeam.name}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              setShowMeetingModal={setShowMeetingModal}
              onCreateTeam={() => setShowCreateTeam(true)}
              onAddTeamMembers={() => setShowAddTeamMembers(true)}
              onDeleteTeam={
                isTeamAdmin ? () => setShowDeleteTeam(true) : undefined
              }
              isTeamAdmin={isTeamAdmin}
            />
            <div className="flex-1 overflow-auto custom-scrollbar p-6">
              {isWorkspaceLoading && (
                <p className="text-[#8696a0] text-sm mb-2">
                  Loading workspace…
                </p>
              )}
              <TeamTabContent
                activeTab={activeTab}
                teamData={teamData}
                selectedTeam={selectedTeam}
                selectedOrg={selectedOrg}
                teamConversationId={teamConversationId}
                onTeamUpdated={(updated: any) => setSelectedTeam(updated)}
                isTeamAdmin={isTeamAdmin}
                currentUserId={uid}
                currentUserName={
                  profile?.display_name ??
                  currentUser?.display_name ??
                  "Someone"
                }
                onRemoveTeamMember={handleRemoveTeamMember}
                onUpdateTeamMemberRole={handleUpdateTeamMemberRole}
                onAddActivity={handleAddActivity}
                onDeleteActivity={handleDeleteActivity}
                onRefreshWorkspace={async () => {
                  if (selectedOrg && selectedTeam?.id)
                    await loadTeamWorkspace(selectedOrg, selectedTeam.id);
                }}
                onAddTask={handleAddTask}
                onDeleteTask={handleDeleteTask}
                onUpdateTask={handleUpdateTask}
                // Calendar removed from team level - now org-level only
                onClockIn={handleClockIn}
                onClockOut={handleClockOut}
                onRequestApproval={handleRequestApproval}
                onApproveApproval={handleApproveApproval}
                onRejectApproval={handleRejectApproval}
                onCancelApproval={handleCancelApproval}
                // onSendPraise removed - now organization-level only
                onScheduleMeeting={handleScheduleMeeting}
                onStartMeetingNow={handleStartMeetingNow}
                onStartMeeting={handleStartMeeting}
                onEndMeeting={handleEndMeeting}
              />
            </div>
            <TeamModals
              showMeetingModal={showMeetingModal}
              setShowMeetingModal={setShowMeetingModal}
              showTaskModal={showTaskModal}
              setShowTaskModal={setShowTaskModal}
            />
          </>
        ) : selectedOrg ? (
          <OrganizationMembersView
            orgName={selectedOrgObj?.name}
            orgMembers={selectedOrgObj?.members ?? []}
            attendance={orgAttendance}
            praise={orgPraise}
            calendar={orgCalendar}
            meetings={orgMeetings}
            isOrgAdmin={isOrgAdmin}
            currentUserId={uid}
            onAddMembers={() => {
              if (!selectedOrg) return;
              setShowAddOrgMembers(true);
            }}
            onRemoveMember={handleRemoveOrgMember}
            onUpdateMemberRole={handleUpdateOrgMemberRole}
            onClockIn={handleOrgClockIn}
            onClockOut={handleOrgClockOut}
            onSendPraise={handleSendOrgPraise}
            onAddCalendarEvent={handleAddCalendarEvent}
            onDeleteCalendarEvent={handleDeleteCalendarEvent}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
            <div className="w-32 h-32 rounded-full bg-[#1e2a30] flex items-center justify-center">
              <span className="text-6xl">🏢</span>
            </div>
            <div className="text-center max-w-md">
              <h2 className="text-[#e9edef] text-2xl font-bold mb-2">
                Welcome to Organizations
              </h2>
              <p className="text-[#8696a0] text-sm mb-6">
                Organizations help you manage teams, projects, and collaborate with your colleagues. 
                Create your first organization to get started.
              </p>
              <button
                onClick={() => setShowCreateOrg(true)}
                className="px-6 py-3 rounded-lg text-sm font-semibold bg-[#00a884] text-[#0b141a] hover:bg-[#00a884]/90 transition-all shadow-lg"
              >
                🏢 Create Organization
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-8 max-w-2xl">
              <div className="text-center p-4 bg-[#111b21] rounded-xl border border-[#222d34]">
                <div className="text-3xl mb-2">👥</div>
                <p className="text-[#e9edef] text-sm font-semibold mb-1">Teams</p>
                <p className="text-[#8696a0] text-xs">Organize members into teams</p>
              </div>
              <div className="text-center p-4 bg-[#111b21] rounded-xl border border-[#222d34]">
                <div className="text-3xl mb-2">📅</div>
                <p className="text-[#e9edef] text-sm font-semibold mb-1">Meetings</p>
                <p className="text-[#8696a0] text-xs">Schedule and manage meetings</p>
              </div>
              <div className="text-center p-4 bg-[#111b21] rounded-xl border border-[#222d34]">
                <div className="text-3xl mb-2">✅</div>
                <p className="text-[#e9edef] text-sm font-semibold mb-1">Tasks</p>
                <p className="text-[#8696a0] text-xs">Track work and assignments</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      <CreateOrgModal
        open={showCreateOrg}
        onClose={() => setShowCreateOrg(false)}
        onSubmit={handleCreateOrganization}
      />
      <EditOrgModal
        open={showEditOrg}
        onClose={() => setShowEditOrg(false)}
        onSubmit={handleUpdateOrganization}
        organization={selectedOrgObj}
      />
      <DeleteOrgModal
        open={showDeleteOrg}
        onClose={() => setShowDeleteOrg(false)}
        onConfirm={handleDeleteOrganization}
        orgName={selectedOrgObj?.name}
      />
      <CreateTeamModal
        open={showCreateTeam}
        onClose={() => setShowCreateTeam(false)}
        onSubmit={handleCreateTeam}
        orgName={selectedOrgObj?.name}
      />
      <EditTeamModal
        open={showEditTeam}
        onClose={() => setShowEditTeam(false)}
        onSubmit={handleUpdateTeam}
        team={selectedTeam}
      />
      <DeleteTeamModal
        open={showDeleteTeam}
        onClose={() => setShowDeleteTeam(false)}
        onConfirm={handleDeleteTeam}
        teamName={selectedTeam?.name}
      />
      <AddOrgMembersModal
        open={showAddOrgMembers}
        onClose={() => setShowAddOrgMembers(false)}
        onSubmit={handleAddOrgMembers}
        orgName={selectedOrgObj?.name}
      />
      <AddTeamMembersModal
        open={showAddTeamMembers}
        onClose={() => setShowAddTeamMembers(false)}
        onSubmit={handleAddTeamMembers}
        teamName={selectedTeam?.name}
        orgMembers={selectedOrgObj?.members ?? []}
        existingMemberIds={(teamData.members ?? []).map((m: any) => m.id)}
      />
    </div>
  );
};

export default OrgView;
