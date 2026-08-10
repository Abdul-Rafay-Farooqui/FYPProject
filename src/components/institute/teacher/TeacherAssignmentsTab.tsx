"use client";

import { useState } from "react";
import { InstituteAPI } from "@/lib/api/institute";

export default function TeacherAssignmentsTab({ courseId, assignments, submissions, onRefresh, instituteId, currentUserId, subjectAssignments }: any) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (confirm("Are you sure you want to delete this assignment?")) {
      await InstituteAPI.deleteHomework(assignmentId);
      onRefresh();
    }
  };

  const assignmentSubmissions = selectedAssignment
    ? submissions.filter((s: any) => s.homework_id === selectedAssignment)
    : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[#e9edef] text-2xl font-semibold">Assignments</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded bg-[#00a884] text-[#0b141a] hover:bg-[#00a884]/90"
        >
          + Create Assignment
        </button>
      </div>

      {!courseId ? (
        <div className="text-center py-12">
          <p className="text-[#8696a0]">Please select a course to view assignments</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assignments List */}
          <div>
            <h3 className="text-[#e9edef] font-medium mb-4">Your Assignments</h3>
            {assignments.length === 0 ? (
              <div className="text-center py-12 bg-[#111b21] rounded-lg border border-[#222d34]">
                <p className="text-[#8696a0]">No assignments yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map((assignment: any) => (
                  <div
                    key={assignment.id}
                    className={`bg-[#111b21] rounded-lg p-4 border cursor-pointer transition-colors ${
                      selectedAssignment === assignment.id
                        ? "border-[#00a884]"
                        : "border-[#222d34] hover:border-[#2a3942]"
                    }`}
                    onClick={() => setSelectedAssignment(assignment.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-[#e9edef] font-medium mb-1">{assignment.title}</h4>
                        {assignment.description && (
                          <p className="text-[#8696a0] text-sm mb-2">{assignment.description}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-[#8696a0]">
                          {assignment.due_date && (
                            <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                          )}
                          <span>
                            {submissions.filter((s: any) => s.homework_id === assignment.id).length} submissions
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAssignment(assignment.id);
                        }}
                        className="text-red-400 hover:text-red-300 p-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submissions */}
          <div>
            <h3 className="text-[#e9edef] font-medium mb-4">
              {selectedAssignment ? "Submissions" : "Select an assignment"}
            </h3>
            {selectedAssignment ? (
              assignmentSubmissions.length === 0 ? (
                <div className="text-center py-12 bg-[#111b21] rounded-lg border border-[#222d34]">
                  <p className="text-[#8696a0]">No submissions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assignmentSubmissions.map((submission: any) => (
                    <div key={submission.id} className="bg-[#111b21] rounded-lg p-4 border border-[#222d34]">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-[#e9edef] font-medium">
                            {submission.student?.display_name || submission.student?.email}
                          </p>
                          <p className="text-[#8696a0] text-xs">
                            {new Date(submission.submitted_date).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-4 h-4 ${
                                i < submission.stars ? "text-yellow-400" : "text-[#222d34]"
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>

                      {submission.submission_text && (
                        <p className="text-[#8696a0] text-sm mb-2">{submission.submission_text}</p>
                      )}

                      {submission.image_url && (
                        <a
                          href={submission.image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-[#00a884] text-sm hover:underline"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          View Attachment
                        </a>
                      )}

                      {submission.teacher_feedback && (
                        <div className="mt-3 p-2 bg-[#0b141a] rounded">
                          <p className="text-[#8696a0] text-xs mb-1">Your Feedback:</p>
                          <p className="text-[#e9edef] text-sm">{submission.teacher_feedback}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-12 bg-[#111b21] rounded-lg border border-[#222d34]">
                <p className="text-[#8696a0]">Select an assignment to view submissions</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showCreateModal && (
        <CreateAssignmentModal
          courseId={courseId}
          instituteId={instituteId}
          currentUserId={currentUserId}
          subjectAssignments={subjectAssignments}
          onClose={() => setShowCreateModal(false)}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}

function CreateAssignmentModal({ courseId, instituteId, currentUserId, subjectAssignments, onClose, onRefresh }: any) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  // Get subject_id from the selected course (subject_assignment)
  const selectedAssignment = subjectAssignments?.find((sa: any) => sa.id === courseId);
  const subjectId = selectedAssignment?.subject_id || null;

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert("Please enter a title");
      return;
    }

    setLoading(true);
    try {
      await InstituteAPI.createHomework({
        title,
        description,
        due_date: dueDate || null,
        teacher_id: currentUserId,
        institute_id: instituteId,
        subject_id: subjectId,
      });

      // Automatically create an announcement for the assignment
      try {
        const dueDateText = dueDate ? ` Due date: ${new Date(dueDate).toLocaleDateString()}.` : '';
        await InstituteAPI.createAnnouncement({
          teacher_id: currentUserId,
          institute_id: instituteId,
          subject_id: subjectId, // Link to the course/subject
          announcement_type: "general",
          title: `New Assignment: ${title}`,
          content: `A new assignment "${title}" has been posted. ${description ? description : ''}${dueDateText}`,
        });
      } catch (err) {
        console.error("Failed to create announcement:", err);
        // Don't fail the assignment creation if announcement fails
      }

      onRefresh();
      onClose();
    } catch (error) {
      console.error("Failed to create assignment:", error);
      alert("Failed to create assignment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111b21] rounded-lg max-w-md w-full p-6 border border-[#222d34]">
        <h2 className="text-[#e9edef] text-xl font-semibold mb-4">Create Assignment</h2>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-[#8696a0] text-sm mb-2">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-[#0b141a] border border-[#222d34] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884]"
              placeholder="Assignment title"
            />
          </div>

          <div>
            <label className="block text-[#8696a0] text-sm mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-[#0b141a] border border-[#222d34] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884] resize-none"
              rows={4}
              placeholder="Assignment description"
            />
          </div>

          <div>
            <label className="block text-[#8696a0] text-sm mb-2">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 bg-[#0b141a] border border-[#222d34] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884]"
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-[#8696a0] hover:bg-[#1e2a30]"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded bg-[#00a884] text-[#0b141a] hover:bg-[#00a884]/90 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Assignment"}
          </button>
        </div>
      </div>
    </div>
  );
}
