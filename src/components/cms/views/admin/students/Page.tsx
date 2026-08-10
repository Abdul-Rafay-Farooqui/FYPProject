'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/cms/api';
import { useAuth } from '@/contexts/cms/AuthContext';
import { UserPlus, Trash2 } from 'lucide-react';

export default function StudentsPage() {
  const { school } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ display_name: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { if (school) fetchStudents(); }, [school]);

  const fetchStudents = async () => {
    try {
      const data = await api.get(`/api/cms/users?school_id=${school!.id}&role=student`);
      setStudents(data);
    } catch (err: any) { setError(err.response?.data?.message || err.message || 'Error fetching students'); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/cms/users', { ...formData, school_role: 'student', school_id: school!.id });
      setShowModal(false);
      setFormData({ display_name: '', email: '' });
      setError('');
      fetchStudents();
    } catch (err: any) { setError(err.response?.data?.message || err.message || 'Error creating student'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this student?')) return;
    try { await api.delete(`/api/cms/users/${id}`); setError(''); fetchStudents(); } catch (err: any) { setError(err.response?.data?.message || err.message || 'Error deleting student'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[#00a884]/30 border-t-[#00a884] rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-[#e9edef]">Students</h1>
        <button onClick={() => { setShowModal(true); setError(''); setFormData({ display_name: '', email: '' }); }} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: '#00a884' }}>
          <UserPlus className="w-4 h-4" /> Add Student
        </button>
      </div>
      {error && <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>{error}</div>}

      <div className="rounded-xl overflow-hidden" style={{ background: '#111b21', border: '1px solid #222d34' }}>
        <table className="min-w-full">
          <thead><tr style={{ background: '#202c33' }}>
            <th className="px-6 py-3 text-left text-xs font-medium text-[#8696a0] uppercase">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-[#8696a0] uppercase">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-[#8696a0] uppercase">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-[#222d34]">
            {students.map((s) => (
              <tr key={s.id}>
                <td className="px-6 py-4 text-sm text-[#e9edef]">{s.display_name}</td>
                <td className="px-6 py-4 text-sm text-[#8696a0]">{s.email}</td>
                <td className="px-6 py-4"><button onClick={() => handleDelete(s.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button></td>
              </tr>
            ))}
            {students.length === 0 && <tr><td colSpan={3} className="px-6 py-8 text-center text-[#8696a0]">No students yet. Click "Add Student" to get started.</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="rounded-xl p-6 w-full max-w-md" style={{ background: '#111b21', border: '1px solid #222d34' }}>
            <h2 className="text-lg font-bold text-[#e9edef] mb-4">Add Student</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[#8696a0] text-xs font-medium mb-1.5">Name</label>
                <input type="text" value={formData.display_name} onChange={(e) => setFormData({ ...formData, display_name: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-sm text-[#e9edef] placeholder-[#8696a0] outline-none focus:ring-1 focus:ring-[#00a884]" style={{ background: '#0b141a', border: '1px solid #222d34' }} placeholder="Student name" required />
              </div>
              <div>
                <label className="block text-[#8696a0] text-xs font-medium mb-1.5">Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-sm text-[#e9edef] placeholder-[#8696a0] outline-none focus:ring-1 focus:ring-[#00a884]" style={{ background: '#0b141a', border: '1px solid #222d34' }} placeholder="student@school.com" required />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-sm text-[#8696a0] border border-[#222d34] hover:bg-[#202c33]">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: '#00a884' }}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
