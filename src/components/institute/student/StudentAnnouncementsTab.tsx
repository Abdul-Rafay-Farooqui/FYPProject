"use client";

import { useState, useEffect } from "react";
import { InstituteAPI } from "@/lib/api/institute";
import { Bell, Calendar } from "lucide-react";

interface StudentAnnouncementsTabProps {
  instituteId: string;
  currentUserId: string;
  enrolledSubjectIds: string[];
  onRefresh: () => void;
}

export default function StudentAnnouncementsTab({
  instituteId,
  currentUserId,
  enrolledSubjectIds,
  onRefresh,
}: StudentAnnouncementsTabProps) {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, [currentUserId]);

  const fetchAnnouncements = async () => {
    if (!currentUserId) return;

    try {
      setLoading(true);
      console.log("📢 Fetching announcements for student:", currentUserId);
      const data = await InstituteAPI.getAnnouncements({
        student_id: currentUserId,
      });
      console.log("📢 Fetched announcements:", data);
      console.log("📢 Enrolled subject IDs:", enrolledSubjectIds);
      setAnnouncements(data || []);
    } catch (error) {
      console.error("Error fetching announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00a884]" />
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="text-center py-12 bg-[#111b21] rounded-lg border border-[#2a3942]">
        <Bell className="w-12 h-12 mx-auto mb-4 text-[#8696a0]" />
        <p className="text-[#8696a0]">No announcements yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {announcements.map((announcement) => (
        <div
          key={announcement.id}
          className="bg-[#111b21] rounded-lg border border-[#2a3942] p-6 hover:border-[#00a884] transition-colors"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-[#e9edef] mb-1">
                {announcement.title}
              </h3>
              <div className="flex items-center gap-3 text-sm text-[#8696a0]">
                <span>From: {announcement.teacher?.name || "Teacher"}</span>
                {announcement.subject && (
                  <span className="px-2 py-0.5 bg-[#00a884]/10 text-[#00a884] rounded">
                    {announcement.subject.name}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#8696a0]">
              <Calendar className="w-4 h-4" />
              {new Date(announcement.published_date).toLocaleDateString()}
            </div>
          </div>

          <p className="text-[#d1d7db] whitespace-pre-wrap">
            {announcement.content}
          </p>

          {announcement.announcement_type === "individual" && (
            <div className="mt-3 pt-3 border-t border-[#2a3942]">
              <span className="inline-flex items-center px-2 py-1 bg-purple-500/10 text-purple-400 rounded text-xs font-medium">
                Personal Message
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
