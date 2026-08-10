"use client";

import { useState, useEffect } from "react";
import { InstituteAPI } from "@/lib/api/institute";
import {
  MessageCircle,
  Send,
  BookOpen,
  ChevronRight,
  Clock,
  User,
} from "lucide-react";

interface StudentDiscussionTabProps {
  instituteId: string;
  currentUserId: string;
  enrolledSubjectIds: string[];
  onRefresh: () => void;
}

interface DiscussionThread {
  id: string;
  subject_id: string;
  subject_name: string;
  teacher_id: string;
  teacher_name: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  replies: any[];
  unreadCount: number;
}

export default function StudentDiscussionTab({
  instituteId,
  currentUserId,
  enrolledSubjectIds,
  onRefresh,
}: StudentDiscussionTabProps) {
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    fetchData();
  }, [currentUserId, enrolledSubjectIds]);

  // Mark messages as read when a thread is selected
  useEffect(() => {
    if (selectedThread) {
      markThreadAsRead();
    }
  }, [selectedThread]);

  const markThreadAsRead = async () => {
    if (!selectedThread) return;

    try {
      const threadReplies = discussions.filter((d) => d.parent_id === selectedThread);
      const unreadReplies = threadReplies.filter(
        (reply) => !reply.is_read && reply.created_by !== currentUserId
      );

      for (const reply of unreadReplies) {
        await InstituteAPI.markDiscussionAsRead(reply.id);
      }

      // Refresh to update unread counts
      if (unreadReplies.length > 0) {
        await fetchData();
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const fetchData = async () => {
    if (!currentUserId) return;

    try {
      setLoading(true);
      const [subjectsData, discussionsData] = await Promise.all([
        InstituteAPI.getSubjects(instituteId),
        InstituteAPI.getDiscussions({ student_id: currentUserId }),
      ]);

      // Filter subjects by enrolled IDs
      const enrolledSubjects = subjectsData.filter((subject: any) =>
        enrolledSubjectIds.includes(subject.id)
      );

      setSubjects(enrolledSubjects);
      setDiscussions(discussionsData || []);
    } catch (error) {
      console.error("Error fetching discussions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedThread || !replyText.trim()) return;

    try {
      const parentDiscussion = discussions.find((d) => d.id === selectedThread);
      
      await InstituteAPI.replyToDiscussion(selectedThread, {
        student_id: currentUserId,
        teacher_id: parentDiscussion.teacher_id,
        message: replyText,
        created_by: currentUserId,
      });
      
      setReplyText("");
      fetchData();
    } catch (error) {
      console.error("Failed to send reply:", error);
      alert("Failed to send reply");
    }
  };

  // Group discussions by subject
  const discussionsBySubject: { [key: string]: DiscussionThread[] } = {};
  subjects.forEach((subject) => {
    const subjectDiscussions = discussions
      .filter(
        (d) =>
          d.subject_id === subject.id &&
          d.student_id === currentUserId &&
          !d.parent_id
      )
      .map((d) => ({
        ...d,
        subject_name: subject.name,
        teacher_name: d.teacher?.display_name || d.teacher?.email || "Teacher",
        replies:
          discussions.filter((reply) => reply.parent_id === d.id) || [],
        unreadCount: discussions.filter(
          (reply) =>
            reply.parent_id === d.id &&
            reply.created_by !== currentUserId &&
            !reply.is_read
        ).length,
      }));

    discussionsBySubject[subject.id] = subjectDiscussions;
  });

  const selectedThreadData = selectedThread
    ? discussions.find((d) => d.id === selectedThread)
    : null;
  const threadReplies = selectedThread
    ? discussions
        .filter((d) => d.parent_id === selectedThread)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00a884]" />
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="text-center py-12 bg-[#111b21] rounded-lg border border-[#2a3942]">
        <MessageCircle className="w-12 h-12 mx-auto mb-4 text-[#8696a0]" />
        <p className="text-[#8696a0]">No enrolled courses</p>
        <p className="text-[#8696a0] text-sm mt-2">
          Enroll in courses to start discussions with teachers
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-4" style={{ minHeight: 'min(calc(100vh-250px), 600px)' }}>
      {/* Left Sidebar - Subjects — full width on mobile, fixed on desktop */}
      <div className="w-full md:w-72 md:flex-shrink-0 bg-[#111b21] rounded-lg border border-[#2a3942] flex flex-col max-h-64 md:max-h-none">
        <div className="p-3 md:p-4 border-b border-[#2a3942]">
          <h3 className="text-[#e9edef] font-semibold mb-2 text-sm md:text-base">My Courses</h3>
          <button
            onClick={() => setShowNewModal(true)}
            className="w-full px-3 py-2 bg-[#00a884] text-[#0b141a] rounded-lg hover:bg-[#00a884]/90 transition-colors text-xs md:text-sm font-medium"
          >
            + New Discussion
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {subjects.map((subject) => {
            const subjectThreads = discussionsBySubject[subject.id] || [];
            const totalUnread = subjectThreads.reduce((sum, t) => sum + t.unreadCount, 0);

            return (
              <div
                key={subject.id}
                className={`border-b border-[#2a3942] ${selectedSubject === subject.id ? "bg-[#0b141a]" : ""}`}
              >
                <button
                  onClick={() => setSelectedSubject(selectedSubject === subject.id ? null : subject.id)}
                  className="w-full p-3 md:p-4 text-left hover:bg-[#0b141a] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                      <BookOpen className="w-4 h-4 text-[#00a884] flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[#e9edef] font-medium text-sm truncate">{subject.name}</p>
                        <p className="text-xs text-[#8696a0]">
                          {subjectThreads.length} discussion{subjectThreads.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {totalUnread > 0 && (
                        <span className="bg-[#00a884] text-[#0b141a] text-xs font-bold px-1.5 py-0.5 rounded-full">
                          {totalUnread}
                        </span>
                      )}
                      <ChevronRight className={`w-4 h-4 text-[#8696a0] transition-transform ${selectedSubject === subject.id ? "rotate-90" : ""}`} />
                    </div>
                  </div>
                </button>

                {selectedSubject === subject.id && (
                  <div className="bg-[#0b141a]">
                    {subjectThreads.length > 0 ? (
                      subjectThreads.map((thread) => (
                        <button
                          key={thread.id}
                          onClick={() => setSelectedThread(thread.id)}
                          className={`w-full p-3 px-5 text-left hover:bg-[#1e2a30] transition-colors border-l-2 ${
                            selectedThread === thread.id ? "border-[#00a884] bg-[#1e2a30]" : "border-transparent"
                          }`}
                        >
                          <p className="text-[#e9edef] text-xs font-medium truncate">{thread.title}</p>
                          <div className="flex items-center justify-between mt-0.5">
                            <p className="text-xs text-[#8696a0]">with {thread.teacher_name}</p>
                            {thread.unreadCount > 0 && (
                              <span className="bg-[#00a884] text-[#0b141a] text-xs font-bold px-1.5 py-0.5 rounded-full">
                                {thread.unreadCount}
                              </span>
                            )}
                          </div>
                        </button>
                      ))
                    ) : (
                      <p className="text-xs text-[#8696a0] text-center py-4">No discussions yet</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Panel - Discussion Thread */}
      <div className="flex-1 bg-[#111b21] rounded-lg border border-[#2a3942] flex flex-col min-h-64 md:min-h-0">
        {selectedThread && selectedThreadData ? (
          <>
            {/* Thread Header */}
            <div className="p-4 border-b border-[#2a3942]">
              <h3 className="text-[#e9edef] font-semibold text-lg">
                {selectedThreadData.title}
              </h3>
              <div className="flex items-center gap-2 mt-1 text-sm text-[#8696a0]">
                <User className="w-4 h-4" />
                <span>
                  Discussion with{" "}
                  {selectedThreadData.teacher?.display_name ||
                    selectedThreadData.teacher?.email ||
                    "Teacher"}
                </span>
                <span>•</span>
                <span>
                  {selectedThreadData.subject?.name || "Subject"}
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Original Message */}
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-[#00a884]/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-[#00a884]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[#e9edef] font-medium text-sm">
                      You
                    </span>
                    <span className="text-xs text-[#8696a0]">
                      {new Date(
                        selectedThreadData.created_at
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-[#0b141a] rounded-lg p-3">
                    <p className="text-[#d1d7db] whitespace-pre-wrap">
                      {selectedThreadData.message}
                    </p>
                  </div>
                </div>
              </div>

              {/* Replies */}
              {threadReplies.map((reply) => {
                // Check who actually sent this reply using created_by
                const isTeacher = reply.created_by !== currentUserId;
                return (
                  <div
                    key={reply.id}
                    className={`flex gap-3 ${isTeacher ? "" : "flex-row-reverse"}`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isTeacher
                          ? "bg-blue-500/10"
                          : "bg-[#00a884]/10"
                      }`}
                    >
                      <User
                        className={`w-5 h-5 ${
                          isTeacher ? "text-blue-400" : "text-[#00a884]"
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <div
                        className={`flex items-center gap-2 mb-1 ${
                          isTeacher ? "" : "flex-row-reverse"
                        }`}
                      >
                        <span className="text-[#e9edef] font-medium text-sm">
                          {isTeacher
                            ? reply.teacher?.display_name ||
                              reply.teacher?.email ||
                              "Teacher"
                            : "You"}
                        </span>
                        <span className="text-xs text-[#8696a0]">
                          {new Date(reply.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div
                        className={`rounded-lg p-3 ${
                          isTeacher
                            ? "bg-[#0b141a]"
                            : "bg-[#00a884]/20"
                        }`}
                      >
                        <p className="text-[#d1d7db] whitespace-pre-wrap">
                          {reply.message}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply Input */}
            <div className="p-4 border-t border-[#2a3942]">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendReply()}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 bg-[#0b141a] border border-[#2a3942] rounded-lg text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:border-[#00a884]"
                />
                <button
                  onClick={handleSendReply}
                  disabled={!replyText.trim()}
                  className="px-4 py-2 bg-[#00a884] text-[#0b141a] rounded-lg hover:bg-[#00a884]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-[#8696a0]" />
              <p className="text-[#8696a0]">
                Select a discussion to view messages
              </p>
            </div>
          </div>
        )}
      </div>

      {/* New Discussion Modal */}
      {showNewModal && (
        <NewDiscussionModal
          subjects={subjects}
          instituteId={instituteId}
          currentUserId={currentUserId}
          onClose={() => setShowNewModal(false)}
          onSuccess={() => {
            setShowNewModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

function NewDiscussionModal({
  subjects,
  instituteId,
  currentUserId,
  onClose,
  onSuccess,
}: any) {
  const [subjectId, setSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");

  // Fetch teachers when subject is selected
  useEffect(() => {
    if (subjectId) {
      fetchTeachers();
    }
  }, [subjectId]);

  const fetchTeachers = async () => {
    try {
      const assignments = await InstituteAPI.getSubjectAssignments(instituteId);
      const subjectTeachers = assignments
        .filter((a: any) => a.subject_id === subjectId)
        .map((a: any) => a.teacher);
      setTeachers(subjectTeachers);
      if (subjectTeachers.length > 0) {
        setSelectedTeacher(subjectTeachers[0].id);
      }
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  };

  const handleSubmit = async () => {
    if (!subjectId || !selectedTeacher || !title.trim() || !message.trim()) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      await InstituteAPI.createDiscussion({
        student_id: currentUserId,
        teacher_id: selectedTeacher,
        institute_id: instituteId,
        subject_id: subjectId,
        title,
        message,
        created_by: currentUserId, // Track who created this discussion
      });
      onSuccess();
    } catch (error) {
      alert("Failed to create discussion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111b21] rounded-lg max-w-lg w-full p-6 border border-[#2a3942]">
        <h2 className="text-[#e9edef] text-xl font-semibold mb-4">
          New Discussion
        </h2>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-[#8696a0] text-sm mb-2">
              Subject *
            </label>
            <select
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value);
                setSelectedTeacher("");
              }}
              className="w-full px-3 py-2 bg-[#0b141a] border border-[#2a3942] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884]"
            >
              <option value="">Select a subject</option>
              {subjects.map((subject: any) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          {subjectId && teachers.length > 0 && (
            <div>
              <label className="block text-[#8696a0] text-sm mb-2">
                Teacher *
              </label>
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="w-full px-3 py-2 bg-[#0b141a] border border-[#2a3942] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884]"
              >
                {teachers.map((teacher: any) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.display_name || teacher.email}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[#8696a0] text-sm mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What do you want to discuss?"
              className="w-full px-3 py-2 bg-[#0b141a] border border-[#2a3942] rounded text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:border-[#00a884]"
            />
          </div>

          <div>
            <label className="block text-[#8696a0] text-sm mb-2">
              Message *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your question or topic..."
              className="w-full px-3 py-2 bg-[#0b141a] border border-[#2a3942] rounded text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:border-[#00a884] resize-none"
              rows={5}
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-[#8696a0] hover:bg-[#2a3942] transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded bg-[#00a884] text-[#0b141a] hover:bg-[#00a884]/90 disabled:opacity-50 transition-colors"
            disabled={loading || !subjectId || !selectedTeacher || !title || !message}
          >
            {loading ? "Creating..." : "Start Discussion"}
          </button>
        </div>
      </div>
    </div>
  );
}
