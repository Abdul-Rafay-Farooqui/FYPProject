"use client";

import { useState, useEffect } from "react";
import { X, Download, Calendar } from "lucide-react";
import { InstituteAPI } from "@/lib/api/institute";
import * as XLSX from "xlsx";

interface AttendanceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  instituteId: string;
  subjectId: string;
  subjectName?: string;
  students: any[];
}

export default function AttendanceReportModal({
  isOpen,
  onClose,
  instituteId,
  subjectId,
  subjectName,
  students,
}: AttendanceReportModalProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // YYYY-MM format
  );
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [monthlyStats, setMonthlyStats] = useState<any>({});

  useEffect(() => {
    if (isOpen && subjectId && selectedMonth) {
      fetchMonthlyAttendance();
    }
  }, [isOpen, subjectId, selectedMonth]);

  const fetchMonthlyAttendance = async () => {
    try {
      setLoading(true);
      const response = await InstituteAPI.getMonthlyAttendance(
        instituteId,
        subjectId,
        selectedMonth
      );
      setAttendanceData(response);
      calculateMonthlyStats(response);
    } catch (error) {
      console.error("Failed to fetch monthly attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyStats = (data: any[]) => {
    const stats: any = {};
    
    students.forEach((student) => {
      const studentRecords = data.filter(
        (record) => record.student_id === student.user_id
      );
      
      const present = studentRecords.filter((r) => r.status === "present").length;
      const absent = studentRecords.filter((r) => r.status === "absent").length;
      const total = studentRecords.length;
      const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : "0";

      stats[student.user_id] = {
        present,
        absent,
        total,
        percentage,
      };
    });

    setMonthlyStats(stats);
  };

  const getDaysInMonth = (yearMonth: string) => {
    const [year, month] = yearMonth.split("-").map(Number);
    return new Date(year, month, 0).getDate();
  };

  const getAttendanceForDate = (studentId: string, date: string) => {
    const record = attendanceData.find(
      (r) => r.student_id === studentId && r.attendance_date === date
    );
    return record?.status || "";
  };

  const downloadExcel = () => {
    const [year, month] = selectedMonth.split("-");
    const daysInMonth = getDaysInMonth(selectedMonth);
    
    // Create header row with dates
    const dates = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      return `${year}-${month}-${day.toString().padStart(2, "0")}`;
    });

    const headers = [
      "Student Name",
      "Email",
      ...dates,
      "Total Present",
      "Total Absent",
      "Total Days",
      "Attendance %",
    ];

    // Create data rows
    const rows = students.map((student) => {
      const stats = monthlyStats[student.user_id] || {
        present: 0,
        absent: 0,
        total: 0,
        percentage: "0",
      };

      const attendanceByDate = dates.map((date) => {
        const status = getAttendanceForDate(student.user_id, date);
        if (status === "present") return "P";
        if (status === "absent") return "A";
        return "-";
      });

      return [
        student.user?.display_name || "N/A",
        student.user?.email || "N/A",
        ...attendanceByDate,
        stats.present,
        stats.absent,
        stats.total,
        `${stats.percentage}%`,
      ];
    });

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    // Set column widths
    const colWidths = [
      { wch: 20 }, // Student Name
      { wch: 25 }, // Email
      ...dates.map(() => ({ wch: 5 })), // Date columns
      { wch: 12 }, // Total Present
      { wch: 12 }, // Total Absent
      { wch: 12 }, // Total Days
      { wch: 15 }, // Attendance %
    ];
    worksheet["!cols"] = colWidths;

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      `Attendance ${selectedMonth}`
    );

    // Download file
    const fileName = `${subjectName || "Course"}_Attendance_${selectedMonth}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  if (!isOpen) return null;

  const [year, month] = selectedMonth.split("-");
  const monthName = new Date(selectedMonth).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#202c33] rounded-lg w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2a3942]">
          <div>
            <h2 className="text-xl font-semibold text-[#e9edef]">
              Monthly Attendance Report
            </h2>
            <p className="text-sm text-[#8696a0] mt-1">
              {subjectName || "Course"} - {monthName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#8696a0] hover:text-[#e9edef] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-[#2a3942] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#8696a0]" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              max={new Date().toISOString().slice(0, 7)}
              className="bg-[#2a3942] text-[#e9edef] px-4 py-2 rounded-lg outline-none"
            />
          </div>

          <button
            onClick={downloadExcel}
            disabled={loading || students.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-[#00a884] text-[#0b141a] rounded-lg font-medium hover:bg-[#00a884]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Excel
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-[#8696a0]">Loading...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-[#8696a0]">No students enrolled</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#111b21] sticky top-0 z-10">
                  <tr>
                    <th className="text-left px-4 py-3 text-[#8696a0] text-sm font-medium">
                      Student Name
                    </th>
                    <th className="text-center px-4 py-3 text-[#8696a0] text-sm font-medium">
                      Total Present
                    </th>
                    <th className="text-center px-4 py-3 text-[#8696a0] text-sm font-medium">
                      Total Absent
                    </th>
                    <th className="text-center px-4 py-3 text-[#8696a0] text-sm font-medium">
                      Total Days
                    </th>
                    <th className="text-center px-4 py-3 text-[#8696a0] text-sm font-medium">
                      Attendance %
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => {
                    const stats = monthlyStats[student.user_id] || {
                      present: 0,
                      absent: 0,
                      total: 0,
                      percentage: "0",
                    };

                    const percentage = parseFloat(stats.percentage);
                    const percentageColor =
                      percentage >= 75
                        ? "text-green-400"
                        : percentage >= 50
                        ? "text-yellow-400"
                        : "text-red-400";

                    return (
                      <tr
                        key={student.user_id}
                        className={`border-b border-[#2a3942] ${
                          index % 2 === 0 ? "bg-[#202c33]" : "bg-[#1a252d]"
                        }`}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center text-[#0b141a] font-semibold">
                              {student.user?.display_name?.[0]?.toUpperCase() || "S"}
                            </div>
                            <div>
                              <p className="text-[#e9edef] font-medium">
                                {student.user?.display_name || "Student"}
                              </p>
                              <p className="text-[#8696a0] text-sm">
                                {student.user?.email || "N/A"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center text-green-400 font-semibold">
                          {stats.present}
                        </td>
                        <td className="px-4 py-4 text-center text-red-400 font-semibold">
                          {stats.absent}
                        </td>
                        <td className="px-4 py-4 text-center text-[#e9edef] font-semibold">
                          {stats.total}
                        </td>
                        <td
                          className={`px-4 py-4 text-center font-semibold ${percentageColor}`}
                        >
                          {stats.percentage}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#2a3942] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#2a3942] text-[#e9edef] rounded-lg font-medium hover:bg-[#374a56] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
