'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/cms/api';
import { useAuth } from '@/contexts/cms/AuthContext';
import { FileText, BookOpen, CheckSquare } from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ resultsCount: 0, pendingHomework: 0, attendancePercentage: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { if (user) fetchStats(); }, [user]);

  const fetchStats = async () => {
    try {
      // Try to get enrollment - may not exist yet for new students
      let enrollment: any = null;
      try {
        enrollment = await api.get(`/api/student-enrollments/single?student_id=${user?.id}`);
      } catch { /* Student may not be enrolled yet */ }

      let resultsCount = 0;
      try {
        const resultsRes = await api.get(`/api/results/count?student_id=${user?.id}`);
        resultsCount = resultsRes.count || 0;
      } catch { /* ignore */ }

      let pendingHomework = 0;
      let attendancePercentage = 0;

      if (enrollment?.class_batch_section_id) {
        try {
          const hwRes = await api.get(`/api/homework?cbs_id=${enrollment.class_batch_section_id}`);
          const submissionsRes = await api.get(`/api/homework-submissions?student_id=${user?.id}`);
          const submittedHwIds = new Set((submissionsRes || []).map((s: any) => s.homework_id));
          pendingHomework = (hwRes || []).filter((h: any) => !submittedHwIds.has(h.id)).length;
        } catch { /* ignore */ }

        try {
          const attendanceRes = await api.get(`/api/attendance?student_id=${user?.id}`);
          const totalDays = (attendanceRes || []).length;
          const presentDays = (attendanceRes || []).filter((a: any) => a.status === 'present').length;
          attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
        } catch { /* ignore */ }
      }

      setStats({ resultsCount, pendingHomework, attendancePercentage });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[#00a884]/30 border-t-[#00a884] rounded-full animate-spin" /></div>;

  const statCards = [
    { title: 'Published Results', value: stats.resultsCount, icon: FileText, gradient: 'from-blue-500 to-blue-600' },
    { title: 'Pending Homework', value: stats.pendingHomework, icon: BookOpen, gradient: 'from-amber-500 to-amber-600' },
    { title: 'Attendance', value: `${stats.attendancePercentage}%`, icon: CheckSquare, gradient: stats.attendancePercentage >= 75 ? 'from-emerald-500 to-emerald-600' : 'from-red-500 to-red-600' },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-[#e9edef] mb-6">Welcome, {user?.display_name}</h1>
      {error && <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="rounded-xl p-5" style={{ background: "#111b21", border: "1px solid #222d34" }} style={{ background: '#111b21', border: '1px solid #222d34' }}>
              <div className="flex items-center justify-between mb-3">
                <div className={`bg-gradient-to-br ${card.gradient} p-2.5 rounded-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-[#8696a0] text-xs mb-0.5">{card.title}</p>
              <p className="text-2xl font-bold text-[#e9edef]">{card.value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
