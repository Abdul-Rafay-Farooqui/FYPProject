"use client";

import { useState, useEffect } from "react";
import { InstituteAPI } from "@/lib/api/institute";

interface TeacherCourseOverviewProps {
  courseId: string;
  instituteId: string;
}

export default function TeacherCourseOverview({ courseId, instituteId }: TeacherCourseOverviewProps) {
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverview();
  }, [courseId]);

  const loadOverview = async () => {
    try {
      setLoading(true);
      // TODO: Create API endpoint for teacher course overview
      const data = await InstituteAPI.getTeacherCourseOverview(courseId);
      setOverview(data);
    } catch (error) {
      console.error("Failed to load overview:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-[#8696a0]">Loading overview...</div>;
  }

  if (!overview) {
    return <div className="text-[#8696a0]">No data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Students"
          value={overview.stats?.totalStudents || 0}
          subtitle="Enrolled students"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
          color="blue"
        />
        <StatCard
          title="Quizzes"
          value={overview.stats?.totalQuizzes || 0}
          subtitle="Created quizzes"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
          color="purple"
        />
        <StatCard
          title="Assignments"
          value={overview.stats?.totalAssignments || 0}
          subtitle="Created assignments"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
          color="green"
        />
        <StatCard
          title="Announcements"
          value={overview.stats?.totalAnnouncements || 0}
          subtitle="Posted announcements"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>}
          color="yellow"
        />
      </div>

      {/* Class Schedule */}
      <div className="bg-[#111b21] rounded-xl border border-[#222d34] p-6">
        <h3 className="text-[#e9edef] text-lg font-semibold mb-4">Class Schedule</h3>
        {overview.schedules && overview.schedules.length > 0 ? (
          <div className="space-y-2">
            {overview.schedules.map((schedule: any) => (
              <div key={schedule.id} className="flex items-center justify-between p-3 bg-[#0b141a] rounded-lg">
                <div>
                  <p className="text-[#e9edef] font-medium">{schedule.day_of_week}</p>
                  <p className="text-[#8696a0] text-sm">{schedule.start_time} - {schedule.end_time}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[#8696a0] text-sm">No schedule set</p>
        )}
      </div>

      {/* Recent Announcements */}
      <div className="bg-[#111b21] rounded-xl border border-[#222d34] p-6">
        <h3 className="text-[#e9edef] text-lg font-semibold mb-4">Recent Announcements</h3>
        {overview.recentAnnouncements && overview.recentAnnouncements.length > 0 ? (
          <div className="space-y-3">
            {overview.recentAnnouncements.map((announcement: any) => (
              <div key={announcement.id} className="p-3 bg-[#0b141a] rounded-lg">
                <p className="text-[#e9edef] font-medium">{announcement.title}</p>
                <p className="text-[#8696a0] text-sm mt-1">{announcement.content}</p>
                <p className="text-[#8696a0] text-xs mt-2">
                  {new Date(announcement.published_date).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[#8696a0] text-sm">No announcements yet</p>
        )}
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
