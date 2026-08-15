'use client';

import { useEffect, useState } from 'react';
import { X, Users, Check, Camera, UserPlus, Search, Loader2 } from 'lucide-react';
import { ContactsAPI, ConversationsAPI, GroupsAPI, MediaAPI, UsersAPI } from '@/lib/api/endpoints';
import { useUIStore } from '@/store/uiStore';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (group: any) => void;
}
//comment
export default function GroupCreateModal({
  open,
  onClose,
  onCreated,
}: Props) {
  const [step, setStep] = useState<'members' | 'info'>('members');
  const [contacts, setContacts] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchPhone, setSearchPhone] = useState('');
  const [searchingContact, setSearchingContact] = useState(false);
  const [searchContactError, setSearchContactError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { isAddContactModalOpen, setAddContactModalOpen } = useUIStore();

  const loadPeopleFromConversations = async () => {
    try {
      const data = await ConversationsAPI.list();
      const people = (data || [])
        .filter((conv: any) => conv.type !== 'group' && conv.other_participant?.id)
        .map((conv: any) => ({
          id: conv.other_participant.id,
          display_name: conv.other_participant.display_name,
          avatar_url: conv.other_participant.avatar_url,
          phone: conv.other_participant.phone,
        }));
      setContacts(people);
    } catch {
      setContacts([]);
    }
  };

  useEffect(() => {
    if (!open) return;
    setStep('members');
    setSelected([]);
    setName('');
    setDescription('');
    setAvatarUrl(null);
    setSearchPhone('');
    setSearchResult(null);
    setSearchContactError(null);
    setError(null);
    loadPeopleFromConversations();
  }, [open]);

  useEffect(() => {
    if (!open || isAddContactModalOpen) return;
    loadPeopleFromConversations();
  }, [open, isAddContactModalOpen]);

  if (!open) return null;

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const up = await MediaAPI.upload(file);
      setAvatarUrl(up.url);
    } catch {
      setError('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const refreshContacts = async () => {
    await loadPeopleFromConversations();
  };

  const handleSearchContact = async () => {
    const phone = searchPhone.trim();
    if (!phone) {
      setSearchContactError('Enter a phone number');
      return;
    }

    setSearchingContact(true);
    setSearchContactError(null);
    setSearchResult(null);

    try {
      const result = await UsersAPI.searchByPhone(phone);
      if (!result) {
        setSearchContactError('No WeConnect user found with that number.');
        return;
      }
      setSearchResult(result);
    } catch (err: any) {
      setSearchContactError(
        err?.response?.status === 404
          ? 'No WeConnect user found with that number.'
          : err?.response?.data?.message || 'Search failed',
      );
    } finally {
      setSearchingContact(false);
    }
  };

  const addFoundContact = async () => {
    if (!searchResult) return;
    try {
      await ContactsAPI.add(searchResult.id);
      setSelected((prev) => (prev.includes(searchResult.id) ? prev : [...prev, searchResult.id]));
      await refreshContacts();
      setSearchPhone('');
      setSearchResult(null);
      setSearchContactError(null);
    } catch (err: any) {
      setSearchContactError(err?.response?.data?.message || 'Failed to add contact');
    }
  };

  const submit = async () => {
    if (!name.trim() || selected.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const g = await GroupsAPI.create({
        name: name.trim(),
        description: description.trim() || undefined,
        avatar_url: avatarUrl || undefined,
        member_ids: selected,
      });
      onCreated(g);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to create group');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111b21] w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-[#202c33] px-4 py-3 flex items-center gap-3">
          <button onClick={onClose} className="text-[#aebac1]">
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-[#e9edef] text-base font-medium">
            {step === 'members' ? 'Add group members' : 'New group'}
          </h2>
        </div>

        {step === 'members' ? (
          <>
            <div className="px-4 py-3 border-b border-[#222d34] space-y-3 text-[#8696a0] text-xs">
              <div className="flex items-center justify-between gap-3">
                <span>{selected.length} selected</span>
                <button
                  type="button"
                  onClick={() => setAddContactModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#00a884]/10 text-[#00a884] px-2.5 py-1.5 font-medium hover:bg-[#00a884]/20 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Add contact
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  placeholder="Search by phone"
                  className="flex-1 bg-[#202c33] text-[#e9edef] px-3 py-2 rounded-md outline-none placeholder:text-[#8696a0]"
                />
                <button
                  type="button"
                  onClick={handleSearchContact}
                  disabled={searchingContact}
                  className="bg-[#00a884] text-[#111b21] px-3 py-2 rounded-md font-medium disabled:opacity-60 flex items-center justify-center"
                >
                  {searchingContact ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </button>
              </div>

              {searchContactError && (
                <p className="text-red-400 text-[11px]">{searchContactError}</p>
              )}

              {searchResult && (
                <div className="flex items-center justify-between gap-3 rounded-md bg-[#202c33] p-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {searchResult.avatar_url ? (
                      <img src={searchResult.avatar_url} alt={searchResult.display_name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#2a3942] flex items-center justify-center text-[#e9edef] text-xs font-medium">
                        {searchResult.display_name?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-[#e9edef] text-[11px] truncate">{searchResult.display_name}</p>
                      <p className="text-[#8696a0] text-[10px] truncate">{searchResult.phone}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addFoundContact}
                    className="text-[#00a884] text-[11px] font-medium hover:underline"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {contacts.length === 0 && (
                <div className="p-6 text-center">
                  <p className="text-[#8696a0] text-sm">
                    No contacts yet. Add a contact to create a group.
                  </p>
                </div>
              )}
              {contacts.map((c: any) => {
                const cu = c.contact || c.other_participant || c;
                if (!cu?.id) return null;
                const sel = selected.includes(cu.id);
                return (
                  <button
                    key={cu.id}
                    onClick={() => toggle(cu.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#202c33] ${
                      sel ? 'bg-[#202c33]' : ''
                    }`}
                  >
                    {cu.avatar_url ? (
                      <img
                        src={cu.avatar_url}
                        className="w-10 h-10 rounded-full object-cover"
                        alt={cu.display_name}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#2a3942] flex items-center justify-center">
                        <span className="text-[#e9edef]">
                          {cu.display_name?.[0]?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="text-[#e9edef] text-sm flex-1 text-left">
                      {cu.display_name}
                    </span>
                    {sel && (
                      <div className="w-5 h-5 rounded-full bg-[#00a884] flex items-center justify-center">
                        <Check className="w-3 h-3 text-[#111b21]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="bg-[#202c33] px-4 py-3 flex justify-end">
              <button
                onClick={() => setStep('info')}
                disabled={selected.length === 0}
                className="bg-[#00a884] text-[#111b21] font-semibold px-5 py-2 rounded-full hover:bg-[#008069] disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
              <div className="flex flex-col items-center gap-3 mb-6">
                <label className="relative cursor-pointer">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-24 h-24 rounded-full object-cover border-4 border-[#00a884]"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-[#2a3942] flex items-center justify-center border-4 border-[#00a884]">
                      <Users className="w-10 h-10 text-[#8696a0]" />
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 bg-[#00a884] rounded-full p-2">
                    <Camera className="w-4 h-4 text-[#111b21]" />
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={uploadAvatar}
                  />
                </label>
                {uploading && (
                  <p className="text-xs text-[#8696a0]">Uploading...</p>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[#00a884] text-xs font-medium mb-1 block">
                    Group name
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter group name"
                    maxLength={100}
                    className="w-full bg-[#202c33] text-[#e9edef] px-3 py-2 rounded outline-none focus:ring-2 focus:ring-[#00a884]"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-[#00a884] text-xs font-medium mb-1 block">
                    Description (optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add group description"
                    maxLength={500}
                    rows={3}
                    className="w-full bg-[#202c33] text-[#e9edef] px-3 py-2 rounded outline-none focus:ring-2 focus:ring-[#00a884] resize-none"
                  />
                </div>
                <p className="text-[#8696a0] text-xs">
                  Members: {selected.length}
                </p>
              </div>

              {error && (
                <p className="text-red-400 text-sm mt-3 text-center">{error}</p>
              )}
            </div>
            <div className="bg-[#202c33] px-4 py-3 flex justify-between">
              <button
                onClick={() => setStep('members')}
                className="text-[#8696a0] text-sm hover:text-[#e9edef]"
              >
                Back
              </button>
              <button
                onClick={submit}
                disabled={submitting || !name.trim()}
                className="bg-[#00a884] text-[#111b21] font-semibold px-5 py-2 rounded-full hover:bg-[#008069] disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-[#111b21] border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Create'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}