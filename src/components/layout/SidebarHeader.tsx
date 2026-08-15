"use client";

import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import {
  MessageSquarePlus,
  Users,
  CircleDashed,
  MoreVertical,
  LogOut,
  Star,
  Archive,
  Settings,
  X,
  Camera,
  User,
  Info,
  UsersRound,
  Plus,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { UsersAPI, MediaAPI } from "@/lib/api/endpoints";
import { clearToken } from "@/lib/api/client";
import { disconnectSocket } from "@/lib/socket";
import { useRouter } from "next/navigation";
import { SidebarTab } from "./Sidebar";

interface Props {
  tab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
}

export default function SidebarHeader({ tab, onTabChange }: Props) {
  const { profile, setProfile, signOut } = useAuthStore();
  const { setAddContactModalOpen } = useUIStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAbout, setEditAbout] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isProfileOpen && profile) {
      setEditName(profile.display_name ?? "");
      setEditAbout(profile.about ?? "");
      setSaveError(null);
      setUploadError(null);
    }
  }, [isProfileOpen, profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !profile) return;
    setUploading(true);
    setUploadError(null);
    try {
      const file = e.target.files[0];
      const uploadResult = await MediaAPI.upload(file);
      const updated = await UsersAPI.updateMe({ avatar_url: uploadResult.url });
      if (updated) setProfile(updated);
    } catch (err: any) {
      setUploadError(
        `Upload failed: ${err?.response?.data?.message || err?.message || "Unknown error"}`,
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveProfile = async () => {
    if (!profile || !editName.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await UsersAPI.updateMe({
        display_name: editName.trim(),
        about: editAbout,
      });
      if (updated) setProfile(updated);
      setIsProfileOpen(false);
    } catch (err: any) {
      setSaveError(
        `Save failed: ${err?.response?.data?.message || err?.message || "Unknown error"}`,
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await UsersAPI.setPresence(false);
    } catch {}
    disconnectSocket();
    clearToken();
    signOut();
    router.push("/auth/login");
  };

  const title =
    tab === "chats"
      ? "WeConnect"
      : tab === "status"
        ? "Status"
        : tab === "groups"
          ? "Groups"
          : tab === "communities"
            ? "Communities"
            : "Calls";

  return (
    <>
      <div className="bg-[#202c33] px-4 py-4 flex items-center justify-between sticky top-0 z-10 min-h-[56px]">
        <button
          onClick={() => setIsProfileOpen(true)}
          className="focus:outline-none flex-shrink-0"
        >
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-[#2a3942] rounded-full flex items-center justify-center">
              <span className="text-[#e9edef] text-lg font-medium">
                {profile?.display_name?.[0]?.toUpperCase() ?? "?"}
              </span>
            </div>
          )}
        </button>

        <h2 className="text-[#e9edef] font-medium text-base ml-3 flex-1 truncate">
          {title}
        </h2>

        <div className="flex items-center gap-4 text-[#aebac1]">
          {tab === "chats" && (
            <button
              title="New chat"
              onClick={() => setAddContactModalOpen(true)}
              className="hover:text-[#e9edef] transition-colors"
            >
              <MessageSquarePlus className="w-5 h-5" />
            </button>
          )}
          {tab === "status" && (
            <button
              title="Add status"
              onClick={() =>
                document
                  .querySelector<HTMLButtonElement>("[data-new-status]")
                  ?.click()
              }
              className="hover:text-[#e9edef] transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
          {tab === "groups" && (
            <button
              title="New group"
              onClick={() =>
                document
                  .querySelector<HTMLButtonElement>("[data-new-group]")
                  ?.click()
              }
              className="hover:text-[#e9edef] transition-colors"
            >
              <Users className="w-5 h-5" />
            </button>
          )}
          {tab === "communities" && (
            <button
              title="New community"
              onClick={() =>
                document
                  .querySelector<HTMLButtonElement>("[data-new-community]")
                  ?.click()
              }
              className="hover:text-[#e9edef] transition-colors"
            >
              <UsersRound className="w-5 h-5" />
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="hover:text-[#e9edef] transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-52 bg-[#233138] shadow-2xl rounded-md py-1 z-50">
                  <button
                    className="w-full text-left px-4 py-3 text-[#e9edef] hover:bg-[#182229] text-sm flex items-center gap-3"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onTabChange("groups");
                    }}
                  >
                    <Users className="w-4 h-4 text-[#8696a0]" /> Groups
                  </button>
                  <button
                    className="w-full text-left px-4 py-3 text-[#e9edef] hover:bg-[#182229] text-sm flex items-center gap-3"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onTabChange("communities");
                    }}
                  >
                    <UsersRound className="w-4 h-4 text-[#8696a0]" />{" "}
                    Communities
                  </button>
                  <button
                    className="w-full text-left px-4 py-3 text-[#e9edef] hover:bg-[#182229] text-sm flex items-center gap-3"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onTabChange("status");
                    }}
                  >
                    <CircleDashed className="w-4 h-4 text-[#8696a0]" /> Status
                  </button>
                  <div className="h-px bg-[#2a3942] my-1" />
                  <button
                    className="w-full text-left px-4 py-3 text-[#e9edef] hover:bg-[#182229] text-sm flex items-center gap-3"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Star className="w-4 h-4 text-[#8696a0]" /> Starred messages
                  </button>
                  <button
                    className="w-full text-left px-4 py-3 text-[#e9edef] hover:bg-[#182229] text-sm flex items-center gap-3"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Archive className="w-4 h-4 text-[#8696a0]" /> Archived
                  </button>
                  <button
                    className="w-full text-left px-4 py-3 text-[#e9edef] hover:bg-[#182229] text-sm flex items-center gap-3"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsProfileOpen(true);
                    }}
                  >
                    <Settings className="w-4 h-4 text-[#8696a0]" /> Settings
                  </button>
                  <div className="h-px bg-[#2a3942] my-1" />
                  <button
                    className="w-full text-left px-4 py-3 text-red-400 hover:bg-[#182229] text-sm flex items-center gap-3"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4" /> Log out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Profile Panel */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-[200] flex">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsProfileOpen(false)}
          />

          <div className="relative w-[355px] h-full bg-[#111b21] flex flex-col shadow-2xl">
            <div className="bg-[#00a884] px-4 pt-12 pb-5">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="text-[#111b21] hover:opacity-70"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-[#111b21] font-semibold text-lg">
                  Profile
                </h2>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="flex flex-col items-center py-8 gap-3 bg-[#111b21]">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-[#2a3942] border-4 border-[#00a884]">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-16 h-16 text-[#8696a0]" />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute bottom-1 right-1 bg-[#00a884] p-2.5 rounded-full hover:bg-[#008069] transition-colors shadow-lg disabled:opacity-60"
                  >
                    <Camera className="w-4 h-4 text-[#111b21]" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </div>
                {uploading && (
                  <div className="flex items-center gap-2 text-[#8696a0] text-xs">
                    <div className="w-3 h-3 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin" />
                    Uploading photo...
                  </div>
                )}
                {uploadError && (
                  <p className="text-red-400 text-xs text-center px-4">
                    {uploadError}
                  </p>
                )}
              </div>

              <div className="bg-[#111b21] px-6 space-y-0 pb-8">
                <div className="py-4 border-b border-[#222d34]">
                  <label className="flex items-center gap-2 text-[#00a884] text-xs font-medium mb-3">
                    <User className="w-3.5 h-3.5" /> Your name
                  </label>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    maxLength={25}
                    className="w-full bg-transparent text-[#e9edef] text-[15px] outline-none border-b-2 border-[#00a884] pb-1"
                    placeholder="Enter your name"
                  />
                  <p className="text-[#8696a0] text-xs mt-2">
                    This is not your username. This name will be visible to your
                    contacts.
                  </p>
                </div>

                <div className="py-4 border-b border-[#222d34]">
                  <label className="flex items-center gap-2 text-[#00a884] text-xs font-medium mb-3">
                    <Info className="w-3.5 h-3.5" /> About
                  </label>
                  <input
                    value={editAbout}
                    onChange={(e) => setEditAbout(e.target.value)}
                    maxLength={139}
                    className="w-full bg-transparent text-[#e9edef] text-[15px] outline-none border-b-2 border-[#00a884] pb-1"
                    placeholder="Hey there! I am using WeConnect."
                  />
                </div>

                <div className="py-4 border-b border-[#222d34]">
                  <label className="text-[#00a884] text-xs font-medium block mb-2">
                    Phone
                  </label>
                  <p className="text-[#e9edef] text-[15px]">{profile?.phone}</p>
                </div>

                {saveError && (
                  <p className="text-red-400 text-sm pt-4">{saveError}</p>
                )}

                <button
                  onClick={handleSaveProfile}
                  disabled={saving || !editName.trim()}
                  className="w-full mt-6 bg-[#00a884] text-[#111b21] font-bold py-3 rounded-lg hover:bg-[#008069] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#111b21] border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
