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
  <div className="p-3 md:p-4 border-b border-[#222d34] bg-[#111b21]">
    <div className="flex items-center justify-between mb-2 md:mb-3 min-w-0">
      <h2 className="text-[#e9edef] text-base md:text-lg font-semibold flex items-center gap-2 min-w-0 mr-2">
        <span className="flex-shrink-0">👥</span>
        <span className="truncate">{selectedTeam}</span>
      </h2>

      <div className="flex gap-1 md:gap-2 items-center flex-shrink-0">
        <button
          onClick={onAddTeamMembers}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-[#00a884] border border-[#00a884]/30 hover:bg-[#00a884]/10 transition-all whitespace-nowrap"
        >
          + Member
        </button>

        {isTeamAdmin && onDeleteTeam && (
          <button
            onClick={onDeleteTeam}
            title="Delete this team"
            className="p-1.5 rounded-lg text-xs font-medium text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-all"
          >
            🗑️
          </button>
        )}
      </div>
    </div>

    {/* Scrollable tab row — always scrollable, no clipping */}
    <div className="relative">
      <div className="flex gap-1 overflow-x-auto no-scrollbar pb-0.5">
        {TEAM_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-md text-xs capitalize whitespace-nowrap flex-shrink-0 font-medium transition-colors ${
              activeTab === tab
                ? "bg-[#00a884] text-[#0b141a]"
                : "bg-[#202c33] text-[#8696a0] hover:text-[#e9edef]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      {/* Fade hint on right to indicate scrollability */}
      <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#111b21] to-transparent pointer-events-none md:hidden" />
    </div>
  </div>
);

export default TeamWorkspaceHeader;
