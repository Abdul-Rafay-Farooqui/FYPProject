'use client';

import { useState, useEffect } from 'react';
import { Bell, X, Award, Calendar, CheckSquare, Users, Clock, FileText, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { OrganizationAPI } from '@/lib/api/organization';
import { getSocket } from '@/lib/socket';

interface Notification {
  id: string;
  type: 'praise' | 'meeting' | 'task' | 'approval' | 'attendance' | 'activity' | 'general';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  metadata?: {
    from_user?: string;
    to_user?: string;
    badge?: string;
    meeting_id?: string;
    task_id?: string;
    approval_id?: string;
  };
}

interface NotificationCenterProps {
  organizationId: string;
  currentUserId?: string;
  onClose?: () => void;
  onNotificationRead?: () => void;
}

const NotificationCenter = ({ organizationId, currentUserId, onClose, onNotificationRead }: NotificationCenterProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Load notifications
  useEffect(() => {
    console.log('[NotificationCenter] Loading notifications for org:', organizationId);
    loadNotifications();
  }, [organizationId]);

  // WebSocket listener for real-time updates
  useEffect(() => {
    if (!currentUserId) return;

    const socket = getSocket();
    
    const handleNewNotification = (data: any) => {
      console.log('[NotificationCenter] Received new notification via WebSocket:', data);
      // Reload notifications to get the full data
      loadNotifications();
    };

    const handleNotificationRead = (data: any) => {
      console.log('[NotificationCenter] Notification marked as read:', data);
      // Update the notification in the list
      setNotifications(prev =>
        prev.map(n => n.id === data.notification_id ? { ...n, read: true } : n)
      );
    };

    const handleAllNotificationsRead = (data: any) => {
      console.log('[NotificationCenter] All notifications marked as read:', data);
      // Mark all notifications as read
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    // Listen for notification events
    socket.on('notification:new', handleNewNotification);
    socket.on('notification:read', handleNotificationRead);
    socket.on('notification:all-read', handleAllNotificationsRead);

    // Cleanup
    return () => {
      socket.off('notification:new', handleNewNotification);
      socket.off('notification:read', handleNotificationRead);
      socket.off('notification:all-read', handleAllNotificationsRead);
    };
  }, [currentUserId, organizationId]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      console.log('[NotificationCenter] Fetching notifications...');
      const response = await OrganizationAPI.getNotifications(organizationId);
      console.log('[NotificationCenter] Received notifications:', response);
      setNotifications(response.notifications);
    } catch (error) {
      console.error('[NotificationCenter] Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await OrganizationAPI.markNotificationAsRead(organizationId, notificationId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      // Notify parent to update unread count
      if (onNotificationRead) {
        onNotificationRead();
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await OrganizationAPI.markAllNotificationsAsRead(organizationId);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      // Notify parent to update unread count
      if (onNotificationRead) {
        onNotificationRead();
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await OrganizationAPI.deleteNotification(organizationId, notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'praise':
        return <Award className="w-5 h-5 text-yellow-400" />;
      case 'meeting':
        return <Calendar className="w-5 h-5 text-blue-400" />;
      case 'task':
        return <CheckSquare className="w-5 h-5 text-green-400" />;
      case 'approval':
        return <FileText className="w-5 h-5 text-purple-400" />;
      case 'attendance':
        return <Clock className="w-5 h-5 text-orange-400" />;
      case 'activity':
        return <Users className="w-5 h-5 text-cyan-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex flex-col h-full bg-[#0b141a]">
      {/* Header */}
      <div className="p-4 border-b border-[#222d34] bg-[#111b21]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#00a884]" />
            <h2 className="text-[#e9edef] text-lg font-semibold">Notifications</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold bg-[#00a884] text-[#0b141a] rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33] transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === 'all'
                ? 'bg-[#00a884] text-[#0b141a]'
                : 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === 'unread'
                ? 'bg-[#00a884] text-[#0b141a]'
                : 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="ml-auto px-3 py-1.5 rounded-lg text-sm font-medium text-[#00a884] hover:bg-[#00a884]/10 transition-all"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00a884]"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div className="w-16 h-16 rounded-full bg-[#1e2a30] flex items-center justify-center">
              <Bell className="w-8 h-8 text-[#8696a0]" />
            </div>
            <p className="text-[#8696a0] text-sm">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => {
                  // Mark as read when clicked
                  if (!notification.read) {
                    markAsRead(notification.id);
                  }
                }}
                className={`group relative p-4 rounded-xl border transition-all cursor-pointer ${
                  notification.read
                    ? 'bg-[#111b21] border-[#222d34] hover:bg-[#1a252c]'
                    : 'bg-[#1e2a30] border-[#00a884]/30 hover:bg-[#253640]'
                }`}
              >
                <div className="flex gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {getIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-[#e9edef] text-sm font-semibold">
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-[#00a884]"></span>
                      )}
                    </div>
                    <p className="text-[#8696a0] text-sm mb-2">
                      {notification.message}
                    </p>
                    <p className="text-[#667781] text-xs">
                      {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!notification.read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering parent onClick
                        markAsRead(notification.id);
                      }}
                      title="Mark as read"
                      className="p-1.5 rounded-lg text-[#8696a0] hover:text-[#00a884] hover:bg-[#00a884]/10 transition-all"
                    >
                      <CheckSquare className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    title="Delete"
                    className="p-1.5 rounded-lg text-[#8696a0] hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
