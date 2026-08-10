'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/cms/api';
import { useAuth } from '@/contexts/cms/AuthContext';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function StudentSchedulePage() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchSchedule(); }, [user]);

  const fetchSchedule = async () => {
    try {
      const enrollmentRes = await api.get(`/api/student-enrollments/single?student_id=${user?.id}`);
      if (!enrollmentRes) { setLoading(false); return; }

      const data = await api.get(`/api/schedules?cbs_id=${enrollmentRes.class_batch_section_id}`);
      setSchedules(data);
    } catch (error) { console.error('Error:', error); } finally { setLoading(false); }
  };

  const groupedSchedules = daysOfWeek.reduce((acc, day) => { acc[day] = schedules.filter(s => s.day_of_week === day); return acc; }, {} as Record<string, any[]>);

  if (loading) return (<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a884]"></div></div>);

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#e9edef] mb-6">Class Schedule</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {daysOfWeek.map((day) => (
          <div key={day} className="rounded-xl p-6" style={{ background: "#111b21", border: "1px solid #222d34" }}>
            <h2 className="text-xl font-semibold text-[#e9edef] mb-4 pb-2 border-b border-[#222d34]">{day}</h2>
            {groupedSchedules[day].length > 0 ? (
              <div className="space-y-4">
                {groupedSchedules[day].map((schedule) => (
                  <div key={schedule.id} className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <div className="flex justify-between items-center mb-2"><span className="font-bold text-blue-800">{schedule.start_time} - {schedule.end_time}</span></div>
                    {schedule.subject && <p className="font-semibold text-[#e9edef]">{schedule.subject.name}</p>}
                    <p className="text-sm text-[#8696a0]">Teacher: {schedule.teacher?.name}</p>
                  </div>
                ))}
              </div>
            ) : (<p className="text-[#8696a0] italic">No classes scheduled</p>)}
          </div>
        ))}
      </div>
    </div>
  );
}
