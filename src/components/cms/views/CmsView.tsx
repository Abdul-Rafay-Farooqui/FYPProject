import React from 'react';
import { useAuth } from '@/contexts/cms/AuthContext';
import { useCmsRouter } from '@/contexts/cms/CmsRouterContext';
import CmsLogin from '../auth/CmsLogin';
import CmsRegister from '../auth/CmsRegister';

// Layouts
import AdminLayout from './admin/Layout';
import TeacherLayout from './teacher/Layout';
import StudentLayout from './student/Layout';

// Admin Pages
import AdminDashboard from './admin/Page';
import AdminClasses from './admin/classes/Page';
import AdminBatches from './admin/batches/Page';
import AdminSections from './admin/sections/Page';
import AdminSubjects from './admin/subjects/Page';
import AdminTeachers from './admin/teachers/Page';
import AdminStudents from './admin/students/Page';
import AdminAssignments from './admin/assignments/Page';

// Teacher Pages
import TeacherDashboard from './teacher/Page';
import TeacherAnnouncements from './teacher/announcements/Page';
import TeacherAttendance from './teacher/attendance/Page';
import TeacherHomework from './teacher/homework/Page';
import TeacherResults from './teacher/results/Page';
import TeacherSchedule from './teacher/schedule/Page';

// Student Pages
import StudentDashboard from './student/Page';
import StudentAnnouncements from './student/announcements/Page';
import StudentAttendance from './student/attendance/Page';
import StudentHomework from './student/homework/Page';
import StudentResults from './student/results/Page';
import StudentSchedule from './student/schedule/Page';

export default function CmsView() {
  const { user, loading } = useAuth();
  const { currentPath } = useCmsRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: '#0b141a' }}>
        <div className="w-10 h-10 border-2 border-[#00a884]/30 border-t-[#00a884] rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in — show auth screens
  if (!user) {
    if (currentPath === '/cms/register') return <CmsRegister />;
    return <CmsLogin />;
  }

  // Logged in — route based on role
  const role = user.school_role;

  if (role === 'admin') {
    let content = <AdminDashboard />;
    if (currentPath === '/cms/admin/classes') content = <AdminClasses />;
    else if (currentPath === '/cms/admin/batches') content = <AdminBatches />;
    else if (currentPath === '/cms/admin/sections') content = <AdminSections />;
    else if (currentPath === '/cms/admin/subjects') content = <AdminSubjects />;
    else if (currentPath === '/cms/admin/teachers') content = <AdminTeachers />;
    else if (currentPath === '/cms/admin/students') content = <AdminStudents />;
    else if (currentPath === '/cms/admin/assignments') content = <AdminAssignments />;
    return <AdminLayout>{content}</AdminLayout>;
  }

  if (role === 'teacher') {
    let content = <TeacherDashboard />;
    if (currentPath === '/cms/teacher/announcements') content = <TeacherAnnouncements />;
    else if (currentPath === '/cms/teacher/attendance') content = <TeacherAttendance />;
    else if (currentPath === '/cms/teacher/homework') content = <TeacherHomework />;
    else if (currentPath === '/cms/teacher/results') content = <TeacherResults />;
    else if (currentPath === '/cms/teacher/schedule') content = <TeacherSchedule />;
    return <TeacherLayout>{content}</TeacherLayout>;
  }

  if (role === 'student') {
    let content = <StudentDashboard />;
    if (currentPath === '/cms/student/announcements') content = <StudentAnnouncements />;
    else if (currentPath === '/cms/student/attendance') content = <StudentAttendance />;
    else if (currentPath === '/cms/student/homework') content = <StudentHomework />;
    else if (currentPath === '/cms/student/results') content = <StudentResults />;
    else if (currentPath === '/cms/student/schedule') content = <StudentSchedule />;
    return <StudentLayout>{content}</StudentLayout>;
  }

  // Unknown role — show login
  return <CmsLogin />;
}
