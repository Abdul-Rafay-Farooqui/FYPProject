'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/cms/api';
import { useAuth } from '@/contexts/cms/AuthContext';
import { FiPlus, FiStar } from 'react-icons/fi';

export default function TeacherHomeworkPage() {
  const { user } = useAuth();
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [homework, setHomework] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedHomework, setSelectedHomework] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({ class_batch_section_id: '', subject_id: '', title: '', description: '', image_url: '', due_date: '' });
  const [reviewData, setReviewData] = useState({ submission_id: '', stars: 0, feedback: '' });

  useEffect(() => { if (user) fetchData(); }, [user]);

  const fetchData = async () => {
    try {
      const [sectionsRes, subjectsRes, homeworkRes] = await Promise.all([
        api.get(`/api/teacher-assignments?teacher_id=${user?.id}`),
        api.get('/api/subjects'),
        api.get(`/api/homework?teacher_id=${user?.id}`)
      ]);
      setSections(sectionsRes); setSubjects(subjectsRes); setHomework(homeworkRes);
      setError('');
    } catch (err: any) { setError(err.response?.data?.message || err.message || 'Error fetching data'); } finally { setLoading(false); }
  };

  const fetchSubmissions = async (homeworkId: string) => {
    try { const data = await api.get(`/api/homework-submissions?homework_id=${homeworkId}`); setSubmissions(data); }
    catch (error) { console.error('Error:', error); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/homework', { ...formData, teacher_id: user?.id, subject_id: formData.subject_id || null });
      setShowModal(false); setFormData({ class_batch_section_id: '', subject_id: '', title: '', description: '', image_url: '', due_date: '' });
      setError('');
      fetchData(); 
    } catch (err: any) { setError(err.response?.data?.message || err.message || 'Error publishing homework'); }
  };

  const handleReview = async (submissionId: string) => {
    try {
      await api.put(`/api/homework-submissions/${submissionId}`, { stars: reviewData.stars, teacher_feedback: reviewData.feedback });
      setReviewData({ submission_id: '', stars: 0, feedback: '' });
      if (selectedHomework) fetchSubmissions(selectedHomework);
      setError('');
    } catch (err: any) { setError(err.response?.data?.message || err.message || 'Error submitting review'); }
  };

  const openSubmissionsModal = (homeworkId: string) => { setSelectedHomework(homeworkId); fetchSubmissions(homeworkId); setShowSubmissionsModal(true); };

  if (loading) return (<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a884]"></div></div>);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#e9edef]">Homework Management</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center space-x-2 bg-[#00a884] text-white px-4 py-2 rounded-lg hover:opacity-90 transition"><FiPlus /><span>Create Homework</span></button>
      </div>
      {error && <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>{error}</div>}

      <div className="space-y-4">
        {homework.map((hw) => (
          <div key={hw.id} className="rounded-xl p-6" style={{ background: "#111b21", border: "1px solid #222d34" }}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-[#e9edef]">{hw.title}</h3>
                <p className="text-sm text-[#8696a0]">{hw.class_batch_section?.class?.name} - {hw.class_batch_section?.batch?.name} - Section {hw.class_batch_section?.section?.name}</p>
                {hw.subject && <p className="text-sm text-[#8696a0]">Subject: {hw.subject.name}</p>}
                {hw.due_date && <p className="text-sm text-[#8696a0]">Due: {new Date(hw.due_date).toLocaleDateString()}</p>}
              </div>
              <button onClick={() => openSubmissionsModal(hw.id)} className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition">View Submissions</button>
            </div>
            {hw.description && <p className="text-[#d1d7db] mb-2">{hw.description}</p>}
            {hw.image_url && <img src={hw.image_url} alt="Homework" className="mt-2 max-w-md rounded-lg" />}
          </div>
        ))}
        {homework.length === 0 && <div className="rounded-xl p-12 text-center" style={{ background: "#111b21", border: "1px solid #222d34" }}><p className="text-[#8696a0]">No homework created yet.</p></div>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="rounded-xl p-8 max-w" style={{ background: "#111b21", border: "1px solid #222d34" }} data-x="rounded-xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Create Homework</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4"><label className="block text-sm font-medium text-[#d1d7db] mb-2">Section</label><select value={formData.class_batch_section_id} onChange={(e) => setFormData({ ...formData, class_batch_section_id: e.target.value })} className="w-full px-3 py-2 border border-[#222d34] rounded-lg focus:ring-1 focus:ring-[#00a884]" required><option value="">Select Section</option>{sections.map((section) => (<option key={section.class_batch_section_id} value={section.class_batch_section_id}>{section.class_batch_section?.class?.name} - {section.class_batch_section?.batch?.name} - Section {section.class_batch_section?.section?.name}</option>))}</select></div>
              <div className="mb-4"><label className="block text-sm font-medium text-[#d1d7db] mb-2">Subject</label><select value={formData.subject_id} onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })} className="w-full px-3 py-2 border border-[#222d34] rounded-lg focus:ring-1 focus:ring-[#00a884]"><option value="">Select Subject (Optional)</option>{subjects.map((subject) => (<option key={subject.id} value={subject.id}>{subject.name}</option>))}</select></div>
              <div className="mb-4"><label className="block text-sm font-medium text-[#d1d7db] mb-2">Title</label><input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border border-[#222d34] rounded-lg focus:ring-1 focus:ring-[#00a884]" required /></div>
              <div className="mb-4"><label className="block text-sm font-medium text-[#d1d7db] mb-2">Description</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border border-[#222d34] rounded-lg focus:ring-1 focus:ring-[#00a884]" rows={4} /></div>
              <div className="mb-4"><label className="block text-sm font-medium text-[#d1d7db] mb-2">Image URL</label><input type="url" value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} className="w-full px-3 py-2 border border-[#222d34] rounded-lg focus:ring-1 focus:ring-[#00a884]" placeholder="https://example.com/image.jpg" /></div>
              <div className="mb-6"><label className="block text-sm font-medium text-[#d1d7db] mb-2">Due Date</label><input type="datetime-local" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} className="w-full px-3 py-2 border border-[#222d34] rounded-lg focus:ring-1 focus:ring-[#00a884]" /></div>
              <div className="flex justify-end space-x-3"><button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-[#222d34] rounded-lg hover:bg-[#111b21]">Cancel</button><button type="submit" className="px-4 py-2 bg-[#00a884] text-white rounded-lg hover:opacity-90">Publish</button></div>
            </form>
          </div>
        </div>
      )}

      {showSubmissionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl p-8 max-w" style={{ background: "#111b21", border: "1px solid #222d34" }} data-x="rounded-xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Homework Submissions</h2>
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div key={submission.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-[#e9edef]">{submission.student?.name}</p><p className="text-sm text-[#8696a0]">{submission.student?.email}</p>
                      <p className="text-sm text-[#8696a0]">Submitted: {new Date(submission.submitted_date).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} onClick={() => { setReviewData({ ...reviewData, submission_id: submission.id, stars: star }); handleReview(submission.id); }} className={`${submission.stars >= star ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition`}><FiStar className="fill-current" /></button>
                      ))}
                    </div>
                  </div>
                  {submission.submission_text && <p className="text-[#d1d7db] mb-2">{submission.submission_text}</p>}
                  {submission.image_url && <img src={submission.image_url} alt="Submission" className="max-w-md rounded-lg mb-2" />}
                  {submission.teacher_feedback && <div className="bg-blue-50 p-3 rounded-lg mt-2"><p className="text-sm font-semibold text-blue-800">Your Feedback:</p><p className="text-sm text-blue-700">{submission.teacher_feedback}</p></div>}
                  <div className="mt-3"><input type="text" placeholder="Add feedback..." value={reviewData.submission_id === submission.id ? reviewData.feedback : ''} onChange={(e) => setReviewData({ ...reviewData, submission_id: submission.id, feedback: e.target.value })} className="w-full px-3 py-2 border border-[#222d34] rounded-lg focus:ring-1 focus:ring-[#00a884]" /><button onClick={() => handleReview(submission.id)} className="mt-2 bg-[#00a884] text-white px-4 py-2 rounded-lg hover:opacity-90 transition">Submit Feedback</button></div>
                </div>
              ))}
              {submissions.length === 0 && <p className="text-[#8696a0] text-center py-8">No submissions yet.</p>}
            </div>
            <div className="flex justify-end mt-6"><button onClick={() => setShowSubmissionsModal(false)} className="px-4 py-2 border border-[#222d34] rounded-lg hover:bg-[#111b21]">Close</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
