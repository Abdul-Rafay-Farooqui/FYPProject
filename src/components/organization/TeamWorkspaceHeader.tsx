import { TEAM_TABS } from "./constants";

const TeamWorkspaceHeader = ({
  selectedTeam,
  activeTab,
  setActiveTab,
  onCreateTeam,
  onAddTeamMembers,
  onDeleteTeam,
  isTeamAdmin,
}: any) => (
  <div className="p-4 border-b border-[#222d34] bg-[#111b21]">
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-[#e9edef] text-lg font-semibold flex items-center gap-2">
        <span>👥</span>
        {selectedTeam}
      </h2>

      <div className="flex gap-2 items-center">
        <button
          onClick={onAddTeamMembers}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[#00a884] border border-[#00a884]/30 hover:bg-[#00a884]/10 transition-all"
        >
          + Add Member
        </button>

        {/* Delete team – visible only to the team creator/admin */}
        {isTeamAdmin && onDeleteTeam && (
          <button
            onClick={onDeleteTeam}
            title="Delete this team (admin only)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-400 border border-red-500/30 hover:bg-red-500/10 hover:text-red-300 transition-all"
          >
            🗑️ Delete Team
          </button>
        )}
      </div>
    </div>

    <div className="flex gap-2 flex-wrap">
      {TEAM_TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`px-3 py-1 rounded-md text-sm capitalize ${
            activeTab === tab
              ? "bg-[#00a884] text-[#0b141a]"
              : "bg-transparent text-[#8696a0] hover:bg-[#202c33]"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  </div>
);

export default TeamWorkspaceHeader;
