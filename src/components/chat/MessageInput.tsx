'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { MessagesAPI, MediaAPI } from '@/lib/api/endpoints';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import {
  Smile, Plus, Mic, Send, X, Camera, Image as ImageIcon,
  FileText, Trash2, Loader2,
} from 'lucide-react';
import dynamic from 'next/dynamic';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

export default function MessageInput({ conversationId }: { conversationId: string }) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSendingVoiceRef = useRef(false);

  const { user } = useAuthStore();
  const { replyTo, setReplyTo, addMessage } = useChatStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Typing indicator
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  // Clean up recording on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Pre-generate random waveform heights to avoid re-render issues
  const waveformHeights = useMemo(
    () => Array.from({ length: 30 }, () => Math.random() * 16 + 4),
    []
  );
  const waveformDurations = useMemo(
    () => Array.from({ length: 30 }, () => 0.8 + Math.random() * 0.8),
    []
  );

  const emitTyping = () => {
    const socket = getSocket();
    socket.emit('typing', { conversationId, userId: user?.id });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', { conversationId, userId: user?.id });
    }, 2000);
  };

  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed || sending || !user?.id) return;

    setSending(true);
    setContent('');
    setShowEmojiPicker(false);

    try {
      const payload: any = {
        conversation_id: conversationId,
        content: trimmed,
        type: 'text',
      };

      if (replyTo) {
        payload.reply_to_id = replyTo.id;
      }

      const sentMsg = await MessagesAPI.send(payload);
      addMessage(sentMsg);
      setReplyTo(null);
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Send failed';
      console.error('Send error:', msg);
      alert(msg);
      setContent(trimmed);
    }

    setSending(false);
    textareaRef.current?.focus();

    // Stop typing indicator
    const socket = getSocket();
    socket.emit('typing:stop', { conversationId, userId: user?.id });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ─── File Upload via NestJS Media API ───
  const uploadFile = async (
    file: File,
    messageType: 'image' | 'video' | 'document' | 'audio'
  ) => {
    if (!user?.id) return;
    setUploading(true);
    setUploadProgress(`Uploading ${file.name}...`);

    try {
      // Upload to NestJS backend
      const uploadResult = await MediaAPI.upload(file);

      const payload: any = {
        conversation_id: conversationId,
        type: messageType,
        media_url: uploadResult.url,
        media_mime_type: uploadResult.mime_type,
        media_size: uploadResult.size,
        media_filename: uploadResult.original_name,
      };

      if (replyTo) {
        payload.reply_to_id = replyTo.id;
      }

      if (messageType === 'image') {
        try {
          const dimensions = await getImageDimensions(file);
          payload.media_width = dimensions.width;
          payload.media_height = dimensions.height;
        } catch {}
      }

      const sentMsg = await MessagesAPI.send(payload);
      addMessage(sentMsg);
      setReplyTo(null);
    } catch (error: any) {
      console.error('Upload error:', error?.response?.data?.message || error?.message);
      setUploadProgress(`Upload failed: ${error?.message || 'Unknown error'}`);
      setTimeout(() => { setUploading(false); setUploadProgress(''); }, 2000);
      return;
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => { resolve({ width: img.naturalWidth, height: img.naturalHeight }); URL.revokeObjectURL(img.src); };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const type = file.type.startsWith('video/') ? 'video' : 'image';
    uploadFile(file, type as 'image' | 'video');
    setShowAttachMenu(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDocSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadFile(file, 'document');
    setShowAttachMenu(false);
    if (docInputRef.current) docInputRef.current.value = '';
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadFile(file, 'image');
    setShowAttachMenu(false);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  // ─── Voice Recording ───
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      audioChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;
      isSendingVoiceRef.current = false;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach((t) => t.stop());

        // Only upload if user pressed send (not cancel)
        if (!isSendingVoiceRef.current) return;

        const chunks = audioChunksRef.current;
        if (chunks.length === 0) {
          console.error('No audio chunks recorded');
          setUploading(false);
          setUploadProgress('');
          return;
        }

        const blob = new Blob(chunks, { type: mimeType });
        const ext = mimeType.includes('webm') ? 'webm' : 'mp4';
        const file = new File([blob], `voice-${Date.now()}.${ext}`, { type: mimeType });
        const duration = recordingTime;

        setUploading(true);
        setUploadProgress('Sending voice message...');

        try {
          const uploadResult = await MediaAPI.upload(file);

          const sentMsg = await MessagesAPI.send({
            conversation_id: conversationId,
            type: 'audio',
            media_url: uploadResult.url,
            media_mime_type: uploadResult.mime_type,
            media_size: uploadResult.size,
            media_duration: duration,
          });
          addMessage(sentMsg);
        } catch (e) {
          console.error('Voice send error:', e);
        } finally {
          setUploading(false);
          setUploadProgress('');
        }

        audioChunksRef.current = [];
      };

      // Request data every 250ms to ensure we capture all audio
      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch (err) {
      console.error('Mic access denied:', err);
      alert('Microphone access is required for voice messages. Please allow microphone access.');
    }
  };

  const cancelRecording = () => {
    isSendingVoiceRef.current = false;
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingTime(0);
  };

  const sendRecording = () => {
    isSendingVoiceRef.current = true;
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop(); // This triggers onstop which handles upload
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ─── Emoji ───
  const handleEmojiClick = (emojiData: any) => {
    setContent((prev) => prev + emojiData.emoji);
    // Don't close picker or focus textarea - let user pick multiple emojis
  };

  return (
    <div className="sticky bottom-0 z-20 relative">
      {/* Reply preview */}
      {replyTo && (
        <div className="bg-[#1e2a30] border-l-4 border-[#00a884] px-4 py-2 flex items-center justify-between mx-2 mt-1 rounded-t-lg">
          <div className="flex-1 min-w-0">
            <p className="text-[#00a884] text-xs font-medium">
              {replyTo.sender_id === user?.id ? 'You' : 'Replying'}
            </p>
            <p className="text-[#8696a0] text-sm truncate">{replyTo.content}</p>
          </div>
          <button onClick={() => setReplyTo(null)} className="text-[#8696a0] hover:text-[#e9edef] ml-3 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="bg-[#1e2a30] px-4 py-2 mx-2 flex items-center gap-2 text-[#8696a0] text-sm rounded">
          <Loader2 className="w-4 h-4 animate-spin text-[#00a884]" />
          {uploadProgress}
        </div>
      )}

      {/* Emoji picker - positioned above input, high z-index */}
      {showEmojiPicker && (
        <>
          <div
            className="fixed inset-0 z-[25]"
            onClick={() => setShowEmojiPicker(false)}
          />
          <div className="absolute bottom-full left-0 mb-2 z-[30]">
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              theme={'dark' as any}
              width={350}
              height={400}
              searchDisabled={false}
              skinTonesDisabled
              previewConfig={{ showPreview: false }}
            />
          </div>
        </>
      )}

      {/* Attachment menu */}
      {showAttachMenu && (
        <>
          <div
            className="fixed inset-0 z-[25]"
            onClick={() => setShowAttachMenu(false)}
          />
          <div className="absolute bottom-full left-12 mb-3 bg-[#233138] rounded-xl shadow-2xl py-3 px-2 pop-up z-[30]">
            <div className="grid grid-cols-3 gap-2 min-w-[200px]">
              <AttachOption
                icon={<ImageIcon className="w-5 h-5" />}
                label="Photos"
                color="bg-[#7f66ff]"
                onClick={() => { fileInputRef.current?.click(); setShowAttachMenu(false); }}
              />
              <AttachOption
                icon={<Camera className="w-5 h-5" />}
                label="Camera"
                color="bg-[#ff6b8a]"
                onClick={() => { cameraInputRef.current?.click(); setShowAttachMenu(false); }}
              />
              <AttachOption
                icon={<FileText className="w-5 h-5" />}
                label="Document"
                color="bg-[#5157ae]"
                onClick={() => { docInputRef.current?.click(); setShowAttachMenu(false); }}
              />
            </div>
          </div>
        </>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handlePhotoSelect}
      />
      <input
        ref={docInputRef}
        type="file"
        accept="*/*"
        className="hidden"
        onChange={handleDocSelect}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCameraCapture}
      />

      {/* Main input bar */}
      <div className="bg-[#202c33] px-4 py-2 flex items-center gap-3">
        {isRecording ? (
          /* ─── Recording UI ─── */
          <div className="flex items-center gap-3 flex-1">
            <button onClick={cancelRecording} className="text-red-400 hover:text-red-300 transition-colors">
              <Trash2 className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2 flex-1">
              <div className="w-3 h-3 bg-red-500 rounded-full record-pulse" />
              <span className="text-red-400 text-sm font-mono">{formatTime(recordingTime)}</span>
              <div className="flex-1 flex items-center gap-0.5 h-6">
                {waveformHeights.map((h, i) => (
                  <div
                    key={i}
                    className="w-1 bg-[#00a884] rounded-full"
                    style={{
                      height: `${h}px`,
                      animationName: 'waveform',
                      animationDuration: `${waveformDurations[i]}s`,
                      animationTimingFunction: 'ease-in-out',
                      animationIterationCount: 'infinite',
                      animationDelay: `${i * 0.05}s`,
                    }}
                  />
                ))}
              </div>
            </div>
            <button onClick={sendRecording} className="text-[#00a884] hover:text-[#00c49a] transition-colors">
              <Send className="w-6 h-6" />
            </button>
          </div>
        ) : (
          /* ─── Normal Input UI ─── */
          <>
            <div className="flex items-center gap-4 text-[#aebac1]">
              <button
                onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowAttachMenu(false); }}
                className={`hover:text-[#e9edef] transition-colors ${showEmojiPicker ? 'text-[#00a884]' : ''}`}
              >
                {showEmojiPicker ? <X className="w-6 h-6" /> : <Smile className="w-6 h-6" />}
              </button>
              <button
                onClick={() => { setShowAttachMenu(!showAttachMenu); setShowEmojiPicker(false); }}
                className={`hover:text-[#e9edef] transition-colors ${showAttachMenu ? 'text-[#00a884]' : ''}`}
              >
                {showAttachMenu ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
              </button>
            </div>

            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => { setContent(e.target.value); emitTyping(); }}
              onKeyDown={handleKeyDown}
              placeholder="Type a message"
              rows={1}
              className="flex-1 bg-[#2a3942] text-[#e9edef] text-sm py-2.5 px-4 rounded-lg outline-none placeholder:text-[#8696a0] resize-none max-h-32 custom-scrollbar"
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = 'auto';
                t.style.height = Math.min(t.scrollHeight, 128) + 'px';
              }}
            />

            <div className="text-[#aebac1] flex-shrink-0">
              {content.trim() ? (
                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="text-[#00a884] hover:text-[#008069] transition-colors disabled:opacity-50"
                >
                  <Send className="w-6 h-6" />
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  className="hover:text-[#e9edef] transition-colors"
                >
                  <Mic className="w-6 h-6" />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function AttachOption({
  icon,
  label,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-[#111b21] transition-colors"
    >
      <div className={`w-10 h-10 ${color} rounded-full flex items-center justify-center text-white`}>
        {icon}
      </div>
      <span className="text-[#e9edef] text-[11px]">{label}</span>
    </button>
  );
}
