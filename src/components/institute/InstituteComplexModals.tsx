"use client";

import { useState } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
}

// ============= HOMEWORK MODALS =============
interface AddHomeworkModalProps extends ModalProps {
  onSubmit: (data: {
    title: string;
    description: string;
    due_date: string;
    class_batch_section_id: string;
    subject_id: string;
  }) => Promise<void>;
  classBatchSections: any[];
  subjects: any[];
  currentUserId: string;
}

export function AddHomeworkModal({
  open,
  onClose,
  onSubmit,
  classBatchSections,
  subjects,
  currentUserId,
}: AddHomeworkModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [cbsId, setCbsId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !cbsId) {
      setError("Title and class are required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        due_date: dueDate,
        class_batch_section_id: cbsId,
        subject_id: subjectId,
      });
      setTitle("");
      setDescription("");
      setDueDate("");
      setCbsId("");
      setSubjectId("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to add homework");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const hasCBS = classBatchSections && classBatchSections.length > 0;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#111b21] rounded-lg max-w-md w-full p-6 border border-[#222d34] my-8">
        <h2 className="text-[#e9edef] text-xl font-semibold mb-4">Add Homework</h2>
        
        {!hasCBS ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1e2a30] flex items-center justify-center">
              <svg className="w-8 h-8 text-[#8696a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-[#e9edef] font-medium mb-2">No Class Combinations Found</p>
            <p className="text-[#8696a0] text-sm mb-4">
              You need to create class-batch-section combinations first.
            </p>
            <div className="text-left bg-[#0b141a] rounded p-4 mb-4">
              <p className="text-[#8696a0] text-xs mb-2">Steps to create combinations:</p>
              <ol className="text-[#8696a0] text-xs space-y-1 list-decimal list-inside">
                <li>Create at least one Class (e.g., "Grade 10")</li>
                <li>Create at least one Batch (e.g., "2024-2025")</li>
                <li>Create at least one Section (e.g., "Section A")</li>
                <li>Then you can assign homework to specific class combinations</li>
              </ol>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded bg-[#00a884] text-[#0b141a] hover:bg-[#00a884]/90"
            >
              Got it
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-[#8696a0] text-sm mb-2">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-[#0b141a] border border-[#222d34] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884]"
              placeholder="Homework title"
            />
          </div>
          <div className="mb-4">
            <label className="block text-[#8696a0] text-sm mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-[#0b141a] border border-[#222d34] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884] resize-none"
              rows={3}
              placeholder="Homework description"
            />
          </div>
          <div className="mb-4">
            <label className="block text-[#8696a0] text-sm mb-2">Class *</label>
            <select
              value={cbsId}
              onChange={(e) => setCbsId(e.target.value)}
              className="w-full px-3 py-2 bg-[#0b141a] border border-[#222d34] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884]"
            >
              <option value="">Select class</option>
              {classBatchSections.map((cbs: any) => (
                <option key={cbs.id} value={cbs.id}>
                  {[cbs.batch?.name, cbs.section?.name].filter(Boolean).join(' · ')}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-[#8696a0] text-sm mb-2">Subject</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full px-3 py-2 bg-[#0b141a] border border-[#222d34] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884]"
            >
              <option value="">Select subject (optional)</option>
              {subjects.map((subject: any) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} {subject.code ? `(${subject.code})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-[#8696a0] text-sm mb-2">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 bg-[#0b141a] border border-[#222d34] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884]"
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
              {loading ? "Adding..." : "Add Homework"}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}

// ============= SCHEDULE MODALS =============
interface AddScheduleModalProps extends ModalProps {
  onSubmit: (data: {
    class_batch_section_id: string;
    subject_id: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    teacher_id: string;
  }) => Promise<void>;
  classBatchSections: any[];
  subjects: any[];
  teachers?: any[];
  subjectAssignments?: any[];
  currentUserId: string;
}

export function AddScheduleModal({
  open,
  onClose,
  onSubmit,
  classBatchSections,
  subjects,
  teachers,
  subjectAssignments,
  currentUserId,
}: AddScheduleModalProps) {
  const [cbsId, setCbsId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubjectChange = (selectedSubjectId: string) => {
    setSubjectId(selectedSubjectId);
    // Auto-populate teacher from subject assignment
    if (selectedSubjectId && subjectAssignments) {
      const assignment = subjectAssignments.find(
        (a: any) => a.subject_id === selectedSubjectId
      );
      if (assignment) {
        setTeacherId(assignment.teacher_id);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cbsId || !dayOfWeek || !startTime || !endTime) {
      setError("All fields are required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onSubmit({
        class_batch_section_id: cbsId,
        subject_id: subjectId,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        teacher_id: teacherId || currentUserId,
      });
      setCbsId("");
      setSubjectId("");
      setTeacherId("");
      setDayOfWeek("");
      setStartTime("");
      setEndTime("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to add schedule");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const hasCBS = classBatchSections && classBatchSections.length > 0;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#111b21] rounded-lg max-w-md w-full p-6 border border-[#222d34] my-8">
        <h2 className="text-[#e9edef] text-xl font-semibold mb-4">Add Schedule</h2>
        
        {!hasCBS ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1e2a30] flex items-center justify-center">
              <svg className="w-8 h-8 text-[#8696a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-[#e9edef] font-medium mb-2">No Class Combinations Found</p>
            <p className="text-[#8696a0] text-sm mb-4">
              Create classes, batches, and sections first to add schedules.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded bg-[#00a884] text-[#0b141a] hover:bg-[#00a884]/90"
            >
              Got it
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-[#8696a0] text-sm mb-2">
              Teacher
              {teacherId && subjectId && subjectAssignments?.find((a: any) => a.subject_id === subjectId)?.teacher_id === teacherId && (
                <span className="ml-2 text-[#00a884] text-xs">(auto-filled from subject)</span>
              )}
            </label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="w-full px-3 py-2 bg-[#0b141a] border border-[#222d34] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884]"
            >
              <option value="">Select teacher (optional)</option>
              {teachers && teachers.map((t: any) => (
                <option key={t.user_id || t.id} value={t.user_id || t.id}>
                  {t.user?.display_name || t.user?.name || t.name || t.email}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-[#8696a0] text-sm mb-2">Class *</label>
            <select
              value={cbsId}
              onChange={(e) => setCbsId(e.target.value)}
              className="w-full px-3 py-2 bg-[#0b141a] border border-[#222d34] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884]"
            >
              <option value="">Select class</option>
              {classBatchSections.map((cbs: any) => (
                <option key={cbs.id} value={cbs.id}>
                  {[cbs.batch?.name, cbs.section?.name].filter(Boolean).join(' · ')}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-[#8696a0] text-sm mb-2">Subject</label>
            <select
              value={subjectId}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="w-full px-3 py-2 bg-[#0b141a] border border-[#222d34] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884]"
            >
              <option value="">Select subject (optional)</option>
              {subjects.map((subject: any) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} {subject.code ? `(${subject.code})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-[#8696a0] text-sm mb-2">Day of Week *</label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value)}
              className="w-full px-3 py-2 bg-[#0b141a] border border-[#222d34] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884]"
            >
              <option value="">Select day</option>
              {daysOfWeek.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#8696a0] text-sm mb-2">Start Time *</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-[#0b141a] border border-[#222d34] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884]"
              />
            </div>
            <div>
              <label className="block text-[#8696a0] text-sm mb-2">End Time *</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 bg-[#0b141a] border border-[#222d34] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884]"
              />
            </div>
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
              {loading ? "Adding..." : "Add Schedule"}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}

// ============= ANNOUNCEMENT MODALS =============
interface AddAnnouncementModalProps extends ModalProps {
  onSubmit: (data: {
    title: string;
    content: string;
    class_batch_section_id?: string;
    announcement_type: string;
    institute_id: string;
  }) => Promise<void>;
  classBatchSections: any[];
  currentUserId: string;
  instituteId: string;
  isAdmin?: boolean;
}

export function AddAnnouncementModal({
  open,
  onClose,
  onSubmit,
  classBatchSections,
  currentUserId,
  instituteId,
  isAdmin = true,
}: AddAnnouncementModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [cbsId, setCbsId] = useState("");
  const [announcementType, setAnnouncementType] = useState("general");
  const [announceToAll, setAnnounceToAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required");
      return;
    }
    // For teachers, announcements are course-specific (no class selection needed)
    // For admins, require either "Announce to All" or a class selection
    if (isAdmin && !announceToAll && !cbsId) {
      setError("Please select a class or choose 'Announce to All'");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload: any = {
        title: title.trim(),
        content: content.trim(),
        announcement_type: announcementType,
        institute_id: instituteId,
      };
      
      // Only add class_batch_section_id if it has a value
      if (!announceToAll && cbsId) {
        payload.class_batch_section_id = cbsId;
      }
      
      await onSubmit(payload);
      setTitle("");
      setContent("");
      setCbsId("");
      setAnnouncementType("general");
      setAnnounceToAll(false);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to add announcement");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const hasCBS = classBatchSections && classBatchSections.length > 0;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#111b21] rounded-lg max-w-md w-full p-6 border border-[#222d34] my-8">
        <h2 className="text-[#e9edef] text-xl font-semibold mb-4">Add Announcement</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-[#8696a0] text-sm mb-2">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-[#0b141a] border border-[#222d34] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884]"
              placeholder="Announcement title"
            />
          </div>
          <div className="mb-4">
            <label className="block text-[#8696a0] text-sm mb-2">Content *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 bg-[#0b141a] border border-[#222d34] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884] resize-none"
              rows={4}
              placeholder="Announcement content"
            />
          </div>
          
          {isAdmin && (
            <>
              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={announceToAll}
                    onChange={(e) => {
                      setAnnounceToAll(e.target.checked);
                      if (e.target.checked) setCbsId("");
                    }}
                    className="w-4 h-4 rounded border-[#222d34] text-[#00a884] focus:ring-[#00a884]"
                  />
                  <span className="text-[#e9edef] text-sm font-medium">Announce to All Institute</span>
                </label>
                <p className="text-[#8696a0] text-xs mt-1 ml-6">
                  This will send the announcement to everyone in the institute
                </p>
              </div>

              {!announceToAll && (
                <div className="mb-4">
                  <label className="block text-[#8696a0] text-sm mb-2">Class *</label>
                  <select
                    value={cbsId}
                    onChange={(e) => setCbsId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0b141a] border border-[#222d34] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884]"
                    disabled={!hasCBS}
                  >
                    <option value="">Select class</option>
                    {classBatchSections.map((cbs: any) => (
                      <option key={cbs.id} value={cbs.id}>
                        {[cbs.batch?.name, cbs.section?.name].filter(Boolean).join(' · ')}
                      </option>
                    ))}
                  </select>
                  {!hasCBS && (
                    <p className="text-[#8696a0] text-xs mt-1">
                      No class combinations available. Create classes, batches, and sections first.
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {!isAdmin && (
            <div className="mb-4 p-3 bg-[#0b141a] rounded border border-[#222d34]">
              <p className="text-[#8696a0] text-sm">
                This announcement will be visible to all students enrolled in your course.
              </p>
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-[#8696a0] text-sm mb-2">Type *</label>
            <select
              value={announcementType}
              onChange={(e) => setAnnouncementType(e.target.value)}
              className="w-full px-3 py-2 bg-[#0b141a] border border-[#222d34] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884]"
            >
              <option value="general">General</option>
              <option value="urgent">Urgent</option>
              <option value="event">Event</option>
              <option value="holiday">Holiday</option>
            </select>
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
              {loading ? "Adding..." : "Add Announcement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
