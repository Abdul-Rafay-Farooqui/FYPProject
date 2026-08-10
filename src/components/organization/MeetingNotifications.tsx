'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/store/uiStore';
import { Bell, Video, Phone, Calendar, Clock, X, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MeetingNotificationsProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinMeeting?: (notification: any) => void;
}

const MeetingNotifications = ({ isOpen, onClose, onJoinMeeting }: MeetingNotificationsProps) => {
  const { meetingNotifications, markNotificationRead, clearMeetingNotifications } = useUIStore();

  const unreadCount = meetingNotifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'started':
        return <Video className="w-5 h-5 text-green-500" />;
      case 'starting_soon':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'scheduled':
        return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'ended':
        return <Check className="w-5 h-5 text-gray-500" />;
      case 'cancelled':
        return <X className="w-5 h-5 text-red-500" />;
      default:
        return <Bell className="w-5 h-5 text-[#00a884]" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'started':
        return 'border-l-green-500 bg-green-500/5';
      case 'starting_soon':
        return 'border-l-yellow-500 bg-yellow-500/5';
      case 'scheduled':
        return 'border-l-blue-500 bg-blue-500/5';
      case 'ended':
        return 'border-l-gray-500 bg-gray-500/5';
      case 'cancelled':
        return 'border-l-red-500 bg-red-500/5';
      default:
        return 'border-l-[#00a884] bg-[#00a884]/5';
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-screen w-full sm:w-[420px] bg-[#111b21] border-l border-[#222d34] z-50 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-[#222d34] flex items-center justify-between bg-[#202c33]">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-[#00a884]" />
          <h2 className="text-[#e9edef] font-semibold text-lg">Meeting Notifications</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-[#00a884] text-[#0b141a] text-xs font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-[#2a3942] text-[#8696a0] hover:text-[#e9edef] transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Actions */}
      {meetingNotifications.length > 0 && (
        <div className="p-3 border-b border-[#222d34] flex gap-2">
          <button
            onClick={() => {
              meetingNotifications.forEach(n => markNotificationRead(n.id));
            }}
            className="flex-1 px-3 py-2 rounded-lg bg-[#202c33] hover:bg-[#2a3942] text-[#e9edef] text-sm font-medium transition-all"
          >
            Mark all as read
          </button>
          <button
            onClick={clearMeetingNotifications}
            className="flex-1 px-3 py-2 rounded-lg bg-[#202c33] hover:bg-[#2a3942] text-[#e9edef] text-sm font-medium transition-all"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {meetingNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-[#1a252c] flex items-center justify-center">
              <Bell className="w-8 h-8 text-[#8696a0]" />
            </div>
            <p className="text-[#e9edef] font-medium">No notifications</p>
            <p className="text-[#8696a0] text-sm">
              You'll see meeting updates and reminders here
            </p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {meetingNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`border-l-4 rounded-lg p-4 transition-all cursor-pointer ${
                  getNotificationColor(notification.type)
                } ${
                  notification.read
                    ? 'opacity-60 hover:opacity-80'
                    : 'hover:bg-[#202c33]/50'
                }`}
                onClick={() => markNotificationRead(notification.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-[#e9edef] font-semibold text-sm line-clamp-1">
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-[#00a884] flex-shrink-0 mt-1" />
                      )}
                    </div>
                    
                    <p className="text-[#8696a0] text-sm mb-2">
                      {notification.message}
                    </p>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#8696a0] text-xs">
                        {formatTime(notification.created_at)}
                      </span>

                      {notification.type === 'started' && onJoinMeeting && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onJoinMeeting(notification);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#00a884] hover:bg-[#00ba95] text-[#0b141a] text-xs font-semibold transition-all flex items-center gap-1.5"
                        >
                          {notification.call_type === 'video' ? (
                            <Video className="w-3.5 h-3.5" />
                          ) : (
                            <Phone className="w-3.5 h-3.5" />
                          )}
                          Join Now
                        </button>
                      )}

                      {notification.type === 'starting_soon' && notification.starts_at && (
                        <div className="flex items-center gap-1 text-yellow-500 text-xs font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          Starts {formatTime(notification.starts_at)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingNotifications;
