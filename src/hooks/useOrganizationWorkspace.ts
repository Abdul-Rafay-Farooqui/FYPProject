'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { OrganizationAPI } from '@/lib/api/organization';
import { teamData as defaultTeamData } from '@/components/organization/constants';

export function useOrganizationWorkspace() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [orgTeamsById, setOrgTeamsById] = useState<Record<string, any[]>>({});
  const [orgMembersById, setOrgMembersById] = useState<Record<string, any[]>>({});
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [teamData, setTeamData] = useState<any>(defaultTeamData);
  const [teamConversationId, setTeamConversationId] = useState<string | null>(null);
  const [isOrgsLoading, setIsOrgsLoading] = useState(true);
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(false);
  const [error, setError] = useState('');

  const loadOrganizations = useCallback(async () => {
    try {
      setIsOrgsLoading(true);
      setError('');
      const data = await OrganizationAPI.listOrganizations();
      setOrganizations(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || 'Unable to load organizations');
    } finally {
      setIsOrgsLoading(false);
    }
  }, []);

  const loadOrganizationTeams = useCallback(async (organizationId: string, force = false) => {
    if (!organizationId) return;
    if (!force && orgTeamsById[organizationId]) return;
    try {
      setError('');
      const data = await OrganizationAPI.getOrganization(organizationId);
      const teams = Array.isArray(data?.teams) ? data.teams : [];
      const members = Array.isArray(data?.members) ? data.members : [];
      setOrgTeamsById((prev) => ({ ...prev, [organizationId]: teams }));
      setOrgMembersById((prev) => ({ ...prev, [organizationId]: members }));
    } catch (err: any) {
      setError(err?.message || 'Unable to load teams');
    }
  }, [orgTeamsById]);

  const loadTeamWorkspace = useCallback(async (organizationId: string, teamId: string) => {
    if (!organizationId || !teamId) return;
    try {
      setIsWorkspaceLoading(true);
      setError('');
      const data = await OrganizationAPI.getTeamWorkspace(organizationId, teamId);
      setTeamData({ ...defaultTeamData, ...(data?.tabs || {}) });
      setTeamConversationId(data?.chat_conversation_id ?? null);
    } catch (err: any) {
      setError(err?.message || 'Unable to load team workspace');
      setTeamData(defaultTeamData);
      setTeamConversationId(null);
    } finally {
      setIsWorkspaceLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  useEffect(() => {
    if (selectedOrg) loadOrganizationTeams(selectedOrg);
  }, [selectedOrg, loadOrganizationTeams]);

  useEffect(() => {
    if (selectedOrg && selectedTeam?.id) {
      loadTeamWorkspace(selectedOrg, selectedTeam.id);
    }
  }, [selectedOrg, selectedTeam?.id, loadTeamWorkspace]);

  const organizationsWithTeams = useMemo(
    () =>
      organizations.map((org) => ({
        ...org,
        icon: org.icon || '🏢',
        teams: orgTeamsById[org.id] || [],
        members: orgMembersById[org.id] || [],
      })),
    [organizations, orgTeamsById, orgMembersById],
  );

  return {
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
  };
}
