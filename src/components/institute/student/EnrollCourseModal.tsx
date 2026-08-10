"use client";

import { useState } from "react";
import { InstituteAPI } from "@/lib/api/institute";

interface EnrollCourseModalProps {
  instituteId: string;
  currentUserId: string;
  onSuccess: () => void;
  onClose: () => void;
}

export default function EnrollCourseModal({
  instituteId,
  currentUserId,
  onSuccess,
  onClose,
}: EnrollCourseModalProps) {
  const [courseCode, setCourseCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!courseCode.trim()) {
      setError("Please enter a course code");
      return;
    }

    try {
      setLoading(true);
      await InstituteAPI.joinCourseByCode({
        student_id: currentUserId,
        course_code: courseCode.trim().toUpperCase(),
        institute_id: instituteId,
      });
      onSuccess();
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to enroll in course";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111b21] rounded-xl border border-[#222d34] w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[#e9edef] text-xl font-semibold">
            Enroll in a Course
          </h3>
          <button
            onClick={onClose}
            className="text-[#8696a0] hover:text-[#e9edef]"
            disabled={loading}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleEnroll} className="space-y-4">
          <div>
            <label className="block text-[#8696a0] text-sm font-medium mb-2">
              Course Code
            </label>
            <input
              type="text"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              placeholder="e.g., CS101"
              className="w-full px-4 py-2 rounded-lg bg-[#0b141a] border border-[#222d34] text-[#e9edef] placeholder-[#8696a0] focus:border-[#00a884] focus:outline-none"
              disabled={loading}
              autoFocus
            />
            <p className="text-xs text-[#8696a0] mt-2">
              Ask your instructor for the course code
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-400/10 border border-red-400/30">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-[#222d34] text-[#e9edef] hover:bg-[#0b141a] transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-lg bg-[#00a884] text-[#0b141a] hover:bg-[#00a884]/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Enrolling..." : "Enroll"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
