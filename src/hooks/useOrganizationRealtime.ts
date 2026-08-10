'use client';

import { useEffect } from 'react';
import { getSocket } from '@/lib/socket';

interface UseOrganizationRealtimeProps {
  organizationId: string | null;
  onCalendarCreated?: (data: any) => void;
  onCalendarDeleted?: (data: any) => void;
  onTaskCreated?: (data: any) => void;
  onTaskUpdated?: (data: any) => void;
  onTaskDeleted?: (data: any) => void;
  onPraiseCreated?: (data: any) => void;
  onAttendanceUpdated?: (data: any) => void;
  onApprovalCreated?: (data: any) => void;
  onApprovalUpdated?: (data: any) => void;
  onMemberAdded?: (data: any) => void;
  onMemberRemoved?: (data: any) => void;
  onTeamCreated?: (data: any) => void;
  onTeamDeleted?: (data: any) => void;
}

export function useOrganizationRealtime({
  organizationId,
  onCalendarCreated,
  onCalendarDeleted,
  onTaskCreated,
  onTaskUpdated,
  onTaskDeleted,
  onPraiseCreated,
  onAttendanceUpdated,
  onApprovalCreated,
  onApprovalUpdated,
  onMemberAdded,
  onMemberRemoved,
  onTeamCreated,
  onTeamDeleted,
}: UseOrganizationRealtimeProps) {
  useEffect(() => {
    if (!organizationId) return;

    const socket = getSocket();

    // Join organization room
    socket.emit('join:organization', { organization_id: organizationId });
    console.log('[Realtime] Joined organization room:', organizationId);

    // Calendar events
    if (onCalendarCreated) {
      socket.on('org:calendar:created', onCalendarCreated);
    }
    if (onCalendarDeleted) {
      socket.on('org:calendar:deleted', onCalendarDeleted);
    }

    // Task events
    if (onTaskCreated) {
      socket.on('org:task:created', onTaskCreated);
    }
    if (onTaskUpdated) {
      socket.on('org:task:updated', onTaskUpdated);
    }
    if (onTaskDeleted) {
      socket.on('org:task:deleted', onTaskDeleted);
    }

    // Praise events
    if (onPraiseCreated) {
      socket.on('org:praise:created', onPraiseCreated);
    }

    // Attendance events
    if (onAttendanceUpdated) {
      socket.on('org:attendance:updated', onAttendanceUpdated);
    }

    // Approval events
    if (onApprovalCreated) {
      socket.on('org:approval:created', onApprovalCreated);
    }
    if (onApprovalUpdated) {
      socket.on('org:approval:updated', onApprovalUpdated);
    }

    // Member events
    if (onMemberAdded) {
      socket.on('org:member:added', onMemberAdded);
    }
    if (onMemberRemoved) {
      socket.on('org:member:removed', onMemberRemoved);
    }

    // Team events
    if (onTeamCreated) {
      socket.on('org:team:created', onTeamCreated);
    }
    if (onTeamDeleted) {
      socket.on('org:team:deleted', onTeamDeleted);
    }

    return () => {
      // Leave organization room
      socket.emit('leave:organization', { organization_id: organizationId });
      console.log('[Realtime] Left organization room:', organizationId);

      // Remove all listeners
      socket.off('org:calendar:created');
      socket.off('org:calendar:deleted');
      socket.off('org:task:created');
      socket.off('org:task:updated');
      socket.off('org:task:deleted');
      socket.off('org:praise:created');
      socket.off('org:attendance:updated');
      socket.off('org:approval:created');
      socket.off('org:approval:updated');
      socket.off('org:member:added');
      socket.off('org:member:removed');
      socket.off('org:team:created');
      socket.off('org:team:deleted');
    };
  }, [
    organizationId,
    onCalendarCreated,
    onCalendarDeleted,
    onTaskCreated,
    onTaskUpdated,
    onTaskDeleted,
    onPraiseCreated,
    onAttendanceUpdated,
    onApprovalCreated,
    onApprovalUpdated,
    onMemberAdded,
    onMemberRemoved,
    onTeamCreated,
    onTeamDeleted,
  ]);
}
