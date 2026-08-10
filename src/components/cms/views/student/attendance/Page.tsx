'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/cms/api';
import { useAuth } from '@/contexts/cms/AuthContext';
import { FiCheck, FiX } from 'react-icons/fi';

export default function StudentAttendancePage() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ present: 0, absent: 0, percentage: 0 });

  useEffect(() => { if (user) fetchAttendance(); }, [user]);

  const fetchAttendance = async () => {
    try {
      const data = await api.get(`/api/attendance?student_id=${user?.id}`);
      setAttendance(data);
      const present = data.filter((r: any) => r.status === 'present').length;
      const total = data.length;
      setStats({ present, absent: total - present, percentage: total > 0 ? Math.round((present / total) * 100) : 0 });
    } catch (error) { console.error('Error:', error); } finally { setLoading(false); }
  };

  if (loading) return (<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a884]"></div></div>);

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#e9edef] mb-6">Attendance Record</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="rounded-xl p-6 border-l-4 border-blue-500"><h3 className="text-[#8696a0] text-sm mb-1">Overall Attendance</h3><p className={`text-3xl font-bold ${stats.percentage >= 75 ? 'text-green-600' : 'text-red-600'}`}>{stats.percentage}%</p></div>
        <div className="rounded-xl p-6 border-l-4 border-green-500"><h3 className="text-[#8696a0] text-sm mb-1">Days Present</h3><p className="text-3xl font-bold text-[#e9edef]">{stats.present}</p></div>
        <div className="rounded-xl p-6 border-l-4 border-red-500"><h3 className="text-[#8696a0] text-sm mb-1">Days Absent</h3><p className="text-3xl font-bold text-[#e9edef]">{stats.absent}</p></div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: "#111b21", border: "1px solid #222d34" }}>
        <table className="min-w-full divide-y divide-[#222d34]">
          <thead className="bg-[#111b21]"><tr><th className="px-6 py-3 text-left text-xs font-medium text-[#8696a0] uppercase">Date</th><th className="px-6 py-3 text-left text-xs font-medium text-[#8696a0] uppercase">Status</th><th className="px-6 py-3 text-left text-xs font-medium text-[#8696a0] uppercase">Marked By</th></tr></thead>
          <tbody className=" divide-y divide-[#222d34]">
            {attendance.map((record) => (
              <tr key={record.id}>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-[#e9edef]">{new Date(record.attendance_date).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {record.status === 'present' ? (<span className="flex items-center text-green-600 bg-green-50 px-2 py-1 rounded-full w-max"><FiCheck className="mr-1" /> Present</span>) : (<span className="flex items-center text-red-600 bg-red-50 px-2 py-1 rounded-full w-max"><FiX className="mr-1" /> Absent</span>)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#8696a0]">{record.teacher?.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {attendance.length === 0 && <div className="p-8 text-center text-[#8696a0]">No attendance records found.</div>}
      </div>
    </div>
  );
}
