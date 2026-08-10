"use client";

import { useState } from "react";
import { InstituteAPI } from "@/lib/api/institute";

export default function TeacherResourcesTab({
  courseId,
  resources,
  onRefresh,
  instituteId,
  currentUserId,
  subjectId,
}: any) {
  const [showUploadModal, setShowUploadModal] = useState(false);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this resource?")) {
      await InstituteAPI.deleteResource(id);
      onRefresh();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[#e9edef] text-2xl font-semibold">Resources</h2>
        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2 rounded bg-[#00a884] text-[#0b141a] hover:bg-[#00a884]/90"
        >
          + Upload Resource
        </button>
      </div>

      {!courseId ? (
        <div className="text-center py-12">
          <p className="text-[#8696a0]">Please select a course</p>
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#1e2a30] flex items-center justify-center">
            <svg
              className="w-10 h-10 text-[#8696a0]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
          </div>
          <p className="text-[#8696a0]">No resources uploaded yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((resource: any) => (
            <div
              key={resource.id}
              className="bg-[#111b21] rounded-lg p-4 border border-[#222d34]"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-[#00a884]/20 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-[#00a884]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-[#e9edef] font-medium text-sm">
                      {resource.title}
                    </p>
                    <p className="text-[#8696a0] text-xs capitalize">
                      {resource.resource_type}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(resource.id)}
                  className="text-red-400 hover:text-red-300 p-1"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>

              {resource.description && (
                <p className="text-[#8696a0] text-sm mb-3">
                  {resource.description}
                </p>
              )}

              <a
                href={resource.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#00a884] text-sm hover:underline"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Download
              </a>
            </div>
          ))}
        </div>
      )}

      {showUploadModal && (
        <UploadResourceModal
          courseId={courseId}
          onClose={() => setShowUploadModal(false)}
          onRefresh={onRefresh}
          instituteId={instituteId}
          currentUserId={currentUserId}
          subjectId={subjectId}
        />
      )}
    </div>
  );
}

function UploadResourceModal({ 
  courseId, 
  onClose, 
  onRefresh,
  instituteId,
  currentUserId,
  subjectId,
}: any) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [resourceType, setResourceType] = useState("slides");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !selectedFile) {
      alert("Please fill required fields and select a file");
      return;
    }

    setLoading(true);
    try {
      // Upload file to media endpoint
      const formData = new FormData();
      formData.append("file", selectedFile);

      const uploadResponse = await fetch(
        "http://localhost:4000/api/media/upload",
        {
          method: "POST",
          body: formData,
        },
      );

      if (!uploadResponse.ok) {
        throw new Error("File upload failed");
      }

      const uploadData = await uploadResponse.json();

      // Create resource with uploaded file URL
      await InstituteAPI.uploadResource({
        title,
        description,
        resource_type: resourceType,
        file_url: uploadData.url,
        subject_assignment_id: courseId,
        institute_id: instituteId,
        teacher_id: currentUserId,
        subject_id: subjectId,
      });

      onRefresh();
      onClose();
    } catch (error) {
      console.error("Failed to upload resource:", error);
      alert("Failed to upload resource");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111b21] rounded-lg max-w-md w-full p-6 border border-[#222d34]">
        <h2 className="text-[#e9edef] text-xl font-semibold mb-4">
          Upload Resource
        </h2>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-[#8696a0] text-sm mb-2">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-[#0b141a] border border-[#222d34] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884]"
              placeholder="Resource title"
            />
          </div>

          <div>
            <label className="block text-[#8696a0] text-sm mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-[#0b141a] border border-[#222d34] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884] resize-none"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-[#8696a0] text-sm mb-2">Type</label>
            <select
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value)}
              className="w-full px-3 py-2 bg-[#0b141a] border border-[#222d34] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884]"
            >
              <option value="slides">Slides</option>
              <option value="document">Document</option>
              <option value="video">Video</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-[#8696a0] text-sm mb-2">File *</label>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive
                  ? "border-[#00a884] bg-[#00a884]/10"
                  : "border-[#222d34] bg-[#0b141a] hover:border-[#00a884]/50"
              }`}
            >
              <input
                type="file"
                onChange={handleFileInputChange}
                className="hidden"
                id="file-input"
                disabled={loading}
              />
              <label htmlFor="file-input" className="cursor-pointer">
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg
                      className="w-5 h-5 text-[#00a884]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-[#e9edef] text-sm">
                      {selectedFile.name}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <svg
                      className="w-8 h-8 text-[#8696a0] mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <div>
                      <p className="text-[#e9edef] text-sm font-medium">
                        Drag and drop your file here
                      </p>
                      <p className="text-[#8696a0] text-xs">
                        or click to select
                      </p>
                    </div>
                  </div>
                )}
              </label>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-[#8696a0] hover:bg-[#1e2a30]"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded bg-[#00a884] text-[#0b141a] hover:bg-[#00a884]/90 disabled:opacity-50"
            disabled={loading || !selectedFile}
          >
            {loading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}
