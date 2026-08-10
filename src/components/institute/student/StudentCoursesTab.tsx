"use client";

import { useState, useEffect } from "react";
import { InstituteAPI } from "@/lib/api/institute";
import EnrollCourseModal from "./EnrollCourseModal";

interface StudentCoursesTabProps {
  instituteId: string;
  currentUserId: string;
  onRefresh?: () => void;
}

export default function StudentCoursesTab({
  instituteId,
  currentUserId,
  onRefresh,
}: StudentCoursesTabProps) {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  useEffect(() => {
    loadCourses();
  }, [currentUserId, instituteId]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await InstituteAPI.getCourseEnrollments({
        student_id: currentUserId,
        institute_id: instituteId,
      });
      setCourses(data || []);
    } catch (error) {
      console.error("Failed to load courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollSuccess = () => {
    setShowEnrollModal(false);
    loadCourses();
    onRefresh?.();
  };

  const handleUnenroll = async (enrollmentId: string) => {
    if (confirm("Are you sure you want to unenroll from this course?")) {
      try {
        await InstituteAPI.unenrollStudent(enrollmentId);
        loadCourses();
        onRefresh?.();
      } catch (error) {
        console.error("Failed to unenroll:", error);
        alert("Failed to unenroll from course");
      }
    }
  };

  if (loading) {
    return <div className="text-[#8696a0]">Loading courses...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[#e9edef] text-2xl font-semibold">My Courses</h2>
        <button
          onClick={() => setShowEnrollModal(true)}
          className="px-4 py-2 rounded bg-[#00a884] text-[#0b141a] hover:bg-[#00a884]/90 font-medium"
        >
          + Enroll Course
        </button>
      </div>

      {courses.length === 0 ? (
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
                d="M12 6.253v13m0-13C6.5 6.253 2 10.998 2 17s4.5 10.747 10 10.747c5.5 0 10-4.998 10-10.747 0-5.002-4.5-10.747-10-10.747z"
              />
            </svg>
          </div>
          <p className="text-[#8696a0] mb-4">No courses enrolled yet</p>
          <button
            onClick={() => setShowEnrollModal(true)}
            className="text-[#00a884] hover:underline"
          >
            Enroll in a course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((enrollment: any) => (
            <div
              key={enrollment.id}
              className="bg-[#111b21] rounded-lg border border-[#222d34] p-5 hover:border-[#00a884]/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-[#e9edef] font-semibold text-lg">
                    {enrollment.subject?.name || "Unnamed Course"}
                  </h3>
                  <p className="text-[#00a884] text-sm font-medium mt-1">
                    {enrollment.subject?.course_code || "No code"}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-[#00a884]/20 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-[#00a884]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C6.5 6.253 2 10.998 2 17s4.5 10.747 10 10.747c5.5 0 10-4.998 10-10.747 0-5.002-4.5-10.747-10-10.747z"
                    />
                  </svg>
                </div>
              </div>

              {enrollment.subject?.description && (
                <p className="text-[#8696a0] text-sm mb-4">
                  {enrollment.subject.description}
                </p>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-[#222d34]">
                <span className="text-xs text-[#8696a0]">
                  {new Date(enrollment.enrolled_at).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleUnenroll(enrollment.id)}
                  className="text-xs text-red-400 hover:text-red-300 hover:underline"
                >
                  Unenroll
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showEnrollModal && (
        <EnrollCourseModal
          instituteId={instituteId}
          currentUserId={currentUserId}
          onSuccess={handleEnrollSuccess}
          onClose={() => setShowEnrollModal(false)}
        />
      )}
    </div>
  );
}
