'use client';

import { Profile } from '@/types';
import { useUIStore } from '@/store/uiStore';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { ConversationsAPI, BlocksAPI } from '@/lib/api/endpoints';
import { useState } from 'react';
import {
  X, Phone, Video, Star, Bell, BellOff, Clock, Shield,
  ChevronRight, Image as ImageIcon, FileText, Link2,
  Ban, Flag, Trash2, User,
} from 'lucide-react';

export default function ContactInfoPanel() {
  const { isContactInfoOpen, setContactInfoOpen } = useUIStore();
  const { activeConversation } = useChatStore();
  const { user } = useAuthStore();
  const [isMuted, setIsMuted] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  if (!isContactInfoOpen || !activeConversation) return null;

  const contact = activeConversation.other_participant;
  if (!contact) return null;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleMuteToggle = async () => {
    if (!user?.id) return;
    const newMuted = !isMuted;
    try {
      await ConversationsAPI.mute(activeConversation.id, newMuted);
      setIsMuted(newMuted);
      showToast(newMuted ? 'Notifications muted' : 'Notifications unmuted');
    } catch (e) {
      console.error('Mute error:', e);
    }
  };

  const handleBlock = async () => {
    if (!user?.id || blocking) return;
    setBlocking(true);
    try {
      await BlocksAPI.block(contact.id);
      showToast(`${contact.display_name} blocked`);
    } catch (e) {
      console.error('Block error:', e);
    } finally {
      setBlocking(false);
    }
  };

  const handleReport = async () => {
    if (!user?.id || reporting) return;
    setReporting(true);
    try {
      await BlocksAPI.report(contact.id);
      showToast(`${contact.display_name} reported`);
    } catch (e) {
      console.error('Report error:', e);
    } finally {
      setReporting(false);
    }
  };

  return (
    <div className="w-[340px] h-full bg-[#111b21] border-l border-[#222d34] flex flex-col slide-in-right flex-shrink-0">
      {/* Header */}
      <div className="bg-[#202c33] px-4 py-3 flex items-center gap-4 sticky top-0 z-10">
        <button
          onClick={() => setContactInfoOpen(false)}
          className="text-[#aebac1] hover:text-[#e9edef] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-[#e9edef] font-medium text-lg">Contact info</h2>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Avatar + Name Section */}
        <div className="flex flex-col items-center py-7 bg-[#111b21]">
          <div className="w-[200px] h-[200px] rounded-full overflow-hidden bg-[#2a3942] mb-4">
            {contact.avatar_url ? (
              <img src={contact.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-24 h-24 text-[#8696a0]" />
              </div>
            )}
          </div>
          <h3 className="text-[#e9edef] text-xl font-medium">{contact.display_name}</h3>
          <p className="text-[#8696a0] text-sm mt-0.5">{contact.phone}</p>
          <p className="text-[#8696a0] text-xs mt-1">
            {contact.is_online ? '🟢 online' : 'last seen recently'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-6 py-4 border-b border-[#222d34] bg-[#111b21]">
          <ActionBtn icon={<Phone className="w-5 h-5" />} label="Audio" />
          <ActionBtn icon={<Video className="w-5 h-5" />} label="Video" />
          <ActionBtn icon={<Star className="w-5 h-5" />} label="Search" />
        </div>

        {/* About */}
        {contact.about && (
          <div className="px-6 py-4 border-b border-[#222d34]">
            <p className="text-[#8696a0] text-xs mb-1">About</p>
            <p className="text-[#e9edef] text-sm">{contact.about}</p>
          </div>
        )}

        {/* Media, Links & Docs */}
        <button className="w-full px-6 py-4 border-b border-[#222d34] flex items-center justify-between hover:bg-[#202c33] transition-colors">
          <span className="text-[#e9edef] text-sm">Media, links and docs</span>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-8 h-8 bg-[#2a3942] rounded flex items-center justify-center">
                <ImageIcon className="w-4 h-4 text-[#8696a0]" />
              </div>
              <div className="w-8 h-8 bg-[#2a3942] rounded flex items-center justify-center">
                <Link2 className="w-4 h-4 text-[#8696a0]" />
              </div>
              <div className="w-8 h-8 bg-[#2a3942] rounded flex items-center justify-center">
                <FileText className="w-4 h-4 text-[#8696a0]" />
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8696a0]" />
          </div>
        </button>

        {/* Notifications */}
        <button
          onClick={handleMuteToggle}
          className="w-full px-6 py-4 border-b border-[#222d34] flex items-center gap-4 hover:bg-[#202c33] transition-colors"
        >
          {isMuted ? (
            <BellOff className="w-5 h-5 text-[#8696a0]" />
          ) : (
            <Bell className="w-5 h-5 text-[#8696a0]" />
          )}
          <div className="text-left">
            <p className="text-[#e9edef] text-sm">Mute notifications</p>
            <p className="text-[#8696a0] text-xs">{isMuted ? 'On' : 'Off'}</p>
          </div>
        </button>

        {/* Starred messages */}
        <button className="w-full px-6 py-4 border-b border-[#222d34] flex items-center gap-4 hover:bg-[#202c33] transition-colors">
          <Star className="w-5 h-5 text-[#8696a0]" />
          <span className="text-[#e9edef] text-sm">Starred messages</span>
          <ChevronRight className="w-4 h-4 text-[#8696a0] ml-auto" />
        </button>

        {/* Disappearing messages */}
        <button className="w-full px-6 py-4 border-b border-[#222d34] flex items-center gap-4 hover:bg-[#202c33] transition-colors">
          <Clock className="w-5 h-5 text-[#8696a0]" />
          <div className="text-left">
            <p className="text-[#e9edef] text-sm">Disappearing messages</p>
            <p className="text-[#8696a0] text-xs">Off</p>
          </div>
        </button>

        {/* Encryption */}
        <button className="w-full px-6 py-4 border-b border-[#222d34] flex items-center gap-4 hover:bg-[#202c33] transition-colors">
          <Shield className="w-5 h-5 text-[#8696a0]" />
          <div className="text-left">
            <p className="text-[#e9edef] text-sm">Encryption</p>
            <p className="text-[#8696a0] text-xs">Messages are end-to-end encrypted</p>
          </div>
        </button>

        {/* Danger zone */}
        <div className="py-2">
          <button
            onClick={handleBlock}
            disabled={blocking}
            className="w-full px-6 py-4 flex items-center gap-4 hover:bg-[#202c33] transition-colors"
          >
            <Ban className="w-5 h-5 text-red-400" />
            <span className="text-red-400 text-sm">
              {blocking ? 'Blocking...' : `Block ${contact.display_name}`}
            </span>
          </button>
          <button
            onClick={handleReport}
            disabled={reporting}
            className="w-full px-6 py-4 flex items-center gap-4 hover:bg-[#202c33] transition-colors"
          >
            <Flag className="w-5 h-5 text-red-400" />
            <span className="text-red-400 text-sm">
              {reporting ? 'Reporting...' : `Report ${contact.display_name}`}
            </span>
          </button>
          <button
            onClick={() => { setContactInfoOpen(false); }}
            className="w-full px-6 py-4 flex items-center gap-4 hover:bg-[#202c33] transition-colors"
          >
            <Trash2 className="w-5 h-5 text-red-400" />
            <span className="text-red-400 text-sm">Delete chat</span>
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#1f2c33] text-[#e9edef] text-sm px-4 py-2 rounded-lg shadow-lg z-50 whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  );
}

function ActionBtn({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex flex-col items-center gap-1 text-[#00a884] hover:text-[#00c49a] transition-colors">
      <div className="w-12 h-12 rounded-full bg-[#202c33] flex items-center justify-center">
        {icon}
      </div>
      <span className="text-xs">{label}</span>
    </button>
  );
}
