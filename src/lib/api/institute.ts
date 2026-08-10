"use client";

import { api } from "./client";

export const InstituteAPI = {
  // Institute management
  listInstitutes: () => api.get("/institutes").then((r) => r.data),
  getInstitute: (instituteId: string) =>
    api.get(`/institutes/${instituteId}`).then((r) => r.data),
  createInstitute: (payload: {
    name: string;
    slug?: string;
    description?: string;
    logo_url?: string;
  }) => api.post("/institutes", payload).then((r) => r.data),
  updateInstitute: (
    instituteId: string,
    payload: {
      name?: string;
      slug?: string;
      description?: string;
      logo_url?: string;
      website_url?: string;
    },
  ) => api.patch(`/institutes/${instituteId}`, payload).then((r) => r.data),
  deleteInstitute: (instituteId: string) =>
    api.delete(`/institutes/${instituteId}`).then((r) => r.data),

  // Member management
  addInstituteMembers: (
    instituteId: string,
    member_ids: string[],
    role?: "admin" | "teacher" | "student",
  ) =>
    api
      .post(`/institutes/${instituteId}/members`, {
        user_ids: member_ids,
        role,
      })
      .then((r) => r.data),
  getMembers: (instituteId: string, role?: string) =>
    api
      .get(`/institutes/${instituteId}/members${role ? `?role=${role}` : ""}`)
      .then((r) => r.data),
  removeMember: (instituteId: string, memberId: string) =>
    api
      .delete(`/institutes/${instituteId}/members/${memberId}`)
      .then((r) => r.data),
  updateMemberRole: (
    instituteId: string,
    memberId: string,
    role: "admin" | "teacher" | "student",
  ) =>
    api
      .patch(`/institutes/${instituteId}/members/${memberId}`, { role })
      .then((r) => r.data),

  // Classes
  getClasses: (instituteId: string) => {
    console.log("[InstituteAPI] Fetching classes for institute:", instituteId);
    return api.get(`/classes?institute_id=${instituteId}`).then((r) => {
      console.log("[InstituteAPI] Classes response:", r.data);
      return r.data;
    });
  },
  createClass: (payload: {
    name: string;
    description?: string;
    institute_id: string;
  }) => api.post("/classes", payload).then((r) => r.data),
  updateClass: (
    classId: string,
    payload: { name?: string; description?: string },
  ) => api.patch(`/classes/${classId}`, payload).then((r) => r.data),
  deleteClass: (classId: string) =>
    api.delete(`/classes/${classId}`).then((r) => r.data),

  // Batches
  getBatches: (params?: {
    institute_id?: string;
    search?: string;
    sortField?: "name" | "year" | "created_at" | "student_count";
    sortOrder?: "ASC" | "DESC";
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams(params as any).toString();
    return api.get(`/batches${query ? `?${query}` : ""}`).then((r) => r.data);
  },
  getBatch: (batchId: string) =>
    api.get(`/batches/${batchId}`).then((r) => r.data),
  getBatchWithStudents: (batchId: string) =>
    api.get(`/batches/${batchId}/students`).then((r) => r.data),
  createBatch: (payload: {
    name: string;
    year: number;
    institute_id: string;
  }) => api.post("/batches", payload).then((r) => r.data),
  updateBatch: (batchId: string, payload: { name?: string; year?: number }) =>
    api.put(`/batches/${batchId}`, payload).then((r) => r.data),
  deleteBatch: (batchId: string) =>
    api.delete(`/batches/${batchId}`).then((r) => r.data),
  addStudentsToBatch: (
    batchId: string,
    payload: { student_ids: string[]; class_batch_section_id: string },
  ) => api.post(`/batches/${batchId}/students`, payload).then((r) => r.data),
  removeStudentFromBatch: (enrollmentId: string) =>
    api.delete(`/batches/enrollments/${enrollmentId}`).then((r) => r.data),
  updateStudentEnrollment: (
    enrollmentId: string,
    payload: { class_batch_section_id: string },
  ) =>
    api
      .put(`/batches/enrollments/${enrollmentId}`, payload)
      .then((r) => r.data),

  // Sections
  getSections: (params?: {
    institute_id?: string;
    search?: string;
    sortField?: "name" | "created_at" | "student_count";
    sortOrder?: "ASC" | "DESC";
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams(params as any).toString();
    return api.get(`/sections${query ? `?${query}` : ""}`).then((r) => r.data);
  },
  getSection: (sectionId: string) =>
    api.get(`/sections/${sectionId}`).then((r) => r.data),
  getSectionWithStudents: (sectionId: string) =>
    api.get(`/sections/${sectionId}/students`).then((r) => r.data),
  createSection: (payload: { name: string; institute_id: string }) =>
    api.post("/sections", payload).then((r) => r.data),
  updateSection: (sectionId: string, payload: { name?: string }) =>
    api.put(`/sections/${sectionId}`, payload).then((r) => r.data),
  deleteSection: (sectionId: string) =>
    api.delete(`/sections/${sectionId}`).then((r) => r.data),
  addStudentsToSection: (
    sectionId: string,
    payload: { student_ids: string[]; class_batch_section_id: string },
  ) => api.post(`/sections/${sectionId}/students`, payload).then((r) => r.data),
  removeStudentFromSection: (enrollmentId: string) =>
    api.delete(`/sections/enrollments/${enrollmentId}`).then((r) => r.data),

  // Subjects
  getSubjects: (instituteId: string) =>
    api.get(`/subjects?institute_id=${instituteId}`).then((r) => r.data),
  createSubject: (payload: {
    name: string;
    code?: string;
    institute_id: string;
  }) => api.post("/subjects", payload).then((r) => r.data),
  updateSubject: (
    subjectId: string,
    payload: { name?: string; code?: string },
  ) => api.patch(`/subjects/${subjectId}`, payload).then((r) => r.data),
  deleteSubject: (subjectId: string) =>
    api.delete(`/subjects/${subjectId}`).then((r) => r.data),

  // Class-Batch-Sections
  getCBS: (params?: {
    class_id?: string;
    batch_id?: string;
    section_id?: string;
  }) => {
    const query = new URLSearchParams(params as any).toString();
    return api
      .get(`/class-batch-sections${query ? `?${query}` : ""}`)
      .then((r) => r.data);
  },
  createCBS: (payload: {
    class_id: string;
    batch_id: string;
    section_id: string;
  }) => api.post("/class-batch-sections", payload).then((r) => r.data),
  deleteCBS: (cbsId: string) =>
    api.delete(`/class-batch-sections/${cbsId}`).then((r) => r.data),

  // Student Enrollments
  getEnrollments: (params?: {
    student_id?: string;
    class_batch_section_id?: string;
  }) => {
    const query = new URLSearchParams(params as any).toString();
    return api
      .get(`/student-enrollments${query ? `?${query}` : ""}`)
      .then((r) => r.data);
  },
  createEnrollment: (payload: {
    student_id: string;
    class_batch_section_id: string;
  }) => api.post("/student-enrollments", payload).then((r) => r.data),
  deleteEnrollment: (enrollmentId: string) =>
    api.delete(`/student-enrollments/${enrollmentId}`).then((r) => r.data),

  // Teacher Assignments
  getAssignments: (params?: {
    teacher_id?: string;
    class_batch_section_id?: string;
  }) => {
    const query = new URLSearchParams(params as any).toString();
    return api
      .get(`/teacher-assignments${query ? `?${query}` : ""}`)
      .then((r) => r.data);
  },
  createAssignment: (payload: {
    teacher_id: string;
    class_batch_section_id: string;
    subject_id?: string;
  }) => api.post("/teacher-assignments", payload).then((r) => r.data),
  deleteAssignment: (assignmentId: string) =>
    api.delete(`/teacher-assignments/${assignmentId}`).then((r) => r.data),

  // Attendance
  getAttendance: (params?: {
    class_batch_section_id?: string;
    student_id?: string;
    attendance_date?: string;
  }) => {
    const query = new URLSearchParams(params as any).toString();
    return api
      .get(`/attendance${query ? `?${query}` : ""}`)
      .then((r) => r.data);
  },
  markAttendance: (payload: {
    class_batch_section_id: string;
    student_id: string;
    teacher_id: string;
    attendance_date: string;
    status: string;
  }) => api.post("/attendance", payload).then((r) => r.data),
  updateAttendance: (attendanceId: string, payload: { status?: string }) =>
    api.patch(`/attendance/${attendanceId}`, payload).then((r) => r.data),
  
  // Teacher Attendance Management
  getAttendanceByDate: (
    instituteId: string,
    subjectId: string,
    date: string
  ) =>
    api
      .get(`/institutes/${instituteId}/subjects/${subjectId}/attendance?date=${date}`)
      .then((r) => r.data),
  
  getMonthlyAttendance: (
    instituteId: string,
    subjectId: string,
    yearMonth: string
  ) =>
    api
      .get(`/institutes/${instituteId}/subjects/${subjectId}/attendance/monthly?month=${yearMonth}`)
      .then((r) => r.data),
  
  getStudentAttendanceBySubject: (
    instituteId: string,
    subjectId: string,
    studentId: string
  ) =>
    api
      .get(`/institutes/${instituteId}/subjects/${subjectId}/students/${studentId}/attendance`)
      .then((r) => r.data),
  
  saveAttendance: (attendanceData: any[]) =>
    api.post("/institutes/attendance/bulk", attendanceData).then((r) => r.data),

  // Homework
  getHomework: (params?: {
    teacher_id?: string;
    class_batch_section_id?: string;
    institute_id?: string;
    subject_id?: string;
    subject_ids?: string;
  }) => {
    const query = new URLSearchParams(params as any).toString();
    return api.get(`/homework${query ? `?${query}` : ""}`).then((r) => r.data);
  },
  createHomework: (payload: {
    teacher_id: string;
    class_batch_section_id: string;
    subject_id?: string;
    title: string;
    description?: string;
    due_date?: string;
    image_url?: string;
  }) => api.post("/homework", payload).then((r) => r.data),
  updateHomework: (homeworkId: string, payload: any) =>
    api.patch(`/homework/${homeworkId}`, payload).then((r) => r.data),
  deleteHomework: (homeworkId: string) =>
    api.delete(`/homework/${homeworkId}`).then((r) => r.data),

  // Homework Submissions
  getSubmissions: (params?: { homework_id?: string; student_id?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return api
      .get(`/homework-submissions${query ? `?${query}` : ""}`)
      .then((r) => r.data);
  },
  submitHomework: (payload: {
    homework_id: string;
    student_id: string;
    submission_text?: string;
    image_url?: string;
  }) => api.post("/homework-submissions", payload).then((r) => r.data),
  gradeSubmission: (
    submissionId: string,
    payload: { stars?: number; teacher_feedback?: string },
  ) =>
    api
      .patch(`/homework-submissions/${submissionId}`, payload)
      .then((r) => r.data),

  // Results
  getResults: (params?: {
    student_id?: string;
    teacher_id?: string;
    class_batch_section_id?: string;
    subject_id?: string;
  }) => {
    const query = new URLSearchParams(params as any).toString();
    return api.get(`/results${query ? `?${query}` : ""}`).then((r) => r.data);
  },
  createResult: (payload: {
    student_id: string;
    teacher_id: string;
    class_batch_section_id: string;
    subject_id?: string;
    result_type: string;
    marks_obtained: number;
    total_marks: number;
    grade?: string;
    remarks?: string;
  }) => api.post("/results", payload).then((r) => r.data),
  updateResult: (resultId: string, payload: any) =>
    api.patch(`/results/${resultId}`, payload).then((r) => r.data),
  deleteResult: (resultId: string) =>
    api.delete(`/results/${resultId}`).then((r) => r.data),

  // Schedules
  getSchedules: (params?: {
    teacher_id?: string;
    class_batch_section_id?: string;
    day_of_week?: string;
    institute_id?: string;
  }) => {
    const query = new URLSearchParams(params as any).toString();
    return api.get(`/schedules${query ? `?${query}` : ""}`).then((r) => r.data);
  },
  createSchedule: (payload: {
    teacher_id: string;
    class_batch_section_id: string;
    subject_id?: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
  }) => api.post("/schedules", payload).then((r) => r.data),
  updateSchedule: (scheduleId: string, payload: any) =>
    api.patch(`/schedules/${scheduleId}`, payload).then((r) => r.data),
  deleteSchedule: (scheduleId: string) =>
    api.delete(`/schedules/${scheduleId}`).then((r) => r.data),

  // Announcements
  getAnnouncements: (params?: {
    teacher_id?: string;
    class_batch_section_id?: string;
    institute_id?: string;
    student_id?: string;
  }) => {
    const query = new URLSearchParams(params as any).toString();
    return api
      .get(`/announcements${query ? `?${query}` : ""}`)
      .then((r) => r.data);
  },
  createAnnouncement: (payload: {
    teacher_id: string;
    class_batch_section_id?: string;
    announcement_type: string;
    student_id?: string;
    title: string;
    content: string;
    institute_id: string;
  }) => api.post("/announcements", payload).then((r) => r.data),
  deleteAnnouncement: (announcementId: string) =>
    api.delete(`/announcements/${announcementId}`).then((r) => r.data),

  // Dashboard
  getStudentDashboard: (instituteId: string) =>
    api
      .get(`/dashboard/student?institute_id=${instituteId}`)
      .then((r) => r.data),
  getTeacherDashboard: (instituteId: string) =>
    api
      .get(`/dashboard/teacher?institute_id=${instituteId}`)
      .then((r) => r.data),
  getAdminDashboard: (instituteId: string) =>
    api.get(`/dashboard/admin?institute_id=${instituteId}`).then((r) => r.data),

  // Quizzes
  getQuizzes: (params?: {
    institute_id?: string;
    teacher_id?: string;
    class_batch_section_id?: string;
    subject_id?: string;
    subject_ids?: string;
  }) => {
    const query = new URLSearchParams(params as any).toString();
    return api.get(`/quizzes${query ? `?${query}` : ""}`).then((r) => r.data);
  },
  getQuiz: (quizId: string) =>
    api.get(`/quizzes/${quizId}`).then((r) => r.data),
  createQuiz: (payload: any) =>
    api.post("/quizzes", payload).then((r) => r.data),
  updateQuiz: (quizId: string, payload: any) =>
    api.put(`/quizzes/${quizId}`, payload).then((r) => r.data),
  deleteQuiz: (quizId: string) =>
    api.delete(`/quizzes/${quizId}`).then((r) => r.data),

  // Quiz Questions
  addQuizQuestion: (quizId: string, payload: any) =>
    api.post(`/quizzes/${quizId}/questions`, payload).then((r) => r.data),
  getQuizQuestions: (quizId: string) =>
    api.get(`/quizzes/${quizId}/questions`).then((r) => r.data),
  updateQuizQuestion: (questionId: string, payload: any) =>
    api.put(`/quizzes/questions/${questionId}`, payload).then((r) => r.data),
  deleteQuizQuestion: (questionId: string) =>
    api.delete(`/quizzes/questions/${questionId}`).then((r) => r.data),

  // Quiz Attempts
  startQuizAttempt: (quizId: string) =>
    api.post(`/quizzes/${quizId}/start`).then((r) => r.data),
  submitQuizAttempt: (attemptId: string, payload: any) =>
    api
      .post(`/quizzes/attempts/${attemptId}/submit`, payload)
      .then((r) => r.data),
  getMyQuizAttempts: () => api.get("/quizzes/attempts/my").then((r) => r.data),
  getQuizAttempts: (quizId: string) =>
    api.get(`/quizzes/${quizId}/attempts`).then((r) => r.data),
  getQuizAttempt: (attemptId: string) =>
    api.get(`/quizzes/attempts/${attemptId}`).then((r) => r.data),
  gradeQuizAnswer: (
    answerId: string,
    payload: { marks_obtained: number; teacher_feedback?: string },
  ) =>
    api
      .patch(`/quizzes/answers/${answerId}/grade`, payload)
      .then((r) => r.data),

  // Resources
  getResources: (params?: {
    institute_id?: string;
    teacher_id?: string;
    class_batch_section_id?: string;
    subject_id?: string;
  }) => {
    const query = new URLSearchParams(params as any).toString();
    return api.get(`/resources${query ? `?${query}` : ""}`).then((r) => r.data);
  },
  getResource: (resourceId: string) =>
    api.get(`/resources/${resourceId}`).then((r) => r.data),
  uploadResource: (payload: any) =>
    api.post("/resources", payload).then((r) => r.data),
  deleteResource: (resourceId: string) =>
    api.delete(`/resources/${resourceId}`).then((r) => r.data),

  // Discussions
  getDiscussions: (params?: {
    institute_id?: string;
    student_id?: string;
    teacher_id?: string;
  }) => {
    const query = new URLSearchParams(params as any).toString();
    return api
      .get(`/discussions${query ? `?${query}` : ""}`)
      .then((r) => r.data);
  },
  getDiscussion: (discussionId: string) =>
    api.get(`/discussions/${discussionId}`).then((r) => r.data),
  createDiscussion: (payload: any) =>
    api.post("/discussions", payload).then((r) => r.data),
  getDiscussionReplies: (discussionId: string) =>
    api.get(`/discussions/${discussionId}/replies`).then((r) => r.data),
  replyToDiscussion: (discussionId: string, payload: { message: string }) =>
    api.post(`/discussions/${discussionId}/reply`, payload).then((r) => r.data),
  markDiscussionAsRead: (discussionId: string) =>
    api.patch(`/discussions/${discussionId}/read`).then((r) => r.data),
  deleteDiscussion: (discussionId: string) =>
    api.delete(`/discussions/${discussionId}`).then((r) => r.data),
  getUnreadDiscussionCount: () =>
    api.get("/discussions/unread-count").then((r) => r.data),

  // Live Classes
  getLiveClasses: (params?: {
    institute_id?: string;
    teacher_id?: string;
    class_batch_section_id?: string;
    status?: string;
  }) => {
    const query = new URLSearchParams(params as any).toString();
    return api
      .get(`/live-classes${query ? `?${query}` : ""}`)
      .then((r) => r.data);
  },
  getUpcomingLiveClasses: (params?: { institute_id?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return api
      .get(`/live-classes/upcoming${query ? `?${query}` : ""}`)
      .then((r) => r.data);
  },
  getLiveClass: (classId: string) =>
    api.get(`/live-classes/${classId}`).then((r) => r.data),
  createLiveClass: (payload: any) =>
    api.post("/live-classes", payload).then((r) => r.data),
  updateLiveClass: (classId: string, payload: any) =>
    api.put(`/live-classes/${classId}`, payload).then((r) => r.data),
  updateLiveClassStatus: (classId: string, status: string) =>
    api
      .patch(`/live-classes/${classId}/status`, { status })
      .then((r) => r.data),
  deleteLiveClass: (classId: string) =>
    api.delete(`/live-classes/${classId}`).then((r) => r.data),
  scheduleClass: (payload: any) =>
    api.post("/live-classes/schedule-class", payload).then((r) => r.data),
  startClassNow: (payload: any) =>
    api.post("/live-classes/start-now", payload).then((r) => r.data),
  joinLiveClass: (classId: string) =>
    api.post(`/live-classes/${classId}/join`).then((r) => r.data),
  leaveLiveClass: (participantId: string) =>
    api
      .post(`/live-classes/participants/${participantId}/leave`)
      .then((r) => r.data),
  getLiveClassParticipants: (classId: string) =>
    api.get(`/live-classes/${classId}/participants`).then((r) => r.data),
  getActiveLiveClassParticipants: (classId: string) =>
    api.get(`/live-classes/${classId}/participants/active`).then((r) => r.data),

  // Subject Assignments (Teacher-Subject assignments)
  getSubjectAssignments: (instituteId: string) =>
    api
      .get(`/subject-assignments?institute_id=${instituteId}`)
      .then((r) => r.data),
  assignSubjectToTeacher: (payload: {
    subject_id: string;
    teacher_id: string;
    institute_id: string;
  }) => api.post("/subject-assignments", payload).then((r) => r.data),
  removeSubjectAssignment: (assignmentId: string) =>
    api.delete(`/subject-assignments/${assignmentId}`).then((r) => r.data),
  getTeacherSubjects: (teacherId: string, instituteId: string) =>
    api
      .get(
        `/subject-assignments/teacher/${teacherId}?institute_id=${instituteId}`,
      )
      .then((r) => r.data),

  // Teacher Course Overview
  getTeacherCourseOverview: (courseId: string) =>
    api.get(`/teacher/course/${courseId}/overview`).then((r) => r.data),

  // Course Enrollments
  getCourseEnrollments: (params?: {
    student_id?: string;
    subject_id?: string;
    institute_id?: string;
  }) => {
    const query = new URLSearchParams(params as any).toString();
    return api
      .get(`/course-enrollments${query ? `?${query}` : ""}`)
      .then((r) => r.data);
  },
  getEnrolledStudents: (subjectId: string) =>
    api.get(`/course-enrollments/by-subject/${subjectId}`).then((r) => r.data),
  enrollStudent: (payload: {
    student_id: string;
    subject_id: string;
    institute_id: string;
  }) => api.post("/course-enrollments", payload).then((r) => r.data),
  joinCourseByCode: (payload: {
    student_id: string;
    course_code: string;
    institute_id: string;
  }) =>
    api.post("/course-enrollments/join-by-code", payload).then((r) => r.data),
  unenrollStudent: (enrollmentId: string) =>
    api.delete(`/course-enrollments/${enrollmentId}`).then((r) => r.data),
};
