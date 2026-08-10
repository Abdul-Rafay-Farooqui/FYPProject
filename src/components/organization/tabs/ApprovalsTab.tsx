'use client';

import { useState } from 'react';
import { Plus, Check, X, Clock, FileText, DollarSign, Calendar as CalendarIcon, Briefcase, AlertCircle } from 'lucide-react';

interface Approval {
  id: string;
  requested_by: string;
  requester_name: string;
  requester_avatar?: string | null;
  approver_id?: string | null;
  approver_name?: string | null;
  approval_type: 'leave' | 'attendance' | 'purchase' | 'timesheet' | 'expense' | 'other';
  title: string;
  description?: string | null;
  amount?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  created_at: string;
  decided_at?: string | null;
  decision_note?: string | null;
}

interface ApprovalsTabProps {
  approvals?: Approval[];
  currentUserId?: string;
  isAdmin?: boolean;
  onRequestApproval?: (payload: {
    approval_type: string;
    title: string;
    description?: string;
    amount?: string;
  }) => Promise<void>;
  onApprove?: (approvalId: string, note?: string) => Promise<void>;
  onReject?: (approvalId: string, note: string) => Promise<void>;
  onCancel?: (approvalId: string) => Promise<void>;
}

const APPROVAL_TYPES = [
  { value: 'leave', label: 'Leave Request', icon: CalendarIcon, color: 'text-blue-400' },
  { value: 'attendance', label: 'Attendance Request', icon: Clock, color: 'text-orange-400' },
  { value: 'purchase', label: 'Purchase Request', icon: Briefcase, color: 'text-purple-400' },
  { value: 'expense', label: 'Expense Claim', icon: DollarSign, color: 'text-green-400' },
  { value: 'timesheet', label: 'Timesheet Approval', icon: Clock, color: 'text-yellow-400' },
  { value: 'other', label: 'Other', icon: FileText, color: 'text-[#8696a0]' },
];

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'text-yellow-400 bg-yellow-400/10', icon: Clock },
  approved: { label: 'Approved', color: 'text-[#00a884] bg-[#00a884]/10', icon: Check },
  rejected: { label: 'Rejected', color: 'text-red-400 bg-red-400/10', icon: X },
  cancelled: { label: 'Cancelled', color: 'text-[#8696a0] bg-[#8696a0]/10', icon: AlertCircle },
};

const ApprovalsTab = ({
  approvals = [],
  currentUserId,
  isAdmin,
  onRequestApproval,
  onApprove,
  onReject,
  onCancel,
}: ApprovalsTabProps) => {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [decisionType, setDecisionType] = useState<'approve' | 'reject'>('approve');
  
  // Form state
  const [approvalType, setApprovalType] = useState('leave');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [attendanceDate, setAttendanceDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [decisionNote, setDecisionNote] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [err, setErr] = useState('');

  // Filter approvals
  const myRequests = approvals.filter(a => a.requested_by === currentUserId);
  const pendingForMe = isAdmin ? approvals.filter(a => a.status === 'pending') : [];
  const allApprovals = approvals;

  const [activeFilter, setActiveFilter] = useState<'all' | 'my-requests' | 'pending'>('all');

  const filteredApprovals = 
    activeFilter === 'my-requests' ? myRequests :
    activeFilter === 'pending' ? pendingForMe :
    allApprovals;

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAmount('');
    setAttendanceDate('');
    setStartDate('');
    setEndDate('');
    setApprovalType('leave');
    setErr('');
  };

  const handleSubmitRequest = async () => {
    if (!title.trim()) {
      setErr('Title is required');
      return;
    }

    if ((approvalType === 'purchase' || approvalType === 'expense') && !amount) {
      setErr('Amount is required for this type');
      return;
    }

    if (approvalType === 'attendance' && !attendanceDate) {
      setErr('Date is required for attendance requests');
      return;
    }

    if (approvalType === 'leave' && (!startDate || !endDate)) {
      setErr('Start date and end date are required for leave requests');
      return;
    }

    setSubmitting(true);
    setErr('');
    try {
      const payload: any = {
        approval_type: approvalType,
        title: title.trim(),
        description: description.trim() || undefined,
        amount: amount || undefined,
      };

      // Add attendance date to description for attendance requests
      if (approvalType === 'attendance' && attendanceDate) {
        payload.description = `Date: ${attendanceDate}${description.trim() ? '\n' + description.trim() : ''}`;
      }

      // Add leave dates to description for leave requests
      if (approvalType === 'leave' && startDate && endDate) {
        payload.description = `From: ${startDate} To: ${endDate}${description.trim() ? '\n' + description.trim() : ''}`;
      }

      await onRequestApproval?.(payload);
      resetForm();
      setShowRequestModal(false);
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (approval: Approval) => {
    setSelectedApproval(approval);
    setDecisionType('approve');
    setDecisionNote('');
    setShowDecisionModal(true);
  };

  const handleReject = async (approval: Approval) => {
    setSelectedApproval(approval);
    setDecisionType('reject');
    setDecisionNote('');
    setShowDecisionModal(true);
  };

  const handleSubmitDecision = async () => {
    if (!selectedApproval) return;

    if (decisionType === 'reject' && !decisionNote.trim()) {
      setErr('Please provide a reason for rejection');
      return;
    }

    setProcessing(selectedApproval.id);
    setErr('');
    try {
      if (decisionType === 'approve') {
        await onApprove?.(selectedApproval.id, decisionNote.trim() || undefined);
      } else {
        await onReject?.(selectedApproval.id, decisionNote.trim());
      }
      setShowDecisionModal(false);
      setSelectedApproval(null);
      setDecisionNote('');
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || 'Failed to process decision');
    } finally {
      setProcessing(null);
    }
  };

  const handleCancelRequest = async (approvalId: string) => {
    setProcessing(approvalId);
    try {
      await onCancel?.(approvalId);
    } finally {
      setProcessing(null);
    }
  };

  const getTypeConfig = (type: string) => {
    return APPROVAL_TYPES.find(t => t.value === type) || APPROVAL_TYPES[4];
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const Spinner = () => (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );

  return (
    <div className="space-y-4">
      {/* Header with Request Button */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeFilter === 'all'
                ? 'bg-[#00a884] text-[#0b141a]'
                : 'text-[#8696a0] hover:text-[#e9edef] bg-[#111b21] border border-[#222d34]'
            }`}
          >
            All ({allApprovals.length})
          </button>
          <button
            onClick={() => setActiveFilter('my-requests')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeFilter === 'my-requests'
                ? 'bg-[#00a884] text-[#0b141a]'
                : 'text-[#8696a0] hover:text-[#e9edef] bg-[#111b21] border border-[#222d34]'
            }`}
          >
            My Requests ({myRequests.length})
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeFilter === 'pending'
                  ? 'bg-[#00a884] text-[#0b141a]'
                  : 'text-[#8696a0] hover:text-[#e9edef] bg-[#111b21] border border-[#222d34]'
              }`}
            >
              Pending ({pendingForMe.length})
            </button>
          )}
        </div>

        <button
          onClick={() => setShowRequestModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#00a884] hover:bg-[#008069] text-[#0b141a] transition-all"
        >
          <Plus className="w-4 h-4" /> New Request
        </button>
      </div>

      {/* Approvals List */}
      <div className="space-y-3">
        {filteredApprovals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <div className="w-12 h-12 rounded-full bg-[#1e2a30] flex items-center justify-center">
              <FileText className="w-6 h-6 text-[#8696a0]" />
            </div>
            <p className="text-[#8696a0] text-sm">No approval requests found</p>
          </div>
        ) : (
          filteredApprovals.map(approval => {
            const typeConfig = getTypeConfig(approval.approval_type);
            const statusConfig = STATUS_CONFIG[approval.status];
            const TypeIcon = typeConfig.icon;
            const StatusIcon = statusConfig.icon;
            const isMyRequest = approval.requested_by === currentUserId;
            const canApprove = isAdmin && approval.status === 'pending' && !isMyRequest;
            const canCancel = isMyRequest && approval.status === 'pending';

            return (
              <div
                key={approval.id}
                className="bg-[#111b21] border border-[#222d34] rounded-xl p-4 hover:border-[#2a3942] transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-full bg-[#1e2a30] flex items-center justify-center flex-shrink-0 ${typeConfig.color}`}>
                    <TypeIcon className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <h4 className="text-[#e9edef] text-sm font-medium">{approval.title}</h4>
                        <p className="text-[#8696a0] text-xs mt-0.5">
                          {typeConfig.label} • Requested by {approval.requester_name}
                        </p>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${statusConfig.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </span>
                    </div>

                    {approval.description && (
                      <p className="text-[#8696a0] text-sm mb-2">{approval.description}</p>
                    )}

                    {approval.amount && (
                      <div className="flex items-center gap-1 text-[#00a884] text-sm font-medium mb-2">
                        <DollarSign className="w-4 h-4" />
                        {approval.amount}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-[#8696a0] text-xs">
                      <span>Submitted {formatDate(approval.created_at)}</span>
                      {approval.decided_at && (
                        <span>Decided {formatDate(approval.decided_at)}</span>
                      )}
                    </div>

                    {approval.decision_note && (
                      <div className="mt-2 p-2 bg-[#0b141a] rounded-lg">
                        <p className="text-[#8696a0] text-xs">
                          <span className="font-medium">Note:</span> {approval.decision_note}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {(canApprove || canCancel) && (
                      <div className="flex gap-2 mt-3">
                        {canApprove && (
                          <>
                            <button
                              onClick={() => handleApprove(approval)}
                              disabled={processing === approval.id}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#00a884] hover:bg-[#008069] text-[#0b141a] disabled:opacity-50 transition-all"
                            >
                              {processing === approval.id ? <Spinner /> : <Check className="w-3 h-3" />}
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(approval)}
                              disabled={processing === approval.id}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 transition-all"
                            >
                              {processing === approval.id ? <Spinner /> : <X className="w-3 h-3" />}
                              Reject
                            </button>
                          </>
                        )}
                        {canCancel && (
                          <button
                            onClick={() => handleCancelRequest(approval.id)}
                            disabled={processing === approval.id}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33] disabled:opacity-50 transition-all"
                          >
                            {processing === approval.id ? <Spinner /> : <X className="w-3 h-3" />}
                            Cancel Request
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111b21] border border-[#222d34] rounded-xl w-full max-w-md">
            <div className="p-4 border-b border-[#222d34] flex items-center justify-between">
              <h3 className="text-[#e9edef] text-lg font-semibold">New Approval Request</h3>
              <button
                onClick={() => {
                  setShowRequestModal(false);
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
                  Request Type *
                </label>
                <select
                  value={approvalType}
                  onChange={(e) => setApprovalType(e.target.value)}
                  className="w-full bg-[#0b141a] border border-[#2a3942] text-[#e9edef] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#00a884]"
                >
                  {APPROVAL_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#8696a0] text-xs uppercase tracking-wider mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief description of your request"
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
                  placeholder="Provide additional details..."
                  rows={3}
                  className="w-full bg-[#0b141a] border border-[#2a3942] text-[#e9edef] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#00a884] placeholder-[#4a5568] resize-none"
                />
              </div>

              {approvalType === 'leave' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#8696a0] text-xs uppercase tracking-wider mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-[#0b141a] border border-[#2a3942] text-[#e9edef] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#00a884]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#8696a0] text-xs uppercase tracking-wider mb-1">
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      className="w-full bg-[#0b141a] border border-[#2a3942] text-[#e9edef] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#00a884]"
                    />
                  </div>
                </div>
              )}

              {approvalType === 'attendance' && (
                <div>
                  <label className="block text-[#8696a0] text-xs uppercase tracking-wider mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="w-full bg-[#0b141a] border border-[#2a3942] text-[#e9edef] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#00a884]"
                  />
                  <p className="text-[#8696a0] text-xs mt-1">
                    Select the date for which you need attendance correction/approval
                  </p>
                </div>
              )}

              {(approvalType === 'purchase' || approvalType === 'expense') && (
                <div>
                  <label className="block text-[#8696a0] text-xs uppercase tracking-wider mb-1">
                    Amount *
                  </label>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g., $500 or 500 USD"
                    className="w-full bg-[#0b141a] border border-[#2a3942] text-[#e9edef] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#00a884] placeholder-[#4a5568]"
                  />
                </div>
              )}

              {err && <p className="text-red-400 text-xs">{err}</p>}

              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={() => {
                    setShowRequestModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-lg text-sm text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRequest}
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-[#00a884] hover:bg-[#008069] text-[#0b141a] disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {submitting && <Spinner />}
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Decision Modal */}
      {showDecisionModal && selectedApproval && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111b21] border border-[#222d34] rounded-xl w-full max-w-md">
            <div className="p-4 border-b border-[#222d34] flex items-center justify-between">
              <h3 className="text-[#e9edef] text-lg font-semibold">
                {decisionType === 'approve' ? 'Approve' : 'Reject'} Request
              </h3>
              <button
                onClick={() => {
                  setShowDecisionModal(false);
                  setSelectedApproval(null);
                  setDecisionNote('');
                  setErr('');
                }}
                className="p-1 rounded-lg hover:bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="p-3 bg-[#0b141a] rounded-lg">
                <p className="text-[#e9edef] text-sm font-medium">{selectedApproval.title}</p>
                <p className="text-[#8696a0] text-xs mt-1">
                  Requested by {selectedApproval.requester_name}
                </p>
              </div>

              <div>
                <label className="block text-[#8696a0] text-xs uppercase tracking-wider mb-1">
                  {decisionType === 'reject' ? 'Reason for Rejection *' : 'Note (Optional)'}
                </label>
                <textarea
                  value={decisionNote}
                  onChange={(e) => setDecisionNote(e.target.value)}
                  placeholder={decisionType === 'reject' ? 'Please explain why...' : 'Add a note...'}
                  rows={3}
                  className="w-full bg-[#0b141a] border border-[#2a3942] text-[#e9edef] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#00a884] placeholder-[#4a5568] resize-none"
                />
              </div>

              {err && <p className="text-red-400 text-xs">{err}</p>}

              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={() => {
                    setShowDecisionModal(false);
                    setSelectedApproval(null);
                    setDecisionNote('');
                    setErr('');
                  }}
                  className="px-4 py-2 rounded-lg text-sm text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitDecision}
                  disabled={!!processing}
                  className={`px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-all flex items-center gap-2 ${
                    decisionType === 'approve'
                      ? 'bg-[#00a884] hover:bg-[#008069] text-[#0b141a]'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  {processing && <Spinner />}
                  {decisionType === 'approve' ? 'Approve' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalsTab;
