'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/cms/api';
import { useAuth } from '@/contexts/cms/AuthContext';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function TeacherSchedulePage() {
  const { user } = useAuth();
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({ class_batch_section_id: '', subject_id: '', day_of_week: 'Monday', start_time: '', end_time: '' });

  useEffect(() => { if (user) fetchData(); }, [user]);

  const fetchData = async () => {
    try {
      const [sectionsRes, subjectsRes, schedulesRes] = await Promise.all([
        api.get(`/api/teacher-assignments?teacher_id=${user?.id}`),
        api.get('/api/subjects'),
        api.get(`/api/schedules?teacher_id=${user?.id}`)
      ]);
      setSections(sectionsRes); setSubjects(subjectsRes); setSchedules(schedulesRes);
      setError('');
    } catch (err: any) { setError(err.response?.data?.message || err.message || 'Failed to fetch data'); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/schedules', { ...formData, teacher_id: user?.id, subject_id: formData.subject_id || null });
      setShowModal(false); setFormData({ class_batch_section_id: '', subject_id: '', day_of_week: 'Monday', start_time: '', end_time: '' });
      setError('');
      fetchData();
    } catch (err: any) { setError(err.response?.data?.message || err.message || 'Error creating schedule'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    try { await api.delete(`/api/schedules/${id}`); setError(''); fetchData(); } catch (err: any) { setError(err.response?.data?.message || err.message || 'Error deleting schedule'); }
  };

  const groupedSchedules = daysOfWeek.reduce((acc, day) => { acc[day] = schedules.filter(s => s.day_of_week === day); return acc; }, {} as Record<string, any[]>);

  if (loading) return (<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a884]"></div></div>);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#e9edef]">Schedule Management</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center space-x-2 bg-[#00a884] text-white px-4 py-2 rounded-lg hover:opacity-90 transition"><FiPlus /><span>Add Schedule</span></button>
      </div>
      {error && <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>{error}</div>}

      <div className="space-y-6">
        {daysOfWeek.map((day) => (
          <div key={day} className="rounded-xl p-6" style={{ background: "#111b21", border: "1px solid #222d34" }}>
            <h2 className="text-xl font-semibold text-[#e9edef] mb-4">{day}</h2>
            {groupedSchedules[day].length > 0 ? (
              <div className="space-y-3">
                {groupedSchedules[day].map((schedule) => (
                  <div key={schedule.id} className="flex justify-between items-center border border-gray-200 rounded-lg p-4">
                    <div>
                      <p className="font-semibold text-[#e9edef]">{schedule.start_time} - {schedule.end_time}</p>
                      <p className="text-sm text-[#8696a0]">{schedule.class_batch_section?.class?.name} - {schedule.class_batch_section?.batch?.name} - Section {schedule.class_batch_section?.section?.name}</p>
                      {schedule.subject && <p className="text-sm text-[#8696a0]">Subject: {schedule.subject.name}</p>}
                    </div>
                    <button onClick={() => handleDelete(schedule.id)} className="text-red-600 hover:text-red-900"><FiTrash2 /></button>
                  </div>
                ))}
              </div>
            ) : (<p className="text-[#8696a0] text-center py-4">No classes scheduled</p>)}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="rounded-xl p-8 max-w" style={{ background: "#111b21", border: "1px solid #222d34" }} data-x="rounded-xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Add Schedule</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4"><label className="block text-sm font-medium text-[#d1d7db] mb-2">Section</label><select value={formData.class_batch_section_id} onChange={(e) => setFormData({ ...formData, class_batch_section_id: e.target.value })} className="w-full px-3 py-2 border border-[#222d34] rounded-lg focus:ring-1 focus:ring-[#00a884]" required><option value="">Select Section</option>{sections.map((section) => (<option key={section.class_batch_section_id} value={section.class_batch_section_id}>{section.class_batch_section?.class?.name} - {section.class_batch_section?.batch?.name} - Section {section.class_batch_section?.section?.name}</option>))}</select></div>
              <div className="mb-4"><label className="block text-sm font-medium text-[#d1d7db] mb-2">Subject</label><select value={formData.subject_id} onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })} className="w-full px-3 py-2 border border-[#222d34] rounded-lg focus:ring-1 focus:ring-[#00a884]"><option value="">Select Subject (Optional)</option>{subjects.map((subject) => (<option key={subject.id} value={subject.id}>{subject.name}</option>))}</select></div>
              <div className="mb-4"><label className="block text-sm font-medium text-[#d1d7db] mb-2">Day of Week</label><select value={formData.day_of_week} onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })} className="w-full px-3 py-2 border border-[#222d34] rounded-lg focus:ring-1 focus:ring-[#00a884]" required>{daysOfWeek.map((day) => (<option key={day} value={day}>{day}</option>))}</select></div>
              <div className="mb-4"><label className="block text-sm font-medium text-[#d1d7db] mb-2">Start Time</label><input type="time" value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} className="w-full px-3 py-2 border border-[#222d34] rounded-lg focus:ring-1 focus:ring-[#00a884]" required /></div>
              <div className="mb-6"><label className="block text-sm font-medium text-[#d1d7db] mb-2">End Time</label><input type="time" value={formData.end_time} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} className="w-full px-3 py-2 border border-[#222d34] rounded-lg focus:ring-1 focus:ring-[#00a884]" required /></div>
              <div className="flex justify-end space-x-3"><button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-[#222d34] rounded-lg hover:bg-[#111b21]">Cancel</button><button type="submit" className="px-4 py-2 bg-[#00a884] text-white rounded-lg hover:opacity-90">Create</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
