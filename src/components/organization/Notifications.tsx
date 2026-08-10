'use client';

const Notifications = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed right-0 top-0 h-screen w-[360px] bg-[#111b21] border-l border-[#222d34] z-50">
      <div className="p-4 border-b border-[#222d34] flex items-center justify-between">
        <h2 className="text-[#e9edef] font-semibold">Notifications</h2>
        <button className="btn-ghost" onClick={onClose}>Close</button>
      </div>
      <div className="p-4 text-[#8696a0] text-sm">No new notifications</div>
    </div>
  );
};

export default Notifications;
