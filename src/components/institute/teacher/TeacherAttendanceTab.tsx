"use client";

import { useState, useEffect } from "react";
import { InstituteAPI } from "@/lib/api/institute";
import { Calendar, FileText } from "lucide-react";
import AttendanceReportModal from "./AttendanceReportModal";

interface TeacherAttendanceTabProps {
  courseId: string;
  students: any[];
  instituteId: string;
  currentUserId?: string;
  subjectId?: string;
  onRefresh: () => void;
  subjectName?: string;
}

export default function TeacherAttendanceTab({
  courseId,
  students,
  instituteId,
  currentUserId,
  subjectId,
  onRefresh,
  subjectName,
}: TeacherAttendanceTabProps) {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [attendanceRecords, setAttendanceRecords] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Fetch attendance for selected date
  useEffect(() => {
    if (subjectId && selectedDate) {
      fetchAttendanceForDate();
    }
  }, [subjectId, selectedDate]);

  const fetchAttendanceForDate = async () => {
    try {
      setLoading(true);
      const response = await InstituteAPI.getAttendanceByDate(
        instituteId,
        subjectId!,
        selectedDate
      );
      
      const recordsMap = new Map<string, string>();
      response.forEach((record: any) => {
        recordsMap.set(record.student_id, record.status);
      });
      setAttendanceRecords(recordsMap);
    } catch (error) {
      console.error("Failed to fetch attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = (studentId: string, status: string) => {
    setAttendanceRecords((prev) => {
      const newMap = new Map(prev);
      newMap.set(studentId, status);
      return newMap;
    });
  };

  const handleSaveAttendance = async () => {
    try {
      setSaving(true);
      
      const attendanceData = students.map((student) => ({
        student_id: student.user_id,
        status: attendanceRecords.get(student.user_id) || "absent",
        attendance_date: selectedDate,
        subject_id: subjectId,
        institute_id: instituteId,
        teacher_id: currentUserId,
      }));

      await InstituteAPI.saveAttendance(attendanceData);
      
      alert("Attendance saved successfully!");
      onRefresh();
    } catch (error: any) {
      console.error("Failed to save attendance:", error);
      alert(error.response?.data?.message || "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const calculateStats = () => {
    let present = 0;
    let absent = 0;

    students.forEach((student) => {
      const status = attendanceRecords.get(student.user_id);
      if (status === "present") present++;
      else if (status === "absent") absent++;
    });

    return { present, absent, total: students.length };
  };

  const stats = calculateStats();

  if (!subjectId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[#8696a0]">Please select a course</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#e9edef]">Attendance</h2>
          <p className="text-sm text-[#8696a0] mt-1">
            Mark attendance for your students
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Monthly Report Button */}
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#2a3942] text-[#e9edef] rounded-lg font-medium hover:bg-[#374a56] transition-colors"
          >
            <FileText className="w-4 h-4" />
            Monthly Report
          </button>

          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-[#202c33] rounded-lg px-4 py-2">
            <Calendar className="w-4 h-4 text-[#8696a0]" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="bg-transparent text-[#e9edef] text-sm outline-none"
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveAttendance}
            disabled={saving || loading}
            className="px-4 py-2 bg-[#00a884] text-[#0b141a] rounded-lg font-medium hover:bg-[#00a884]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "Saving..." : "Save Attendance"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#202c33] rounded-lg p-4">
          <p className="text-[#8696a0] text-sm">Total Students</p>
          <p className="text-2xl font-semibold text-[#e9edef] mt-1">
            {stats.total}
          </p>
        </div>
        <div className="bg-[#202c33] rounded-lg p-4">
          <p className="text-[#8696a0] text-sm">Present</p>
          <p className="text-2xl font-semibold text-green-400 mt-1">
            {stats.present}
          </p>
        </div>
        <div className="bg-[#202c33] rounded-lg p-4">
          <p className="text-[#8696a0] text-sm">Absent</p>
          <p className="text-2xl font-semibold text-red-400 mt-1">
            {stats.absent}
          </p>
        </div>
      </div>

      {/* Attendance List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-[#8696a0]">Loading...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-[#8696a0]">No students enrolled in this course</p>
        </div>
      ) : (
        <div className="bg-[#202c33] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#111b21] border-b border-[#2a3942]">
              <tr>
                <th className="text-left px-6 py-3 text-[#8696a0] text-sm font-medium">
                  Student Name
                </th>
                <th className="text-left px-6 py-3 text-[#8696a0] text-sm font-medium">
                  Email
                </th>
                <th className="text-center px-6 py-3 text-[#8696a0] text-sm font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => {
                const status = attendanceRecords.get(student.user_id) || "";
                
                return (
                  <tr
                    key={student.user_id}
                    className={`border-b border-[#2a3942] ${
                      index % 2 === 0 ? "bg-[#202c33]" : "bg-[#1a252d]"
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center text-[#0b141a] font-semibold">
                          {student.user?.display_name?.[0]?.toUpperCase() || "S"}
                        </div>
                        <span className="text-[#e9edef] font-medium">
                          {student.user?.display_name || "Student"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#8696a0]">
                      {student.user?.email || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-4">
                        <button
                          onClick={() =>
                            handleAttendanceChange(student.user_id, "present")
                          }
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            status === "present"
                              ? "bg-green-500 text-white"
                              : "bg-[#2a3942] text-[#8696a0] hover:bg-[#374a56]"
                          }`}
                        >
                          Present
                        </button>
                        <button
                          onClick={() =>
                            handleAttendanceChange(student.user_id, "absent")
                          }
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            status === "absent"
                              ? "bg-red-500 text-white"
                              : "bg-[#2a3942] text-[#8696a0] hover:bg-[#374a56]"
                          }`}
                        >
                          Absent
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Monthly Report Modal */}
      <AttendanceReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        instituteId={instituteId}
        subjectId={subjectId!}
        subjectName={subjectName}
        students={students}
      />
    </div>
  );
}
