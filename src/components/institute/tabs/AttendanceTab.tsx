"use client";

export default function AttendanceTab({ attendance, instituteId, isAdmin, onRefresh }: any) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[#e9edef] text-2xl font-semibold">Attendance</h2>
        {isAdmin && (
          <button className="px-4 py-2 rounded bg-[#00a884] text-[#0b141a] hover:bg-[#00a884]/90">
            Mark Attendance
          </button>
        )}
      </div>
      <div className="text-center py-12">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#1e2a30] flex items-center justify-center">
          <svg className="w-10 h-10 text-[#8696a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <p className="text-[#8696a0]">Attendance tracking coming soon</p>
      </div>
    </div>
  );
}
