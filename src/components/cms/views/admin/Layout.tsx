'use client';
import Navbar from '@/components/cms/Navbar';
import Sidebar from '@/components/cms/Sidebar';
import { FiHome, FiUsers, FiBook, FiCalendar, FiGrid, FiLayers, FiUserCheck } from 'react-icons/fi';

const adminMenuItems = [
  { name: 'Dashboard', href: '/cms/admin', icon: FiHome },
  { name: 'Classes', href: '/cms/admin/classes', icon: FiBook },
  { name: 'Batches', href: '/cms/admin/batches', icon: FiCalendar },
  { name: 'Sections', href: '/cms/admin/sections', icon: FiGrid },
  { name: 'Subjects', href: '/cms/admin/subjects', icon: FiLayers },
  { name: 'Teachers', href: '/cms/admin/teachers', icon: FiUserCheck },
  { name: 'Students', href: '/cms/admin/students', icon: FiUsers },
  { name: 'Assignments', href: '/cms/admin/assignments', icon: FiBook },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full" style={{ background: '#0b141a' }}>
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar items={adminMenuItems} />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
