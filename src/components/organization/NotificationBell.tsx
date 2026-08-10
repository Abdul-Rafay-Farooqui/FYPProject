'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';

interface NotificationBellProps {
  organizationId: string;
  onClick: () => void;
  unreadCount?: number;
}

const NotificationBell = ({ organizationId, onClick, unreadCount = 0 }: NotificationBellProps) => {
  const [count, setCount] = useState(unreadCount);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setCount(unreadCount);
    if (unreadCount > count) {
      setAnimate(true);
      setTimeout(() => setAnimate(false), 500);
    }
  }, [unreadCount]);

  return (
    <button
      onClick={onClick}
      className={`relative p-2 rounded-lg text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33] transition-all ${
        animate ? 'animate-bounce' : ''
      }`}
      title="Notifications"
    >
      <Bell className="w-5 h-5" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold bg-[#00a884] text-[#0b141a] rounded-full">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;
