"use client";

import { useState, useEffect } from "react";
import { InstituteAPI } from "@/lib/api/institute";

interface AssignCoursesTabProps {
  instituteId: string;
  onRefresh: () => void;
}

export default function AssignCoursesTab({ instituteId, onRefresh }: AssignCoursesTabProps) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classBatchSections, setClassBatchSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedCBS, setSelectedCBS] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, [instituteId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assignmentsData, teachersData, cbsData, subjectsData] = await Promise.all([
        InstituteAPI.getAssignments(),
        InstituteAPI.getMembers(instituteId, "teacher"),
        InstituteAPI.getCBS(),
        InstituteAPI.getSubjects(instituteId),
      ]);
      setAssignments(assignmentsData);
      setTeachers(teachersData);
      setClassBatchSections(cbsData);
      setSubjects(subjectsData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher || !selectedCBS) {
      setError("Please select teacher and class");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      await InstituteAPI.createAssignment({
        teacher_id: selectedTeacher,
        class_batch_section_id: selectedCBS,
        subject_id: selectedSubject || undefined,
      });
      await loadData();
      setShowModal(false);
      setSelectedTeacher("");
      setSelectedCBS("");
      setSelectedSubject("");
      onRefresh();
    } catch (error: any) {
      setError(error.message || "Failed to assign course");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!confirm("Remove this course assignment?")) return;
    try {
      await InstituteAPI.deleteAssignment(assignmentId);
      await loadData();
      onRefresh();
    } catch (error) {
      console.error("Failed to remove assignment:", error);
    }
  };

  if (loading) {
    return <div className="text-[#8696a0]">Loading course assignments...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#e9edef] text-xl font-semibold">Course Assignments</h2>
          <p className="text-[#8696a0] text-sm mt-1">Assign teachers to classes and subjects</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-[#00a884] text-[#0b141a] hover:bg-[#00a884]/90 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Assign Course
        </button>
      </div>

      {/* Assignments List */}
      {assignments.length === 0 ? (
        <div className="text-center py-12 bg-[#111b21] rounded-xl border border-[#222d34]">
          <div className="w-16 h-16 rounded-full bg-[#00a884]/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#00a884]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-[#8696a0] text-sm">No course assignments yet</p>
          <p className="text-[#8696a0] text-xs mt-1">Assign teachers to classes to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="bg-[#111b21] rounded-xl border border-[#222d34] p-6 hover:border-[#00a884]/30 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {/* Teacher Avatar */}
                  <div className="w-12 h-12 rounded-full bg-[#00a884]/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#00a884] text-lg font-semibold">
                      {assignment.teacher?.name?.[0] || "T"}
                    </span>
                  </div>

                  {/* Assignment Details */}
                  <div className="flex-1">
                    <h3 className="text-[#e9edef] font-semibold text-lg">
                      {assignment.teacher?.name || "Unknown Teacher"}
                    </h3>
                    <p className="text-[#8696a0] text-sm mt-1">
                      {assignment.teacher?.email || "No email"}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {/* Class Badge */}
                      <div className="px-3 py-1.5 bg-[#0b141a] rounded-lg border border-[#222d34] flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#00a884]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span className="text-[#e9edef] text-sm">
                          {assignment.class_batch_section?.class?.name || "N/A"} - 
                          {assignment.class_batch_section?.batch?.name || "N/A"} - 
                          {assignment.class_batch_section?.section?.name || "N/A"}
                        </span>
                      </div>

                      {/* Subject Badge */}
                      {assignment.subject && (
                        <div className="px-3 py-1.5 bg-[#0b141a] rounded-lg border border-[#222d34] flex items-center gap-2">
                          <svg className="w-4 h-4 text-[#00a884]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          <span className="text-[#e9edef] text-sm">
                            {assignment.subject?.name}
                            {assignment.subject?.code && ` (${assignment.subject.code})`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => handleRemoveAssignment(assignment.id)}
                  className="p-2 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
                  title="Remove assignment"
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

      {/* Assign Course Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111b21] rounded-xl border border-[#222d34] w-full max-w-md">
            <div className="p-6 border-b border-[#222d34]">
              <h3 className="text-[#e9edef] text-lg font-semibold">Assign Course to Teacher</h3>
            </div>

            <form onSubmit={handleAssignCourse} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/40 text-red-200 text-sm">
                  {error}
                </div>
              )}

              {/* Teacher Selection */}
              <div>
                <label className="block text-[#8696a0] text-sm mb-2">Teacher *</label>
                <select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className="w-full px-4 py-2 bg-[#0b141a] border border-[#222d34] rounded-lg text-[#e9edef] focus:outline-none focus:border-[#00a884]"
                  required
                >
                  <option value="">Select a teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.user_id} value={teacher.user_id}>
                      {teacher.user?.name || teacher.user?.email || "Unknown"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Class-Batch-Section Selection */}
              <div>
                <label className="block text-[#8696a0] text-sm mb-2">Class *</label>
                <select
                  value={selectedCBS}
                  onChange={(e) => setSelectedCBS(e.target.value)}
                  className="w-full px-4 py-2 bg-[#0b141a] border border-[#222d34] rounded-lg text-[#e9edef] focus:outline-none focus:border-[#00a884]"
                  required
                >
                  <option value="">Select a class</option>
                  {classBatchSections.map((cbs) => (
                    <option key={cbs.id} value={cbs.id}>
                      {cbs.class?.name || "N/A"} - {cbs.batch?.name || "N/A"} - {cbs.section?.name || "N/A"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Selection (Optional) */}
              <div>
                <label className="block text-[#8696a0] text-sm mb-2">Subject (Optional)</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-4 py-2 bg-[#0b141a] border border-[#222d34] rounded-lg text-[#e9edef] focus:outline-none focus:border-[#00a884]"
                >
                  <option value="">No specific subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name} {subject.code && `(${subject.code})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setError("");
                    setSelectedTeacher("");
                    setSelectedCBS("");
                    setSelectedSubject("");
                  }}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-[#0b141a] text-[#e9edef] border border-[#222d34] hover:bg-[#1e2a30] transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-[#00a884] text-[#0b141a] hover:bg-[#00a884]/90 transition-colors disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? "Assigning..." : "Assign Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
