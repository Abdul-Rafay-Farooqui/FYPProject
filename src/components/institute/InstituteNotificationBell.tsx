"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Check, CheckCheck, Trash2, X } from "lucide-react";
import { useInstituteNotifications } from "@/hooks/useInstituteNotifications";

interface InstituteNotificationBellProps {
  instituteId: string;
}

export default function InstituteNotificationBell({
  instituteId,
}: InstituteNotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useInstituteNotifications(instituteId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "announcement":
        return "📢";
      case "assignment":
      case "assignment_submission":
        return "📝";
      case "quiz":
        return "📊";
      case "live_class":
      case "live_class_started":
        return "🎥";
      case "grade":
        return "⭐";
      case "discussion":
      case "query":
        return "💬";
      case "resource":
        return "📚";
      default:
        return "📌";
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    // TODO: Navigate to related content
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-[#2a3942] transition-colors"
      >
        <Bell className="w-5 h-5 text-[#8696a0]" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-[#00a884] text-[#0b141a] text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-[#202c33] border border-[#2a3942] rounded-lg shadow-xl z-50 max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#2a3942]">
            <div>
              <h3 className="text-[#e9edef] font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <p className="text-[#8696a0] text-xs mt-1">
                  {unreadCount} unread
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="p-2 rounded-lg hover:bg-[#2a3942] transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-4 h-4 text-[#8696a0]" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-[#2a3942] transition-colors"
              >
                <X className="w-4 h-4 text-[#8696a0]" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-[#8696a0] text-sm">Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 px-4">
                <Bell className="w-12 h-12 text-[#8696a0] mb-2" />
                <p className="text-[#8696a0] text-sm">No notifications</p>
              </div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-[#2a3942] hover:bg-[#111b21] transition-colors cursor-pointer ${
                      !notification.read ? "bg-[#00a884]/5" : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="text-2xl flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4
                            className={`text-sm font-medium ${
                              notification.read
                                ? "text-[#8696a0]"
                                : "text-[#e9edef]"
                            }`}
                          >
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-[#00a884] rounded-full flex-shrink-0 mt-1"></div>
                          )}
                        </div>
                        <p className="text-[#8696a0] text-xs mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[#8696a0] text-xs">
                            {getTimeAgo(notification.created_at)}
                          </span>
                          <div className="flex items-center gap-1">
                            {!notification.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="p-1 rounded hover:bg-[#2a3942] transition-colors"
                                title="Mark as read"
                              >
                                <Check className="w-3 h-3 text-[#8696a0]" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="p-1 rounded hover:bg-[#2a3942] transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3 text-[#8696a0]" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-[#2a3942] text-center">
              <button className="text-[#00a884] text-sm hover:underline">
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
