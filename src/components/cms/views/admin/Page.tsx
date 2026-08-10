'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/cms/api';
import { useAuth } from '@/contexts/cms/AuthContext';
import { Users, GraduationCap, BookOpen, Grid3X3 } from 'lucide-react';

export default function AdminDashboard() {
  const { school } = useAuth();
  const [stats, setStats] = useState({ teachers: 0, students: 0, classes: 0, sections: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (school) fetchStats();
    else setLoading(false);
  }, [school]);

  const fetchStats = async () => {
    try {
      const [teachersRes, studentsRes, classesRes, sectionsRes] = await Promise.all([
        api.get(`/api/cms/users/count?school_id=${school!.id}&role=teacher`),
        api.get(`/api/cms/users/count?school_id=${school!.id}&role=student`),
        api.get('/api/classes/count'),
        api.get('/api/class-batch-sections/count'),
      ]);
      setStats({
        teachers: teachersRes.count || 0,
        students: studentsRes.count || 0,
        classes: classesRes.count || 0,
        sections: sectionsRes.count || 0,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#00a884]/30 border-t-[#00a884] rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { title: 'Teachers', value: stats.teachers, icon: Users, gradient: 'from-blue-500 to-blue-600' },
    { title: 'Students', value: stats.students, icon: GraduationCap, gradient: 'from-emerald-500 to-emerald-600' },
    { title: 'Classes', value: stats.classes, icon: BookOpen, gradient: 'from-purple-500 to-purple-600' },
    { title: 'Sections', value: stats.sections, icon: Grid3X3, gradient: 'from-amber-500 to-amber-600' },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-[#e9edef] mb-6">Admin Dashboard</h1>
      {error && (
        <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
