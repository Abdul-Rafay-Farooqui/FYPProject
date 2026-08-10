import ActivityTab from "./tabs/ActivityTab";
import ApprovalsTab from "./tabs/ApprovalsTab";
// CalendarTab removed - now organization-level only
import ChatTab from "./tabs/ChatTab";
import FilesTab from "./tabs/FilesTab";
import MeetingsTab from "./tabs/MeetingsTab";
import MembersTab from "./tabs/MembersTab";
// PraiseTab removed - now organization-level only
import TasksTab from "./tabs/TasksTab";

const TeamTabContent = ({
  activeTab,
  teamData,
  selectedTeam,
  selectedOrg,
  teamConversationId,
  onTeamUpdated,
  isTeamAdmin,
  currentUserId,
  currentUserName,
  onRemoveTeamMember,
  onUpdateTeamMemberRole,
  onAddActivity,
  onDeleteActivity,
  onRefreshWorkspace,
  onAddTask,
  onDeleteTask,
  onUpdateTask,
  // onAddCalendarEvent removed - now organization-level only
  // onDeleteCalendarEvent removed - now organization-level only
  onClockIn,
  onClockOut,
  onRequestApproval,
  onApproveApproval,
  onRejectApproval,
  onCancelApproval,
  onSendPraise,
  onScheduleMeeting,
  onStartMeetingNow,
  onStartMeeting,
  onEndMeeting,
}: any) => {
  if (activeTab === "chat")
    return (
      <ChatTab
        selectedTeam={selectedTeam}
        selectedOrg={selectedOrg}
        teamConversationId={teamConversationId}
        onTeamUpdated={onTeamUpdated}
      />
    );
  if (activeTab === "members")
    return (
      <MembersTab
        members={teamData.members}
        isAdmin={isTeamAdmin}
        currentUserId={currentUserId}
        onRemove={onRemoveTeamMember}
        onUpdateRole={onUpdateTeamMemberRole}
      />
    );
  if (activeTab === "activity")
    return (
      <ActivityTab
        activity={teamData.activity}
        isAdmin={isTeamAdmin}
        onAdd={onAddActivity}
        onDelete={onDeleteActivity}
      />
    );
  if (activeTab === "files")
    return (
      <FilesTab
        files={teamData.files}
        conversationId={teamConversationId}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        isAdmin={isTeamAdmin}
        onRefresh={onRefreshWorkspace}
        onAddActivity={onAddActivity}
      />
    );
  if (activeTab === "meetings")
    return (
      <MeetingsTab
        meetings={teamData.meetings}
        members={teamData.members}
        organizationId={selectedOrg}
        teamId={selectedTeam?.id}
        currentUserId={currentUserId}
        isAdmin={isTeamAdmin}
        onScheduleMeeting={onScheduleMeeting}
        onStartMeetingNow={onStartMeetingNow}
        onStartMeeting={onStartMeeting}
        onEndMeeting={onEndMeeting}
        onRefresh={onRefreshWorkspace}
      />
    );
  if (activeTab === "tasks")
    return (
      <TasksTab
        tasks={teamData.tasks}
        teamMembers={(teamData.members ?? []).map((m: any) => ({
          id: m.id,
          name: m.name,
        }))}
        currentUserId={currentUserId}
        isAdmin={isTeamAdmin}
        onAdd={onAddTask}
        onDelete={onDeleteTask}
        onUpdate={onUpdateTask}
      />
    );
  // Calendar tab removed - now organization-level only
  if (activeTab === "approvals")
    return (
      <ApprovalsTab
        approvals={teamData.approvals}
        currentUserId={currentUserId}
        isAdmin={isTeamAdmin}
        onRequestApproval={onRequestApproval}
        onApprove={onApproveApproval}
        onReject={onRejectApproval}
        onCancel={onCancelApproval}
      />
    );
  // Praise tab removed - now organization-level only
  return null;
};

export default TeamTabContent;
