"use client";

import { useState } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
}

// ============= CLASS MODALS =============
interface AddClassModalProps extends ModalProps {
  onSubmit: (name: string, description: string) => Promise<void>;
}

export function AddClassModal({ open, onClose, onSubmit }: AddClassModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Class name is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onSubmit(name.trim(), description.trim());
      setName("");
      setDescription("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to add class");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111b21] rounded-lg max-w-md w-full p-6 border border-[#222d34]">
        <h2 className="text-[#e9edef] text-xl font-semibold mb-4">Add Class</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-[#8696a0] text-sm mb-2">Class Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-[#0b141a] border border-[#222d34] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884]"
              placeholder="e.g., Grade 10"
            />
          </div>
          <div className="mb-4">
            <label className="block text-[#8696a0] text-sm mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-[#0b141a] border border-[#222d34] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884] resize-none"
              rows={3}
              placeholder="Optional description"
            />
          </div>
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded text-[#8696a0] hover:bg-[#1e2a30]"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-[#00a884] text-[#0b141a] hover:bg-[#00a884]/90 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Class"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============= BATCH MODALS =============
interface AddBatchModalProps extends ModalProps {
  onSubmit: (name: string, year: number) => Promise<void>;
}

export function AddBatchModal({ open, onClose, onSubmit }: AddBatchModalProps) {
  const [name, setName] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Batch name is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onSubmit(name.trim(), year);
      setName("");
      setYear(new Date().getFullYear());
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to add batch");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111b21] rounded-lg max-w-md w-full p-6 border border-[#222d34]">
        <h2 className="text-[#e9edef] text-xl font-semibold mb-4">Add Batch</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-[#8696a0] text-sm mb-2">Batch Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-[#0b141a] border border-[#222d34] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884]"
              placeholder="e.g., 2024-2025"
            />
          </div>
          <div className="mb-4">
            <label className="block text-[#8696a0] text-sm mb-2">Year *</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-[#0b141a] border border-[#222d34] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884]"
              min="2000"
              max="2100"
            />
          </div>
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded text-[#8696a0] hover:bg-[#1e2a30]"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-[#00a884] text-[#0b141a] hover:bg-[#00a884]/90 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Batch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============= SECTION MODALS =============
interface AddSectionModalProps extends ModalProps {
  onSubmit: (name: string) => Promise<void>;
}

export function AddSectionModal({ open, onClose, onSubmit }: AddSectionModalProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Section name is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onSubmit(name.trim());
      setName("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to add section");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111b21] rounded-lg max-w-md w-full p-6 border border-[#222d34]">
        <h2 className="text-[#e9edef] text-xl font-semibold mb-4">Add Section</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-[#8696a0] text-sm mb-2">Section Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-[#0b141a] border border-[#222d34] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884]"
              placeholder="e.g., Section A"
            />
          </div>
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded text-[#8696a0] hover:bg-[#1e2a30]"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-[#00a884] text-[#0b141a] hover:bg-[#00a884]/90 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Section"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============= SUBJECT MODALS =============
interface AddSubjectModalProps extends ModalProps {
  onSubmit: (name: string) => Promise<void>;
}

export function AddSubjectModal({ open, onClose, onSubmit }: AddSubjectModalProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Subject name is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onSubmit(name.trim());
      setName("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to add subject");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111b21] rounded-lg max-w-md w-full p-6 border border-[#222d34]">
        <h2 className="text-[#e9edef] text-xl font-semibold mb-4">Add Subject</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-[#8696a0] text-sm mb-2">Subject Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-[#0b141a] border border-[#222d34] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884]"
              placeholder="e.g., Mathematics"
            />
          </div>
          <p className="text-[#8696a0] text-xs mb-4">
            A course code will be automatically generated for students to join this subject.
          </p>
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded text-[#8696a0] hover:bg-[#1e2a30]"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-[#00a884] text-[#0b141a] hover:bg-[#00a884]/90 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Subject"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
