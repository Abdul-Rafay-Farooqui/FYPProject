'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/cms/api';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

export default function SectionsPage() {
  const [sections, setSections] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchSections(); }, []);

  const fetchSections = async () => {
    try { 
      const data = await api.get('/api/sections'); 
      setSections(data); 
      setError('');
    } catch (err: any) { setError(err.response?.data?.message || err.message || 'Failed to fetch sections'); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSection) { await api.put(`/api/sections/${editingSection.id}`, formData); } else { await api.post('/api/sections', formData); }
      setShowModal(false); setEditingSection(null); setFormData({ name: '' }); 
      setError('');
      fetchSections();
    } catch (err: any) { setError(err.response?.data?.message || err.message || 'Error saving section'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this section?')) return;
    try { await api.delete(`/api/sections/${id}`); setError(''); fetchSections(); } catch (err: any) { setError(err.response?.data?.message || err.message || 'Error deleting section'); }
  };

  if (loading) return (<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a884]"></div></div>);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#e9edef]">Sections</h1>
        <button onClick={() => { setEditingSection(null); setFormData({ name: '' }); setShowModal(true); }} className="flex items-center space-x-2 bg-[#00a884] text-white px-4 py-2 rounded-lg hover:opacity-90 transition"><FiPlus /><span>Add Section</span></button>
      </div>
      {error && <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>{error}</div>}
      <div className="rounded-xl overflow-hidden" style={{ background: "#111b21", border: "1px solid #222d34" }}>
        <table className="min-w-full divide-y divide-[#222d34]">
          <thead className="bg-[#111b21]"><tr><th className="px-6 py-3 text-left text-xs font-medium text-[#8696a0] uppercase">Name</th><th className="px-6 py-3 text-left text-xs font-medium text-[#8696a0] uppercase">Actions</th></tr></thead>
          <tbody className=" divide-y divide-[#222d34]">
            {sections.map((section) => (
              <tr key={section.id}>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-[#e9edef]">{section.name}</td>
                <td className="px-6 py-4 whitespace-nowrap"><button onClick={() => { setEditingSection(section); setFormData({ name: section.name }); setShowModal(true); }} className="text-[#00a884] hover:text-blue-900 mr-4"><FiEdit2 /></button><button onClick={() => handleDelete(section.id)} className="text-red-600 hover:text-red-900"><FiTrash2 /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="rounded-xl p-8 max-w" style={{ background: "#111b21", border: "1px solid #222d34" }} data-x="rounded-xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">{editingSection ? 'Edit Section' : 'Add Section'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-6"><label className="block text-sm font-medium text-[#d1d7db] mb-2">Name</label><input type="text" value={formData.name} onChange={(e) => setFormData({ name: e.target.value })} className="w-full px-3 py-2 border border-[#222d34] rounded-lg focus:ring-1 focus:ring-[#00a884]" required /></div>
              <div className="flex justify-end space-x-3"><button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-[#222d34] rounded-lg hover:bg-[#111b21]">Cancel</button><button type="submit" className="px-4 py-2 bg-[#00a884] text-white rounded-lg hover:opacity-90">{editingSection ? 'Update' : 'Create'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
