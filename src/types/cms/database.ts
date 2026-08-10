export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  email: string;
  display_name: string;
  school_role: string;
  school_id?: string;
  created_at: string;
}

export interface School {
  id: string;
  name: string;
  school_password: string;
  personal_code?: string;
  admin_id?: string;
  created_at: string;
}

export interface Class {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface Batch {
  id: string;
  name: string;
  year: number;
  created_at: string;
}

export interface Section {
  id: string;
  name: string;
  created_at: string;
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
  created_at: string;
}

export interface ClassBatchSection {
  id: string;
  class_id: string;
  batch_id: string;
  section_id: string;
  created_at: string;
  class?: Class;
  batch?: Batch;
  section?: Section;
}

export interface TeacherAssignment {
  id: string;
  teacher_id: string;
  class_batch_section_id: string;
  subject_id?: string;
  created_at: string;
  teacher?: User;
  class_batch_section?: ClassBatchSection;
  subject?: Subject;
}

export interface StudentEnrollment {
  id: string;
  student_id: string;
  class_batch_section_id: string;
  enrollment_date: string;
  is_active: boolean;
  created_at: string;
  student?: User;
  class_batch_section?: ClassBatchSection;
}

export type ResultType = 'quiz' | 'mid' | 'final' | 'assignment';

export interface Result {
  id: string;
  student_id: string;
  teacher_id: string;
  class_batch_section_id: string;
  subject_id?: string;
  result_type: ResultType;
  marks_obtained: number;
  total_marks: number;
  grade?: string;
  remarks?: string;
  published_date: string;
  created_at: string;
  student?: User;
  teacher?: User;
  subject?: Subject;
}

export interface Homework {
  id: string;
  teacher_id: string;
  class_batch_section_id: string;
  subject_id?: string;
  title: string;
  description?: string;
  image_url?: string;
  due_date?: string;
  published_date: string;
  created_at: string;
  teacher?: User;
  class_batch_section?: ClassBatchSection;
  subject?: Subject;
}

export interface HomeworkSubmission {
  id: string;
  homework_id: string;
  student_id: string;
  submission_text?: string;
  image_url?: string;
  stars: number;
  teacher_feedback?: string;
  submitted_date: string;
  created_at: string;
  homework?: Homework;
  student?: User;
}

export type AnnouncementType = 'individual' | 'section' | 'class';

export interface Announcement {
  id: string;
  teacher_id: string;
  class_batch_section_id: string;
  announcement_type: AnnouncementType;
  student_id?: string;
  title: string;
  content: string;
  published_date: string;
  created_at: string;
  teacher?: User;
  class_batch_section?: ClassBatchSection;
  student?: User;
}

export type AttendanceStatus = 'present' | 'absent';

export interface Attendance {
  id: string;
  class_batch_section_id: string;
  student_id: string;
  teacher_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  created_at: string;
  updated_at: string;
  student?: User;
  teacher?: User;
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface Schedule {
  id: string;
  teacher_id: string;
  class_batch_section_id: string;
  subject_id?: string;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  created_at: string;
  teacher?: User;
  class_batch_section?: ClassBatchSection;
  subject?: Subject;
}
