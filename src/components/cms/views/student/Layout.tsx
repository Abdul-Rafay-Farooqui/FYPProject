'use client';
import Navbar from '@/components/cms/Navbar';
import Sidebar from '@/components/cms/Sidebar';
import { FiHome, FiFileText, FiBook, FiMessageSquare, FiCalendar, FiCheckSquare } from 'react-icons/fi';

const studentMenuItems = [
  { name: 'Dashboard', href: '/cms/student', icon: FiHome },
  { name: 'My Results', href: '/cms/student/results', icon: FiFileText },
  { name: 'Homework', href: '/cms/student/homework', icon: FiBook },
  { name: 'Announcements', href: '/cms/student/announcements', icon: FiMessageSquare },
  { name: 'Schedule', href: '/cms/student/schedule', icon: FiCalendar },
  { name: 'Attendance', href: '/cms/student/attendance', icon: FiCheckSquare },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full" style={{ background: '#0b141a' }}>
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar items={studentMenuItems} />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
