'use client';

import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { MessagesAPI } from '@/lib/api/endpoints';
import { useState } from 'react';
import { Trash2, Ban, X } from 'lucide-react';

export default function DeleteMessageModal() {
  const { deleteMessage, setDeleteMessage } = useUIStore();
  const { user } = useAuthStore();
  const { updateMessage, removeMessage } = useChatStore();
  const [deleting, setDeleting] = useState(false);

  if (!deleteMessage) return null;

  const isOwn = deleteMessage.sender_id === user?.id;

  // Check if message is within the 1-hour window for "delete for everyone"
  const msgTime = new Date(deleteMessage.created_at).getTime();
  const canDeleteForEveryone = isOwn && Date.now() - msgTime < 60 * 60 * 1000;

  const close = () => setDeleteMessage(null);

  const handleDeleteForMe = async () => {
    if (deleting || !user?.id) return;
    setDeleting(true);

    try {
      await MessagesAPI.deleteForMe(deleteMessage.id);
      removeMessage(deleteMessage.id);
    } catch (error: any) {
      console.error('Delete error', error);
      alert(`Delete failed: ${error?.response?.data?.message || error?.message}`);
    }
    
    setDeleting(false);
    close();
  };

  const handleDeleteForEveryone = async () => {
    if (deleting || !user?.id) return;
    setDeleting(true);

    try {
      await MessagesAPI.deleteForEveryone(deleteMessage.id);
      updateMessage({
        ...deleteMessage,
        is_deleted_for_everyone: true,
        content: undefined,
        media_url: undefined,
      });
    } catch (error: any) {
      console.error('Delete error', error);
    }

    setDeleting(false);
    close();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#202c33] w-full max-w-sm rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between">
          <h2 className="text-[#e9edef] font-medium text-base">Delete message?</h2>
          <button onClick={close} className="text-[#8696a0] hover:text-[#e9edef] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview */}
        <div className="mx-6 mb-4 px-3 py-2 bg-[#1e2a30] rounded border-l-4 border-[#8696a0]">
          <p className="text-[#8696a0] text-sm truncate">
            {deleteMessage.content || `📎 ${deleteMessage.type}`}
          </p>
        </div>

        {/* Options */}
        <div className="px-6 pb-6 space-y-2.5">
          {canDeleteForEveryone && (
            <button
              onClick={handleDeleteForEveryone}
              disabled={deleting}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-[#2a3942] hover:bg-[#374045] text-red-400 text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Ban className="w-4 h-4" />
              Delete for everyone
            </button>
          )}

          <button
            onClick={handleDeleteForMe}
            disabled={deleting}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-[#2a3942] hover:bg-[#374045] text-[#e9edef] text-sm transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4 text-[#8696a0]" />
            Delete for me
          </button>

          <button
            onClick={close}
            className="w-full px-4 py-3 rounded-lg text-[#8696a0] text-sm hover:bg-[#2a3942] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
