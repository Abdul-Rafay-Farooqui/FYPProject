"use client";

import { useState, useEffect } from "react";
import { InstituteAPI } from "@/lib/api/institute";
import { AddSubjectModal } from "../InstituteDataModals";

export default function SubjectsTab({ subjects, instituteId, isAdmin, onRefresh }: any) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showCourseCodeModal, setShowCourseCodeModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [teacherSearch, setTeacherSearch] = useState("");

  useEffect(() => {
    console.log('SubjectsTab mounted, isAdmin:', isAdmin, 'instituteId:', instituteId);
    if (isAdmin) {
      loadTeachersAndAssignments();
    }
  }, [instituteId, isAdmin]);

  const loadTeachersAndAssignments = async () => {
    try {
      const [teachersData, studentsData, assignmentsData, enrollmentsData] = await Promise.all([
        InstituteAPI.getMembers(instituteId, "teacher").catch((err) => { 
          console.error('Failed to load teachers:', err); 
          return []; 
        }),
        InstituteAPI.getMembers(instituteId, "student").catch((err) => { 
          console.error('Failed to load students:', err); 
          return []; 
        }),
        InstituteAPI.getSubjectAssignments(instituteId).catch((err) => { 
          console.error('Failed to load assignments:', err); 
          return []; 
        }),
        InstituteAPI.getCourseEnrollments({ institute_id: instituteId }).catch((err) => { 
          console.error('Failed to load enrollments:', err); 
          return []; 
        }),
      ]);
      console.log('Loaded data:', { teachersData, studentsData, assignmentsData, enrollmentsData });
      setTeachers(teachersData);
      setStudents(studentsData);
      setAssignments(assignmentsData);
      setEnrollments(enrollmentsData);
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  const handleAddSubject = async (name: string) => {
    await InstituteAPI.createSubject({ name, institute_id: instituteId });
    onRefresh();
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (confirm("Are you sure you want to delete this subject?")) {
      await InstituteAPI.deleteSubject(subjectId);
      onRefresh();
    }
  };

  const handleAssignTeacher = (subject: any) => {
    setSelectedSubject(subject);
    setTeacherSearch(""); // Reset search
    setShowAssignModal(true);
  };

  const handleSubmitAssignment = async (teacherId: string) => {
    if (!selectedSubject) return;
    try {
      setLoading(true);
      await InstituteAPI.assignSubjectToTeacher({
        subject_id: selectedSubject.id,
        teacher_id: teacherId,
        institute_id: instituteId,
      });
      await loadTeachersAndAssignments();
      setShowAssignModal(false);
      setSelectedSubject(null);
      setTeacherSearch(""); // Reset search
    } catch (error: any) {
      alert(error.message || "Failed to assign teacher");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (confirm("Remove this teacher assignment?")) {
      try {
        await InstituteAPI.removeSubjectAssignment(assignmentId);
        await loadTeachersAndAssignments();
      } catch (error) {
        console.error("Failed to remove assignment:", error);
      }
    }
  };

  const getAssignedTeachers = (subjectId: string) => {
    return assignments.filter((a: any) => a.subject_id === subjectId);
  };

  const getEnrolledStudents = (subjectId: string) => {
    return enrollments.filter((e: any) => e.subject_id === subjectId);
  };

  const handleEnrollStudents = (subject: any) => {
    setSelectedSubject(subject);
    setStudentSearch(""); // Reset search
    setShowEnrollModal(true);
  };

  const handleSubmitEnrollment = async (studentId: string) => {
    if (!selectedSubject) return;
    try {
      setLoading(true);
      await InstituteAPI.enrollStudent({
        student_id: studentId,
        subject_id: selectedSubject.id,
        institute_id: instituteId,
      });
      await loadTeachersAndAssignments();
      setShowEnrollModal(false);
      setSelectedSubject(null);
      setStudentSearch(""); // Reset search
    } catch (error: any) {
      alert(error.message || "Failed to enroll student");
    } finally {
      setLoading(false);
    }
  };

  const handleUnenrollStudent = async (enrollmentId: string) => {
    if (confirm("Remove this student from the course?")) {
      try {
        await InstituteAPI.unenrollStudent(enrollmentId);
        await loadTeachersAndAssignments();
      } catch (error) {
        console.error("Failed to unenroll student:", error);
      }
    }
  };

  const handleGenerateCourseCode = (subject: any) => {
    setSelectedSubject(subject);
    setShowCourseCodeModal(true);
  };

  const generateCourseCode = async () => {
    if (!selectedSubject) return;
    try {
      setLoading(true);
      // Generate a random 6-character code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      await InstituteAPI.updateSubject(selectedSubject.id, { course_code: code });
      onRefresh();
      await loadTeachersAndAssignments();
    } catch (error: any) {
      alert(error.message || "Failed to generate course code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-[#e9edef] text-lg md:text-2xl font-semibold">Subjects</h2>
        {isAdmin && (
          <button onClick={() => setShowAddModal(true)} className="px-3 py-1.5 rounded text-xs md:text-sm bg-[#00a884] text-[#0b141a] hover:bg-[#00a884]/90 whitespace-nowrap">+ Add Subject</button>
        )}
      </div>
      {subjects.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#1e2a30] flex items-center justify-center">
            <svg className="w-10 h-10 text-[#8696a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-[#8696a0]">No subjects yet</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {subjects.map((subject: any) => {
            const assignedTeachers = getAssignedTeachers(subject.id);
            const enrolledStudents = getEnrolledStudents(subject.id);
            return (
              <div key={subject.id} className="bg-[#111b21] rounded-lg p-4 border border-[#222d34]">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[#e9edef] font-medium">{subject.name}</h3>
                    {subject.code && <p className="text-[#8696a0] text-sm mt-1">Code: {subject.code}</p>}
                    {subject.course_code && (
                      <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-[#00a884]/10 border border-[#00a884]/30 rounded-lg">
                        <svg className="w-4 h-4 text-[#00a884]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                        <span className="text-[#00a884] text-sm font-mono font-semibold">{subject.course_code}</span>
                      </div>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="flex flex-wrap gap-1.5 flex-shrink-0">
                      <button onClick={() => handleEnrollStudents(subject)} className="px-2 py-1 rounded text-xs bg-[#00a884] text-[#0b141a] hover:bg-[#00a884]/90 flex items-center gap-1 whitespace-nowrap">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Enroll
                      </button>
                      <button onClick={() => handleGenerateCourseCode(subject)} className="px-2 py-1 rounded text-xs bg-[#1e2a30] text-[#e9edef] hover:bg-[#2a3942] flex items-center gap-1 whitespace-nowrap">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>Code
                      </button>
                      <button onClick={() => handleAssignTeacher(subject)} className="px-2 py-1 rounded text-xs bg-[#1e2a30] text-[#e9edef] hover:bg-[#2a3942] flex items-center gap-1 whitespace-nowrap">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>Teacher
                      </button>
                      <button onClick={() => handleDeleteSubject(subject.id)} className="p-1.5 text-red-400 hover:text-red-300">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Assigned Teachers */}
                {assignedTeachers.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#222d34]">
                    <p className="text-[#8696a0] text-xs mb-2">Assigned Teachers:</p>
                    <div className="flex flex-wrap gap-2">
                      {assignedTeachers.map((assignment: any) => (
                        <div
                          key={assignment.id}
                          className="flex items-center gap-2 px-3 py-1.5 bg-[#0b141a] rounded-lg border border-[#222d34]"
                        >
                          <div className="w-6 h-6 rounded-full bg-[#00a884]/20 flex items-center justify-center">
                            <span className="text-[#00a884] text-xs font-semibold">
                              {assignment.teacher?.display_name?.[0] || assignment.teacher?.email?.[0] || "T"}
                            </span>
                          </div>
                          <span className="text-[#e9edef] text-sm">
                            {assignment.teacher?.display_name || assignment.teacher?.email || "Unknown"}
                          </span>
                          {isAdmin && (
                            <button
                              onClick={() => handleRemoveAssignment(assignment.id)}
                              className="text-red-400 hover:text-red-300 ml-1"
                              title="Remove assignment"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Enrolled Students */}
                {enrolledStudents.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#222d34]">
                    <p className="text-[#8696a0] text-xs mb-2">Enrolled Students ({enrolledStudents.length}):</p>
                    <div className="flex flex-wrap gap-2">
                      {enrolledStudents.slice(0, 5).map((enrollment: any) => (
                        <div
                          key={enrollment.id}
                          className="flex items-center gap-2 px-3 py-1.5 bg-[#0b141a] rounded-lg border border-[#222d34]"
                        >
                          <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <span className="text-blue-400 text-xs font-semibold">
                              {enrollment.student?.display_name?.[0] || enrollment.student?.email?.[0] || "S"}
                            </span>
                          </div>
                          <span className="text-[#e9edef] text-sm">
                            {enrollment.student?.display_name || enrollment.student?.email || "Unknown"}
                          </span>
                          {isAdmin && (
                            <button
                              onClick={() => handleUnenrollStudent(enrollment.id)}
                              className="text-red-400 hover:text-red-300 ml-1"
                              title="Unenroll student"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                      {enrolledStudents.length > 5 && (
                        <div className="px-3 py-1.5 bg-[#0b141a] rounded-lg border border-[#222d34]">
                          <span className="text-[#8696a0] text-sm">+{enrolledStudents.length - 5} more</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Subject Modal */}
      <AddSubjectModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddSubject}
      />

      {/* Assign Teacher Modal */}
      {showAssignModal && selectedSubject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111b21] rounded-xl border border-[#222d34] w-full max-w-md">
            <div className="p-6 border-b border-[#222d34]">
              <h3 className="text-[#e9edef] text-lg font-semibold">
                Assign Teacher to {selectedSubject.name}
              </h3>
            </div>

            <div className="p-6">
              <p className="text-[#8696a0] text-sm mb-4">
                Select a teacher to assign to this subject:
              </p>

              {/* Search Field */}
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search teachers by name or email..."
                    value={teacherSearch}
                    onChange={(e) => setTeacherSearch(e.target.value)}
                    className="w-full px-4 py-2 pl-10 bg-[#0b141a] border border-[#222d34] rounded-lg text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:border-[#00a884]"
                  />
                  <svg 
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8696a0]" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                {teachers.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1e2a30] flex items-center justify-center">
                      <svg className="w-8 h-8 text-[#8696a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <p className="text-[#e9edef] font-medium mb-2">No teachers found</p>
                    <p className="text-[#8696a0] text-sm">
                      Add teachers to your institute from the Members tab first
                    </p>
                  </div>
                ) : (
                  teachers
                    .filter((teacher: any) => {
                      if (!teacherSearch) return true;
                      const search = teacherSearch.toLowerCase();
                      return (
                        teacher.user?.display_name?.toLowerCase().includes(search) ||
                        teacher.user?.email?.toLowerCase().includes(search)
                      );
                    })
                    .map((teacher: any) => {
                      const alreadyAssigned = assignments.some(
                        (a: any) => a.subject_id === selectedSubject.id && a.teacher_id === teacher.user_id
                      );
                      return (
                        <button
                          key={teacher.user_id}
                          onClick={() => !alreadyAssigned && handleSubmitAssignment(teacher.user_id)}
                          disabled={alreadyAssigned || loading}
                          className={`w-full p-3 rounded-lg border text-left flex items-center gap-3 transition-colors ${
                            alreadyAssigned
                              ? "border-[#222d34] bg-[#0b141a] opacity-50 cursor-not-allowed"
                              : "border-[#222d34] hover:border-[#00a884] hover:bg-[#0b141a]"
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-[#00a884]/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-[#00a884] font-semibold">
                              {teacher.user?.display_name?.[0] || teacher.user?.email?.[0] || "T"}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-[#e9edef] font-medium">
                              {teacher.user?.display_name || "Unknown"}
                            </p>
                            <p className="text-[#8696a0] text-sm">
                              {teacher.user?.email || "No email"}
                            </p>
                          </div>
                          {alreadyAssigned && (
                            <span className="text-[#00a884] text-xs">Already Assigned</span>
                          )}
                        </button>
                      );
                    })
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedSubject(null);
                    setTeacherSearch("");
                  }}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-[#0b141a] text-[#e9edef] border border-[#222d34] hover:bg-[#1e2a30] transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enroll Students Modal */}
      {showEnrollModal && selectedSubject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111b21] rounded-xl border border-[#222d34] w-full max-w-md">
            <div className="p-6 border-b border-[#222d34]">
              <h3 className="text-[#e9edef] text-lg font-semibold">
                Enroll Students in {selectedSubject.name}
              </h3>
            </div>

            <div className="p-6">
              <p className="text-[#8696a0] text-sm mb-4">
                Select a student to enroll in this course:
              </p>

              {/* Search Field */}
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search students by name or email..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full px-4 py-2 pl-10 bg-[#0b141a] border border-[#222d34] rounded-lg text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:border-[#00a884]"
                  />
                  <svg 
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8696a0]" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                {students.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1e2a30] flex items-center justify-center">
                      <svg className="w-8 h-8 text-[#8696a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <p className="text-[#e9edef] font-medium mb-2">No students found</p>
                    <p className="text-[#8696a0] text-sm">
                      Add students to your institute from the Members tab first
                    </p>
                  </div>
                ) : (
                  students
                    .filter((student: any) => {
                      if (!studentSearch) return true;
                      const search = studentSearch.toLowerCase();
                      return (
                        student.user?.display_name?.toLowerCase().includes(search) ||
                        student.user?.email?.toLowerCase().includes(search)
                      );
                    })
                    .map((student: any) => {
                      const alreadyEnrolled = enrollments.some(
                        (e: any) => e.subject_id === selectedSubject.id && e.student_id === student.user_id
                      );
                      return (
                        <button
                          key={student.user_id}
                          onClick={() => !alreadyEnrolled && handleSubmitEnrollment(student.user_id)}
                          disabled={alreadyEnrolled || loading}
                          className={`w-full p-3 rounded-lg border text-left flex items-center gap-3 transition-colors ${
                            alreadyEnrolled
                              ? "border-[#222d34] bg-[#0b141a] opacity-50 cursor-not-allowed"
                              : "border-[#222d34] hover:border-[#00a884] hover:bg-[#0b141a]"
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-400 font-semibold">
                              {student.user?.display_name?.[0] || student.user?.email?.[0] || "S"}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-[#e9edef] font-medium">
                              {student.user?.display_name || "Unknown"}
                            </p>
                            <p className="text-[#8696a0] text-sm">
                              {student.user?.email || "No email"}
                            </p>
                          </div>
                          {alreadyEnrolled && (
                            <span className="text-[#00a884] text-xs">Already Enrolled</span>
                          )}
                        </button>
                      );
                    })
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEnrollModal(false);
                    setSelectedSubject(null);
                    setStudentSearch("");
                  }}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-[#0b141a] text-[#e9edef] border border-[#222d34] hover:bg-[#1e2a30] transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Course Code Modal */}
      {showCourseCodeModal && selectedSubject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111b21] rounded-xl border border-[#222d34] w-full max-w-md">
            <div className="p-6 border-b border-[#222d34]">
              <h3 className="text-[#e9edef] text-lg font-semibold">
                Course Code for {selectedSubject.name}
              </h3>
            </div>

            <div className="p-6">
              {selectedSubject.course_code ? (
                <div>
                  <p className="text-[#8696a0] text-sm mb-4">
                    Students can use this code to join the course:
                  </p>
                  <div className="p-4 bg-[#0b141a] rounded-lg border border-[#00a884]/30 text-center">
                    <p className="text-[#00a884] text-3xl font-mono font-bold tracking-wider">
                      {selectedSubject.course_code}
                    </p>
                  </div>
                  <p className="text-[#8696a0] text-xs mt-4 text-center">
                    Share this code with students to let them join this course
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-[#8696a0] text-sm mb-4">
                    No course code has been generated yet. Generate one to allow students to join this course.
                  </p>
                  <button
                    onClick={generateCourseCode}
                    disabled={loading}
                    className="w-full px-4 py-2 rounded-lg bg-[#00a884] text-[#0b141a] hover:bg-[#00a884]/90 font-medium disabled:opacity-50"
                  >
                    {loading ? "Generating..." : "Generate Course Code"}
                  </button>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCourseCodeModal(false);
                    setSelectedSubject(null);
                  }}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-[#0b141a] text-[#e9edef] border border-[#222d34] hover:bg-[#1e2a30] transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
