"use client";

import { useState, useEffect } from "react";
import { InstituteAPI } from "@/lib/api/institute";

interface StudentOverviewProps {
  instituteId: string;
  currentUserId?: string;
}

export default function StudentOverview({ 
  instituteId,
  currentUserId 
}: StudentOverviewProps) {
  const [dashboard, setDashboard] = useState<any>(null);
  const [enrolledSubjects, setEnrolledSubjects] = useState<any[]>([]);
  const [subjectAttendance, setSubjectAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUserId) {
      loadDashboard();
      loadEnrolledSubjects();
    }
  }, [instituteId, currentUserId]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await InstituteAPI.getStudentDashboard(instituteId);
      setDashboard(data);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadEnrolledSubjects = async () => {
    try {
      // Fetch enrolled subjects
      const enrollments = await InstituteAPI.getCourseEnrollments({
        student_id: currentUserId,
        institute_id: instituteId,
      });
      
      setEnrolledSubjects(enrollments);

      // Fetch attendance for each subject
      const attendanceData = [];
      for (const enrollment of enrollments) {
        try {
          const attendance = await InstituteAPI.getStudentAttendanceBySubject(
            instituteId,
            enrollment.subject_id,
            currentUserId!
          );
          
          // Calculate stats
          const present = attendance.filter((a: any) => a.status === "present").length;
          const absent = attendance.filter((a: any) => a.status === "absent").length;
          const total = attendance.length;
          const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : "0";

          attendanceData.push({
            subject: enrollment.subject,
            present,
            absent,
            total,
            percentage,
          });
        } catch (error) {
          console.error(`Failed to fetch attendance for subject ${enrollment.subject_id}:`, error);
        }
      }
      
      setSubjectAttendance(attendanceData);
    } catch (error) {
      console.error("Failed to load enrolled subjects:", error);
    }
  };

  if (loading) {
    return <div className="text-[#8696a0]">Loading dashboard...</div>;
  }

  if (!dashboard) {
    return <div className="text-[#8696a0]">No data available</div>;
  }

  const { stats, recentAnnouncements, upcomingClasses } = dashboard;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assignments"
          value={`${stats.submittedAssignments}/${stats.totalAssignments}`}
          subtitle={`${stats.pendingAssignments} pending`}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
          color="blue"
        />
        <StatCard
          title="Quizzes"
          value={`${stats.attemptedQuizzes}/${stats.totalQuizzes}`}
          subtitle={`${stats.pendingQuizzes} pending`}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
          color="purple"
        />
        <StatCard
          title="Enrolled Subjects"
          value={enrolledSubjects.length}
          subtitle="Active courses"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
          color="green"
        />
        <StatCard
          title="Overall Grade"
          value={stats.overallGrade > 0 ? `${stats.overallGrade}%` : "N/A"}
          subtitle={stats.overallGrade > 0 ? "Average score" : "No grades yet"}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>}
          color="yellow"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance by Subject */}
        <div className="bg-[#111b21] rounded-xl border border-[#222d34] p-6">
          <h3 className="text-[#e9edef] text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#00a884]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            Attendance by Subject
          </h3>
          {subjectAttendance && subjectAttendance.length > 0 ? (
            <div className="space-y-3">
              {subjectAttendance.map((item, index) => {
                const percentage = parseFloat(item.percentage);
                const percentageColor =
                  percentage >= 75
                    ? "text-green-400"
                    : percentage >= 50
                    ? "text-yellow-400"
                    : "text-red-400";

                const progressColor =
                  percentage >= 75
                    ? "bg-green-500"
                    : percentage >= 50
                    ? "bg-yellow-500"
                    : "bg-red-500";

                return (
                  <div key={index} className="p-4 bg-[#0b141a] rounded-lg border border-[#222d34]">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <p className="text-[#e9edef] font-medium">
                          {item.subject?.name || "Subject"}
                        </p>
                        {item.subject?.code && (
                          <p className="text-[#8696a0] text-xs mt-1">
                            Code: {item.subject.code}
                          </p>
                        )}
                      </div>
                      <span className={`text-lg font-bold ${percentageColor}`}>
                        {item.percentage}%
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="w-full bg-[#2a3942] rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full ${progressColor} transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex justify-between text-sm">
                      <span className="text-green-400">
                        Present: {item.present}
                      </span>
                      <span className="text-red-400">
                        Absent: {item.absent}
                      </span>
                      <span className="text-[#8696a0]">
                        Total: {item.total}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[#8696a0] text-sm">No attendance records yet</p>
          )}
        </div>

        {/* Recent Announcements */}
        <div className="bg-[#111b21] rounded-xl border border-[#222d34] p-6">
          <h3 className="text-[#e9edef] text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#00a884]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
            Recent Announcements
          </h3>
          {recentAnnouncements && recentAnnouncements.length > 0 ? (
            <div className="space-y-3">
              {recentAnnouncements.map((announcement: any) => (
                <div key={announcement.id} className="p-3 bg-[#0b141a] rounded-lg border border-[#222d34]">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#00a884]/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-[#00a884] text-sm font-semibold">
                        {announcement.teacher?.name?.[0] || "T"}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-[#e9edef] font-medium">{announcement.title}</p>
                      <p className="text-[#8696a0] text-sm mt-1">{announcement.content}</p>
                      <p className="text-[#8696a0] text-xs mt-2">
                        {new Date(announcement.published_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#8696a0] text-sm">No recent announcements</p>
          )}
        </div>
      </div>

      {/* Upcoming Live Classes */}
      {upcomingClasses && upcomingClasses.length > 0 && (
        <div className="bg-[#111b21] rounded-xl border border-[#222d34] p-6">
          <h3 className="text-[#e9edef] text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#00a884]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            Upcoming Live Classes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingClasses.map((liveClass: any) => (
              <div key={liveClass.id} className="p-4 bg-[#0b141a] rounded-lg border border-[#222d34]">
                <p className="text-[#e9edef] font-medium">{liveClass.title}</p>
                <p className="text-[#8696a0] text-sm mt-1">{liveClass.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-[#8696a0]">
                    {new Date(liveClass.scheduled_at).toLocaleString()}
                  </span>
                  {liveClass.meeting_url && (
                    <a
                      href={liveClass.meeting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#00a884] hover:underline"
                    >
                      Join →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, color }: any) {
  const colorClasses = {
    blue: "bg-blue-500/10 text-blue-400",
    purple: "bg-purple-500/10 text-purple-400",
    green: "bg-green-500/10 text-green-400",
    yellow: "bg-yellow-500/10 text-yellow-400",
  };

  return (
    <div className="bg-[#111b21] rounded-xl border border-[#222d34] p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[#8696a0] text-sm mb-2">{title}</p>
          <p className="text-[#e9edef] text-3xl font-bold mb-1">{value}</p>
          <p className="text-[#8696a0] text-xs">{subtitle}</p>
        </div>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
