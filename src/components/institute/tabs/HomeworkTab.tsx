"use client";

import { useState } from "react";
import { InstituteAPI } from "@/lib/api/institute";
import { AddHomeworkModal } from "../InstituteComplexModals";

export default function HomeworkTab({
  homework,
  instituteId,
  isAdmin,
  currentUserId,
  classBatchSections,
  subjects,
  onRefresh,
}: any) {
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAddHomework = async (data: any) => {
    await InstituteAPI.createHomework({
      ...data,
      teacher_id: currentUserId,
    });
    onRefresh();
  };

  const handleDeleteHomework = async (homeworkId: string) => {
    if (confirm("Are you sure you want to delete this homework?")) {
      await InstituteAPI.deleteHomework(homeworkId);
      onRefresh();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[#e9edef] text-2xl font-semibold">Homework</h2>
        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded bg-[#00a884] text-[#0b141a] hover:bg-[#00a884]/90"
          >
            + Assign Homework
          </button>
        )}
      </div>
      {homework.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#1e2a30] flex items-center justify-center">
            <svg className="w-10 h-10 text-[#8696a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <p className="text-[#8696a0]">No homework assigned yet</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {homework.map((hw: any) => (
            <div key={hw.id} className="bg-[#111b21] rounded-lg p-4 border border-[#222d34]">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-[#e9edef] font-medium">{hw.title}</h3>
                  {hw.description && (
                    <p className="text-[#8696a0] text-sm mt-1">{hw.description}</p>
                  )}
                  <div className="flex gap-4 mt-2 text-xs text-[#8696a0]">
                    {hw.subject && <span>Subject: {hw.subject.name}</span>}
                    {hw.due_date && (
                      <span>Due: {new Date(hw.due_date).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleDeleteHomework(hw.id)}
                    className="text-red-400 hover:text-red-300 p-2"
                    title="Delete homework"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AddHomeworkModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddHomework}
        classBatchSections={classBatchSections}
        subjects={subjects}
        currentUserId={currentUserId}
      />
    </div>
  );
}
