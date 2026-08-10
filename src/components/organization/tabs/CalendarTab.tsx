'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Clock, Users, MapPin, Calendar, Video } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  start_time: string;
  end_time?: string;
  location?: string;
  attendees?: string[];
  created_by?: string;
  type?: 'meeting' | 'event' | 'reminder' | 'deadline';
  meeting_id?: string;
  is_meeting?: boolean;
  meeting_status?: 'scheduled' | 'ongoing' | 'ended';
}

interface CalendarTabProps {
  events?: CalendarEvent[];
  meetings?: any[];
  teamMembers?: { id: string; name: string }[];
  currentUserId?: string;
  isAdmin?: boolean;
  onAdd?: (payload: {
    title: string;
    description?: string;
    date: string;
    start_time: string;
    end_time?: string;
    location?: string;
    attendee_ids?: string[];
    type?: string;
  }) => Promise<void>;
  onDelete?: (eventId: string) => Promise<void>;
  onJoinMeeting?: (meetingId: string) => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const EVENT_TYPES = [
  { value: 'meeting', label: 'Meeting', color: 'bg-blue-500' },
  { value: 'event', label: 'Event', color: 'bg-purple-500' },
  { value: 'reminder', label: 'Reminder', color: 'bg-yellow-500' },
  { value: 'deadline', label: 'Deadline', color: 'bg-red-500' },
];

const CalendarTab = ({
  events = [],
  meetings = [],
  teamMembers = [],
  currentUserId,
  isAdmin,
  onAdd,
  onDelete,
  onJoinMeeting,
}: CalendarTabProps) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [eventType, setEventType] = useState('meeting');
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [err, setErr] = useState('');

  const Spinner = () => (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );

  // Combine events and meetings for calendar display
  const allCalendarItems = useMemo(() => {
    const items = [...events];
    
    // Add meetings as calendar events
    meetings.forEach((meeting) => {
      if (meeting.starts_at) {
        const startDate = new Date(meeting.starts_at);
        const dateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
        const startTime = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;
        
        let endTime;
        if (meeting.ends_at) {
          const endDate = new Date(meeting.ends_at);
          endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
        }
        
        items.push({
          id: `meeting-${meeting.id}`,
          title: meeting.title,
          description: meeting.description,
          date: dateStr,
          start_time: startTime,
          end_time: endTime,
          type: 'meeting',
          is_meeting: true,
          meeting_id: meeting.id,
          meeting_status: meeting.status,
          attendees: meeting.attendee_ids,
        });
      }
    });
    
    return items;
  }, [events, meetings]);

  // Get days in month
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get first day of month (0 = Sunday)
  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days: (number | null)[] = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  }, [currentMonth, currentYear]);

  // Get events for a specific date
  const getEventsForDate = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return allCalendarItems.filter(e => e.date === dateStr);
  };

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    return allCalendarItems.filter(e => e.date === dateStr);
  }, [selectedDate, allCalendarItems]);

  // Get upcoming events (for agenda view)
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return allCalendarItems
      .filter(e => new Date(e.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 10);
  }, [allCalendarItems]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDayClick = (day: number) => {
    setSelectedDate(new Date(currentYear, currentMonth, day));
  };

  const handleAddEvent = () => {
    if (selectedDate) {
      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
      setEventDate(dateStr);
    } else {
      setEventDate('');
    }
    setShowEventModal(true);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setEventDate('');
    setStartTime('');
    setEndTime('');
    setLocation('');
    setEventType('meeting');
    setSelectedAttendees([]);
    setErr('');
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setErr('Title is required');
      return;
    }
    if (!eventDate) {
      setErr('Date is required');
      return;
    }
    if (!startTime) {
      setErr('Start time is required');
      return;
    }

    setSaving(true);
    setErr('');
    try {
      await onAdd?.({
        title: title.trim(),
        description: description.trim() || undefined,
        date: eventDate,
        start_time: startTime,
        end_time: endTime || undefined,
        location: location.trim() || undefined,
        attendee_ids: selectedAttendees.length > 0 ? selectedAttendees : undefined,
        type: eventType,
      });
      resetForm();
      setShowEventModal(false);
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || 'Failed to create event');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!onDelete) return;
    setDeletingId(eventId);
    try {
      await onDelete(eventId);
    } finally {
      setDeletingId(null);
    }
  };

  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getEventTypeColor = (type?: string) => {
    const eventType = EVENT_TYPES.find(t => t.value === type);
    return eventType?.color || 'bg-[#00a884]';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-lg hover:bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-[#e9edef] text-lg font-semibold min-w-[200px] text-center">
            {MONTHS[currentMonth]} {currentYear}
          </h2>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg hover:bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-[#111b21] border border-[#222d34] rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 text-xs font-medium transition-all ${
                viewMode === 'month'
                  ? 'bg-[#00a884] text-[#0b141a]'
                  : 'text-[#8696a0] hover:text-[#e9edef]'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 text-xs font-medium transition-all ${
                viewMode === 'agenda'
                  ? 'bg-[#00a884] text-[#0b141a]'
                  : 'text-[#8696a0] hover:text-[#e9edef]'
              }`}
            >
              Agenda
            </button>
          </div>

          <button
            onClick={handleAddEvent}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#00a884] hover:bg-[#008069] text-[#0b141a] transition-all"
          >
            <Plus className="w-4 h-4" /> New Event
          </button>
        </div>
      </div>

      {/* Legend - only show in month view */}
      {viewMode === 'month' && (
        <div className="flex items-center gap-4 px-4 py-2 bg-[#111b21] border border-[#222d34] rounded-lg">
          <span className="text-[#8696a0] text-xs font-medium">Event Types:</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-1 rounded-full bg-blue-500" />
            <span className="text-[#e9edef] text-xs">Meeting</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-1 rounded-full bg-purple-500" />
            <span className="text-[#e9edef] text-xs">Event</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-1 rounded-full bg-yellow-500" />
            <span className="text-[#e9edef] text-xs">Reminder</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-1 rounded-full bg-red-500" />
            <span className="text-[#e9edef] text-xs">Deadline</span>
          </div>
        </div>
      )}

      {viewMode === 'month' ? (
        <div className="grid grid-cols-[1fr_300px] gap-4">
          {/* Calendar Grid */}
          <div className="bg-[#111b21] border border-[#222d34] rounded-xl p-4">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {DAYS.map(day => (
                <div key={day} className="text-center text-[#8696a0] text-xs font-medium py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                const dayEvents = getEventsForDate(day);
                const isTodayDate = isToday(day);
                const isSelected = selectedDate?.getDate() === day &&
                  selectedDate?.getMonth() === currentMonth &&
                  selectedDate?.getFullYear() === currentYear;

                // Group events by type for color indicators
                const eventsByType = dayEvents.reduce((acc, event) => {
                  const type = event.type || 'meeting';
                  acc[type] = (acc[type] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>);

                const hasEvents = dayEvents.length > 0;

                return (
                  <button
                    key={day}
                    onClick={() => handleDayClick(day)}
                    className={`aspect-square rounded-lg p-1.5 text-sm transition-all relative flex flex-col items-center justify-start ${
                      isSelected
                        ? 'bg-[#00a884] text-[#0b141a] font-semibold ring-2 ring-[#00a884] ring-offset-2 ring-offset-[#111b21]'
                        : isTodayDate
                        ? 'bg-[#202c33] text-[#00a884] font-semibold ring-1 ring-[#00a884]'
                        : hasEvents
                        ? 'text-[#e9edef] hover:bg-[#202c33] font-medium'
                        : 'text-[#8696a0] hover:bg-[#202c33]'
                    }`}
                  >
                    <span className="block mb-auto">{day}</span>
                    
                    {/* Event indicators */}
                    {hasEvents && (
                      <div className="flex flex-col gap-0.5 w-full mt-1">
                        {/* Show colored bars for different event types */}
                        <div className="flex gap-0.5 justify-center">
                          {eventsByType.meeting && (
                            <div 
                              className={`h-1 rounded-full ${isSelected ? 'bg-blue-900' : 'bg-blue-500'}`}
                              style={{ width: `${Math.min(eventsByType.meeting * 8, 24)}px` }}
                              title={`${eventsByType.meeting} meeting${eventsByType.meeting > 1 ? 's' : ''}`}
                            />
                          )}
                          {eventsByType.event && (
                            <div 
                              className={`h-1 rounded-full ${isSelected ? 'bg-purple-900' : 'bg-purple-500'}`}
                              style={{ width: `${Math.min(eventsByType.event * 8, 24)}px` }}
                              title={`${eventsByType.event} event${eventsByType.event > 1 ? 's' : ''}`}
                            />
                          )}
                          {eventsByType.reminder && (
                            <div 
                              className={`h-1 rounded-full ${isSelected ? 'bg-yellow-900' : 'bg-yellow-500'}`}
                              style={{ width: `${Math.min(eventsByType.reminder * 8, 24)}px` }}
                              title={`${eventsByType.reminder} reminder${eventsByType.reminder > 1 ? 's' : ''}`}
                            />
                          )}
                          {eventsByType.deadline && (
                            <div 
                              className={`h-1 rounded-full ${isSelected ? 'bg-red-900' : 'bg-red-500'}`}
                              style={{ width: `${Math.min(eventsByType.deadline * 8, 24)}px` }}
                              title={`${eventsByType.deadline} deadline${eventsByType.deadline > 1 ? 's' : ''}`}
                            />
                          )}
                        </div>
                        
                        {/* Event count badge */}
                        {dayEvents.length > 0 && (
                          <div className={`text-[9px] font-bold text-center ${
                            isSelected ? 'text-[#0b141a]' : 'text-[#00a884]'
                          }`}>
                            {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Events */}
          <div className="bg-[#111b21] border border-[#222d34] rounded-xl p-4">
            <h3 className="text-[#e9edef] text-sm font-semibold mb-3 flex items-center justify-between">
              <span>
                {selectedDate
                  ? `${MONTHS[selectedDate.getMonth()]} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`
                  : 'Select a date'}
              </span>
              {selectedDate && selectedDateEvents.length > 0 && (
                <span className="text-xs text-[#8696a0] font-normal">
                  {selectedDateEvents.length} event{selectedDateEvents.length !== 1 ? 's' : ''}
                </span>
              )}
            </h3>

            {selectedDate && selectedDateEvents.length === 0 && (
              <p className="text-[#8696a0] text-xs">No events scheduled</p>
            )}

            <div className="space-y-2">
              {selectedDateEvents.map(event => (
                <div
                  key={event.id}
                  className="bg-[#0b141a] border border-[#2a3942] rounded-lg p-3 group"
                >
                  <div className="flex items-start gap-2">
                    <div className={`w-1 h-full ${getEventTypeColor(event.type)} rounded-full flex-shrink-0 mt-1`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[#e9edef] text-sm font-medium">{event.title}</p>
                        {event.is_meeting && event.meeting_status === 'ongoing' && (
                          <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            LIVE
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[#8696a0] text-xs mt-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {formatTime(event.start_time)}
                          {event.end_time && ` - ${formatTime(event.end_time)}`}
                        </span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1 text-[#8696a0] text-xs mt-1">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                      {event.description && (
                        <p className="text-[#8696a0] text-xs mt-1 line-clamp-2">{event.description}</p>
                      )}
                      {event.is_meeting && event.meeting_status === 'ongoing' && onJoinMeeting && (
                        <button
                          onClick={() => onJoinMeeting(event.meeting_id!)}
                          className="mt-2 px-3 py-1.5 rounded-lg bg-[#00a884] hover:bg-[#00ba95] text-[#0b141a] text-xs font-semibold transition-all flex items-center gap-1.5"
                        >
                          <Video className="w-3.5 h-3.5" />
                          Join Meeting
                        </button>
                      )}
                    </div>
                    {onDelete && !event.is_meeting && (isAdmin || event.created_by === currentUserId) && (
                      <button
                        onClick={() => handleDelete(event.id)}
                        disabled={deletingId === event.id}
                        className="p-1 rounded text-red-500/40 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50 flex-shrink-0"
                      >
                        {deletingId === event.id ? <Spinner /> : <X className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Agenda View */
        <div className="bg-[#111b21] border border-[#222d34] rounded-xl p-4">
          <h3 className="text-[#e9edef] text-sm font-semibold mb-4">Upcoming Events</h3>

          {upcomingEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <div className="w-12 h-12 rounded-full bg-[#1e2a30] flex items-center justify-center">
                <Calendar className="w-6 h-6 text-[#8696a0]" />
              </div>
              <p className="text-[#8696a0] text-sm">No upcoming events</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map(event => {
                const eventDate = new Date(event.date);
                const dateStr = `${MONTHS[eventDate.getMonth()]} ${eventDate.getDate()}, ${eventDate.getFullYear()}`;

                return (
                  <div
                    key={event.id}
                    className="bg-[#0b141a] border border-[#2a3942] rounded-lg p-4 group"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-full ${getEventTypeColor(event.type)} rounded-full flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-[#e9edef] text-sm font-medium">{event.title}</p>
                            <p className="text-[#8696a0] text-xs mt-0.5">{dateStr}</p>
                          </div>
                          {onDelete && (isAdmin || event.created_by === currentUserId) && (
                            <button
                              onClick={() => handleDelete(event.id)}
                              disabled={deletingId === event.id}
                              className="p-1.5 rounded-lg text-red-500/40 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50 flex-shrink-0"
                            >
                              {deletingId === event.id ? <Spinner /> : <X className="w-4 h-4" />}
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-[#8696a0] text-xs mt-2">
                          <Clock className="w-3 h-3" />
                          <span>
                            {formatTime(event.start_time)}
                            {event.end_time && ` - ${formatTime(event.end_time)}`}
                          </span>
                        </div>

                        {event.location && (
                          <div className="flex items-center gap-1 text-[#8696a0] text-xs mt-1">
                            <MapPin className="w-3 h-3" />
                            <span>{event.location}</span>
                          </div>
                        )}

                        {event.attendees && event.attendees.length > 0 && (
                          <div className="flex items-center gap-1 text-[#8696a0] text-xs mt-1">
                            <Users className="w-3 h-3" />
                            <span>{event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}</span>
                          </div>
                        )}

                        {event.description && (
                          <p className="text-[#8696a0] text-xs mt-2">{event.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111b21] border border-[#222d34] rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="sticky top-0 bg-[#111b21] border-b border-[#222d34] p-4 flex items-center justify-between">
              <h3 className="text-[#e9edef] text-lg font-semibold">New Event</h3>
              <button
                onClick={() => {
                  setShowEventModal(false);
                  resetForm();
                }}
                className="p-1 rounded-lg hover:bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-[#8696a0] text-xs uppercase tracking-wider mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Event title"
                  className="w-full bg-[#0b141a] border border-[#2a3942] text-[#e9edef] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#00a884] placeholder-[#4a5568]"
                />
              </div>

              <div>
                <label className="block text-[#8696a0] text-xs uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details..."
                  rows={3}
                  className="w-full bg-[#0b141a] border border-[#2a3942] text-[#e9edef] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#00a884] placeholder-[#4a5568] resize-none"
                />
              </div>

              <div>
                <label className="block text-[#8696a0] text-xs uppercase tracking-wider mb-1">
                  Type
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full bg-[#0b141a] border border-[#2a3942] text-[#e9edef] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#00a884]"
                >
                  {EVENT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#8696a0] text-xs uppercase tracking-wider mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full bg-[#0b141a] border border-[#2a3942] text-[#e9edef] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#00a884]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#8696a0] text-xs uppercase tracking-wider mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-[#0b141a] border border-[#2a3942] text-[#e9edef] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#00a884]"
                  />
                </div>
                <div>
                  <label className="block text-[#8696a0] text-xs uppercase tracking-wider mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-[#0b141a] border border-[#2a3942] text-[#e9edef] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#00a884]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#8696a0] text-xs uppercase tracking-wider mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Add location or meeting link"
                  className="w-full bg-[#0b141a] border border-[#2a3942] text-[#e9edef] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#00a884] placeholder-[#4a5568]"
                />
              </div>

              {teamMembers.length > 0 && (
                <div>
                  <label className="block text-[#8696a0] text-xs uppercase tracking-wider mb-1">
                    Attendees
                  </label>
                  <div className="bg-[#0b141a] border border-[#2a3942] rounded-lg p-2 max-h-32 overflow-y-auto custom-scrollbar">
                    {teamMembers.map(member => (
                      <label
                        key={member.id}
                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#202c33] rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedAttendees.includes(member.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAttendees([...selectedAttendees, member.id]);
                            } else {
                              setSelectedAttendees(selectedAttendees.filter(id => id !== member.id));
                            }
                          }}
                          className="w-4 h-4 rounded border-[#2a3942] bg-[#0b141a] text-[#00a884] focus:ring-[#00a884] focus:ring-offset-0"
                        />
                        <span className="text-[#e9edef] text-sm">{member.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {err && <p className="text-red-400 text-xs">{err}</p>}

              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={() => {
                    setShowEventModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-lg text-sm text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-[#00a884] hover:bg-[#008069] text-[#0b141a] disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {saving && <Spinner />}
                  Create Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarTab;
