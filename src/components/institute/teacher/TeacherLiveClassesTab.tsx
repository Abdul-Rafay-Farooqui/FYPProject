"use client";

import { useState, useEffect } from "react";
import { InstituteAPI } from "@/lib/api/institute";
import JitsiLiveClassRoom from "./JitsiLiveClassRoom";

export default function TeacherLiveClassesTab({
  assignmentId,
  subjectAssignments,
  liveClasses,
  onRefresh,
  instituteId,
  currentUserId,
  currentUserName,
}: any) {
  const [showCreateModal, setShowCreateModal] = useState<
    false | "schedule" | "instant"
  >(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);

  // Get the actual subject_id from the assignment
  const subject_id =
    subjectAssignments?.find((sa: any) => sa.id === assignmentId)?.subject_id ||
    null;

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this live class?")) {
      await InstituteAPI.deleteLiveClass(id);
      onRefresh();
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
      alert("Failed to join class");
    }
  };

  const handleEndClass = async (classId: string) => {
    try {
      await InstituteAPI.updateLiveClassStatus(classId, "ended");
      onRefresh();
    } catch (error) {
      console.error("Failed to end class:", error);
      alert("Failed to end class");
    }
  };

  const handleClassCreated = async (newClass: any) => {
    // Auto-join the newly created class
    try {
      await InstituteAPI.joinLiveClass(newClass.id);
      setSelectedClass(newClass);
    } catch (error) {
      console.error("Failed to auto-join class:", error);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 md:mb-6">
        <h2 className="text-[#e9edef] text-lg md:text-2xl font-semibold">Live Classes</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowCreateModal("schedule")}
            className="px-3 py-1.5 rounded text-xs md:text-sm bg-[#00a884] text-[#0b141a] hover:bg-[#00a884]/90 font-medium whitespace-nowrap"
          >
            📅 Schedule Class
          </button>
          <button
            onClick={() => setShowCreateModal("instant")}
            className="px-3 py-1.5 rounded text-xs md:text-sm bg-[#0066cc] text-white hover:bg-[#0066cc]/90 font-medium whitespace-nowrap"
          >
            ▶️ Start Instant
          </button>
        </div>
      </div>

      {!subject_id ? (
        <div className="text-center py-12">
          <p className="text-[#8696a0]">Please select a subject</p>
        </div>
      ) : !liveClasses || liveClasses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[#8696a0]">No live classes scheduled</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {liveClasses.map((liveClass: any) => {
            const isLive = liveClass.status === "live";
            const isScheduled = liveClass.status === "scheduled";

            return (
              <div
                key={liveClass.id}
                className="bg-[#111b21] rounded-lg p-3 md:p-4 border border-[#222d34] hover:border-[#00a884]/50 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-[#e9edef] font-medium text-sm md:text-base truncate">
                        {liveClass.title}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium flex-shrink-0 ${
                        isLive ? "bg-red-900/30 text-red-400" : isScheduled ? "bg-yellow-900/30 text-yellow-400" : "bg-gray-900/30 text-gray-400"
                      }`}>
                        {isLive ? "🔴 Live" : isScheduled ? "📅 Scheduled" : "✓ Ended"}
                      </span>
                    </div>
                    {liveClass.description && (
                      <p className="text-[#8696a0] text-sm mb-2">{liveClass.description}</p>
                    )}
                    <div className="text-[#8696a0] text-xs md:text-sm space-y-1">
                      <p>📅 {new Date(liveClass.scheduled_at).toLocaleString()}</p>
                      <p>⏱️ Duration: {liveClass.duration_minutes} minutes</p>
                      {liveClass.subject?.name && (
                        <p className="text-[#00a884] font-medium">📚 {liveClass.subject.name}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex sm:flex-col gap-2 flex-shrink-0">
                    {isLive && (
                      <button
                        onClick={() => handleJoinClass(liveClass)}
                        className="flex-1 sm:flex-none px-3 py-1.5 bg-[#00a884] text-[#0b141a] hover:bg-[#00a884]/90 rounded font-medium text-xs md:text-sm transition whitespace-nowrap"
                      >
                        📹 Join
                      </button>
                    )}
                    {isScheduled && (
                      <button
                        onClick={() => {
                          InstituteAPI.updateLiveClassStatus(liveClass.id, "live").then(() => {
                            onRefresh();
                            setTimeout(() => handleJoinClass(liveClass), 500);
                          });
                        }}
                        className="flex-1 sm:flex-none px-3 py-1.5 bg-[#0066cc] text-white hover:bg-[#0066cc]/90 rounded font-medium text-xs md:text-sm transition whitespace-nowrap"
                      >
                        ▶️ Start
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(liveClass.id)}
                      className="p-1.5 text-red-400 hover:text-red-300 rounded hover:bg-red-500/10 transition flex-shrink-0"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <CreateLiveClassModal
          mode={showCreateModal}
          subject_id={subject_id}
          instituteId={instituteId}
          onClose={() => setShowCreateModal(false)}
          onRefresh={onRefresh}
          onClassCreated={handleClassCreated}
        />
      )}

      {/* Jitsi Live Class Room */}
      {selectedClass && (
        <JitsiLiveClassRoom
          open={!!selectedClass}
          liveClass={selectedClass}
          instituteId={instituteId}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          isTeacher={true}
          onClose={() => setSelectedClass(null)}
          onRefresh={onRefresh}
          onEndClass={handleEndClass}
        />
      )}
    </div>
  );
}

function CreateLiveClassModal({
  mode,
  subject_id,
  instituteId,
  onClose,
  onRefresh,
  onClassCreated,
}: any) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [duration, setDuration] = useState(60);
  const [locationType, setLocationType] = useState<
    "online" | "onsite" | "hybrid"
  >("online");
  const [callType, setCallType] = useState<"voice" | "video">("video");
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);

  // Fetch available subjects to get the name of the selected course
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const data = await InstituteAPI.getSubjects(instituteId);
        setSubjects(data || []);
      } catch (error) {
        console.error("Failed to fetch subjects:", error);
      }
    };

    if (instituteId) {
      fetchSubjects();
    }
  }, [instituteId]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert("Please enter a title");
      return;
    }

    if (!subject_id) {
      alert("Please select a subject from the sidebar");
      return;
    }

    if (mode === "schedule" && !scheduledAt) {
      alert("Please select a date and time");
      return;
    }

    if (!instituteId) {
      alert("Institute ID not found. Please reload the page.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title,
        description,
        institute_id: instituteId,
        duration_minutes: duration,
        location_type: locationType,
        call_type: callType,
      };

      if (mode === "schedule") {
        // Convert datetime-local string to ISO format
        // Input format: "2026-05-21T14:30" (local time)
        // Output format: "2026-05-21T14:30:00.000Z" (ISO string)

        // Parse the datetime-local string more reliably
        const [datePart, timePart] = scheduledAt.split("T");
        const isoScheduledAt = `${datePart}T${timePart}:00.000Z`;

        console.log("[Schedule Class] scheduledAt input:", scheduledAt);
        console.log("[Schedule Class] converted ISO:", isoScheduledAt);
        console.log("[Schedule Class] full payload:", {
          ...payload,
          subject_id,
          scheduled_at: isoScheduledAt,
        });

        await InstituteAPI.scheduleClass({
          ...payload,
          subject_id,
          scheduled_at: isoScheduledAt,
        });
      } else {
        console.log("[Start Class Now] payload:", { ...payload, subject_id });
        const createdClass = await InstituteAPI.startClassNow({
          ...payload,
          subject_id,
        });
        console.log("[Start Class Now] Response:", createdClass);

        // Auto-join the newly created class
        if (createdClass && onClassCreated) {
          onClassCreated(createdClass);
        }
      }

      onRefresh();
      onClose();
      alert(
        mode === "schedule"
          ? "Class scheduled successfully!"
          : "Class started! Opening meeting...",
      );
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.message || error?.message || "Unknown error";
      alert(
        `Failed to ${mode === "schedule" ? "schedule" : "start"} live class: ${errorMsg}`,
      );
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111b21] rounded-lg max-w-md w-full max-h-[90vh] flex flex-col border border-[#222d34]">
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <h2 className="text-[#e9edef] text-xl font-semibold mb-4">
            {mode === "schedule"
              ? "📅 Schedule Live Class"
              : "▶️ Start Instant Class"}
          </h2>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-[#8696a0] text-sm mb-2">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Lecture on Calculus"
                className="w-full px-3 py-2 bg-[#0b141a] border border-[#222d34] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884]"
              />
            </div>

            <div>
              <label className="block text-[#8696a0] text-sm mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description (optional)"
                className="w-full px-3 py-2 bg-[#0b141a] border border-[#222d34] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884] h-20 resize-none"
              />
            </div>

            {mode === "schedule" && (
              <div>
                <label className="block text-[#8696a0] text-sm mb-2">
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0b141a] border border-[#222d34] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884]"
                />
              </div>
            )}

            <div>
              <label className="block text-[#8696a0] text-sm mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) =>
                  setDuration(Math.max(15, parseInt(e.target.value)))
                }
                min="15"
                max="480"
                className="w-full px-3 py-2 bg-[#0b141a] border border-[#222d34] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884]"
              />
            </div>

            <div>
              <label className="block text-[#8696a0] text-sm mb-2">
                Location Type
              </label>
              <select
                value={locationType}
                onChange={(e) => setLocationType(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#0b141a] border border-[#222d34] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884]"
              >
                <option value="online">🌐 Online</option>
                <option value="onsite">🏫 Onsite</option>
                <option value="hybrid">🔀 Hybrid</option>
              </select>
            </div>

            <div>
              <label className="block text-[#8696a0] text-sm mb-2">
                Call Type
              </label>
              <select
                value={callType}
                onChange={(e) => setCallType(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#0b141a] border border-[#222d34] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884]"
              >
                <option value="video">📹 Video</option>
                <option value="voice">🎤 Voice Only</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end p-6 border-t border-[#222d34]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-[#8696a0] hover:bg-[#1e2a30] transition"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className={`px-4 py-2 rounded text-white font-medium transition disabled:opacity-50 ${
              mode === "schedule"
                ? "bg-[#00a884] hover:bg-[#00a884]/90"
                : "bg-[#0066cc] hover:bg-[#0066cc]/90"
            }`}
            disabled={loading}
          >
            {loading
              ? "Processing..."
              : mode === "schedule"
                ? "Schedule Class"
                : "Start Class"}
          </button>
        </div>
      </div>
    </div>
  );
}
