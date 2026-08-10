'use client';

import { useState, useRef } from 'react';
import { Upload, Trash2, Download, FileText, Image, Film, Music, File } from 'lucide-react';
import { MediaAPI, MessagesAPI } from '@/lib/api/endpoints';

interface FileItem {
  id: string;
  name: string;
  size: string;
  uploadedBy: string;
  sender_id: string | null;
  media_url: string | null;
  time: string;
  type: string;
  icon: string;
}

interface FilesTabProps {
  files?: FileItem[];
  conversationId?: string | null;
  currentUserId?: string;
  currentUserName?: string;
  isAdmin?: boolean;
  onRefresh?: () => Promise<void>;
  onAddActivity?: (payload: { activity_type: string; preview_text?: string }) => Promise<void>;
}

const typeIcon = (type: string) => {
  if (type === 'image') return <Image className="w-5 h-5 text-blue-400" />;
  if (type === 'video') return <Film className="w-5 h-5 text-purple-400" />;
  if (type === 'audio') return <Music className="w-5 h-5 text-yellow-400" />;
  return <FileText className="w-5 h-5 text-[#00a884]" />;
};

const downloadFile = (url: string, filename: string) => {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  a.remove();
};

const FilesTab = ({
  files = [],
  conversationId,
  currentUserId,
  currentUserName,
  isAdmin,
  onRefresh,
  onAddActivity,
}: FilesTabProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversationId) return;
    setUploading(true);
    setErr('');
    setUploadProgress(`Uploading ${file.name}…`);
    try {
      const uploaded = await MediaAPI.upload(file);
      const msgType = file.type.startsWith('image/')
        ? 'image'
        : file.type.startsWith('video/')
        ? 'video'
        : file.type.startsWith('audio/')
        ? 'audio'
        : 'document';
      await MessagesAPI.send({
        conversation_id: conversationId,
        type: msgType,
        media_url: uploaded.url,
        media_mime_type: uploaded.mime_type,
        media_size: uploaded.size,
        media_filename: uploaded.original_name,
      });
      await onAddActivity?.({
        activity_type: 'file_shared',
        preview_text: `${currentUserName || 'Someone'} shared "${uploaded.original_name}"`,
      }).catch(() => {}); // non-blocking — don't fail upload if activity log fails
      await onRefresh?.();
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (file: FileItem) => {
    setDeletingId(file.id);
    setErr('');
    try {
      await MessagesAPI.deleteForEveryone(file.id);
      await onRefresh?.();
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = (file: FileItem) => {
    if (!file.media_url) return;
    downloadFile(file.media_url, file.name);
  };

  const canDelete = (file: FileItem) => isAdmin || file.sender_id === currentUserId;

  const Spinner = () => (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );

  return (
    <div className="space-y-3">
      {conversationId && (
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[#00a884] border border-[#00a884]/30 hover:bg-[#00a884]/10 transition-all disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {uploading ? uploadProgress : 'Share File'}
          </button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
        </div>
      )}

      {err && <p className="text-red-400 text-xs mb-2">{err}</p>}

      {!files.length ? (
        <div className="flex flex-col items-center justify-center h-40 gap-3">
          <div className="w-12 h-12 rounded-full bg-[#1e2a30] flex items-center justify-center">
            <File className="w-6 h-6 text-[#8696a0]" />
          </div>
          <p className="text-[#8696a0] text-sm">No files shared yet.</p>
        </div>
      ) : (
        files.map((file) => (
          <div key={file.id} className="bg-[#111b21] border border-[#222d34] rounded-xl p-3 flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-[#1e2a30] flex items-center justify-center flex-shrink-0">
              {typeIcon(file.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#e9edef] text-sm font-medium truncate">{file.name}</p>
              <p className="text-[#8696a0] text-xs">{file.uploadedBy} · {file.size} · {file.time}</p>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
              {file.media_url && (
                <button
                  onClick={() => handleDownload(file)}
                  title="Download"
                  className="p-1.5 rounded-lg text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33] transition-all"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}
              {canDelete(file) && (
                <button
                  onClick={() => handleDelete(file)}
                  disabled={deletingId === file.id}
                  title="Delete file"
                  className="p-1.5 rounded-lg text-red-500/40 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                >
                  {deletingId === file.id ? <Spinner /> : <Trash2 className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default FilesTab;
