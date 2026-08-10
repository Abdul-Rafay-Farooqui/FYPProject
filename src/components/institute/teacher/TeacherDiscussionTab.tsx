"use client";

import { useState, useEffect } from "react";
import { InstituteAPI } from "@/lib/api/institute";
import { MessageCircle, Send, User, Clock } from "lucide-react";

export default function TeacherDiscussionTab({
  courseId,
  discussions,
  onRefresh,
  currentUserId,
  subjectId,
}: any) {
  const [allDiscussions, setAllDiscussions] = useState<any[]>([]);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (discussions) {
      // Fetch all discussions with their replies
      fetchDiscussionsWithReplies();
    }
  }, [discussions]);

  // Mark discussion as read when selected
  useEffect(() => {
    if (selectedThread) {
      markThreadAsRead();
    }
  }, [selectedThread]);

  const markThreadAsRead = async () => {
    if (!selectedThread) return;
    
    try {
      const threadData = allDiscussions.find((d) => d.id === selectedThread);
      if (!threadData) return;

      // Mark all unread replies as read
      const unreadReplies = threadData.replies?.filter(
        (reply: any) => !reply.is_read && reply.created_by !== currentUserId
      ) || [];

      for (const reply of unreadReplies) {
        await InstituteAPI.markDiscussionAsRead(reply.id);
      }

      // Refresh to update unread counts
      if (unreadReplies.length > 0) {
        await fetchDiscussionsWithReplies();
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const fetchDiscussionsWithReplies = async () => {
    try {
      const discussionsWithReplies = await Promise.all(
        discussions.map(async (discussion: any) => {
          try {
            const replies = await InstituteAPI.getDiscussionReplies(discussion.id);
            return { ...discussion, replies: replies || [] };
          } catch (error) {
            return { ...discussion, replies: [] };
          }
        })
      );
      setAllDiscussions(discussionsWithReplies);
    } catch (error) {
      console.error("Error fetching replies:", error);
      setAllDiscussions(discussions.map((d: any) => ({ ...d, replies: [] })));
    }
  };

  const handleSendReply = async () => {
    if (!selectedThread || !replyText.trim()) return;

    setLoading(true);
    try {
      const parentDiscussion = allDiscussions.find((d) => d.id === selectedThread);
      
      const replyData = {
        student_id: parentDiscussion.student_id,
        teacher_id: currentUserId,
        message: replyText,
        created_by: currentUserId,
      };
      
      await InstituteAPI.replyToDiscussion(selectedThread, replyData);
      
      setReplyText("");
      await fetchDiscussionsWithReplies();
      onRefresh();
    } catch (error) {
      console.error("Failed to send reply:", error);
      alert("Failed to send reply");
    } finally {
      setLoading(false);
    }
  };

  const selectedThreadData = selectedThread
    ? allDiscussions.find((d) => d.id === selectedThread)
    : null;

  if (!courseId) {
    return (
      <div className="text-center py-12">
        <p className="text-[#8696a0]">Please select a course</p>
      </div>
    );
  }

  if (!discussions || discussions.length === 0) {
    return (
      <div className="text-center py-12 bg-[#111b21] rounded-lg border border-[#2a3942]">
        <MessageCircle className="w-12 h-12 mx-auto mb-4 text-[#8696a0]" />
        <p className="text-[#8696a0]">No student queries yet</p>
        <p className="text-[#8696a0] text-sm mt-2">
          Students will be able to ask questions for this course
        </p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-250px)] flex gap-4">
      {/* Left Sidebar - Discussion List */}
      <div className="w-96 bg-[#111b21] rounded-lg border border-[#2a3942] flex flex-col">
        <div className="p-4 border-b border-[#2a3942]">
          <h3 className="text-[#e9edef] font-semibold">Student Queries</h3>
          <p className="text-xs text-[#8696a0] mt-1">
            {allDiscussions.length} discussion{allDiscussions.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {allDiscussions.map((discussion) => {
            const unreadCount = discussion.replies?.filter(
              (r: any) => !r.is_read && r.created_by !== currentUserId
            ).length || 0;

            return (
              <button
                key={discussion.id}
                onClick={() => setSelectedThread(discussion.id)}
                className={`w-full p-4 text-left hover:bg-[#0b141a] transition-colors border-b border-[#2a3942] ${
                  selectedThread === discussion.id ? "bg-[#0b141a] border-l-4 border-l-[#00a884]" : ""
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <p className="text-[#e9edef] font-medium text-sm line-clamp-1">
                    {discussion.title}
                  </p>
                  {unreadCount > 0 && (
                    <span className="bg-[#00a884] text-[#0b141a] text-xs font-bold px-2 py-0.5 rounded-full ml-2">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-[#8696a0] text-xs line-clamp-2 mb-2">
                  {discussion.message}
                </p>
                <div className="flex items-center gap-2 text-xs text-[#8696a0]">
                  <User className="w-3 h-3" />
                  <span>
                    {discussion.student?.display_name ||
                      discussion.student?.email ||
                      "Student"}
                  </span>
                  <span>•</span>
                  <Clock className="w-3 h-3" />
                  <span>{new Date(discussion.created_at).toLocaleDateString()}</span>
                </div>
                {discussion.replies && discussion.replies.length > 0 && (
                  <p className="text-xs text-[#00a884] mt-1">
                    {discussion.replies.length} repl{discussion.replies.length !== 1 ? "ies" : "y"}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Panel - Discussion Thread */}
      <div className="flex-1 bg-[#111b21] rounded-lg border border-[#2a3942] flex flex-col">
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
                  From{" "}
                  {selectedThreadData.student?.display_name ||
                    selectedThreadData.student?.email ||
                    "Student"}
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Original Message */}
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[#e9edef] font-medium text-sm">
                      {selectedThreadData.student?.display_name ||
                        selectedThreadData.student?.email ||
                        "Student"}
                    </span>
                    <span className="text-xs text-[#8696a0]">
                      {new Date(selectedThreadData.created_at).toLocaleString()}
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
              {selectedThreadData.replies && selectedThreadData.replies.length > 0 && (
                selectedThreadData.replies.map((reply: any) => {
                  const isTeacher = reply.created_by === currentUserId;
                  
                  return (
                    <div
                      key={reply.id}
                      className={`flex gap-3 ${isTeacher ? "flex-row-reverse" : ""}`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isTeacher ? "bg-[#00a884]/10" : "bg-blue-500/10"
                        }`}
                      >
                        <User
                          className={`w-5 h-5 ${
                            isTeacher ? "text-[#00a884]" : "text-blue-400"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <div
                          className={`flex items-center gap-2 mb-1 ${
                            isTeacher ? "flex-row-reverse" : ""
                          }`}
                        >
                          <span className="text-[#e9edef] font-medium text-sm">
                            {isTeacher
                              ? "You"
                              : reply.student?.display_name ||
                                reply.student?.email ||
                                "Student"}
                          </span>
                          <span className="text-xs text-[#8696a0]">
                            {new Date(reply.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div
                          className={`rounded-lg p-3 ${
                            isTeacher ? "bg-[#00a884]/20" : "bg-[#0b141a]"
                          }`}
                        >
                          <p className="text-[#d1d7db] whitespace-pre-wrap">
                            {reply.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Reply Input */}
            <div className="p-4 border-t border-[#2a3942]">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && !loading && handleSendReply()}
                  placeholder="Type your reply..."
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-[#0b141a] border border-[#2a3942] rounded-lg text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:border-[#00a884] disabled:opacity-50"
                />
                <button
                  onClick={handleSendReply}
                  disabled={!replyText.trim() || loading}
                  className="px-4 py-2 bg-[#00a884] text-[#0b141a] rounded-lg hover:bg-[#00a884]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-[#0b141a] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
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
    </div>
  );
}
