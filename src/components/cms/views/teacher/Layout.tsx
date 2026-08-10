'use client';
import Navbar from '@/components/cms/Navbar';
import Sidebar from '@/components/cms/Sidebar';
import { FiHome, FiFileText, FiBook, FiMessageSquare, FiCalendar, FiCheckSquare } from 'react-icons/fi';

const teacherMenuItems = [
  { name: 'Dashboard', href: '/cms/teacher', icon: FiHome },
  { name: 'Results', href: '/cms/teacher/results', icon: FiFileText },
  { name: 'Homework', href: '/cms/teacher/homework', icon: FiBook },
  { name: 'Announcements', href: '/cms/teacher/announcements', icon: FiMessageSquare },
  { name: 'Schedule', href: '/cms/teacher/schedule', icon: FiCalendar },
  { name: 'Attendance', href: '/cms/teacher/attendance', icon: FiCheckSquare },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full" style={{ background: '#0b141a' }}>
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar items={teacherMenuItems} />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
