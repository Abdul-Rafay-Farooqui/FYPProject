const TeamModals = ({
  showMeetingModal,
  setShowMeetingModal,
  showTaskModal,
  setShowTaskModal,
}: any) => (
  <>
    {showMeetingModal && (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-[#111b21] border border-[#222d34] rounded-lg p-6 w-[420px]">
          <h3 className="text-[#e9edef] text-lg font-semibold mb-4">Schedule meeting</h3>
          <div className="flex gap-2">
            <button className="btn-primary" onClick={() => setShowMeetingModal(false)}>Create</button>
            <button className="btn-ghost" onClick={() => setShowMeetingModal(false)}>Cancel</button>
          </div>
        </div>
      </div>
    )}
    {showTaskModal && (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-[#111b21] border border-[#222d34] rounded-lg p-6 w-[420px]">
          <h3 className="text-[#e9edef] text-lg font-semibold mb-4">Create task</h3>
          <div className="flex gap-2">
            <button className="btn-primary" onClick={() => setShowTaskModal(false)}>Create</button>
            <button className="btn-ghost" onClick={() => setShowTaskModal(false)}>Cancel</button>
          </div>
        </div>
      </div>
    )}
  </>
);

export default TeamModals;
