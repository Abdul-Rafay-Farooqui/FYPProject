'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/cms/api';
import { useAuth } from '@/contexts/cms/AuthContext';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

export default function TeacherResultsPage() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [existingResults, setExistingResults] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [formData, setFormData] = useState({
    student_id: '', subject_id: '', result_type: 'quiz' as 'quiz' | 'mid' | 'final' | 'assignment',
    marks_obtained: '', total_marks: '', grade: '', remarks: '',
  });

  console.log('🚀 TeacherResultsPage component mounted!', { user: user?.id });

  useEffect(() => { 
    console.log('useEffect 1: User loaded, calling fetchTeacherSubjects');
    if (user) { fetchTeacherSubjects(); } 
  }, [user]);

  useEffect(() => { 
    console.log('useEffect 2: selectedSubject changed:', { selectedSubject });
    if (selectedSubject) { 
      console.log('Calling fetchStudentsForSubject and fetchResults');
      fetchStudentsForSubject(); 
      fetchResults(); 
    } 
  }, [selectedSubject]);

  const fetchTeacherSubjects = async () => {
    try {
      console.log('👨‍🏫 fetchTeacherSubjects called for teacher:', user?.id);
      
      // Get all results for this teacher to find unique subjects
      const allResults = await api.get(`/api/results?teacher_id=${user?.id}`);
      console.log('📚 All results for teacher:', allResults);
      
      // Also try to get subjects from teacher assignments
      let allAssignments = [];
      try {
        allAssignments = await api.get(`/api/teacher-assignments?teacher_id=${user?.id}`);
        console.log('📋 Teacher assignments:', allAssignments);
      } catch (e) {
        console.log('⚠️ No teacher assignments found, will use results');
      }
      
      // Extract unique subjects from both sources
      const subjectMap = new Map();
      
      // Add from results
      if (Array.isArray(allResults)) {
        allResults.forEach((r: any) => {
          if (r.subject && r.subject.id) {
            subjectMap.set(r.subject.id, r.subject);
          }
        });
      }
      
      // Add from assignments
      if (Array.isArray(allAssignments)) {
        allAssignments
          .filter((a: any) => a.subject)
          .forEach((a: any) => {
            subjectMap.set(a.subject_id, a.subject);
          });
      }
      
      const uniqueSubjects = Array.from(subjectMap.values());
      
      console.log('✅ Unique subjects extracted:', uniqueSubjects);
      console.log('📋 Total subjects:', uniqueSubjects.length);
      if (uniqueSubjects.length > 0) {
        console.log('📌 First subject:', uniqueSubjects[0]);
      }
      
      setSubjects(uniqueSubjects);
      setError('');
    } catch (err: any) { 
      const errorMsg = err.response?.data?.message || err.message || 'Error fetching subjects';
      setError(errorMsg);
      console.error('❌ Fetch teacher subjects error:', {
        message: errorMsg,
        response: err.response?.data,
        status: err.response?.status
      });
    } finally { 
      setLoading(false); 
    }
  };

  const fetchStudentsForSubject = async () => {
    try {
      const enrollmentUrl = `/api/course-enrollments?subject_id=${selectedSubject}`;
      console.log('Fetching course enrollments from:', enrollmentUrl);
      
      const data = await api.get(enrollmentUrl);
      console.log('Received course enrollment data:', data);
      
      const extractedStudents = data.map((d: any) => d.student);
      console.log('Extracted students for subject:', extractedStudents);
      
      setStudents(extractedStudents);
      setError('');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Error fetching students';
      setError(errorMsg);
      console.error('Fetch students error:', errorMsg, err);
    }
  };

  const fetchResults = async () => {
    try {
      console.log('📞 fetchResults called');
      console.log('User ID:', user?.id);
      console.log('Selected Subject:', selectedSubject);
      
      const query = `/api/results?teacher_id=${user?.id}&subject_id=${selectedSubject}`;
      console.log('🔍 Making API call to:', query);
      
      const data = await api.get(query);
      console.log('✅ API Response received:', data);
      console.log('📊 Response type:', typeof data);
      console.log('📊 Is array?', Array.isArray(data));
      console.log('📊 Response length:', Array.isArray(data) ? data.length : 'N/A');
      
      if (data && Array.isArray(data) && data.length > 0) {
        console.log('📋 First result:', data[0]);
      }
      
      setExistingResults(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('❌ Error fetching results:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        fullError: err
      });
      setExistingResults([]);
    }
  };

  const calculateGrade = (obtained: number, total: number) => {
    const p = (obtained / total) * 100;
    if (p >= 90) return 'A+'; if (p >= 80) return 'A'; if (p >= 70) return 'B';
    if (p >= 60) return 'C'; if (p >= 50) return 'D'; return 'F';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    console.log('Form Submit - Debug Info:', {
      selectedSubject,
      studentId: formData.student_id,
      subjectId: formData.subject_id,
      marksObtained: formData.marks_obtained,
      totalMarks: formData.total_marks,
    });

    if (!selectedSubject || selectedSubject.trim() === '') {
      setError('Please select a subject first');
      console.log('Error: No subject selected');
      return;
    }
    
    if (!formData.student_id || formData.student_id.trim() === '') {
      setError('Please select a student');
      console.log('Error: No student selected');
      return;
    }
    
    if (!formData.marks_obtained || !formData.total_marks) {
      setError('Please enter marks');
      console.log('Error: Missing marks');
      return;
    }
    
    try {
      const marksObtained = parseFloat(formData.marks_obtained);
      const totalMarks = parseFloat(formData.total_marks);
      
      if (isNaN(marksObtained) || isNaN(totalMarks)) {
        setError('Marks must be valid numbers');
        return;
      }
      
      if (marksObtained > totalMarks) {
        setError('Marks obtained cannot be greater than total marks');
        return;
      }
      
      // Verify the student is actually enrolled in the selected subject
      const enrollmentCheck = students.find(s => s.id === formData.student_id);
      if (!enrollmentCheck) {
        setError('Selected student is not enrolled in this subject. Please refresh and try again.');
        console.log('Error: Student not found in enrollment list');
        return;
      }
      
      const grade = calculateGrade(marksObtained, totalMarks);
      
      console.log('Submitting result with data:', {
        student_id: formData.student_id,
        teacher_id: user?.id,
        subject_id: selectedSubject,
        result_type: formData.result_type,
        marks_obtained: marksObtained,
        total_marks: totalMarks,
        grade,
        remarks: formData.remarks,
      });
      
      await api.post('/api/results', {
        student_id: formData.student_id, 
        teacher_id: user?.id,
        subject_id: selectedSubject,
        result_type: formData.result_type,
        marks_obtained: marksObtained, 
        total_marks: totalMarks,
        grade, 
        remarks: formData.remarks,
      });
      
      console.log('Grade submitted successfully');
      setShowModal(false); 
      setFormData({ student_id: '', subject_id: '', result_type: 'quiz', marks_obtained: '', total_marks: '', grade: '', remarks: '' });
      setSuccessMessage('Grade added successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchResults(); // Refresh the results list
      setError('');
    } catch (err: any) { 
      const errorMsg = err.response?.data?.message || err.message || 'Error adding grade';
      setError(errorMsg);
      console.error('Submit error details:', {
        errorMsg,
        response: err.response?.data,
        fullError: err
      });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#e9edef]">Manage Grades</h1>
        <button 
          onClick={() => { 
            setError('');
            setFormData({ 
              student_id: '', 
              subject_id: selectedSubject, 
              result_type: 'quiz', 
              marks_obtained: '', 
              total_marks: '', 
              grade: '', 
              remarks: '' 
            }); 
            setShowModal(true); 
          }} 
          disabled={!selectedSubject || students.length === 0} 
          className="flex items-center space-x-2 bg-[#00a884] text-white px-4 py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiPlus /><span>Add Grade</span>
        </button>
      </div>
      
      {error && <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>{error}</div>}
      {successMessage && <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'rgba(34,197,94,0.15)', color: '#86efac' }}>{successMessage}</div>}

      <div className="rounded-xl p-6 mb-6" style={{ background: "#111b21", border: "1px solid #222d34" }}>
        <label className="block text-sm font-medium text-[#d1d7db] mb-2">Select Subject *</label>
        <select 
          value={selectedSubject} 
          onChange={(e) => { 
            console.log('🎯 Subject dropdown changed:', {
              newValue: e.target.value,
              oldValue: selectedSubject,
              availableSubjects: subjects.map(s => ({ id: s.id, name: s.name }))
            });
            setSelectedSubject(e.target.value);
            setError('');
          }} 
          className="w-full px-3 py-2 border border-[#222d34] rounded-lg focus:ring-1 focus:ring-[#00a884] text-[#e9edef]" 
          style={{background: '#222d34'}}
        >
          <option value="">Choose a subject you teach</option>
          {subjects && subjects.length > 0 ? (
            subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))
          ) : (
            <option disabled>No subjects found</option>
          )}
        </select>
        {subjects.length === 0 && (
          <p className="text-xs text-[#8696a0] mt-2">📌 Subjects not loaded yet. Check console logs.</p>
        )}
      </div>

      {selectedSubject && students.length > 0 && (
        <div className="rounded-xl p-6 mb-6" style={{ background: "#111b21", border: "1px solid #222d34" }}>
          <h2 className="text-xl font-semibold text-[#e9edef] mb-4">
            Enrolled Students - {subjects.find(s => s.id === selectedSubject)?.name}
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#222d34]">
              <thead className="bg-[#202c33]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8696a0] uppercase">Student Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8696a0] uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8696a0] uppercase">Grades Count</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8696a0] uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222d34]">
                {students.map((student) => {
                  const studentGrades = existingResults.filter(r => r.student_id === student.id);
                  console.log('Rendering student in table:', { id: student.id, name: student.display_name, email: student.email });
                  return (
                    <tr key={student.id}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-[#e9edef]">{student.display_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#8696a0]">{student.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#8696a0]">{studentGrades.length} grades</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button 
                          onClick={() => { 
                            setError('');
                            setFormData({ 
                              student_id: student.id, 
                              subject_id: selectedSubject, 
                              result_type: 'quiz', 
                              marks_obtained: '', 
                              total_marks: '', 
                              grade: '', 
                              remarks: '' 
                            }); 
                            setShowModal(true); 
                          }}
                          className="flex items-center gap-2 px-3 py-1 rounded bg-[#00a884] text-white text-xs hover:opacity-90"
                        >
                          <FiPlus size={14} /> Add Grade
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedSubject && existingResults.length > 0 && (
        <div className="rounded-xl p-6 mb-6" style={{ background: "#111b21", border: "1px solid #222d34" }}>
          <h2 className="text-xl font-semibold text-[#e9edef] mb-4">Recent Grades</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#222d34]">
              <thead className="bg-[#202c33]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8696a0] uppercase">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8696a0] uppercase">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8696a0] uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8696a0] uppercase">Marks</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8696a0] uppercase">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222d34]">
                {existingResults.slice(0, 10).map((result) => (
                  <tr key={result.id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-[#e9edef]">{result.student?.display_name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#8696a0]">{result.subject?.name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#8696a0] capitalize">{result.result_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#e9edef]">{result.marks_obtained}/{result.total_marks}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${result.grade === 'A+' || result.grade === 'A' ? 'bg-green-900 text-green-300' : result.grade === 'B' || result.grade === 'C' ? 'bg-yellow-900 text-yellow-300' : 'bg-red-900 text-red-300'}`}>{result.grade || 'N/A'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="rounded-xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto" style={{ background: "#111b21", border: "1px solid #222d34" }}>
            <h2 className="text-2xl font-bold mb-4 text-[#e9edef]">Add Grade</h2>
            <div className="mb-4 p-3 rounded text-xs" style={{ background: '#222d34', color: '#8696a0' }}>
              Subject: {subjects.find(s => s.id === selectedSubject)?.name || 'Not Selected'}
            </div>
            {error && <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#d1d7db] mb-2">Student *</label>
                <select value={formData.student_id} onChange={(e) => setFormData({ ...formData, student_id: e.target.value })} className="w-full px-3 py-2 border border-[#222d34] rounded-lg focus:ring-1 focus:ring-[#00a884] text-[#e9edef]" style={{background: '#222d34'}} required>
                  <option value="">Select Student</option>
                  {students.map((student: any) => (<option key={student.id} value={student.id}>{student.display_name}</option>))}</select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#d1d7db] mb-2">Result Type *</label>
                <select value={formData.result_type} onChange={(e) => setFormData({ ...formData, result_type: e.target.value as any })} className="w-full px-3 py-2 border border-[#222d34] rounded-lg focus:ring-1 focus:ring-[#00a884] text-[#e9edef]" style={{background: '#222d34'}} required>
                  <option value="quiz">Quiz</option>
                  <option value="mid">Mid Term</option>
                  <option value="final">Final</option>
                  <option value="assignment">Assignment</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#d1d7db] mb-2">Marks Obtained *</label>
                  <input type="number" step="0.01" value={formData.marks_obtained} onChange={(e) => setFormData({ ...formData, marks_obtained: e.target.value })} className="w-full px-3 py-2 border border-[#222d34] rounded-lg focus:ring-1 focus:ring-[#00a884] text-[#e9edef]" style={{background: '#222d34'}} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#d1d7db] mb-2">Total Marks *</label>
                  <input type="number" step="0.01" value={formData.total_marks} onChange={(e) => setFormData({ ...formData, total_marks: e.target.value })} className="w-full px-3 py-2 border border-[#222d34] rounded-lg focus:ring-1 focus:ring-[#00a884] text-[#e9edef]" style={{background: '#222d34'}} required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#d1d7db] mb-2">Remarks</label>
                <textarea value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} className="w-full px-3 py-2 border border-[#222d34] rounded-lg focus:ring-1 focus:ring-[#00a884] text-[#e9edef]" style={{background: '#222d34'}} rows={3} />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-[#222d34] rounded-lg hover:bg-[#202c33] text-[#e9edef] transition">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#00a884] text-white rounded-lg hover:opacity-90 transition">Add Grade</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
