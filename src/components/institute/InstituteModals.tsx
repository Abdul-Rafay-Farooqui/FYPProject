"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api/client";

interface ModalProps {
  open: boolean;
  onClose: () => void;
}

// Create Institute Modal
export function CreateInstituteModal({
  open,
  onClose,
  onSubmit,
}: ModalProps & {
  onSubmit: (name: string, slug: string, description: string, logoUrl?: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Institute name is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onSubmit(name, slug, description, logoUrl || undefined);
      setName("");
      setSlug("");
      setDescription("");
      setLogoUrl("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create institute");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111b21] rounded-lg max-w-md w-full p-6">
        <h2 className="text-[#e9edef] text-xl font-semibold mb-4">Create Institute</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-[#8696a0] text-sm mb-1">Institute Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-[#1e2a30] text-[#e9edef] rounded border border-[#222d34] focus:border-[#00a884] outline-none"
                placeholder="e.g., Springfield High School"
              />
            </div>
            <div>
              <label className="block text-[#8696a0] text-sm mb-1">Slug (optional)</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-3 py-2 bg-[#1e2a30] text-[#e9edef] rounded border border-[#222d34] focus:border-[#00a884] outline-none"
                placeholder="e.g., springfield-high"
              />
            </div>
            <div>
              <label className="block text-[#8696a0] text-sm mb-1">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-[#1e2a30] text-[#e9edef] rounded border border-[#222d34] focus:border-[#00a884] outline-none"
                rows={3}
                placeholder="Brief description of your institute"
              />
            </div>
            <div>
              <label className="block text-[#8696a0] text-sm mb-1">Logo URL (optional)</label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full px-3 py-2 bg-[#1e2a30] text-[#e9edef] rounded border border-[#222d34] focus:border-[#00a884] outline-none"
                placeholder="https://..."
              />
            </div>
          </div>
          {error && <div className="mt-4 text-red-400 text-sm">{error}</div>}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded bg-[#1e2a30] text-[#e9edef] hover:bg-[#2a3942] transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded bg-[#00a884] text-[#0b141a] hover:bg-[#00a884]/90 transition-colors font-medium"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Institute Modal
export function EditInstituteModal({
  open,
  onClose,
  onSubmit,
  institute,
}: ModalProps & {
  onSubmit: (data: any) => Promise<void>;
  institute: any;
}) {
  const [name, setName] = useState(institute?.name || "");
  const [slug, setSlug] = useState(institute?.slug || "");
  const [description, setDescription] = useState(institute?.description || "");
  const [logoUrl, setLogoUrl] = useState(institute?.logo_url || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Institute name is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onSubmit({ name, slug, description, logo_url: logoUrl || undefined });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update institute");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111b21] rounded-lg max-w-md w-full p-6">
        <h2 className="text-[#e9edef] text-xl font-semibold mb-4">Edit Institute</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-[#8696a0] text-sm mb-1">Institute Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-[#1e2a30] text-[#e9edef] rounded border border-[#222d34] focus:border-[#00a884] outline-none"
              />
            </div>
            <div>
              <label className="block text-[#8696a0] text-sm mb-1">Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-3 py-2 bg-[#1e2a30] text-[#e9edef] rounded border border-[#222d34] focus:border-[#00a884] outline-none"
              />
            </div>
            <div>
              <label className="block text-[#8696a0] text-sm mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-[#1e2a30] text-[#e9edef] rounded border border-[#222d34] focus:border-[#00a884] outline-none"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-[#8696a0] text-sm mb-1">Logo URL</label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full px-3 py-2 bg-[#1e2a30] text-[#e9edef] rounded border border-[#222d34] focus:border-[#00a884] outline-none"
              />
            </div>
          </div>
          {error && <div className="mt-4 text-red-400 text-sm">{error}</div>}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded bg-[#1e2a30] text-[#e9edef] hover:bg-[#2a3942] transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded bg-[#00a884] text-[#0b141a] hover:bg-[#00a884]/90 transition-colors font-medium"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Delete Institute Modal
export function DeleteInstituteModal({
  open,
  onClose,
  onConfirm,
  instituteName,
}: ModalProps & {
  onConfirm: () => Promise<void>;
  instituteName?: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111b21] rounded-lg max-w-md w-full p-6">
        <h2 className="text-[#e9edef] text-xl font-semibold mb-4">Delete Institute</h2>
        <p className="text-[#8696a0] mb-6">
          Are you sure you want to delete <span className="text-[#e9edef] font-medium">{instituteName}</span>? 
          This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded bg-[#1e2a30] text-[#e9edef] hover:bg-[#2a3942] transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 transition-colors font-medium"
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Add Members Modal
export function AddMembersModal({
  open,
  onClose,
  onSubmit,
  instituteName,
}: ModalProps & {
  onSubmit: (memberIds: string[], role: "admin" | "teacher" | "student") => Promise<void>;
  instituteName?: string;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [role, setRole] = useState<"admin" | "teacher" | "student">("student");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);

  // Search users by name, email, or phone
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    setError("");
    try {
      const response = await api.get(`/users/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      console.error('Search error:', err);
      setError("Failed to search users");
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const toggleUserSelection = (user: any) => {
    setSelectedUsers(prev => {
      const exists = prev.find(u => u.id === user.id);
      if (exists) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUsers.length === 0) {
      setError("Please select at least one user");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const memberIds = selectedUsers.map(u => u.id);
      await onSubmit(memberIds, role);
      setSelectedUsers([]);
      setSearchQuery("");
      setSearchResults([]);
      setRole("student");
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to add members");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedUsers([]);
    setSearchQuery("");
    setSearchResults([]);
    setError("");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111b21] rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-[#222d34]">
          <h2 className="text-[#e9edef] text-xl font-semibold">
            Add Members to {instituteName}
          </h2>
          <p className="text-[#8696a0] text-sm mt-1">
            Search users by name, email, or phone number
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto">
            {/* Search Input */}
            <div>
              <label className="block text-[#8696a0] text-sm mb-2">
                Search Users
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 bg-[#1e2a30] text-[#e9edef] rounded border border-[#222d34] focus:border-[#00a884] outline-none"
                  placeholder="Type name, email, or phone..."
                />
                <svg className="w-5 h-5 text-[#8696a0] absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searching && (
                  <div className="absolute right-3 top-2.5">
                    <div className="w-5 h-5 border-2 border-[#00a884]/30 border-t-[#00a884] rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-[#8696a0] text-sm mb-2">Role *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#1e2a30] text-[#e9edef] rounded border border-[#222d34] focus:border-[#00a884] outline-none"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <div>
                <label className="block text-[#8696a0] text-sm mb-2">
                  Selected ({selectedUsers.length})
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedUsers.map(user => (
                    <div key={user.id} className="flex items-center justify-between bg-[#1e2a30] rounded p-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#00a884]/20 flex items-center justify-center">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.display_name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <span className="text-xs text-[#00a884]">{user.display_name?.[0]?.toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-[#e9edef] text-sm">{user.display_name}</p>
                          <p className="text-[#8696a0] text-xs">{user.email || user.phone}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleUserSelection(user)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results */}
            {searchQuery && searchResults.length > 0 && (
              <div>
                <label className="block text-[#8696a0] text-sm mb-2">
                  Search Results
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {searchResults.map(user => {
                    const isSelected = selectedUsers.find(u => u.id === user.id);
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => toggleUserSelection(user)}
                        className={`w-full flex items-center gap-3 p-3 rounded border transition-colors ${
                          isSelected
                            ? 'bg-[#00a884]/20 border-[#00a884]'
                            : 'bg-[#1e2a30] border-[#222d34] hover:border-[#00a884]/50'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-[#00a884]/20 flex items-center justify-center flex-shrink-0">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.display_name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <span className="text-[#00a884]">{user.display_name?.[0]?.toUpperCase()}</span>
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-[#e9edef] font-medium">{user.display_name}</p>
                          <p className="text-[#8696a0] text-sm">{user.email || user.phone}</p>
                        </div>
                        {isSelected && (
                          <svg className="w-6 h-6 text-[#00a884]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {searchQuery && !searching && searchResults.length === 0 && (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-[#8696a0] mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-[#8696a0] text-sm">No users found</p>
              </div>
            )}
          </div>

          {error && <div className="px-6 pb-2 text-red-400 text-sm">{error}</div>}

          <div className="p-6 border-t border-[#222d34] flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 rounded bg-[#1e2a30] text-[#e9edef] hover:bg-[#2a3942] transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded bg-[#00a884] text-[#0b141a] hover:bg-[#00a884]/90 transition-colors font-medium disabled:opacity-50"
              disabled={loading || selectedUsers.length === 0}
            >
              {loading ? "Adding..." : `Add ${selectedUsers.length} Member${selectedUsers.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
