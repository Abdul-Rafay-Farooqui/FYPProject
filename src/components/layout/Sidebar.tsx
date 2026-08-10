'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  MessageCircle,
  Phone,
  Bot,
  CircleDashed,
  Users,
  UsersRound,
  Building2,
} from 'lucide-react';
import SidebarHeader from './SidebarHeader';
import ChatsPanel from './panels/ChatsPanel';
import StatusPanel from './panels/StatusPanel';
import GroupsPanel from './panels/GroupsPanel';
import CommunitiesPanel from './panels/CommunitiesPanel';
import CallsPanel from './panels/CallsPanel';

export type SidebarTab = 'chats' | 'status' | 'groups' | 'communities' | 'calls';

export default function Sidebar() {
  const [tab, setTab] = useState<SidebarTab>('chats');
  const router = useRouter();
  const pathname = usePathname();

  const isAiActive = pathname === '/ai-chat';

  return (
    <div className="flex flex-col h-full bg-[#111b21]">
      <SidebarHeader tab={tab} onTabChange={setTab} />

      <div className="flex-1 overflow-hidden">
        {tab === 'chats' && <ChatsPanel />}
        {tab === 'status' && <StatusPanel />}
        {tab === 'groups' && <GroupsPanel />}
        {tab === 'communities' && <CommunitiesPanel />}
        {tab === 'calls' && <CallsPanel />}
      </div>

      {/* Bottom nav bar */}
      <div className="bg-[#202c33] border-t border-[#222d34] flex items-center justify-around py-2">
        <NavBtn
          icon={<MessageCircle className="w-5 h-5" />}
          label="Chats"
          active={!isAiActive && tab === 'chats'}
          onClick={() => { setTab('chats'); router.push('/'); }}
        />
        <NavBtn
          icon={<CircleDashed className="w-5 h-5" />}
          label="Status"
          active={!isAiActive && tab === 'status'}
          onClick={() => { setTab('status'); router.push('/'); }}
        />
        <NavBtn
          icon={<Users className="w-5 h-5" />}
          label="Groups"
          active={!isAiActive && tab === 'groups'}
          onClick={() => { setTab('groups'); router.push('/'); }}
        />
        <NavBtn
          icon={<UsersRound className="w-5 h-5" />}
          label="Community"
          active={!isAiActive && tab === 'communities'}
          onClick={() => { setTab('communities'); router.push('/'); }}
        />
        <NavBtn
          icon={<Phone className="w-5 h-5" />}
          label="Calls"
          active={!isAiActive && tab === 'calls'}
          onClick={() => { setTab('calls'); router.push('/'); }}
        />
        <NavBtn
          icon={<Bot className="w-5 h-5" />}
          label="AI"
          active={isAiActive}
          onClick={() => router.push('/ai-chat')}
        />
      </div>
    </div>
  );
}

function NavBtn({
  icon, label, active, onClick,
}: {
  icon: React.ReactNode; label: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors
        ${active ? 'text-[#00a884]' : 'text-[#8696a0] hover:text-[#e9edef]'}`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}