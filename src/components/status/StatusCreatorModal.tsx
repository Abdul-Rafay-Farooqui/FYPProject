'use client';

import { useEffect, useRef, useState } from 'react';
import {
  X,
  Image as ImgIcon,
  Send,
  Palette,
  Users,
  Check,
} from 'lucide-react';
import { MediaAPI, StatusAPI, ContactsAPI } from '@/lib/api/endpoints';

const BG_COLORS = [
  '#075e54',
  '#128c7e',
  '#25d366',
  '#34b7f1',
  '#a51cbb',
  '#ff9500',
  '#eb5757',
  '#111b21',
];

interface Props {
  open: boolean;
  initialType: 'text' | 'image' | 'video';
  onClose: () => void;
  onCreated: () => void;
}

export default function StatusCreatorModal({
  open,
  initialType,
  onClose,
  onCreated,
}: Props) {
  const [type, setType] = useState(initialType);
  const [text, setText] = useState('');
  const [bgColor, setBgColor] = useState(BG_COLORS[0]);
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [hideFrom, setHideFrom] = useState<string[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setType(initialType);
    setText('');
    setCaption('');
    setBgColor(BG_COLORS[0]);
    setFile(null);
    setPreviewUrl(null);
    setError(null);
    setHideFrom([]);
    ContactsAPI.list()
      .then(setContacts)
      .catch(() => setContacts([]));
  }, [open, initialType]);

  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setType(f.type.startsWith('video') ? 'video' : 'image');
  };

  const submit = async () => {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      if (type === 'text') {
        if (!text.trim()) throw new Error('Status text cannot be empty');
        await StatusAPI.create({
          type: 'text',
          content: text.trim(),
          bg_color: bgColor,
          hide_from: hideFrom,
        });
      } else {
        if (!file) throw new Error('Please select a file');
        const uploaded = await MediaAPI.upload(file);
        await StatusAPI.create({
          type,
          content: caption.trim() || undefined,
          caption: caption.trim() || undefined,
          media_url: uploaded.url,
          hide_from: hideFrom,
        });
      }
      onCreated();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to post');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleHide = (uid: string) => {
    setHideFrom((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid],
    );
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111b21] w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#202c33] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="text-[#aebac1] hover:text-[#e9edef]"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-[#e9edef] text-base font-medium">
              New status
            </h2>
          </div>
          <button
            onClick={() => setPrivacyOpen((o) => !o)}
            title="Privacy"
            className="text-[#aebac1] hover:text-[#e9edef] flex items-center gap-1 text-xs"
          >
            <Users className="w-4 h-4" />
            {hideFrom.length > 0 && `(${hideFrom.length} hidden)`}
          </button>
        </div>

        {/* Type picker */}
        <div className="flex border-b border-[#222d34] bg-[#111b21]">
          {(['text', 'image'] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setType(t);
                setFile(null);
                setPreviewUrl(null);
              }}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                type === t
                  ? 'text-[#00a884] border-b-2 border-[#00a884]'
                  : 'text-[#8696a0] hover:text-[#e9edef]'
              }`}
            >
              {t === 'text' ? 'Text' : 'Photo / Video'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
          {privacyOpen ? (
            <div>
              <h3 className="text-[#e9edef] text-sm font-medium mb-2">
                Hide status from
              </h3>
              <p className="text-[#8696a0] text-xs mb-4">
                Selected contacts will not see this status.
              </p>
              <div className="space-y-1 max-h-80 overflow-y-auto custom-scrollbar">
                {contacts.length === 0 && (
                  <p className="text-[#8696a0] text-sm">
                    You don’t have any contacts yet.
                  </p>
                )}
                {contacts.map((c: any) => {
                  const cu = c.contact;
                  const hidden = hideFrom.includes(cu.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() => toggleHide(cu.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-[#202c33] ${
                        hidden ? 'bg-[#202c33]' : ''
                      }`}
                    >
                      {cu.avatar_url ? (
                        <img
                          src={cu.avatar_url}
                          className="w-9 h-9 rounded-full object-cover"
                          alt={cu.display_name}
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#2a3942] flex items-center justify-center">
                          <span className="text-[#e9edef]">
                            {cu.display_name?.[0]?.toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="text-[#e9edef] text-sm flex-1 text-left">
                        {cu.display_name}
                      </span>
                      {hidden && (
                        <Check className="w-4 h-4 text-[#00a884]" />
                      )}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setPrivacyOpen(false)}
                className="mt-4 w-full py-2 bg-[#00a884] text-[#111b21] text-sm font-semibold rounded hover:bg-[#008069]"
              >
                Done
              </button>
            </div>
          ) : type === 'text' ? (
            <div
              style={{ backgroundColor: bgColor }}
              className="rounded-lg h-64 flex items-center justify-center p-6 relative"
            >
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a status"
                maxLength={700}
                className="bg-transparent text-white text-center text-2xl font-semibold outline-none resize-none w-full placeholder:text-white/50"
                autoFocus
                rows={4}
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <Palette className="w-4 h-4 text-white/80" />
                {BG_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setBgColor(c)}
                    className={`w-5 h-5 rounded-full border-2 ${
                      bgColor === c ? 'border-white' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div>
              {previewUrl ? (
                <div className="rounded-lg overflow-hidden bg-black">
                  {type === 'image' ? (
                    <img
                      src={previewUrl}
                      alt="preview"
                      className="max-h-80 w-full object-contain"
                    />
                  ) : (
                    <video
                      src={previewUrl}
                      controls
                      className="max-h-80 w-full"
                    />
                  )}
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full h-64 border-2 border-dashed border-[#2a3942] rounded-lg flex flex-col items-center justify-center text-[#8696a0] hover:text-[#e9edef] hover:border-[#00a884]"
                >
                  <ImgIcon className="w-12 h-12 mb-2" />
                  <span>Choose photo or video</span>
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFileChange}
              />
              {previewUrl && (
                <input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a caption..."
                  className="mt-3 w-full bg-[#202c33] text-[#e9edef] px-3 py-2 rounded outline-none placeholder:text-[#8696a0]"
                />
              )}
            </div>
          )}

          {error && (
            <p className="text-red-400 text-sm mt-3 text-center">{error}</p>
          )}
        </div>

        {/* Footer */}
        {!privacyOpen && (
          <div className="bg-[#202c33] px-4 py-3 flex justify-end">
            <button
              onClick={submit}
              disabled={
                submitting ||
                (type === 'text' ? !text.trim() : !file)
              }
              className="flex items-center gap-2 bg-[#00a884] text-[#111b21] font-semibold px-6 py-2 rounded-full hover:bg-[#008069] transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-[#111b21] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" /> Post
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}