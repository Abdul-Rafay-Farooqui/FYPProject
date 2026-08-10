'use client';

import { useCmsRouter } from '@/contexts/cms/CmsRouterContext';
import { IconType } from 'react-icons';

interface SidebarItem {
  name: string;
  href: string;
  icon: IconType;
}

interface SidebarProps {
  items: SidebarItem[];
}

export default function Sidebar({ items }: SidebarProps) {
  const { currentPath, navigate } = useCmsRouter();

  return (
    <aside className="w-56 min-h-full" style={{ background: '#111b21', borderRight: '1px solid #222d34' }}>
      <nav className="p-3 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.href;

          return (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'text-white'
                  : 'text-[#8696a0] hover:text-[#e9edef]'
              }`}
              style={isActive ? { background: '#00a884' } : { }}
            >
              <Icon className="text-base" />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
