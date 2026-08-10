"use client";

import { useState, useEffect } from "react";
import { InstituteAPI } from "@/lib/api/institute";

interface StudentAssignmentsTabProps {
  instituteId: string;
  currentUserId: string;
  enrolledSubjectIds: string[];
  onRefresh?: () => void;
}

interface Assignment {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  teacher?: { id: string; display_name: string };
  subject?: { id: string; name: string };
  image_url?: string;
}

interface Submission {
  id: string;
  homework_id: string;
  student_id: string;
  submission_text?: string;
  image_url?: string;
  submitted_date: string;
  stars?: number;
  teacher_feedback?: string;
}

export default function StudentAssignmentsTab({
  instituteId,
  currentUserId,
  enrolledSubjectIds,
  onRefresh,
}: StudentAssignmentsTabProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<
    string | null
  >(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    loadAssignments();
    loadSubmissions();
  }, [currentUserId, enrolledSubjectIds]);

  const loadAssignments = async () => {
    try {
      if (enrolledSubjectIds.length === 0) {
        setAssignments([]);
        return;
      }

      setLoading(true);
      const subjectIdString = enrolledSubjectIds.join(",");
      const data = await InstituteAPI.getHomework({
        subject_ids: subjectIdString,
      });
      setAssignments(data || []);
    } catch (error) {
      console.error("Failed to load assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async () => {
    try {
      const data = await InstituteAPI.getSubmissions({
        student_id: currentUserId,
      });
      setSubmissions(data || []);
    } catch (error) {
      console.error("Failed to load submissions:", error);
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
      const response = await fetch(`${apiUrl}/media/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("File upload failed");
      }

      const data = await response.json();
      return data.url || data.path;
    } catch (error) {
      console.error("File upload error:", error);
      throw error;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ];

      if (file.size > maxSize) {
        alert("File size must be less than 10MB");
        return;
      }

      if (!allowedTypes.includes(file.type)) {
        alert(
          "Please upload a valid file (Image, PDF, Word document, or PowerPoint)",
        );
        return;
      }

      setSubmissionFile(file);
    }
  };

  const selectedAssignment = assignments.find(
    (a) => a.id === selectedAssignmentId,
  );
  const assignmentSubmission = selectedAssignment
    ? submissions.find((s) => s.homework_id === selectedAssignment.id)
    : null;

  const handleSubmit = async () => {
    if (!selectedAssignment || !submissionFile) {
      alert("Please attach a file");
      return;
    }

    try {
      setSubmissionLoading(true);
      let fileUrl: string | undefined;

      // Upload file
      setUploadProgress(25);
      fileUrl = await uploadFile(submissionFile);
      setUploadProgress(100);

      await InstituteAPI.submitHomework({
        homework_id: selectedAssignment.id,
        student_id: currentUserId,
        submission_text: "",
        image_url: fileUrl,
      });
      setShowSubmitModal(false);
      setSubmissionFile(null);
      setUploadProgress(0);
      loadSubmissions();
      onRefresh?.();
    } catch (error) {
      console.error("Failed to submit:", error);
      alert("Failed to submit assignment");
    } finally {
      setSubmissionLoading(false);
    }
  };

  if (loading) {
    return <div className="text-[#8696a0]">Loading assignments...</div>;
  }

  if (assignments.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#1e2a30] flex items-center justify-center">
          <svg
            className="w-10 h-10 text-[#8696a0]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </div>
        <p className="text-[#8696a0]">
          No assignments in your enrolled courses yet
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Assignments List */}
      <div className="lg:col-span-1">
        <h3 className="text-[#e9edef] text-lg font-semibold mb-4">
          Assignments
        </h3>
        <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
          {assignments.map((assignment) => {
            const submission = submissions.find(
              (s) => s.homework_id === assignment.id,
            );
            const isOverdue =
              assignment.due_date && new Date(assignment.due_date) < new Date();

            return (
              <button
                key={assignment.id}
                onClick={() => setSelectedAssignmentId(assignment.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedAssignmentId === assignment.id
                    ? "border-[#00a884] bg-[#00a884]/10"
                    : "border-[#222d34] bg-[#111b21] hover:border-[#00a884]/50"
                }`}
              >
                <div className="flex items-start gap-2 mb-2">
                  <div className="flex-1">
                    <p className="text-[#e9edef] font-medium text-sm">
                      {assignment.title}
                    </p>
                    <p className="text-[#8696a0] text-xs mt-1">
                      {assignment.subject?.name}
                    </p>
                  </div>
                  {submission ? (
                    <span className="text-xs bg-green-400/20 text-green-400 px-2 py-1 rounded">
                      Submitted
                    </span>
                  ) : isOverdue ? (
                    <span className="text-xs bg-red-400/20 text-red-400 px-2 py-1 rounded">
                      Overdue
                    </span>
                  ) : (
                    <span className="text-xs bg-yellow-400/20 text-yellow-400 px-2 py-1 rounded">
                      Pending
                    </span>
                  )}
                </div>
                {assignment.due_date && (
                  <p className="text-[#8696a0] text-xs">
                    Due: {new Date(assignment.due_date).toLocaleDateString()}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Assignment Details */}
      <div className="lg:col-span-2">
        {selectedAssignment ? (
          <div className="bg-[#111b21] rounded-lg border border-[#222d34] p-6">
            <h2 className="text-[#e9edef] text-lg md:text-2xl font-semibold mb-2">
              {selectedAssignment.title}
            </h2>
            <p className="text-[#00a884] text-sm font-medium mb-4">
              {selectedAssignment.subject?.name}
            </p>

            <div className="space-y-4 mb-6">
              {selectedAssignment.description && (
                <div>
                  <h3 className="text-[#e9edef] font-semibold mb-2">
                    Description
                  </h3>
                  <p className="text-[#8696a0]">
                    {selectedAssignment.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <p className="text-[#8696a0] text-sm">Due Date</p>
                  <p className="text-[#e9edef] font-medium">
                    {selectedAssignment.due_date
                      ? new Date(
                          selectedAssignment.due_date,
                        ).toLocaleDateString()
                      : "No due date"}
                  </p>
                </div>
                <div>
                  <p className="text-[#8696a0] text-sm">Teacher</p>
                  <p className="text-[#e9edef] font-medium">
                    {selectedAssignment.teacher?.display_name || "Unknown"}
                  </p>
                </div>
              </div>

              {selectedAssignment.image_url && (
                <div>
                  <h3 className="text-[#e9edef] font-semibold mb-2">
                    Attachment
                  </h3>
                  <a
                    href={selectedAssignment.image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#00a884] hover:underline text-sm"
                  >
                    View File →
                  </a>
                </div>
              )}
            </div>

            {/* Submission Status */}
            {assignmentSubmission ? (
              <div className="bg-[#0b141a] rounded-lg border border-[#222d34] p-4 mb-6">
                <h3 className="text-[#e9edef] font-semibold mb-3">
                  Your Submission
                </h3>
                <p className="text-[#8696a0] text-sm mb-3">
                  Submitted on{" "}
                  {new Date(
                    assignmentSubmission.submitted_date,
                  ).toLocaleString()}
                </p>
                <p className="text-[#e9edef] mb-4">
                  {assignmentSubmission.submission_text}
                </p>

                {assignmentSubmission.image_url && (
                  <div className="mb-4">
                    <p className="text-[#8696a0] text-sm mb-2">Attached File</p>
                    <a
                      href={assignmentSubmission.image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[#00a884] hover:underline text-sm p-2 bg-[#111b21] rounded border border-[#222d34]"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Download File →
                    </a>
                  </div>
                )}

                {assignmentSubmission.stars !== undefined &&
                  assignmentSubmission.stars > 0 && (
                    <div className="mb-4">
                      <p className="text-[#8696a0] text-sm mb-2">Grade</p>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-lg ${
                              i < assignmentSubmission.stars
                                ? "text-yellow-400"
                                : "text-[#8696a0]"
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {assignmentSubmission.teacher_feedback && (
                  <div>
                    <p className="text-[#8696a0] text-sm mb-2">
                      Teacher Feedback
                    </p>
                    <p className="text-[#e9edef] bg-[#0b141a] p-3 rounded border border-[#222d34]">
                      {assignmentSubmission.teacher_feedback}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="w-full px-4 py-2 rounded-lg bg-[#00a884] text-[#0b141a] hover:bg-[#00a884]/90 font-medium"
              >
                Submit Assignment
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-12 bg-[#111b21] rounded-lg border border-[#222d34]">
            <p className="text-[#8696a0]">
              Select an assignment to view details
            </p>
          </div>
        )}
      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111b21] rounded-xl border border-[#222d34] w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-[#e9edef] text-xl font-semibold mb-4">
              Submit Assignment
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[#8696a0] text-sm font-medium mb-2">
                  Attach File (Optional)
                </label>
                <div className="space-y-2">
                  <label className="flex items-center justify-center w-full px-4 py-3 rounded-lg border-2 border-dashed border-[#222d34] cursor-pointer hover:border-[#00a884]/50 transition-colors">
                    <div className="flex flex-col items-center justify-center">
                      <svg
                        className="w-5 h-5 text-[#8696a0] mb-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      <span className="text-[#8696a0] text-sm">
                        {submissionFile
                          ? submissionFile.name
                          : "Click to upload"}
                      </span>
                      <span className="text-[#8696a0] text-xs">
                        (Images, PDF, Word, PPT • Max 10MB)
                      </span>
                    </div>
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.ppt,.pptx"
                      className="hidden"
                      disabled={submissionLoading}
                    />
                  </label>
                  {submissionFile && (
                    <div className="flex items-center justify-between bg-[#0b141a] p-2 rounded border border-[#00a884]/30">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-[#00a884]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="text-[#e9edef] text-sm">
                          {submissionFile.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSubmissionFile(null)}
                        className="text-[#8696a0] hover:text-red-400 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full bg-[#0b141a] rounded-lg overflow-hidden">
                  <div
                    className="h-2 bg-[#00a884] transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowSubmitModal(false);
                    setSubmissionFile(null);
                    setUploadProgress(0);
                  }}
                  className="flex-1 px-4 py-2 rounded-lg border border-[#222d34] text-[#e9edef] hover:bg-[#0b141a] transition-colors"
                  disabled={submissionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submissionLoading || !submissionFile}
                  className="flex-1 px-4 py-2 rounded-lg bg-[#00a884] text-[#0b141a] hover:bg-[#00a884]/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submissionLoading ? "Uploading..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
