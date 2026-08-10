"use client";

import { useState, useEffect } from "react";
import { InstituteAPI } from "@/lib/api/institute";

interface TeacherOverviewProps {
  instituteId: string;
}

export default function TeacherOverview({ instituteId }: TeacherOverviewProps) {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [instituteId]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await InstituteAPI.getTeacherDashboard(instituteId);
      setDashboard(data);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-[#8696a0]">Loading dashboard...</div>;
  }

  if (!dashboard) {
    return <div className="text-[#8696a0]">No data available</div>;
  }

  const { stats, upcomingClasses, recentSubmissions } = dashboard;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          subtitle="In your classes"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
          color="blue"
        />
        <StatCard
          title="Assignments"
          value={stats.totalAssignments}
          subtitle="Created by you"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
          color="purple"
        />
        <StatCard
          title="Pending Grading"
          value={stats.pendingSubmissions}
          subtitle="Submissions to grade"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
          color="yellow"
        />
        <StatCard
          title="Quizzes"
          value={stats.totalQuizzes}
          subtitle="Created by you"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
          color="green"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Live Classes */}
        <div className="bg-[#111b21] rounded-xl border border-[#222d34] p-6">
          <h3 className="text-[#e9edef] text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#00a884]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            Upcoming Classes
          </h3>
          {upcomingClasses && upcomingClasses.length > 0 ? (
            <div className="space-y-3">
              {upcomingClasses.map((liveClass: any) => (
                <div key={liveClass.id} className="p-3 bg-[#0b141a] rounded-lg border border-[#222d34]">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[#e9edef] font-medium">{liveClass.title}</p>
                      <p className="text-[#8696a0] text-sm mt-1">{liveClass.description}</p>
                    </div>
                    <span className="text-xs text-[#00a884] bg-[#00a884]/10 px-2 py-1 rounded">
                      {new Date(liveClass.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {liveClass.meeting_url && (
                    <a
                      href={liveClass.meeting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#00a884] hover:underline mt-2 inline-block"
                    >
                      Start Class →
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#8696a0] text-sm">No upcoming classes</p>
          )}
        </div>

        {/* Recent Submissions */}
        <div className="bg-[#111b21] rounded-xl border border-[#222d34] p-6">
          <h3 className="text-[#e9edef] text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#00a884]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Recent Submissions
          </h3>
          {recentSubmissions && recentSubmissions.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              {recentSubmissions.map((submission: any) => (
                <div key={submission.id} className="p-3 bg-[#0b141a] rounded-lg border border-[#222d34]">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#00a884]/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-[#00a884] text-sm font-semibold">
                        {submission.student?.name?.[0] || "S"}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-[#e9edef] font-medium">{submission.student?.name || "Student"}</p>
                      <p className="text-[#8696a0] text-sm mt-1">{submission.homework?.title || "Assignment"}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-[#8696a0]">
                          {new Date(submission.submitted_date).toLocaleDateString()}
                        </span>
                        {submission.stars === 0 && (
                          <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded">
                            Needs Grading
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#8696a0] text-sm">No recent submissions</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-[#111b21] rounded-xl border border-[#222d34] p-4 md:p-6">
        <h3 className="text-[#e9edef] text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button className="p-3 md:p-4 bg-[#0b141a] rounded-lg border border-[#222d34] hover:border-[#00a884] transition-colors text-center">
            <svg className="w-7 h-7 text-[#00a884] mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            <p className="text-[#e9edef] text-xs md:text-sm font-medium">Create Assignment</p>
          </button>
          <button className="p-3 md:p-4 bg-[#0b141a] rounded-lg border border-[#222d34] hover:border-[#00a884] transition-colors text-center">
            <svg className="w-7 h-7 text-[#00a884] mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            <p className="text-[#e9edef] text-xs md:text-sm font-medium">Create Quiz</p>
          </button>
          <button className="p-3 md:p-4 bg-[#0b141a] rounded-lg border border-[#222d34] hover:border-[#00a884] transition-colors text-center">
            <svg className="w-7 h-7 text-[#00a884] mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            <p className="text-[#e9edef] text-xs md:text-sm font-medium">Schedule Class</p>
          </button>
          <button className="p-3 md:p-4 bg-[#0b141a] rounded-lg border border-[#222d34] hover:border-[#00a884] transition-colors text-center">
            <svg className="w-7 h-7 text-[#00a884] mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            <p className="text-[#e9edef] text-xs md:text-sm font-medium">Upload Resource</p>
          </button>
        </div>
      </div>
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
