"use client";

import { useState } from "react";
import { InstituteAPI } from "@/lib/api/institute";
import { AddClassModal } from "../InstituteDataModals";

export default function ClassesTab({ classes, instituteId, isAdmin, onRefresh }: any) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  console.log('[ClassesTab] classes:', classes);
  console.log('[ClassesTab] instituteId:', instituteId);
  console.log('[ClassesTab] classes.length:', classes?.length);

  const handleAddClass = async (name: string, description: string) => {
    await InstituteAPI.createClass({ name, description, institute_id: instituteId });
    onRefresh();
  };

  const handleDeleteClass = async (classId: string) => {
    if (confirm("Are you sure you want to delete this class?")) {
      await InstituteAPI.deleteClass(classId);
      onRefresh();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-[#e9edef] text-2xl font-semibold">Classes</h2>
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="text-xs text-[#8696a0] hover:text-[#e9edef] px-2 py-1 rounded border border-[#222d34]"
          >
            {showDebug ? 'Hide' : 'Show'} Debug
          </button>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded bg-[#00a884] text-[#0b141a] hover:bg-[#00a884]/90"
          >
            + Add Class
          </button>
        )}
      </div>

      {showDebug && (
        <div className="mb-4 p-4 bg-[#111b21] rounded border border-[#222d34] text-xs">
          <p className="text-[#e9edef] font-semibold mb-2">Debug Info:</p>
          <p className="text-[#8696a0]">Institute ID: {instituteId}</p>
          <p className="text-[#8696a0]">Classes count: {classes?.length || 0}</p>
          <p className="text-[#8696a0]">Classes data: {JSON.stringify(classes, null, 2)}</p>
        </div>
      )}
      {classes.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#1e2a30] flex items-center justify-center">
            <svg className="w-10 h-10 text-[#8696a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-[#8696a0] mb-2">No classes yet</p>
          {isAdmin && (
            <p className="text-[#8696a0] text-sm">Click "Add Class" to create your first class</p>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {classes.map((cls: any) => (
            <div key={cls.id} className="bg-[#111b21] rounded-lg p-4 border border-[#222d34] flex items-start justify-between">
              <div>
                <h3 className="text-[#e9edef] font-medium">{cls.name}</h3>
                {cls.description && <p className="text-[#8696a0] text-sm mt-1">{cls.description}</p>}
              </div>
              {isAdmin && (
                <button
                  onClick={() => handleDeleteClass(cls.id)}
                  className="text-red-400 hover:text-red-300 p-2"
                  title="Delete class"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <AddClassModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddClass}
      />
    </div>
  );
}
