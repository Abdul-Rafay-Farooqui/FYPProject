'use client';

import { useState } from 'react';
import Notifications from './Notifications';

const Sidebar = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  return (
    <>
      <div className="w-[72px] h-full bg-[#111b21] border-r border-[#222d34] flex flex-col items-center py-4 gap-3">
        <button className="btn-ghost">💬</button>
        <button className="btn-ghost">🏢</button>
        <button className="btn-ghost" onClick={() => setShowNotifications((v) => !v)}>🔔</button>
      </div>
      <Notifications isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
    </>
  );
};

export default Sidebar;
