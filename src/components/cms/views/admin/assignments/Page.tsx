'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/cms/api';
import { FiPlus, FiTrash2, FiUsers, FiBook } from 'react-icons/fi';

export default function AssignmentsPage() {
  const [activeTab, setActiveTab] = useState('sections');
  const [classes, setClasses] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [combinations, setCombinations] = useState<any[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<any[]>([]);
  const [studentEnrollments, setStudentEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [cbsForm, setCbsForm] = useState({ class_id: '', batch_id: '', section_id: '' });
  const [taForm, setTaForm] = useState({ teacher_id: '', class_batch_section_id: '', subject_id: '' });
  const [enrollForm, setEnrollForm] = useState({ class_batch_section_id: '', student_ids: [] as string[] });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [cls, btc, sec, sub, tch, stu, cbs] = await Promise.all([
        api.get('/api/classes'), api.get('/api/batches'), api.get('/api/sections'), api.get('/api/subjects'),
        api.get('/api/cms/users?role=teacher'), api.get('/api/cms/users?role=student'), api.get('/api/class-batch-sections')
      ]);
      setClasses(cls); setBatches(btc); setSections(sec); setSubjects(sub); setTeachers(tch); setStudents(stu); setCombinations(cbs);
    } catch (error) { console.error('Error fetching data:', error); } finally { setLoading(false); }
  };

  const createCombination = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.post('/api/class-batch-sections', cbsForm); setCbsForm({ class_id: '', batch_id: '', section_id: '' }); fetchData(); alert('Created successfully'); }
    catch (error) { console.error('Error:', error); alert('Error creating combination'); }
  };

  const createTeacherAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.post('/api/teacher-assignments', taForm); setTaForm({ teacher_id: '', class_batch_section_id: '', subject_id: '' }); alert('Created successfully'); }
    catch (error) { console.error('Error:', error); alert('Error creating assignment'); }
  };

  const handleStudentSelect = (studentId: string) => {
    setEnrollForm(prev => ({
      ...prev,
      student_ids: prev.student_ids.includes(studentId)
        ? prev.student_ids.filter(id => id !== studentId)
        : [...prev.student_ids, studentId]
    }));
  };

  const enrollStudents = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = enrollForm.student_ids.map(student_id => ({
        student_id, class_batch_section_id: enrollForm.class_batch_section_id
      }));
      await api.post('/api/student-enrollments', payload);
      setEnrollForm({ class_batch_section_id: '', student_ids: [] }); alert('Enrolled successfully');
    } catch (error) { console.error('Error:', error); alert('Error enrolling students'); }
  };

  const deleteCombination = async (id: string) => {
    if (!confirm('Delete this section combination?')) return;
    try { await api.delete(`/api/class-batch-sections/${id}`); fetchData(); }
    catch (error) { console.error('Error:', error); alert('Cannot delete section, it may be in use'); }
  };

  if (loading) return (<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a884]"></div></div>);

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#e9edef] mb-6">Assignments & Enrollments</h1>
      
      <div className="flex space-x-4 mb-8">
        <button onClick={() => setActiveTab('sections')} className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === 'sections' ? 'bg-[#00a884] text-white' : 'bg-white text-[#8696a0] hover:bg-[#111b21]'}`}>Section Management</button>
        <button onClick={() => setActiveTab('teachers')} className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === 'teachers' ? 'bg-[#00a884] text-white' : 'bg-white text-[#8696a0] hover:bg-[#111b21]'}`}>Teacher Assignments</button>
        <button onClick={() => setActiveTab('students')} className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === 'students' ? 'bg-[#00a884] text-white' : 'bg-white text-[#8696a0] hover:bg-[#111b21]'}`}>Student Enrollments</button>
      </div>

      {activeTab === 'sections' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="rounded-xl p-6" style={{ background: "#111b21", border: "1px solid #222d34" }}>
            <h2 className="text-xl font-semibold mb-4">Create Section Combination</h2>
            <form onSubmit={createCombination} className="space-y-4">
              <div><label className="block text-sm font-medium text-[#d1d7db] mb-1">Class</label><select required value={cbsForm.class_id} onChange={(e) => setCbsForm({...cbsForm, class_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg"><option value="">Select Class</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-[#d1d7db] mb-1">Batch</label><select required value={cbsForm.batch_id} onChange={(e) => setCbsForm({...cbsForm, batch_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg"><option value="">Select Batch</option>{batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-[#d1d7db] mb-1">Section</label><select required value={cbsForm.section_id} onChange={(e) => setCbsForm({...cbsForm, section_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg"><option value="">Select Section</option>{sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              <button type="submit" className="w-full bg-[#00a884] text-white py-2 rounded-lg hover:opacity-90">Create Combination</button>
            </form>
          </div>
          <div className="rounded-xl p-6" style={{ background: "#111b21", border: "1px solid #222d34" }}>
            <h2 className="text-xl font-semibold mb-4">Active Combinations</h2>
            <div className="space-y-3">
              {combinations.map(cbs => (
                <div key={cbs.id} className="flex justify-between items-center border p-3 rounded-lg">
                  <div>
                    <span className="font-semibold text-[#e9edef]">{cbs.class?.name}</span>
                    <span className="text-[#8696a0] mx-2">-</span>
                    <span className="text-[#00a884]">{cbs.batch?.name}</span>
                    <span className="text-[#8696a0] mx-2">-</span>
                    <span className="text-green-600">Section {cbs.section?.name}</span>
                  </div>
                  <button onClick={() => deleteCombination(cbs.id)} className="text-red-600 hover:text-red-800"><FiTrash2 /></button>
                </div>
              ))}
              {combinations.length === 0 && <p className="text-[#8696a0] text-center py-4">No combinations found</p>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'teachers' && (
        <div className="rounded-xl p-6" style={{ background: "#111b21", border: "1px solid #222d34" }}>
          <h2 className="text-xl font-semibold mb-4">Assign Teacher to Section/Subject</h2>
          <form onSubmit={createTeacherAssignment} className="space-y-4 max-w-lg">
            <div><label className="block text-sm font-medium text-[#d1d7db] mb-1">Teacher</label><select required value={taForm.teacher_id} onChange={(e) => setTaForm({...taForm, teacher_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg"><option value="">Select Teacher</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-[#d1d7db] mb-1">Section</label><select required value={taForm.class_batch_section_id} onChange={(e) => setTaForm({...taForm, class_batch_section_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg"><option value="">Select Section</option>{combinations.map(c => <option key={c.id} value={c.id}>{c.class?.name} - {c.batch?.name} - {c.section?.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-[#d1d7db] mb-1">Subject (Optional)</label><select value={taForm.subject_id} onChange={(e) => setTaForm({...taForm, subject_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg"><option value="">Select Subject</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <button type="submit" className="w-full bg-[#00a884] text-white py-2 rounded-lg hover:opacity-90">Assign Teacher</button>
          </form>
        </div>
      )}

      {activeTab === 'students' && (
        <div className="rounded-xl p-6" style={{ background: "#111b21", border: "1px solid #222d34" }}>
          <h2 className="text-xl font-semibold mb-4">Enroll Students in Section</h2>
          <form onSubmit={enrollStudents} className="space-y-6">
            <div><label className="block text-sm font-medium text-[#d1d7db] mb-2">Target Section</label><select required value={enrollForm.class_batch_section_id} onChange={(e) => setEnrollForm({...enrollForm, class_batch_section_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg max-w-lg"><option value="">Select Section</option>{combinations.map(c => <option key={c.id} value={c.id}>{c.class?.name} - {c.batch?.name} - {c.section?.name}</option>)}</select></div>
            <div>
              <label className="block text-sm font-medium text-[#d1d7db] mb-2">Select Students</label>
              <div className="border rounded-lg p-4 max-h-96 overflow-y-auto bg-[#111b21] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {students.map(student => (
                  <label key={student.id} className="flex items-center space-x-3 p-3 bg-white rounded shadow-sm cursor-pointer hover:bg-blue-50 transition">
                    <input type="checkbox" checked={enrollForm.student_ids.includes(student.id)} onChange={() => handleStudentSelect(student.id)} className="h-4 w-4 text-[#00a884] rounded border-[#222d34] focus:ring-blue-500" />
                    <div><p className="font-medium text-[#e9edef]">{student.display_name}</p><p className="text-xs text-[#8696a0]">{student.email}</p></div>
                  </label>
                ))}
              </div>
            </div>
            <button type="submit" disabled={enrollForm.student_ids.length === 0 || !enrollForm.class_batch_section_id} className="bg-[#00a884] text-white px-6 py-2 rounded-lg hover:opacity-90 disabled:opacity-50">Enroll Selected Students ({enrollForm.student_ids.length})</button>
          </form>
        </div>
      )}
    </div>
  );
}
