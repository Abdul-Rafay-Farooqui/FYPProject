'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/cms/api';
import { useAuth } from '@/contexts/cms/AuthContext';
import { FiPlus } from 'react-icons/fi';

export default function TeacherAnnouncementsPage() {
  const { user } = useAuth();
  const [sections, setSections] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({ class_batch_section_id: '', announcement_type: 'section' as 'individual' | 'section' | 'class', student_id: '', title: '', content: '' });

  useEffect(() => { if (user) fetchData(); }, [user]);
  useEffect(() => { if (formData.class_batch_section_id && formData.announcement_type === 'individual') fetchStudents(); }, [formData.class_batch_section_id, formData.announcement_type]);

  const fetchData = async () => {
    try {
      const [sectionsRes, announcementsRes] = await Promise.all([
        api.get(`/api/teacher-assignments?teacher_id=${user?.id}`),
        api.get(`/api/announcements?teacher_id=${user?.id}`)
      ]);
      setSections(sectionsRes); setAnnouncements(announcementsRes);
      setError('');
    } catch (err: any) { setError(err.response?.data?.message || err.message || 'Error fetching data'); } finally { setLoading(false); }
  };

  const fetchStudents = async () => {
    try { 
      const data = await api.get(`/api/student-enrollments?cbs_id=${formData.class_batch_section_id}&active=true`); 
      setStudents(data.map((d: any) => d.student)); 
      setError('');
    } catch (err: any) { setError(err.response?.data?.message || err.message || 'Error fetching students'); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/announcements', {
        teacher_id: user?.id, class_batch_section_id: formData.class_batch_section_id,
        announcement_type: formData.announcement_type,
        student_id: formData.announcement_type === 'individual' ? formData.student_id : null,
        title: formData.title, content: formData.content,
      });
      setShowModal(false); setFormData({ class_batch_section_id: '', announcement_type: 'section', student_id: '', title: '', content: '' });
      setError('');
      fetchData(); 
    } catch (err: any) { setError(err.response?.data?.message || err.message || 'Error publishing announcement'); }
  };

  if (loading) return (<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a884]"></div></div>);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#e9edef]">Announcements</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center space-x-2 bg-[#00a884] text-white px-4 py-2 rounded-lg hover:opacity-90 transition"><FiPlus /><span>Create Announcement</span></button>
      </div>
      {error && <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>{error}</div>}

      <div className="space-y-4">
        {announcements.map((announcement) => (
          <div key={announcement.id} className="rounded-xl p-6" style={{ background: "#111b21", border: "1px solid #222d34" }}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-xl font-semibold text-[#e9edef]">{announcement.title}</h3>
                <p className="text-sm text-[#8696a0]">{announcement.class_batch_section?.class?.name} - {announcement.class_batch_section?.batch?.name} - Section {announcement.class_batch_section?.section?.name}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`text-xs px-2 py-1 rounded-full ${announcement.announcement_type === 'individual' ? 'bg-blue-100 text-blue-800' : announcement.announcement_type === 'section' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}`}>{announcement.announcement_type.toUpperCase()}</span>
                  {announcement.student && <span className="text-xs text-[#8696a0]">To: {announcement.student.display_name}</span>}
                </div>
              </div>
              <p className="text-sm text-[#8696a0]">{new Date(announcement.published_date).toLocaleDateString()}</p>
            </div>
            <p className="text-[#d1d7db] mt-3">{announcement.content}</p>
          </div>
        ))}
        {announcements.length === 0 && <div className="rounded-xl p-12 text-center" style={{ background: "#111b21", border: "1px solid #222d34" }}><p className="text-[#8696a0]">No announcements yet.</p></div>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="rounded-xl p-8 max-w" style={{ background: "#111b21", border: "1px solid #222d34" }} data-x="rounded-xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Create Announcement</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4"><label className="block text-sm font-medium text-[#d1d7db] mb-2">Section</label><select value={formData.class_batch_section_id} onChange={(e) => setFormData({ ...formData, class_batch_section_id: e.target.value })} className="w-full px-3 py-2 border border-[#222d34] rounded-lg focus:ring-1 focus:ring-[#00a884]" required><option value="">Select Section</option>{sections.map((section) => (<option key={section.class_batch_section_id} value={section.class_batch_section_id}>{section.class_batch_section?.class?.name} - {section.class_batch_section?.batch?.name} - Section {section.class_batch_section?.section?.name}</option>))}</select></div>
              <div className="mb-4"><label className="block text-sm font-medium text-[#d1d7db] mb-2">Announcement Type</label><select value={formData.announcement_type} onChange={(e) => setFormData({ ...formData, announcement_type: e.target.value as any })} className="w-full px-3 py-2 border border-[#222d34] rounded-lg focus:ring-1 focus:ring-[#00a884]" required><option value="section">Section-wide</option><option value="class">Class-wide</option><option value="individual">Individual Student</option></select></div>
              {formData.announcement_type === 'individual' && (<div className="mb-4"><label className="block text-sm font-medium text-[#d1d7db] mb-2">Student</label><select value={formData.student_id} onChange={(e) => setFormData({ ...formData, student_id: e.target.value })} className="w-full px-3 py-2 border border-[#222d34] rounded-lg focus:ring-1 focus:ring-[#00a884]" required><option value="">Select Student</option>{students.map((student: any) => (<option key={student.id} value={student.id}>{student.display_name}</option>))}</select></div>)}
              <div className="mb-4"><label className="block text-sm font-medium text-[#d1d7db] mb-2">Title</label><input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border border-[#222d34] rounded-lg focus:ring-1 focus:ring-[#00a884]" required /></div>
              <div className="mb-6"><label className="block text-sm font-medium text-[#d1d7db] mb-2">Content</label><textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} className="w-full px-3 py-2 border border-[#222d34] rounded-lg focus:ring-1 focus:ring-[#00a884]" rows={5} required /></div>
              <div className="flex justify-end space-x-3"><button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-[#222d34] rounded-lg hover:bg-[#111b21]">Cancel</button><button type="submit" className="px-4 py-2 bg-[#00a884] text-white rounded-lg hover:opacity-90">Publish</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
