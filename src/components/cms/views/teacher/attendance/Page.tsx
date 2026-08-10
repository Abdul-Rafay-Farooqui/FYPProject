'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/cms/api';
import { useAuth } from '@/contexts/cms/AuthContext';
import { FiCheck, FiX, FiEdit2 } from 'react-icons/fi';

export default function TeacherAttendancePage() {
  const { user } = useAuth();
  const [sections, setSections] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent'>>({});
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => { if (user) fetchSections(); }, [user]);
  useEffect(() => { if (selectedSection) { fetchStudents(); fetchAttendance(); } }, [selectedSection, selectedDate]);

  const fetchSections = async () => {
    try { const data = await api.get(`/api/teacher-assignments?teacher_id=${user?.id}`); setSections(data); }
    catch (error) { console.error('Error:', error); } finally { setLoading(false); }
  };

  const fetchStudents = async () => {
    try { const data = await api.get(`/api/student-enrollments?cbs_id=${selectedSection}&active=true`); setStudents(data.map((d: any) => d.student)); }
    catch (error) { console.error('Error:', error); }
  };

  const fetchAttendance = async () => {
    try {
      const data = await api.get(`/api/attendance?cbs_id=${selectedSection}&date=${selectedDate}`);
      const attendanceMap: Record<string, 'present' | 'absent'> = {};
      data.forEach((record: any) => { attendanceMap[record.student_id] = record.status; });
      setAttendance(attendanceMap); setIsEditing(data.length > 0);
    } catch (error) { console.error('Error:', error); }
  };

  const handleAttendanceChange = (studentId: string, status: 'present' | 'absent') => { setAttendance({ ...attendance, [studentId]: status }); };

  const handleSubmit = async () => {
    if (!selectedSection || Object.keys(attendance).length === 0) { alert('Please mark attendance for at least one student'); return; }
    try {
      if (isEditing) await api.delete(`/api/attendance?cbs_id=${selectedSection}&date=${selectedDate}`);
      const records = Object.entries(attendance).map(([student_id, status]) => ({ class_batch_section_id: selectedSection, student_id, teacher_id: user?.id, attendance_date: selectedDate, status }));
      await api.post('/api/attendance/bulk', records);
      alert('Attendance saved successfully!'); fetchAttendance();
    } catch (error) { console.error('Error:', error); alert('Error saving attendance'); }
  };

  if (loading) return (<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a884]"></div></div>);

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#e9edef] mb-6">Attendance Management</h1>
      <div className="rounded-xl p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div><label className="block text-sm font-medium text-[#d1d7db] mb-2">Select Section</label><select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} className="w-full px-3 py-2 border border-[#222d34] rounded-lg focus:ring-1 focus:ring-[#00a884]"><option value="">Choose a section</option>{sections.map((section) => (<option key={section.class_batch_section_id} value={section.class_batch_section_id}>{section.class_batch_section?.class?.name} - {section.class_batch_section?.batch?.name} - Section {section.class_batch_section?.section?.name}</option>))}</select></div>
          <div><label className="block text-sm font-medium text-[#d1d7db] mb-2">Date</label><input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full px-3 py-2 border border-[#222d34] rounded-lg focus:ring-1 focus:ring-[#00a884]" /></div>
        </div>
        {isEditing && (<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4"><p className="text-sm text-yellow-800 flex items-center"><FiEdit2 className="mr-2" />Editing existing attendance for this date</p></div>)}
      </div>

      {selectedSection && students.length > 0 && (
        <div className="rounded-xl p-6" style={{ background: "#111b21", border: "1px solid #222d34" }}>
          <h2 className="text-xl font-semibold text-[#e9edef] mb-4">Mark Attendance</h2>
          <div className="space-y-3">
            {students.map((student: any) => (
              <div key={student.id} className="flex items-center justify-between border border-gray-200 rounded-lg p-4">
                <div><p className="font-semibold text-[#e9edef]">{student.display_name}</p><p className="text-sm text-[#8696a0]">{student.email}</p></div>
                <div className="flex space-x-2">
                  <button onClick={() => handleAttendanceChange(student.id, 'present')} className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${attendance[student.id] === 'present' ? 'bg-emerald-500 text-white' : 'bg-[#0b141a] text-[#d1d7db] hover:bg-green-100'}`}><FiCheck /><span>Present</span></button>
                  <button onClick={() => handleAttendanceChange(student.id, 'absent')} className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${attendance[student.id] === 'absent' ? 'bg-red-500/80 text-white' : 'bg-[#0b141a] text-[#d1d7db] hover:bg-red-100'}`}><FiX /><span>Absent</span></button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end"><button onClick={handleSubmit} className="bg-[#00a884] text-white px-6 py-3 rounded-lg hover:opacity-90 transition font-semibold">Save Attendance</button></div>
        </div>
      )}
      {selectedSection && students.length === 0 && (<div className="rounded-xl p-12 text-center" style={{ background: "#111b21", border: "1px solid #222d34" }}><p className="text-[#8696a0]">No students enrolled in this section.</p></div>)}
    </div>
  );
}
