"use client";

import { useEffect } from "react";
import { getSocket } from "@/lib/socket";

interface InstituteRealtimeProps {
  onMemberAdded?: (data: any) => void;
  onMemberRemoved?: (data: any) => void;
  onMembersAdded?: (data: any) => void;
  onAnnouncementCreated?: (data: any) => void;
  onAnnouncementDeleted?: (data: any) => void;
  onQuizCreated?: (data: any) => void;
  onQuizUpdated?: (data: any) => void;
  onQuizDeleted?: (data: any) => void;
  onAssignmentCreated?: (data: any) => void;
  onAssignmentUpdated?: (data: any) => void;
  onAssignmentDeleted?: (data: any) => void;
  onSubmissionCreated?: (data: any) => void;
  onSubmissionUpdated?: (data: any) => void;
  onResultCreated?: (data: any) => void;
  onResultUpdated?: (data: any) => void;
  onResultDeleted?: (data: any) => void;
  onDiscussionCreated?: (data: any) => void;
  onDiscussionReplied?: (data: any) => void;
  onResourceCreated?: (data: any) => void;
  onResourceDeleted?: (data: any) => void;
  onLiveClassCreated?: (data: any) => void;
  onLiveClassUpdated?: (data: any) => void;
  onLiveClassDeleted?: (data: any) => void;
  onEnrollmentCreated?: (data: any) => void;
  onEnrollmentDeleted?: (data: any) => void;
}

export function useInstituteRealtime({
  onMemberAdded,
  onMemberRemoved,
  onMembersAdded,
  onAnnouncementCreated,
  onAnnouncementDeleted,
  onQuizCreated,
  onQuizUpdated,
  onQuizDeleted,
  onAssignmentCreated,
  onAssignmentUpdated,
  onAssignmentDeleted,
  onSubmissionCreated,
  onSubmissionUpdated,
  onResultCreated,
  onResultUpdated,
  onResultDeleted,
  onDiscussionCreated,
  onDiscussionReplied,
  onResourceCreated,
  onResourceDeleted,
  onLiveClassCreated,
  onLiveClassUpdated,
  onLiveClassDeleted,
  onEnrollmentCreated,
  onEnrollmentDeleted,
}: InstituteRealtimeProps) {
  useEffect(() => {
    const socket = getSocket();

    // Member events
    if (onMemberAdded) socket.on("institute:member-added", onMemberAdded);
    if (onMemberRemoved) socket.on("institute:member-removed", onMemberRemoved);
    if (onMembersAdded) socket.on("institute:members-added", onMembersAdded);

    // Announcement events
    if (onAnnouncementCreated) socket.on("institute:announcement-created", onAnnouncementCreated);
    if (onAnnouncementDeleted) socket.on("institute:announcement-deleted", onAnnouncementDeleted);

    // Quiz events
    if (onQuizCreated) socket.on("institute:quiz-created", onQuizCreated);
    if (onQuizUpdated) socket.on("institute:quiz-updated", onQuizUpdated);
    if (onQuizDeleted) socket.on("institute:quiz-deleted", onQuizDeleted);

    // Assignment events
    if (onAssignmentCreated) socket.on("institute:assignment-created", onAssignmentCreated);
    if (onAssignmentUpdated) socket.on("institute:assignment-updated", onAssignmentUpdated);
    if (onAssignmentDeleted) socket.on("institute:assignment-deleted", onAssignmentDeleted);

    // Submission events
    if (onSubmissionCreated) socket.on("institute:submission-created", onSubmissionCreated);
    if (onSubmissionUpdated) socket.on("institute:submission-updated", onSubmissionUpdated);

    // Result/Grade events
    if (onResultCreated) socket.on("institute:result-created", onResultCreated);
    if (onResultUpdated) socket.on("institute:result-updated", onResultUpdated);
    if (onResultDeleted) socket.on("institute:result-deleted", onResultDeleted);

    // Discussion events
    if (onDiscussionCreated) socket.on("institute:discussion-created", onDiscussionCreated);
    if (onDiscussionReplied) socket.on("institute:discussion-replied", onDiscussionReplied);

    // Resource events
    if (onResourceCreated) socket.on("institute:resource-created", onResourceCreated);
    if (onResourceDeleted) socket.on("institute:resource-deleted", onResourceDeleted);

    // Live class events
    if (onLiveClassCreated) socket.on("institute:live-class-created", onLiveClassCreated);
    if (onLiveClassUpdated) socket.on("institute:live-class-updated", onLiveClassUpdated);
    if (onLiveClassDeleted) socket.on("institute:live-class-deleted", onLiveClassDeleted);

    // Enrollment events
    if (onEnrollmentCreated) socket.on("institute:enrollment-created", onEnrollmentCreated);
    if (onEnrollmentDeleted) socket.on("institute:enrollment-deleted", onEnrollmentDeleted);

    // Cleanup
    return () => {
      socket.off("institute:member-added", onMemberAdded);
      socket.off("institute:member-removed", onMemberRemoved);
      socket.off("institute:members-added", onMembersAdded);
      socket.off("institute:announcement-created", onAnnouncementCreated);
      socket.off("institute:announcement-deleted", onAnnouncementDeleted);
      socket.off("institute:quiz-created", onQuizCreated);
      socket.off("institute:quiz-updated", onQuizUpdated);
      socket.off("institute:quiz-deleted", onQuizDeleted);
      socket.off("institute:assignment-created", onAssignmentCreated);
      socket.off("institute:assignment-updated", onAssignmentUpdated);
      socket.off("institute:assignment-deleted", onAssignmentDeleted);
      socket.off("institute:submission-created", onSubmissionCreated);
      socket.off("institute:submission-updated", onSubmissionUpdated);
      socket.off("institute:result-created", onResultCreated);
      socket.off("institute:result-updated", onResultUpdated);
      socket.off("institute:result-deleted", onResultDeleted);
      socket.off("institute:discussion-created", onDiscussionCreated);
      socket.off("institute:discussion-replied", onDiscussionReplied);
      socket.off("institute:resource-created", onResourceCreated);
      socket.off("institute:resource-deleted", onResourceDeleted);
      socket.off("institute:live-class-created", onLiveClassCreated);
      socket.off("institute:live-class-updated", onLiveClassUpdated);
      socket.off("institute:live-class-deleted", onLiveClassDeleted);
      socket.off("institute:enrollment-created", onEnrollmentCreated);
      socket.off("institute:enrollment-deleted", onEnrollmentDeleted);
    };
  }, [
    onMemberAdded,
    onMemberRemoved,
    onMembersAdded,
    onAnnouncementCreated,
    onAnnouncementDeleted,
    onQuizCreated,
    onQuizUpdated,
    onQuizDeleted,
    onAssignmentCreated,
    onAssignmentUpdated,
    onAssignmentDeleted,
    onSubmissionCreated,
    onSubmissionUpdated,
    onResultCreated,
    onResultUpdated,
    onResultDeleted,
    onDiscussionCreated,
    onDiscussionReplied,
    onResourceCreated,
    onResourceDeleted,
    onLiveClassCreated,
    onLiveClassUpdated,
    onLiveClassDeleted,
    onEnrollmentCreated,
    onEnrollmentDeleted,
  ]);

  // Function to join an institute room
  const joinInstitute = (instituteId: string) => {
    const socket = getSocket();
    socket.emit("institute:join", { institute_id: instituteId });
  };

  // Function to leave an institute room
  const leaveInstitute = (instituteId: string) => {
    const socket = getSocket();
    socket.emit("institute:leave", { institute_id: instituteId });
  };

  return {
    joinInstitute,
    leaveInstitute,
  };
}
