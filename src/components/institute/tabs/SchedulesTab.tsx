"use client";

import { useState } from "react";
import { InstituteAPI } from "@/lib/api/institute";
import { AddScheduleModal } from "../InstituteComplexModals";

export default function SchedulesTab({
  schedules,
  instituteId,
  isAdmin,
  currentUserId,
  classBatchSections,
  subjects,
  onRefresh,
}: any) {
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAddSchedule = async (data: any) => {
    await InstituteAPI.createSchedule({
      ...data,
      teacher_id: currentUserId,
    });
    onRefresh();
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (confirm("Are you sure you want to delete this schedule?")) {
      await InstituteAPI.deleteSchedule(scheduleId);
      onRefresh();
    }
  };

  const groupedSchedules = schedules.reduce((acc: any, schedule: any) => {
    const day = schedule.day_of_week;
    if (!acc[day]) acc[day] = [];
    acc[day].push(schedule);
    return acc;
  }, {});

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // Convert 24-hour time to 12-hour format with AM/PM
  const formatTime = (time: string) => {
    if (!time) return '';
    
    // Handle both HH:mm:ss and HH:mm formats
    const [hours, minutes] = time.split(':').map(Number);
    
    if (isNaN(hours) || isNaN(minutes)) return time;
    
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12; // Convert 0 to 12 for midnight
    const displayMinutes = minutes.toString().padStart(2, '0');
    
    return `${displayHours}:${displayMinutes} ${period}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-[#e9edef] text-lg md:text-2xl font-semibold">Schedules</h2>
        {isAdmin && (
          <button onClick={() => setShowAddModal(true)} className="px-3 py-1.5 rounded text-xs md:text-sm bg-[#00a884] text-[#0b141a] hover:bg-[#00a884]/90 whitespace-nowrap">+ Add Schedule</button>
        )}
      </div>
      {schedules.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#1e2a30] flex items-center justify-center">
            <svg className="w-10 h-10 text-[#8696a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-[#8696a0]">No schedules created yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {daysOfWeek.map((day) => {
            const daySchedules = groupedSchedules[day] || [];
            if (daySchedules.length === 0) return null;

            return (
              <div key={day} className="bg-[#111b21] rounded-lg p-4 border border-[#222d34]">
                <h3 className="text-[#e9edef] font-semibold mb-3">{day}</h3>
                <div className="space-y-2">
                  {daySchedules.map((schedule: any) => (
                    <div
                      key={schedule.id}
                      className="flex items-center justify-between bg-[#0b141a] rounded p-3"
                    >
                      <div>
                        <p className="text-[#e9edef] text-sm font-medium">
                          {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                        </p>
                        {schedule.subject && (
                          <p className="text-[#8696a0] text-xs mt-1">{schedule.subject.name}</p>
                        )}
                        {schedule.class_batch_section && (
                          <p className="text-[#8696a0] text-xs mt-1">
                            {schedule.class_batch_section.class?.name} - {schedule.class_batch_section.batch?.name} - {schedule.class_batch_section.section?.name}
                          </p>
                        )}
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          className="text-red-400 hover:text-red-300 p-1"
                          title="Delete schedule"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddScheduleModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddSchedule}
        classBatchSections={classBatchSections}
        subjects={subjects}
        currentUserId={currentUserId}
      />
    </div>
  );
}
