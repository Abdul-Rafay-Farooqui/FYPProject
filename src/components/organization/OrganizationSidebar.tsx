import { Edit2, Trash2, UserPlus, Building2 } from 'lucide-react';

const OrganizationSidebar = ({
  organizations,
  selectedOrg,
  setSelectedOrg,
  selectedTeam,
  setSelectedTeam,
  isLoading,
  error,
  onRetry,
  onCreateOrganization,
  onEditOrganization,
  onCreateTeam,
  onAddOrgMembers,
  onAddTeamMembers,
  onDeleteOrg,
  onEditTeam,
  isOrgAdmin,
  isTeamAdmin,
}: any) => (
  <div className="w-[300px] bg-[#111b21] border-r border-[#222d34] flex flex-col">
    {/* Header */}
    <div className="p-4 border-b border-[#222d34]">
      <h2 className="text-[#e9edef] text-lg font-bold mb-3 tracking-tight">Organizations</h2>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={onCreateOrganization}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#00a884]/15 text-[#00a884] border border-[#00a884]/30 hover:bg-[#00a884]/25 transition-all"
        >
          <Building2 className="w-3.5 h-3.5" />
          New Org
        </button>
        <button
          onClick={onCreateTeam}
          disabled={!selectedOrg}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#202c33] text-[#8696a0] border border-[#2a3942] hover:text-[#e9edef] hover:bg-[#2a3942] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          👥 New Team
        </button>
        <button
          onClick={onAddOrgMembers}
          disabled={!selectedOrg}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#202c33] text-[#8696a0] border border-[#2a3942] hover:text-[#e9edef] hover:bg-[#2a3942] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ➕ Members
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 mt-3">
          <svg className="animate-spin w-3 h-3 text-[#00a884]" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-xs text-[#8696a0]">Loading…</p>
        </div>
      )}
      {!isLoading && error && (
        <button className="btn-ghost mt-2 text-xs" onClick={onRetry}>Retry</button>
      )}
    </div>

    {/* List */}
    <div className="overflow-y-auto custom-scrollbar flex-1">
      {organizations.length === 0 && !isLoading && (
        <div className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[#1e2a30] flex items-center justify-center">
            <Building2 className="w-8 h-8 text-[#8696a0]" />
          </div>
          <p className="text-[#8696a0] text-sm">No organizations yet.</p>
          <button
            onClick={onCreateOrganization}
            className="mt-3 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#00a884]/15 text-[#00a884] border border-[#00a884]/30 hover:bg-[#00a884]/25 transition-all"
          >
            Create one
          </button>
        </div>
      )}

      {organizations.map((org: any) => {
        const isSelected = selectedOrg === org.id;
        return (
          <div key={org.id}>
            {/* Org row */}
            <div className={`flex items-center group transition-all border-l-2 ${
              isSelected ? 'bg-[#202c33] border-[#00a884]' : 'hover:bg-[#1a252c] border-transparent'
            }`}>
              <button
                className="flex-1 text-left px-4 py-3 flex items-center gap-2"
                onClick={() => setSelectedOrg(org.id)}
              >
                {org.logo_url ? (
                  <img 
                    src={org.logo_url} 
                    alt={org.name} 
                    className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <span className="text-xl">{org.icon || '🏢'}</span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[#e9edef] text-sm font-semibold truncate">{org.name}</p>
                  {(org.teams?.length ?? 0) > 0 && (
                    <p className="text-[#8696a0] text-xs">
                      {org.teams.length} team{org.teams.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                {isSelected && (
                  <svg className="w-4 h-4 text-[#00a884] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>

              {/* Edit and Delete org buttons — only shown for admin when org is selected */}
              {isSelected && isOrgAdmin && (
                <div className="flex items-center gap-1 mr-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); onEditOrganization?.(); }}
                    title="Edit organization"
                    className="p-1.5 rounded-lg text-[#8696a0] hover:text-[#00a884] hover:bg-[#00a884]/10 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteOrg(); }}
                    title="Delete organization"
                    className="p-1.5 rounded-lg text-red-500/50 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Teams under selected org */}
            {isSelected && (org.teams || []).map((team: any) => {
              const teamId = typeof team === 'string' ? team : team.id;
              const teamName = typeof team === 'string' ? team : team.name;
              const active = selectedTeam?.id === teamId;
              // Build the full team object so OrgView can check created_by etc.
              const fullTeam = typeof team === 'string' ? { id: team, name: team } : { ...team };

              return (
                <div key={teamId} className="flex items-center group/team">
                  <button
                    className={`flex-1 text-left pl-10 pr-2 py-2 text-sm flex items-center gap-2 transition-all border-l-2 ${
                      active
                        ? 'bg-[#00a884]/15 text-[#e9edef] border-[#00a884]'
                        : 'text-[#8696a0] hover:bg-[#1a252c] border-transparent'
                    }`}
                    onClick={() => setSelectedTeam(fullTeam)}
                  >
                    <span className="text-sm">👥</span>
                    <span className="truncate flex-1">{teamName}</span>
                  </button>
                  {isTeamAdmin && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedTeam(fullTeam); onEditTeam?.(fullTeam); }}
                      title="Edit team"
                      className="mr-1 p-1 rounded text-[#8696a0] hover:text-[#00a884] hover:bg-[#00a884]/10 transition-all opacity-0 group-hover/team:opacity-100 text-xs"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedTeam(fullTeam); onAddTeamMembers?.(fullTeam); }}
                    title="Add members to team"
                    className="mr-2 p-1 rounded text-[#8696a0] hover:text-[#00a884] hover:bg-[#00a884]/10 transition-all opacity-0 group-hover/team:opacity-100 text-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  </div>
);

export default OrganizationSidebar;
