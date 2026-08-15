'use client';

import { Loader2, MessageSquare } from 'lucide-react';
import ChatWindow from '@/components/chat/ChatWindow';

interface ChatTabProps {
  teamConversationId?: string | null;
  selectedTeam?: any;
}

const ChatTab = ({ teamConversationId, selectedTeam }: ChatTabProps) => {
  if (teamConversationId) {
    return (
      <div className="h-full w-full overflow-hidden">
        <ChatWindow conversationId={teamConversationId} showHeader={false} />
      </div>
    );
  }

  // Workspace still loading
  if (!selectedTeam) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-[#8696a0]">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading chat…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-16 h-16 rounded-full bg-[#1e2a30] flex items-center justify-center">
        <MessageSquare className="w-8 h-8 text-[#8696a0]" />
      </div>
      <p className="text-[#8696a0] text-sm">No chat available for this team yet.</p>
    </div>
  );
};

export default ChatTab;
