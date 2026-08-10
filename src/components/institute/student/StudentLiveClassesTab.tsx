"use client";

import { useState, useEffect } from "react";
import { InstituteAPI } from "@/lib/api/institute";
import JitsiLiveClassRoom from "../teacher/JitsiLiveClassRoom";

interface StudentLiveClassesTabProps {
  instituteId: string;
  currentUserId: string;
  currentUserName: string;
  enrolledSubjectIds: string[];
  onRefresh: () => void;
}

export default function StudentLiveClassesTab({
  instituteId,
  currentUserId,
  currentUserName,
  enrolledSubjectIds,
  onRefresh,
}: StudentLiveClassesTabProps) {
  const [liveClasses, setLiveClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<any[]>([]);

  // Fetch subjects for display
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const data = await InstituteAPI.getSubjects(instituteId);
        setSubjects(data || []);
      } catch (error) {
        console.error("Failed to fetch subjects:", error);
      }
    };
    fetchSubjects();
  }, [instituteId]);

  // Fetch live classes for enrolled subjects
  useEffect(() => {
    loadLiveClasses();
  }, [instituteId, enrolledSubjectIds]);

  const loadLiveClasses = async () => {
    try {
      setLoading(true);
      // Get all live classes for the institute
      const allClasses = await InstituteAPI.getLiveClasses({
        institute_id: instituteId,
      });

      // Filter to show only classes from enrolled subjects that are not ended
      const filteredClasses = allClasses
        ?.filter(
          (lc: any) =>
            enrolledSubjectIds.includes(lc.subject_id) &&
            lc.status !== "cancelled",
        )
        ?.sort((a: any, b: any) => {
          // Sort by status (live first, then scheduled, then ended) and then by date
          const statusOrder: { [key: string]: number } = {
            live: 0,
            scheduled: 1,
            ended: 2,
          };
          if (statusOrder[a.status] !== statusOrder[b.status]) {
            return statusOrder[a.status] - statusOrder[b.status];
          }
          return (
            new Date(b.scheduled_at).getTime() -
            new Date(a.scheduled_at).getTime()
          );
        }) || [];

      setLiveClasses(filteredClasses);
    } catch (error) {
      console.error("Failed to fetch live classes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClass = async (liveClass: any) => {
    try {
      // Join the class
      await InstituteAPI.joinLiveClass(liveClass.id);
      // Set selected class to open meeting room
      setSelectedClass(liveClass);
    } catch (error) {
      console.error("Failed to join class:", error);
      alert("Failed to join class. Please try again.");
    }
  };

  const getSubjectName = (subjectId: string) => {
    return subjects.find((s: any) => s.id === subjectId)?.name || "Subject";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-[#00a884]/20 border-t-[#00a884] rounded-full animate-spin" />
          <p className="text-[#8696a0]">Loading live classes...</p>
        </div>
      </div>
    );
  }

  // Separate classes by status
  const liveClassesList = liveClasses.filter((c) => c.status === "live");
  const scheduledClasses = liveClasses.filter((c) => c.status === "scheduled");
  const endedClasses = liveClasses.filter((c) => c.status === "ended");

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-[#e9edef] text-2xl font-semibold mb-4">
          Live Classes
        </h2>
      </div>

      {liveClasses.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#00a884]/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[#00a884]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-[#8696a0] mb-2">
            No live classes available yet
          </p>
          <p className="text-[#8696a0] text-sm">
            Scheduled classes will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Live Classes */}
          {liveClassesList.length > 0 && (
            <div>
              <h3 className="text-[#e9edef] text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                Live Now ({liveClassesList.length})
              </h3>
              <div className="grid gap-4">
                {liveClassesList.map((liveClass: any) => (
                  <ClassCard
                    key={liveClass.id}
                    liveClass={liveClass}
                    subjectName={getSubjectName(liveClass.subject_id)}
                    status="live"
                    onJoinClick={() => handleJoinClass(liveClass)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Scheduled Classes */}
          {scheduledClasses.length > 0 && (
            <div>
              <h3 className="text-[#e9edef] text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="text-yellow-400">📅</span>
                Scheduled ({scheduledClasses.length})
              </h3>
              <div className="grid gap-4">
                {scheduledClasses.map((liveClass: any) => (
                  <ClassCard
                    key={liveClass.id}
                    liveClass={liveClass}
                    subjectName={getSubjectName(liveClass.subject_id)}
                    status="scheduled"
                    onJoinClick={() => handleJoinClass(liveClass)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Ended Classes */}
          {endedClasses.length > 0 && (
            <div>
              <h3 className="text-[#e9edef] text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="text-gray-400">✓</span>
                Completed ({endedClasses.length})
              </h3>
              <div className="grid gap-4">
                {endedClasses.map((liveClass: any) => (
                  <ClassCard
                    key={liveClass.id}
                    liveClass={liveClass}
                    subjectName={getSubjectName(liveClass.subject_id)}
                    status="ended"
                    onJoinClick={undefined}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Jitsi Live Class Room */}
      {selectedClass && (
        <JitsiLiveClassRoom
          open={!!selectedClass}
          liveClass={selectedClass}
          instituteId={instituteId}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          isTeacher={false}
          onClose={() => setSelectedClass(null)}
          onRefresh={() => {
            loadLiveClasses();
            onRefresh();
          }}
          onEndClass={undefined}
        />
      )}
    </div>
  );
}

interface ClassCardProps {
  liveClass: any;
  subjectName: string;
  status: "live" | "scheduled" | "ended";
  onJoinClick?: () => void;
}

function ClassCard({
  liveClass,
  subjectName,
  status,
  onJoinClick,
}: ClassCardProps) {
  const isLive = status === "live";
  const isScheduled = status === "scheduled";
  const isEnded = status === "ended";

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="bg-[#111b21] rounded-lg p-4 border border-[#222d34] hover:border-[#00a884]/50 transition">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-[#e9edef] font-medium text-lg">
              {liveClass.title}
            </h3>
            <span
              className={`text-xs px-2 py-1 rounded font-medium whitespace-nowrap ${
                isLive
                  ? "bg-red-900/30 text-red-400"
                  : isScheduled
                    ? "bg-yellow-900/30 text-yellow-400"
                    : "bg-gray-900/30 text-gray-400"
              }`}
            >
              {isLive ? "🔴 Live" : isScheduled ? "📅 Scheduled" : "✓ Ended"}
            </span>
          </div>
          {liveClass.description && (
            <p className="text-[#8696a0] text-sm mb-2">
              {liveClass.description}
            </p>
          )}
          <div className="text-[#8696a0] text-sm space-y-1">
            <p>📅 {formatDateTime(liveClass.scheduled_at)}</p>
            <p>⏱️ Duration: {formatDuration(liveClass.duration_minutes)}</p>
            {liveClass.subject_id && (
              <p className="text-[#00a884] font-medium">📚 {subjectName}</p>
            )}
            {liveClass.location_type && (
              <p>
                📍{" "}
                {liveClass.location_type === "online"
                  ? "🌐 Online"
                  : liveClass.location_type === "onsite"
                    ? "🏫 Onsite"
                    : "🔀 Hybrid"}
              </p>
            )}
            {liveClass.call_type && (
              <p>
                {liveClass.call_type === "video"
                  ? "📹 Video Call"
                  : "🎤 Voice Only"}
              </p>
            )}
          </div>
        </div>

        {/* Join Button */}
        {onJoinClick && (
          <button
            onClick={onJoinClick}
            className={`px-4 py-2 rounded font-medium text-sm transition whitespace-nowrap ml-4 ${
              isLive
                ? "bg-[#00a884] text-[#0b141a] hover:bg-[#00a884]/90"
                : isScheduled
                  ? "bg-[#0066cc] text-white hover:bg-[#0066cc]/90"
                  : "bg-gray-700 text-gray-300 cursor-not-allowed"
            }`}
            disabled={isEnded}
          >
            {isLive ? "📹 Join Now" : isScheduled ? "📝 Join Class" : "Class Ended"}
          </button>
        )}
        {isEnded && (
          <div className="text-[#8696a0] text-sm ml-4 whitespace-nowrap">
            Class Completed
          </div>
        )}
      </div>

      {/* Teacher Info */}
      {liveClass.teacher && (
        <div className="mt-3 pt-3 border-t border-[#222d34]">
          <p className="text-[#8696a0] text-xs">
            👨‍🏫 Instructor: {liveClass.teacher.name}
          </p>
        </div>
      )}
    </div>
  );
}
