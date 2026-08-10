'use client';

import { useAuth } from '@/contexts/cms/AuthContext';
import { useCmsRouter } from '@/contexts/cms/CmsRouterContext';
import { LogOut, User, GraduationCap } from 'lucide-react';

export default function Navbar() {
  const { user, school, logout } = useAuth();
  const router = useCmsRouter();

  const handleLogout = () => {
    logout();
    router.navigate('/cms/login');
  };

  return (
    <nav className="h-14 flex items-center justify-between px-4" style={{ background: '#202c33', borderBottom: '1px solid #222d34' }}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden" style={{ background: '#00a884' }}>
          <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" onError={(e) => {
            (e.target as any).style.display = 'none';
            (e.target as any).nextSibling.style.display = 'block';
          }} />
          <GraduationCap className="w-4 h-4 text-white hidden" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-[#e9edef]">{school?.name || 'School Portal'}</h1>
          <p className="text-xs text-[#8696a0] capitalize">{user?.school_role} Dashboard</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: '#111b21' }}>
          <User className="w-3.5 h-3.5 text-[#8696a0]" />
          <span className="text-xs text-[#e9edef]">{user?.display_name}</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
          style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}
