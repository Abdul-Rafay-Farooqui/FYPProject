"use client";

import { useState, useEffect } from "react";
import { InstituteAPI } from "@/lib/api/institute";

interface AdminOverviewProps {
  instituteId: string;
}

export default function AdminOverview({ instituteId }: AdminOverviewProps) {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [instituteId]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await InstituteAPI.getAdminDashboard(instituteId);
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

  const { stats, recentActivities } = dashboard;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Members"
          value={stats.totalMembers}
          subtitle={`${stats.totalStudents} students, ${stats.totalTeachers} teachers`}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
          color="blue"
        />
        <StatCard
          title="Batches"
          value={stats.totalBatches}
          subtitle="Total batches"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
          color="purple"
        />
        <StatCard
          title="Sections"
          value={stats.totalSections}
          subtitle="Total sections"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
          color="green"
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#111b21] rounded-xl border border-[#222d34] p-6">
          <h3 className="text-[#e9edef] text-lg font-semibold mb-4">System Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-[#0b141a] rounded-lg">
              <span className="text-[#8696a0]">Students</span>
              <span className="text-[#e9edef] font-semibold">{stats.totalStudents}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-[#0b141a] rounded-lg">
              <span className="text-[#8696a0]">Teachers</span>
              <span className="text-[#e9edef] font-semibold">{stats.totalTeachers}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-[#0b141a] rounded-lg">
              <span className="text-[#8696a0]">Admins</span>
              <span className="text-[#e9edef] font-semibold">{stats.totalAdmins}</span>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-[#111b21] rounded-xl border border-[#222d34] p-6">
          <h3 className="text-[#e9edef] text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#00a884]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Recent Activities
          </h3>
          {recentActivities && recentActivities.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
              {recentActivities.map((activity: any) => (
                <div key={activity.id} className="p-3 bg-[#0b141a] rounded-lg border border-[#222d34]">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#00a884]/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-[#00a884]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-[#e9edef] font-medium">{activity.title}</p>
                      <p className="text-[#8696a0] text-sm mt-1">{activity.content}</p>
                      <p className="text-[#8696a0] text-xs mt-2">
                        {new Date(activity.published_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#8696a0] text-sm">No recent activities</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-[#111b21] rounded-xl border border-[#222d34] p-4 md:p-6">
        <h3 className="text-[#e9edef] text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <button className="p-3 md:p-4 bg-[#0b141a] rounded-lg border border-[#222d34] hover:border-[#00a884] transition-colors text-center">
            <svg className="w-7 h-7 md:w-8 md:h-8 text-[#00a884] mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
            <p className="text-[#e9edef] text-xs md:text-sm font-medium">Add Members</p>
          </button>
          <button className="p-3 md:p-4 bg-[#0b141a] rounded-lg border border-[#222d34] hover:border-[#00a884] transition-colors text-center">
            <svg className="w-7 h-7 md:w-8 md:h-8 text-[#00a884] mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
            <p className="text-[#e9edef] text-xs md:text-sm font-medium">Send Announcement</p>
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
    <div className="bg-[#111b21] rounded-xl border border-[#222d34] p-4 md:p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[#8696a0] text-sm mb-1">{title}</p>
          <p className="text-[#e9edef] text-2xl md:text-3xl font-bold mb-1">{value}</p>
          <p className="text-[#8696a0] text-xs">{subtitle}</p>
        </div>
        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
