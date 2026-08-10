"use client";

import { useState } from "react";
import { InstituteAPI } from "@/lib/api/institute";
import { AddAnnouncementModal } from "../InstituteComplexModals";

export default function AnnouncementsTab({
  announcements,
  instituteId,
  isAdmin,
  currentUserId,
  classBatchSections,
  onRefresh,
  courseId,
  subjectAssignments,
}: any) {
  const [showAddModal, setShowAddModal] = useState(false);

  // Get subject_id from the selected course (for teachers)
  const selectedAssignment = subjectAssignments?.find((sa: any) => sa.id === courseId);
  const subjectId = selectedAssignment?.subject_id || null;

  const handleAddAnnouncement = async (data: any) => {
    await InstituteAPI.createAnnouncement({
      ...data,
      teacher_id: currentUserId,
      subject_id: isAdmin ? undefined : subjectId, // Only add subject_id for teachers
    });
    onRefresh();
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (confirm("Are you sure you want to delete this announcement?")) {
      await InstituteAPI.deleteAnnouncement(announcementId);
      onRefresh();
    }
  };

  const getAnnouncementColor = (type: string) => {
    switch (type) {
      case "urgent":
        return "border-red-500/40 bg-red-500/10";
      case "event":
        return "border-blue-500/40 bg-blue-500/10";
      case "holiday":
        return "border-green-500/40 bg-green-500/10";
      default:
        return "border-[#222d34]";
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[#e9edef] text-2xl font-semibold">Announcements</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded bg-[#00a884] text-[#0b141a] hover:bg-[#00a884]/90"
        >
          + New Announcement
        </button>
      </div>
      {announcements.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#1e2a30] flex items-center justify-center">
            <svg className="w-10 h-10 text-[#8696a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <p className="text-[#8696a0]">No announcements yet</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {announcements.map((announcement: any) => (
            <div
              key={announcement.id}
              className={`bg-[#111b21] rounded-lg p-4 border ${getAnnouncementColor(announcement.announcement_type)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-[#e9edef] font-medium">{announcement.title}</h3>
                    <span className="text-xs px-2 py-1 rounded bg-[#0b141a] text-[#8696a0] capitalize">
                      {announcement.announcement_type}
                    </span>
                  </div>
                  <p className="text-[#8696a0] text-sm">{announcement.content}</p>
                  <p className="text-[#8696a0] text-xs mt-2">
                    {new Date(announcement.published_date).toLocaleDateString()}
                  </p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleDeleteAnnouncement(announcement.id)}
                    className="text-red-400 hover:text-red-300 p-2"
                    title="Delete announcement"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AddAnnouncementModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddAnnouncement}
        classBatchSections={classBatchSections}
        currentUserId={currentUserId}
        instituteId={instituteId}
        isAdmin={isAdmin}
      />
    </div>
  );
}
