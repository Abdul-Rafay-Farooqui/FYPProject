'use client';

import { useState, useEffect, useMemo } from 'react';
import { Clock, LogIn, LogOut, Calendar, Download, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import * as XLSX from 'xlsx';

interface AttendanceRecord {
  id: string;
  user_id: string;
  name: string;
  avatar?: string | null;
  date: string;
  sign_in_at: string | null;
  sign_out_at: string | null;
  status: 'present' | 'absent' | 'leave' | 'late' | 'active';
  work_minutes: number;
  hours: string;
}

interface AttendanceTabProps {
  attendance?: AttendanceRecord[];
  currentUserId?: string;
  isAdmin?: boolean;
  onClockIn?: () => Promise<void>;
  onClockOut?: () => Promise<void>;
  onFetchHistory?: (startDate: string, endDate: string) => Promise<void>;
}

const STATUS_COLORS: Record<string, string> = {
  present: 'text-[#00a884] bg-[#00a884]/10',
  active: 'text-blue-400 bg-blue-400/10',
  absent: 'text-red-400 bg-red-400/10',
  leave: 'text-yellow-400 bg-yellow-400/10',
  late: 'text-orange-400 bg-orange-400/10',
};

const AttendanceTab = ({
  attendance = [],
  currentUserId,
  isAdmin,
  onClockIn,
  onClockOut,
  onFetchHistory,
}: AttendanceTabProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [clockingIn, setClockinIn] = useState(false);
  const [clockingOut, setClockingOut] = useState(false);
  const [viewMode, setViewMode] = useState<'today' | 'history'>('today');
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [liveDuration, setLiveDuration] = useState<string>('0h 0m');

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Get today's date string
  const todayStr = useMemo(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }, []);

  // Find current user's today attendance
  const myTodayAttendance = useMemo(() => {
    return attendance.find(a => a.user_id === currentUserId && a.date === todayStr);
  }, [attendance, currentUserId, todayStr]);

  const isClockedIn = myTodayAttendance?.status === 'active';
  const canClockOut = isClockedIn && myTodayAttendance?.sign_in_at;

  // Update live duration every second when clocked in
  useEffect(() => {
    if (isClockedIn && myTodayAttendance?.sign_in_at) {
      const updateDuration = () => {
        const duration = calculateDuration(myTodayAttendance.sign_in_at, null, true); // Include seconds for live
        setLiveDuration(duration);
      };
      updateDuration(); // Initial update
      const timer = setInterval(updateDuration, 1000);
      return () => clearInterval(timer);
    } else if (myTodayAttendance?.sign_in_at && myTodayAttendance?.sign_out_at) {
      // If clocked out, show final duration without seconds
      setLiveDuration(calculateDuration(myTodayAttendance.sign_in_at, myTodayAttendance.sign_out_at, false));
    } else {
      setLiveDuration('0h 0m 0s');
    }
  }, [isClockedIn, myTodayAttendance]);

  // Group attendance by user for history view
  const attendanceByUser = useMemo(() => {
    const grouped = new Map<string, AttendanceRecord[]>();
    attendance.forEach(record => {
      const existing = grouped.get(record.user_id) || [];
      existing.push(record);
      grouped.set(record.user_id, existing);
    });
    return grouped;
  }, [attendance]);

  // Filter attendance for today view
  const todayAttendance = useMemo(() => {
    let filtered = attendance.filter(a => a.date === todayStr);
    if (filterStatus !== 'all') {
      filtered = filtered.filter(a => a.status === filterStatus);
    }
    return filtered.sort((a, b) => {
      // Sort: active first, then by sign-in time
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      if (a.sign_in_at && b.sign_in_at) {
        return new Date(a.sign_in_at).getTime() - new Date(b.sign_in_at).getTime();
      }
      return 0;
    });
  }, [attendance, todayStr, filterStatus]);

  const handleClockIn = async () => {
    if (!onClockIn) return;
    setClockinIn(true);
    try {
      await onClockIn();
    } finally {
      setClockinIn(false);
    }
  };

  const handleClockOut = async () => {
    if (!onClockOut) return;
    setClockingOut(true);
    try {
      await onClockOut();
    } finally {
      setClockingOut(false);
    }
  };

  const toggleUserExpanded = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const calculateDuration = (signIn: string | null, signOut: string | null, includeSeconds = false) => {
    if (!signIn) return '0h 0m';
    const start = new Date(signIn);
    const end = signOut ? new Date(signOut) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    if (includeSeconds) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    return `${hours}h ${minutes}m`;
  };

  const Spinner = () => (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );

  const exportToExcel = () => {
    if (viewMode === 'today') {
      // Export today's attendance
      const exportData = todayAttendance.map(record => ({
        'Name': record.name,
        'Date': record.date,
        'Clock In': formatTime(record.sign_in_at),
        'Clock Out': formatTime(record.sign_out_at),
        'Duration': calculateDuration(record.sign_in_at, record.sign_out_at),
        'Status': record.status.charAt(0).toUpperCase() + record.status.slice(1),
        'Total Hours': record.hours,
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Today Attendance');

      // Auto-size columns
      const maxWidth = exportData.reduce((w, r) => Math.max(w, r.Name.length), 10);
      worksheet['!cols'] = [
        { wch: maxWidth },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 10 },
        { wch: 12 },
      ];

      XLSX.writeFile(workbook, `Attendance_${todayStr}.xlsx`);
    } else {
      // Export full history
      const exportData: any[] = [];
      
      attendanceByUser.forEach((records, userId) => {
        records.forEach(record => {
          exportData.push({
            'Name': record.name,
            'Date': formatDate(record.date),
            'Clock In': formatTime(record.sign_in_at),
            'Clock Out': formatTime(record.sign_out_at),
            'Duration': calculateDuration(record.sign_in_at, record.sign_out_at),
            'Status': record.status.charAt(0).toUpperCase() + record.status.slice(1),
            'Total Hours': record.hours,
            'Work Minutes': record.work_minutes,
          });
        });
      });

      // Sort by date descending
      exportData.sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance History');

      // Auto-size columns
      worksheet['!cols'] = [
        { wch: 20 },
        { wch: 15 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 10 },
        { wch: 12 },
        { wch: 15 },
      ];

      XLSX.writeFile(workbook, `Attendance_History_${new Date().toISOString().split('T')[0]}.xlsx`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Time & User Status Card */}
      <div className="bg-gradient-to-br from-[#00a884]/10 to-[#111b21] border border-[#00a884]/30 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-5 h-5 text-[#00a884]" />
              <h3 className="text-[#e9edef] text-lg font-semibold">
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
              </h3>
            </div>
            <p className="text-[#8696a0] text-sm">
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          {/* Clock In/Out Buttons */}
          <div className="flex gap-2">
            {!isClockedIn ? (
              <button
                onClick={handleClockIn}
                disabled={clockingIn || !onClockIn}
                className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium bg-[#00a884] hover:bg-[#008069] text-[#0b141a] disabled:opacity-50 transition-all"
              >
                {clockingIn ? <Spinner /> : <LogIn className="w-4 h-4" />}
                Clock In
              </button>
            ) : (
              <button
                onClick={handleClockOut}
                disabled={clockingOut || !canClockOut || !onClockOut}
                className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 transition-all"
              >
                {clockingOut ? <Spinner /> : <LogOut className="w-4 h-4" />}
                Clock Out
              </button>
            )}
          </div>
        </div>

        {/* Current Session Info */}
        {myTodayAttendance && (
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#222d34]">
            <div>
              <p className="text-[#8696a0] text-xs mb-1">Clock In</p>
              <p className="text-[#e9edef] text-sm font-medium">
                {formatTime(myTodayAttendance.sign_in_at)}
              </p>
            </div>
            <div>
              <p className="text-[#8696a0] text-xs mb-1">Clock Out</p>
              <p className="text-[#e9edef] text-sm font-medium">
                {formatTime(myTodayAttendance.sign_out_at)}
              </p>
            </div>
            <div>
              <p className="text-[#8696a0] text-xs mb-1">
                {isClockedIn ? 'Duration (Live)' : 'Total Duration'}
              </p>
              <p className={`text-sm font-medium ${isClockedIn ? 'text-[#00a884] animate-pulse' : 'text-[#00a884]'}`}>
                {liveDuration}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* View Toggle & Filters */}
      <div className="flex items-center justify-between">
        <div className="flex bg-[#111b21] border border-[#222d34] rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('today')}
            className={`px-4 py-2 text-sm font-medium transition-all ${
              viewMode === 'today'
                ? 'bg-[#00a884] text-[#0b141a]'
                : 'text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            Today
          </button>
          {isAdmin && (
            <button
              onClick={() => setViewMode('history')}
              className={`px-4 py-2 text-sm font-medium transition-all ${
                viewMode === 'history'
                  ? 'bg-[#00a884] text-[#0b141a]'
                  : 'text-[#8696a0] hover:text-[#e9edef]'
              }`}
            >
              History
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Dropdown */}
          {viewMode === 'today' && (
            <div className="relative">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-[#e9edef] bg-[#111b21] border border-[#222d34] hover:bg-[#202c33] transition-all"
              >
                <Filter className="w-4 h-4" />
                {filterStatus === 'all' ? 'All Status' : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
                <ChevronDown className="w-3 h-3" />
              </button>

              {showFilterMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-[#111b21] border border-[#222d34] rounded-lg shadow-lg z-10">
                  {['all', 'active', 'present', 'absent', 'late', 'leave'].map(status => (
                    <button
                      key={status}
                      onClick={() => {
                        setFilterStatus(status);
                        setShowFilterMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-[#e9edef] hover:bg-[#202c33] first:rounded-t-lg last:rounded-b-lg capitalize"
                    >
                      {status === 'all' ? 'All Status' : status}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Export Button - Admin Only */}
          {isAdmin && (
            <button 
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-[#e9edef] bg-[#111b21] border border-[#222d34] hover:bg-[#202c33] transition-all"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          )}
        </div>
      </div>

      {/* Today View */}
      {viewMode === 'today' && (
        <div className="space-y-2">
          {todayAttendance.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <div className="w-12 h-12 rounded-full bg-[#1e2a30] flex items-center justify-center">
                <Calendar className="w-6 h-6 text-[#8696a0]" />
              </div>
              <p className="text-[#8696a0] text-sm">No attendance records for today</p>
            </div>
          ) : (
            todayAttendance.map(record => (
              <div
                key={record.id}
                className="bg-[#111b21] border border-[#222d34] rounded-xl p-4 hover:border-[#2a3942] transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-[#00a884]/20 flex items-center justify-center flex-shrink-0">
                      {record.avatar ? (
                        <img src={record.avatar} alt={record.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-[#00a884] font-semibold text-sm">
                          {record.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* User Info */}
                    <div>
                      <p className="text-[#e9edef] text-sm font-medium">{record.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[#8696a0] text-xs">
                          In: {formatTime(record.sign_in_at)}
                        </span>
                        <span className="text-[#8696a0] text-xs">•</span>
                        <span className="text-[#8696a0] text-xs">
                          Out: {formatTime(record.sign_out_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status & Hours */}
                  <div className="text-right">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium capitalize ${STATUS_COLORS[record.status] || 'text-[#8696a0]'}`}>
                      {record.status}
                    </span>
                    <p className="text-[#8696a0] text-xs mt-1">
                      {calculateDuration(record.sign_in_at, record.sign_out_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* History View - Admin Only */}
      {viewMode === 'history' && isAdmin && (
        <div className="space-y-3">
          {Array.from(attendanceByUser.entries()).map(([userId, records]) => {
            const user = records[0];
            const isExpanded = expandedUsers.has(userId);
            const totalHours = records.reduce((sum, r) => sum + r.work_minutes, 0) / 60;
            const presentDays = records.filter(r => r.status === 'present' || r.status === 'active').length;

            return (
              <div key={userId} className="bg-[#111b21] border border-[#222d34] rounded-xl overflow-hidden">
                {/* User Summary Header */}
                <button
                  onClick={() => toggleUserExpanded(userId)}
                  className="w-full p-4 flex items-center justify-between hover:bg-[#1a2730] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#00a884]/20 flex items-center justify-center">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-[#00a884] font-semibold text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-[#e9edef] text-sm font-medium">{user.name}</p>
                      <p className="text-[#8696a0] text-xs">
                        {presentDays} days • {totalHours.toFixed(1)}h total
                      </p>
                    </div>
                  </div>

                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-[#8696a0]" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#8696a0]" />
                  )}
                </button>

                {/* Expanded Records */}
                {isExpanded && (
                  <div className="border-t border-[#222d34] p-4 space-y-2">
                    {records
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map(record => (
                        <div
                          key={record.id}
                          className="flex items-center justify-between p-3 bg-[#0b141a] rounded-lg"
                        >
                          <div>
                            <p className="text-[#e9edef] text-sm">{formatDate(record.date)}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[#8696a0] text-xs">
                                {formatTime(record.sign_in_at)} - {formatTime(record.sign_out_at)}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium capitalize ${STATUS_COLORS[record.status]}`}>
                              {record.status}
                            </span>
                            <p className="text-[#8696a0] text-xs mt-1">
                              {record.hours}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AttendanceTab;
