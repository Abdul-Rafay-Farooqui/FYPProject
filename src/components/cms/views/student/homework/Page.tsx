'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/cms/api';
import { useAuth } from '@/contexts/cms/AuthContext';
import { FiUpload, FiCheckCircle } from 'react-icons/fi';

export default function StudentHomeworkPage() {
  const { user } = useAuth();
  const [homework, setHomework] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, any>>({});
  const [showModal, setShowModal] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({ submission_text: '', image_url: '' });

  useEffect(() => { if (user) fetchData(); }, [user]);

  const fetchData = async () => {
    try {
      const enrollmentRes = await api.get(`/api/student-enrollments/single?student_id=${user?.id}`);
      if (!enrollmentRes) { setLoading(false); return; }

      const hwRes = await api.get(`/api/homework?cbs_id=${enrollmentRes.class_batch_section_id}`);
      setHomework(hwRes);

      const submissionsRes = await api.get(`/api/homework-submissions?student_id=${user?.id}`);
      const subMap: Record<string, any> = {};
      submissionsRes.forEach((s: any) => { subMap[s.homework_id] = s; });
      setSubmissions(subMap);
    } catch (error) { console.error('Error:', error); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/homework-submissions', { ...formData, homework_id: selectedHomework.id, student_id: user?.id, stars: null });
      setShowModal(false); setFormData({ submission_text: '', image_url: '' }); fetchData(); alert('Homework submitted successfully!');
    } catch (error) { console.error('Error:', error); alert('Error submitting homework'); }
  };

  const openSubmitModal = (hw: any) => { setSelectedHomework(hw); setFormData({ submission_text: '', image_url: '' }); setShowModal(true); };

  if (loading) return (<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a884]"></div></div>);

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#e9edef] mb-6">Homework</h1>
      <div className="space-y-6">
        {homework.map((hw) => {
          const submission = submissions[hw.id];
          const isOverdue = hw.due_date && new Date(hw.due_date) < new Date() && !submission;
          return (
            <div key={hw.id} className="rounded-xl overflow-hidden" style={{ background: "#111b21", border: "1px solid #222d34" }}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div><h3 className="text-xl font-semibold text-[#e9edef]">{hw.title}</h3><p className="text-sm text-[#8696a0]">Teacher: {hw.teacher?.name}</p>{hw.subject && <p className="text-sm text-[#8696a0]">Subject: {hw.subject.name}</p>}{hw.due_date && <p className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-[#8696a0]'}`}>Due: {new Date(hw.due_date).toLocaleString()}</p>}</div>
                  {!submission ? (
                    <button onClick={() => openSubmitModal(hw)} className="flex items-center space-x-2 bg-[#00a884] text-white px-4 py-2 rounded-lg hover:opacity-90 transition"><FiUpload /><span>Submit</span></button>
                  ) : (
                    <div className="flex items-center space-x-2 text-green-600 font-medium"><FiCheckCircle /><span>Submitted</span></div>
                  )}
                </div>
                {hw.description && <p className="text-[#d1d7db] mb-4">{hw.description}</p>}
                {hw.image_url && <img src={hw.image_url} alt="Homework" className="max-w-md rounded-lg mb-4" />}
                
                {submission && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-semibold text-[#e9edef] mb-2">Your Submission</h4>
                    <p className="text-sm text-[#8696a0] mb-2">Submitted on: {new Date(submission.submitted_date).toLocaleString()}</p>
                    {submission.submission_text && <p className="text-[#d1d7db] mb-2">{submission.submission_text}</p>}
                    {submission.image_url && <img src={submission.image_url} alt="Submission" className="max-w-md rounded-lg mb-4" />}
                    {submission.stars !== null && (
                      <div className="bg-blue-50 p-4 rounded-lg mt-4">
                        <div className="flex items-center mb-2"><span className="font-semibold text-blue-900 mr-2">Grade:</span><div className="flex text-yellow-400">{[1,2,3,4,5].map(star => (<span key={star} className={submission.stars >= star ? 'text-yellow-400' : 'text-gray-300'}>★</span>))}</div></div>
                        {submission.teacher_feedback && <div><span className="font-semibold text-blue-900">Teacher Feedback:</span><p className="text-blue-800 mt-1">{submission.teacher_feedback}</p></div>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {homework.length === 0 && <div className="rounded-xl p-12 text-center" style={{ background: "#111b21", border: "1px solid #222d34" }}><p className="text-[#8696a0]">No homework assigned yet.</p></div>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="rounded-xl p-8 max-w" style={{ background: "#111b21", border: "1px solid #222d34" }} data-x="rounded-xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Submit Homework</h2>
            <p className="text-[#8696a0] mb-4">Submitting for: <span className="font-semibold">{selectedHomework?.title}</span></p>
            <form onSubmit={handleSubmit}>
              <div className="mb-4"><label className="block text-sm font-medium text-[#d1d7db] mb-2">Submission Details</label><textarea value={formData.submission_text} onChange={(e) => setFormData({ ...formData, submission_text: e.target.value })} className="w-full px-3 py-2 border border-[#222d34] rounded-lg focus:ring-1 focus:ring-[#00a884]" rows={4} placeholder="Type your answer or provide a link..." required /></div>
              <div className="mb-6"><label className="block text-sm font-medium text-[#d1d7db] mb-2">Attachment URL (Optional)</label><input type="url" value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} className="w-full px-3 py-2 border border-[#222d34] rounded-lg focus:ring-1 focus:ring-[#00a884]" placeholder="https://example.com/image.jpg" /></div>
              <div className="flex justify-end space-x-3"><button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-[#222d34] rounded-lg hover:bg-[#111b21]">Cancel</button><button type="submit" className="px-4 py-2 bg-[#00a884] text-white rounded-lg hover:opacity-90">Submit</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
